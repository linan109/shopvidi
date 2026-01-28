// API 服务入口
// 根据环境变量切换 Mock API 和真实 N8N API

import * as mockApi from './mockApi';
import * as n8nApi from './n8nApi';

// 使用 Mock API（开发阶段设为 true）
const USE_MOCK = import.meta.env.VITE_USE_MOCK !== 'false';

const api = USE_MOCK ? mockApi : n8nApi;

export const analyzeShop = api.analyzeShop;

export default api;
