import { useState } from 'react';
import { Download, FileSpreadsheet, FileText, Loader2 } from 'lucide-react';
import { generateDemoReport } from '../utils/exportReport';

const ExportButton = ({ downloadUrl, resultData }) => {
  const [exporting, setExporting] = useState(false);

  const handleDownload = () => {
    if (downloadUrl) {
      window.open(downloadUrl, '_blank');
    } else {
      alert('這是 Demo 模式。在連接真實 N8N 工作流後，將提供實際的 Excel 下載。');
    }
  };

  const handleExportDemo = async () => {
    if (!resultData || exporting) return;
    setExporting(true);
    try {
      await generateDemoReport(resultData);
    } catch (err) {
      console.error('匯出報告失敗:', err);
      alert('匯出報告失敗，請稍後重試');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="mt-8 flex justify-center gap-4 animate-fade-in">
      <button
        onClick={handleDownload}
        className="group relative inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold rounded-2xl hover:from-emerald-600 hover:to-teal-700 transition-all duration-300 shadow-lg shadow-emerald-500/25 hover:shadow-xl hover:shadow-emerald-500/30"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-teal-500 rounded-2xl blur-lg opacity-0 group-hover:opacity-30 transition-opacity duration-300" />
        <FileSpreadsheet size={22} className="relative" />
        <span className="relative">匯出優化選品表</span>
        <Download size={18} className="relative group-hover:translate-y-0.5 transition-transform" />
      </button>

      <button
        onClick={handleExportDemo}
        disabled={exporting}
        className="group relative inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-violet-500 to-purple-600 text-white font-semibold rounded-2xl hover:from-violet-600 hover:to-purple-700 transition-all duration-300 shadow-lg shadow-violet-500/25 hover:shadow-xl hover:shadow-violet-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-violet-400 to-purple-500 rounded-2xl blur-lg opacity-0 group-hover:opacity-30 transition-opacity duration-300" />
        {exporting ? (
          <Loader2 size={22} className="relative animate-spin" />
        ) : (
          <FileText size={22} className="relative" />
        )}
        <span className="relative">{exporting ? '匯出中...' : '匯出 Demo 報告'}</span>
        {!exporting && <Download size={18} className="relative group-hover:translate-y-0.5 transition-transform" />}
      </button>
    </div>
  );
};

export default ExportButton;
