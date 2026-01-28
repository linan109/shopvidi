// N8N API 服务 - 连接真实 N8N 工作流
// 配置你的 N8N Webhook URL 和认证信息

// 开发环境使用代理，生产环境直接请求
const isDev = import.meta.env.DEV;

const N8N_CONFIG = {
  // 开发环境走代理 /api/n8n，生产环境用完整 URL
  webhookUrl: isDev
    ? '/api/n8n/webhook-test/analyse'
    : (import.meta.env.VITE_N8N_WEBHOOK_URL || 'https://n8n.merakku.ai/webhook-test/analyse'),

  // 可选：API Key 认证
  apiKey: import.meta.env.VITE_N8N_API_KEY || '',

  // 请求超时时间（毫秒）- 5分钟
  timeout: 300000
};

/**
 * 调用 N8N 工作流分析店铺
 * @param {string} shopUrl - 店铺 URL
 * @returns {Promise<object>} - 分析结果
 */
export const analyzeShop = async (shopUrl) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), N8N_CONFIG.timeout);

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
      body: JSON.stringify({
        shop_url: shopUrl,
        timestamp: new Date().toISOString()
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`N8N 请求失败: ${response.status} ${response.statusText}`);
    }

    const raw = await response.json();

    // N8N 可能返回数组 [{...}]，取第一个元素
    const data = Array.isArray(raw) ? raw[0] : raw;

    // 验证返回数据格式
    if (!data || !data.status || !data.data) {
      throw new Error('N8N 返回数据格式不正确');
    }

    return data;
  } catch (error) {
    clearTimeout(timeoutId);

    if (error.name === 'AbortError') {
      throw new Error('请求超时，请稍后重试');
    }

    throw error;
  }
};

export default { analyzeShop };
