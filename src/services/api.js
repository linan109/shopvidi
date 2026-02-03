// API 服务入口
// 使用 N8N API + IndexedDB 缓存降级策略

import * as n8nApi from './n8nApi';
import * as rateLimiter from './rateLimiter';

// 调试信息（仅在开发环境输出）
if (import.meta.env.DEV) {
  console.log('🔧 N8N Webhook URL:', import.meta.env.VITE_N8N_WEBHOOK_URL || 'https://n8n.merakku.ai/webhook/analyse');
  console.log('🔧 Cache Strategy: IndexedDB (降级时使用)');
  console.log('🔧 Rate Limits:', rateLimiter.getRateLimitStatus().limits);
}

export const analyzeShop = n8nApi.analyzeShop;
export const getCachedShops = n8nApi.getCachedShops;
export const clearAllCache = n8nApi.clearAllCache;

// 限流相关
export const getRateLimitStatus = rateLimiter.getRateLimitStatus;
export const resetRateLimit = rateLimiter.resetRateLimit;

export default n8nApi;
