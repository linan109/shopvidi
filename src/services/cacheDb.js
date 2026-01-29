// IndexedDB 缓存服务
// 用于缓存店铺分析结果，实现离线降级

const DB_NAME = 'ShopVidiCache';
const DB_VERSION = 1;
const STORE_NAME = 'analysisResults';
const MAX_CACHE_AGE = 7 * 24 * 60 * 60 * 1000; // 7 天

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

    const cacheData = {
      shop_url: normalizeUrl(shopUrl),
      original_url: shopUrl,
      result,
      success,
      timestamp: Date.now(),
    };

    await new Promise((resolve, reject) => {
      const request = store.put(cacheData);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });

    console.log('✅ 缓存已保存:', normalizeUrl(shopUrl));
  } catch (error) {
    console.error('❌ 保存缓存失败:', error);
  }
}

/**
 * 从缓存读取分析结果
 * @param {string} shopUrl - 店铺 URL
 * @returns {object|null} - 缓存的结果或 null
 */
export async function getFromCache(shopUrl) {
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

    console.log('✅ 使用缓存数据:', normalizeUrl(shopUrl), `(${Math.floor(age / 1000 / 60 / 60)}小时前)`);
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
 * 清除过期缓存
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

    let deletedCount = 0;
    for (const key of allKeys) {
      const data = await new Promise((resolve, reject) => {
        const request = store.get(key);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });

      if (data && Date.now() - data.timestamp > MAX_CACHE_AGE) {
        await new Promise((resolve, reject) => {
          const request = store.delete(key);
          request.onsuccess = () => resolve();
          request.onerror = () => reject(request.error);
        });
        deletedCount++;
      }
    }

    if (deletedCount > 0) {
      console.log(`🗑️ 已清理 ${deletedCount} 条过期缓存`);
    }
  } catch (error) {
    console.error('❌ 清理缓存失败:', error);
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
