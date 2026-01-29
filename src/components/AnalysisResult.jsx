import ReactMarkdown from 'react-markdown';
import { FileText, Clock, Store, Database } from 'lucide-react';

const AnalysisResult = ({ data }) => {
  const { analysis_summary, meta, _fromCache, _cacheAge } = data;

  // 格式化缓存时间
  function formatCacheAge(ms) {
    const hours = Math.floor(ms / 1000 / 60 / 60);
    if (hours < 1) return '不到 1 小时前';
    if (hours < 24) return `${hours} 小时前`;
    const days = Math.floor(hours / 24);
    return `${days} 天前`;
  }

  return (
    <div className="animate-slide-up">
      {/* 店铺信息头部 */}
      <div className="flex items-center gap-4 mb-6">
        <div className="w-14 h-14 bg-gradient-to-br from-primary-400 to-primary-600 rounded-2xl flex items-center justify-center shadow-lg shadow-primary-500/25">
          <Store className="w-7 h-7 text-white" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-semibold text-slate-800">
              {meta?.shop_name || '店舖分析'}
            </h2>
            {_fromCache && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-700 text-sm font-medium rounded-full border border-amber-200">
                <Database size={14} />
                離線數據
              </span>
            )}
          </div>
          <div className="flex items-center gap-4 text-sm text-slate-500 mt-1">
            {_fromCache ? (
              <span className="flex items-center gap-1">
                <Clock size={14} />
                緩存時間: {formatCacheAge(_cacheAge)}
              </span>
            ) : (
              <span className="flex items-center gap-1">
                <Clock size={14} />
                處理時間: {meta?.processed_time || 'N/A'}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 分析报告卡片 */}
      <div className="bg-white rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-100 overflow-hidden">
        <div className="px-6 py-4 bg-gradient-to-r from-slate-50 to-white border-b border-slate-100">
          <div className="flex items-center gap-2 text-slate-700 font-medium">
            <FileText size={18} className="text-primary-500" />
            AI 分析報告
          </div>
        </div>

        <div className="p-6 markdown-content">
          <ReactMarkdown>{analysis_summary}</ReactMarkdown>
        </div>
      </div>
    </div>
  );
};

export default AnalysisResult;
