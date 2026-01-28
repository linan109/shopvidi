// N8N API 服务 - 连接真实 N8N 工作流
// 配置你的 N8N Webhook URL 和认证信息

const N8N_CONFIG = {
  // 替换为你的 N8N Webhook URL
  webhookUrl: import.meta.env.VITE_N8N_WEBHOOK_URL || 'https://your-n8n-instance.com/webhook/shop-analyzer',

  // 可选：API Key 认证
  apiKey: import.meta.env.VITE_N8N_API_KEY || '',

  // 请求超时时间（毫秒）
  timeout: 60000
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

    const data = await response.json();

    // 验证返回数据格式
    if (!data.status || !data.data) {
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
