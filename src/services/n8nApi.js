// N8N API 服务 - 连接真实 N8N 工作流
// 配置你的 N8N Webhook URL 和认证信息

import { saveToCache, getFromCache } from './cacheDb';
import { checkRateLimit, recordRequest } from './rateLimiter';

const STORAGE_KEY = 'shopvidi_call_times';

const N8N_CONFIG = {
  // 开发环境走代理 /api/n8n，生产环境用完整 URL
  webhookUrl: import.meta.env.VITE_N8N_WEBHOOK_URL || 'https://n8n.merakku.ai/webhook/analyse',

  // 可选：API Key 认证
  apiKey: import.meta.env.VITE_N8N_API_KEY || '',
};

/**
 * 获取历史调用时间记录
 */
function getCallTimes() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

/**
 * 记录一次调用耗时（保留最近 10 次）
 */
function recordCallTime(ms) {
  const times = getCallTimes().slice(-9);
  times.push(ms);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(times));
}

/**
 * 获取平均调用时间（毫秒），无记录返回 null
 */
export function getAverageTime() {
  const times = getCallTimes();
  if (times.length === 0) return null;
  return times.reduce((a, b) => a + b, 0) / times.length;
}

/**
 * 计算动态超时：平均时间 × 3，最小 60s，最大 600s
 */
function getDynamicTimeout() {
  const avg = getAverageTime();
  if (avg === null) return 600000; // 默认 10 分钟
  return Math.min(1200000, Math.max(300000, avg * 3));
}

/**
 * 将 analysis_summary 对象转为 Markdown 字符串
 */
function formatAnalysisSummary(summary) {
  if (typeof summary === 'string') return summary;
  if (!summary || typeof summary !== 'object') return '';

  const sections = [
    { key: 'executive_summary', title: '綜合摘要' },
    { key: 'conversion_risk_analysis', title: '轉化風險分析' },
    { key: 'traffic_insights', title: '流量洞察' },
  ];

  return sections
    .filter(s => summary[s.key])
    .map(s => `### ${s.title}\n\n${summary[s.key]}`)
    .join('\n\n');
}

/**
 * 规范化 N8N 返回数据，使其符合前端期望的格式
 */
function normalizeResponse(data) {
  const d = data.data;

  // analysis_summary: 对象 → markdown
  d.analysis_summary = formatAnalysisSummary(d.analysis_summary);

  // shop_name 优先取 data.shop_name
  if (!d.meta) d.meta = {};
  if (d.shop_name) {
    d.meta.shop_name = d.shop_name;
  }

  // 处理推荐商品
  if (d.recommendations) {
    d.recommendations = processRecommendations(d.recommendations);
  }

  return data;
}

/**
 * 从推荐理由中提取特色标签（每个商品最多 1 个）
 */
const TAG_RULES = [
  { keywords: ['高動銷', '動銷', '熱銷', '銷量良好'], tag: '熱銷潛力', color: 'rose' },
  { keywords: ['實用', '多功能', '日常使用'], tag: '實用周邊', color: 'sky' },
  { keywords: ['新穎', '新鮮感', '新品', '新奇'], tag: '新品類', color: 'violet' },
  { keywords: ['話題', '社交媒體', '傳播'], tag: '話題性', color: 'amber' },
  { keywords: ['擴大', '拓展', '新客群', '不同客群'], tag: '拓展客群', color: 'teal' },
  { keywords: ['親民', '低門檻', '降低.*成本'], tag: '親民入門', color: 'emerald' },
  { keywords: ['季節', '情人節', '春季', '限定'], tag: '季節限定', color: 'pink' },
  { keywords: ['復購', '重複購買', '長期'], tag: '高復購', color: 'indigo' },
];

function extractTags(reason) {
  for (const rule of TAG_RULES) {
    for (const kw of rule.keywords) {
      if (new RegExp(kw).test(reason)) {
        return [{ label: rule.tag, color: rule.color }];
      }
    }
  }
  return [];
}

/**
 * 清洗推荐商品数据：
 * - 提取推荐理由（去掉校验、比价等内部标记）
 * - 从定价风险标记中提取利润提示
 * - 限制数量为 12 条
 */
function processRecommendations(items) {
  const MAX_ITEMS = 12;

  const seenImages = new Set();

  return items
    .filter(item => !(item.reason || '').includes('🛑'))
    .filter(item => {
      const url = (item.image_url || '').trim();
      if (!url || seenImages.has(url)) return false;
      seenImages.add(url);
      return true;
    })
    .slice(0, MAX_ITEMS)
    .map(item => {
      let reason = item.reason || '';

      // 清洗 reason：只保留 💡 后到第一个 | 之间的推荐理由
      const parts = reason.split(' | ');
      reason = parts[0].replace(/^💡\s*/, '').trim();

      return {
        ...item,
        reason,
        profit_margin: item.profit_margin || null,
        tags: extractTags(reason),
      };
    });
}

/**
 * 调用 N8N 工作流分析店铺
 * @param {string} shopId - 店铺 ID
 * @param {string} shopUrl - 店铺网址（可选）
 * @returns {Promise<object>} - 分析结果
 */
export const analyzeShop = async (shopId, shopUrl = '') => {
  // 检查限流
  const rateLimitResult = checkRateLimit();
  if (!rateLimitResult.allowed) {
    console.warn('⚠️ 請求被限流:', rateLimitResult.reason);
    throw new Error(rateLimitResult.reason);
  }

  const timeout = getDynamicTimeout();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  const startTime = performance.now();

  // 记录请求（在发起请求前记录，确保限流准确）
  recordRequest();

  // 调试日志
  const requestBody = {
    shop_id: shopId,
    shop_url: shopUrl || '',
    timestamp: new Date().toISOString()
  };
  console.log('🚀 Calling N8N API:', N8N_CONFIG.webhookUrl);
  console.log('📦 Request body:', requestBody);

  try {
    const headers = {
      'Content-Type': 'application/json',
    };

    // 如果配置了 API Key，添加到请求头
    if (N8N_CONFIG.apiKey) {
      headers['Authorization'] = `Bearer ${N8N_CONFIG.apiKey}`;
    }

    const response = await fetch(N8N_CONFIG.webhookUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    const elapsed = performance.now() - startTime;
    recordCallTime(elapsed);

    console.log('✅ N8N Response status:', response.status);

    if (!response.ok) {
      throw new Error(`N8N 請求失敗: ${response.status} ${response.statusText}`);
    }

    const raw = await response.json();
    console.log('📥 N8N Response data:', raw);

    // N8N 可能返回数组 [{...}]，取第一个元素
    const data = Array.isArray(raw) ? raw[0] : raw;

    // 验证返回数据格式
    if (!data || !data.status || !data.data) {
      console.error('❌ Invalid N8N response format:', data);
      throw new Error('N8N 返回數據格式不正確');
    }

    const result = normalizeResponse(data);

    // 保存成功结果到缓存
    await saveToCache(shopId, result, true);

    console.log('%c✅ N8N 請求成功', 'color: #10b981; font-weight: bold; font-size: 14px;');
    console.log('🆕 返回最新數據（已保存緩存）');

    return result;
  } catch (error) {
    clearTimeout(timeoutId);

    console.error('❌ N8N API Error:', error);

    // 尝试使用缓存数据降级
    console.log('🔄 嘗試使用緩存降級...');
    const cachedResult = await getFromCache(shopId);

    if (cachedResult) {
      console.log('%c🎯 服務降級成功', 'color: #f59e0b; font-weight: bold; font-size: 14px;');
      console.log('📦 使用緩存數據（用戶端無感知）');
      console.log('📊 緩存時間:', new Date(Date.now() - cachedResult._cacheAge).toLocaleString());
      console.log('🔖 API 版本:', cachedResult.data?.meta?.workflow_version || 'unknown');
      return cachedResult;
    }

    // 如果没有缓存，抛出错误
    console.log('❌ 無可用緩存，降級失敗');

    if (error.name === 'AbortError') {
      throw new Error('請求超時，請稍後重試');
    }

    // CORS 错误提示
    if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
      throw new Error('無法連接到 N8N 服務，請檢查 CORS 配置或網絡連接');
    }

    throw error;
  }
};

// 导出缓存相关函数
export { getCachedShops, clearAllCache, getCacheStats } from './cacheDb';

export default { analyzeShop, getAverageTime };
