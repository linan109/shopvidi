import ReactMarkdown from 'react-markdown';
import { FileText, ExternalLink } from 'lucide-react';

// 精简网址显示：去掉协议和尾部斜杠，截断过长的路径
const formatDisplayUrl = (url) => {
  if (!url) return '';
  let display = url
    .replace(/^https?:\/\//, '')  // 去掉协议
    .replace(/\/$/, '');          // 去掉尾部斜杠

  // 如果太长，截断显示
  if (display.length > 40) {
    const parts = display.split('/');
    if (parts.length > 1) {
      display = parts[0] + '/...';
    }
  }
  return display;
};

const AnalysisResult = ({ data, shopUrl = '' }) => {
  const { analysis_summary } = data;
  const displayUrl = formatDisplayUrl(shopUrl);

  return (
    <div className="animate-slide-up">
      {/* 分析报告卡片 */}
      <div className="bg-white rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-100 overflow-hidden">
        <div className="px-6 py-4 bg-gradient-to-r from-slate-50 to-white border-b border-slate-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-slate-700 font-medium">
              <FileText size={18} className="text-primary-500" />
              AI 分析報告
            </div>
            {displayUrl && (
              <a
                href={shopUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-primary-600 transition-colors"
              >
                <span className="truncate max-w-[200px]">{displayUrl}</span>
                <ExternalLink size={14} />
              </a>
            )}
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
