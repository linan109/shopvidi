/**
 * 请求限流器
 * 支持每秒、每分钟、每小时的请求限制
 */

const STORAGE_KEY = 'shopvidi_rate_limit';

// 默认限制配置
const DEFAULT_LIMITS = {
  perSecond: 2,    // 每秒最多 2 次
  perMinute: 30,   // 每分钟最多 30 次
  perHour: 300,     // 每小时最多 300 次
};

/**
 * 获取限流配置（可通过环境变量覆盖）
 */
function getLimits() {
  return {
    perSecond: parseInt(import.meta.env.VITE_RATE_LIMIT_PER_SECOND) || DEFAULT_LIMITS.perSecond,
    perMinute: parseInt(import.meta.env.VITE_RATE_LIMIT_PER_MINUTE) || DEFAULT_LIMITS.perMinute,
    perHour: parseInt(import.meta.env.VITE_RATE_LIMIT_PER_HOUR) || DEFAULT_LIMITS.perHour,
  };
}

/**
 * 获取请求时间戳记录
 */
function getRequestTimes() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

/**
 * 保存请求时间戳记录
 */
function saveRequestTimes(times) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(times));
}

/**
 * 清理过期的时间戳（只保留最近 1 小时内的）
 */
function cleanExpiredTimes(times) {
  const oneHourAgo = Date.now() - 60 * 60 * 1000;
  return times.filter(t => t > oneHourAgo);
}

/**
 * 检查是否可以发起请求
 * @returns {{ allowed: boolean, retryAfter?: number, reason?: string }}
 */
export function checkRateLimit() {
  const limits = getLimits();
  const now = Date.now();
  let times = cleanExpiredTimes(getRequestTimes());

  const oneSecondAgo = now - 1000;
  const oneMinuteAgo = now - 60 * 1000;
  const oneHourAgo = now - 60 * 60 * 1000;

  // 统计各时间窗口内的请求次数
  const countLastSecond = times.filter(t => t > oneSecondAgo).length;
  const countLastMinute = times.filter(t => t > oneMinuteAgo).length;
  const countLastHour = times.filter(t => t > oneHourAgo).length;

  // 检查每秒限制
  if (countLastSecond >= limits.perSecond) {
    const oldestInSecond = times.filter(t => t > oneSecondAgo).sort()[0];
    const retryAfter = Math.ceil((oldestInSecond + 1000 - now) / 1000);
    return {
      allowed: false,
      retryAfter,
      reason: `請求過於頻繁，請 ${retryAfter} 秒後重試`,
    };
  }

  // 检查每分钟限制
  if (countLastMinute >= limits.perMinute) {
    const oldestInMinute = times.filter(t => t > oneMinuteAgo).sort()[0];
    const retryAfter = Math.ceil((oldestInMinute + 60 * 1000 - now) / 1000);
    return {
      allowed: false,
      retryAfter,
      reason: `每分鐘請求次數已達上限（${limits.perMinute} 次），請 ${retryAfter} 秒後重試`,
    };
  }

  // 检查每小时限制
  if (countLastHour >= limits.perHour) {
    const oldestInHour = times.filter(t => t > oneHourAgo).sort()[0];
    const retryAfter = Math.ceil((oldestInHour + 60 * 60 * 1000 - now) / 1000 / 60);
    return {
      allowed: false,
      retryAfter: retryAfter * 60,
      reason: `每小時請求次數已達上限（${limits.perHour} 次），請 ${retryAfter} 分鐘後重試`,
    };
  }

  return { allowed: true };
}

/**
 * 记录一次请求
 */
export function recordRequest() {
  let times = cleanExpiredTimes(getRequestTimes());
  times.push(Date.now());
  saveRequestTimes(times);
}

/**
 * 获取当前限流状态（用于调试/显示）
 */
export function getRateLimitStatus() {
  const limits = getLimits();
  const now = Date.now();
  const times = cleanExpiredTimes(getRequestTimes());

  const oneSecondAgo = now - 1000;
  const oneMinuteAgo = now - 60 * 1000;
  const oneHourAgo = now - 60 * 60 * 1000;

  return {
    limits,
    usage: {
      lastSecond: times.filter(t => t > oneSecondAgo).length,
      lastMinute: times.filter(t => t > oneMinuteAgo).length,
      lastHour: times.filter(t => t > oneHourAgo).length,
    },
  };
}

/**
 * 重置限流计数（用于调试）
 */
export function resetRateLimit() {
  localStorage.removeItem(STORAGE_KEY);
}
