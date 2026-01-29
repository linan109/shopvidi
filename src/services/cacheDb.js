// IndexedDB 缓存服务
// 用于缓存店铺分析结果，实现离线降级

const DB_NAME = 'ShopVidiCache';
const DB_VERSION = 1;
const STORE_NAME = 'analysisResults';
const MAX_CACHE_AGE = 7 * 24 * 60 * 60 * 1000; // 7 天

// API 版本配置
// ⚠️ 当 N8N workflow 有重大变更时，需要手动更新此版本号
// 版本号不匹配的缓存会被自动忽略
const API_VERSION = import.meta.env.VITE_API_VERSION || '1.0.0';

let dbInstance = null;

/**
 * 初始化 IndexedDB
 */
function initDB() {
  return new Promise((resolve, reject) => {
    if (dbInstance) {
      resolve(dbInstance);
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      dbInstance = request.result;
      resolve(dbInstance);
    };

    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      // 创建对象存储（如果不存在）
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'shop_url' });
        store.createIndex('timestamp', 'timestamp', { unique: false });
        store.createIndex('success', 'success', { unique: false });
      }
    };
  });
}

/**
 * 标准化店铺 URL（用作缓存键）
 */
function normalizeUrl(url) {
  try {
    const parsed = new URL(url.startsWith('http') ? url : `https://${url}`);
    return parsed.hostname + parsed.pathname.replace(/\/$/, '');
  } catch {
    return url.toLowerCase().trim();
  }
}

/**
 * 提取 API 版本号（从返回数据中）
 */
function extractApiVersion(result) {
  // 优先从顶层 version 字段读取
  if (result.version) return result.version;

  // 其次从 meta.workflow_version 读取
  if (result.data?.meta?.workflow_version) return result.data.meta.workflow_version;

  // 降级使用配置的版本号
  return API_VERSION;
}

/**
 * 保存分析结果到缓存
 * @param {string} shopUrl - 店铺 URL
 * @param {object} result - 分析结果
 * @param {boolean} success - 是否成功
 */
export async function saveToCache(shopUrl, result, success = true) {
  try {
    const db = await initDB();
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    const apiVersion = extractApiVersion(result);

    const cacheData = {
      shop_url: normalizeUrl(shopUrl),
      original_url: shopUrl,
      result,
      success,
      timestamp: Date.now(),
      api_version: apiVersion, // 记录 API 版本
    };

    await new Promise((resolve, reject) => {
      const request = store.put(cacheData);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });

    console.log('✅ 缓存已保存:', normalizeUrl(shopUrl), `(API v${apiVersion})`);
  } catch (error) {
    console.error('❌ 保存缓存失败:', error);
  }
}

/**
 * 从缓存读取分析结果
 * @param {string} shopUrl - 店铺 URL
 * @param {boolean} ignoreVersion - 是否忽略版本检查（用于展示历史记录）
 * @returns {object|null} - 缓存的结果或 null
 */
export async function getFromCache(shopUrl, ignoreVersion = false) {
  try {
    const db = await initDB();
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);

    const cacheData = await new Promise((resolve, reject) => {
      const request = store.get(normalizeUrl(shopUrl));
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    if (!cacheData) {
      console.log('📭 无缓存数据:', normalizeUrl(shopUrl));
      return null;
    }

    // 检查缓存是否过期
    const age = Date.now() - cacheData.timestamp;
    if (age > MAX_CACHE_AGE) {
      console.log('⏰ 缓存已过期:', normalizeUrl(shopUrl));
      return null;
    }

    // 检查 API 版本是否匹配
    if (!ignoreVersion && cacheData.api_version !== API_VERSION) {
      console.log(`⚠️ API 版本不匹配: 缓存 v${cacheData.api_version} vs 当前 v${API_VERSION}`);
      console.log('💡 提示: 缓存被忽略，将重新请求最新数据');
      return null;
    }

    console.log('✅ 使用缓存数据:', normalizeUrl(shopUrl), `(${Math.floor(age / 1000 / 60 / 60)}小时前, API v${cacheData.api_version})`);
    return {
      ...cacheData.result,
      _fromCache: true,
      _cacheAge: age,
    };
  } catch (error) {
    console.error('❌ 读取缓存失败:', error);
    return null;
  }
}

/**
 * 获取所有成功缓存的店铺列表
 * @returns {Array} - 店铺列表
 */
export async function getCachedShops() {
  try {
    const db = await initDB();
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const index = store.index('success');

    const shops = await new Promise((resolve, reject) => {
      const request = index.getAll(true); // 只获取成功的
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    // 过滤过期数据，按时间倒序
    return shops
      .filter(shop => Date.now() - shop.timestamp < MAX_CACHE_AGE)
      .sort((a, b) => b.timestamp - a.timestamp)
      .map(shop => ({
        url: shop.original_url,
        shop_name: shop.result?.data?.meta?.shop_name || shop.original_url,
        timestamp: shop.timestamp,
        age: Date.now() - shop.timestamp,
      }));
  } catch (error) {
    console.error('❌ 获取缓存列表失败:', error);
    return [];
  }
}

/**
 * 清除过期缓存和旧版本缓存
 */
export async function cleanExpiredCache() {
  try {
    const db = await initDB();
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    const allKeys = await new Promise((resolve, reject) => {
      const request = store.getAllKeys();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    let expiredCount = 0;
    let versionCount = 0;

    for (const key of allKeys) {
      const data = await new Promise((resolve, reject) => {
        const request = store.get(key);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });

      if (!data) continue;

      let shouldDelete = false;

      // 检查是否过期
      if (Date.now() - data.timestamp > MAX_CACHE_AGE) {
        shouldDelete = true;
        expiredCount++;
      }

      // 检查 API 版本是否过旧
      if (data.api_version && data.api_version !== API_VERSION) {
        shouldDelete = true;
        versionCount++;
      }

      if (shouldDelete) {
        await new Promise((resolve, reject) => {
          const request = store.delete(key);
          request.onsuccess = () => resolve();
          request.onerror = () => reject(request.error);
        });
      }
    }

    if (expiredCount > 0 || versionCount > 0) {
      console.log(`🗑️ 清理缓存: ${expiredCount} 条过期, ${versionCount} 条旧版本`);
    }
  } catch (error) {
    console.error('❌ 清理缓存失败:', error);
  }
}

/**
 * 获取缓存统计信息
 */
export async function getCacheStats() {
  try {
    const db = await initDB();
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);

    const allData = await new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    const now = Date.now();
    const stats = {
      total: allData.length,
      valid: 0,
      expired: 0,
      outdated: 0, // 版本过旧
      byVersion: {},
    };

    allData.forEach(data => {
      const age = now - data.timestamp;
      const version = data.api_version || 'unknown';

      stats.byVersion[version] = (stats.byVersion[version] || 0) + 1;

      if (age > MAX_CACHE_AGE) {
        stats.expired++;
      } else if (data.api_version !== API_VERSION) {
        stats.outdated++;
      } else {
        stats.valid++;
      }
    });

    return stats;
  } catch (error) {
    console.error('❌ 获取缓存统计失败:', error);
    return null;
  }
}

/**
 * 清空所有缓存
 */
export async function clearAllCache() {
  try {
    const db = await initDB();
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    await new Promise((resolve, reject) => {
      const request = store.clear();
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });

    console.log('🗑️ 已清空所有缓存');
  } catch (error) {
    console.error('❌ 清空缓存失败:', error);
  }
}

// 启动时清理过期缓存
if (typeof window !== 'undefined') {
  cleanExpiredCache().catch(console.error);
}
