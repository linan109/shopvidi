import { useState, useEffect } from 'react';
import { AlertCircle, RefreshCw, History, Clock } from 'lucide-react';
import { getCachedShops } from '../services/n8nApi';

/**
 * 错误状态组件
 * 显示错误信息 + 推荐有缓存的店铺
 */
export default function ErrorState({ error, onRetry, onSelectShop }) {
  const [cachedShops, setCachedShops] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCachedShops();
  }, []);

  async function loadCachedShops() {
    try {
      const shops = await getCachedShops();
      setCachedShops(shops);
    } catch (err) {
      console.error('加载缓存店铺失败:', err);
    } finally {
      setLoading(false);
    }
  }

  function formatAge(ms) {
    const hours = Math.floor(ms / 1000 / 60 / 60);
    if (hours < 1) return '不到 1 小时前';
    if (hours < 24) return `${hours} 小时前`;
    const days = Math.floor(hours / 24);
    return `${days} 天前`;
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      {/* 错误信息 */}
      <div className="bg-red-50 border border-red-200 rounded-2xl p-8 mb-8">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              分析失败
            </h2>
            <p className="text-gray-700 mb-4">
              {error || '服务暂时不可用，请稍后重试'}
            </p>
            <button
              onClick={onRetry}
              className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              重试
            </button>
          </div>
        </div>
      </div>

      {/* 推荐有缓存的店铺 */}
      {!loading && cachedShops.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-2xl p-8">
          <div className="flex items-center gap-3 mb-6">
            <History className="w-6 h-6 text-blue-500" />
            <h3 className="text-lg font-semibold text-gray-900">
              推荐查看历史分析（离线可用）
            </h3>
          </div>

          <div className="space-y-3">
            {cachedShops.slice(0, 10).map((shop, index) => (
              <button
                key={index}
                onClick={() => onSelectShop(shop.url)}
                className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors text-left group"
              >
                <div className="flex-1">
                  <div className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                    {shop.shop_name}
                  </div>
                  <div className="text-sm text-gray-500 mt-1">
                    {shop.url}
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Clock className="w-4 h-4" />
                  {formatAge(shop.age)}
                </div>
              </button>
            ))}
          </div>

          <p className="text-sm text-gray-500 mt-6 text-center">
            💡 这些店铺的分析结果已缓存，即使服务离线也能查看
          </p>
        </div>
      )}

      {!loading && cachedShops.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <History className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>暂无历史分析记录</p>
        </div>
      )}
    </div>
  );
}
