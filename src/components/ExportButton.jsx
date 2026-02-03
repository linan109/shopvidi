import { Download, FileSpreadsheet } from 'lucide-react';

const ExportButton = ({ downloadUrl }) => {
  const handleDownload = () => {
    if (downloadUrl) {
      window.open(downloadUrl, '_blank');
    } else {
      alert('這是 Demo 模式。在連接真實 N8N 工作流後，將提供實際的 Excel 下載。');
    }
  };

  return (
    <div className="mt-8 flex justify-center animate-fade-in">
      <button
        onClick={handleDownload}
        className="group relative inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold rounded-2xl hover:from-emerald-600 hover:to-teal-700 transition-all duration-300 shadow-lg shadow-emerald-500/25 hover:shadow-xl hover:shadow-emerald-500/30"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-teal-500 rounded-2xl blur-lg opacity-0 group-hover:opacity-30 transition-opacity duration-300" />
        <FileSpreadsheet size={22} className="relative" />
        <span className="relative">匯出優化選品表</span>
        <Download size={18} className="relative group-hover:translate-y-0.5 transition-transform" />
      </button>
    </div>
  );
};

export default ExportButton;
