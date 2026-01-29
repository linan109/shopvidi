// API 服务入口
// 根据环境变量切换 Mock API 和真实 N8N API

import * as mockApi from './mockApi';
import * as n8nApi from './n8nApi';

// 使用 Mock API（开发阶段设为 true）
// 只有明确设置为 'true' 时才使用 Mock，默认使用真实 API
const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true';

const api = USE_MOCK ? mockApi : n8nApi;

// 调试信息（仅在开发环境输出）
if (import.meta.env.DEV) {
  console.log('🔧 API Mode:', USE_MOCK ? 'Mock API' : 'Real N8N API');
  console.log('🔧 VITE_USE_MOCK:', import.meta.env.VITE_USE_MOCK);
  console.log('🔧 N8N Webhook URL:', import.meta.env.VITE_N8N_WEBHOOK_URL);
}

export const analyzeShop = api.analyzeShop;

export default api;
