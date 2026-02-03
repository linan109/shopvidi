import ReactMarkdown from 'react-markdown';
import { FileText } from 'lucide-react';

const AnalysisResult = ({ data }) => {
  const { analysis_summary } = data;

  return (
    <div className="animate-slide-up">
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
