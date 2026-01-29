import ReactMarkdown from 'react-markdown';
import { FileText, Clock, Store } from 'lucide-react';

const AnalysisResult = ({ data }) => {
  const { analysis_summary, meta } = data;

  return (
    <div className="animate-slide-up">
      {/* 店铺信息头部 */}
      <div className="flex items-center gap-4 mb-6">
        <div className="w-14 h-14 bg-gradient-to-br from-primary-400 to-primary-600 rounded-2xl flex items-center justify-center shadow-lg shadow-primary-500/25">
          <Store className="w-7 h-7 text-white" />
        </div>
        <div className="flex-1">
          <h2 className="text-xl font-semibold text-slate-800">
            {meta?.shop_name || '店舖分析'}
          </h2>
          <div className="flex items-center gap-4 text-sm text-slate-500 mt-1">
            <span className="flex items-center gap-1">
              <Clock size={14} />
              處理時間: {meta?.processed_time || 'N/A'}
            </span>
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
