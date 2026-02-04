import { useState } from 'react';
import {
  Header,
  ShopIdInput,
  LoadingState,
  AnalysisResult,
  ProductRecommendations,
  ExportButton,
} from './components';
import ErrorState from './components/ErrorState';
import { analyzeShop } from './services/api';
import { generateReportImage } from './utils/exportReport';
import { RefreshCw, FileDown } from 'lucide-react';

// 应用状态
const VIEW_STATE = {
  INPUT: 'input',
  LOADING: 'loading',
  RESULT: 'result',
  ERROR: 'error'
};

// URL 参数
const urlParams = new URLSearchParams(window.location.search);
const isExportMode = urlParams.get('mode') === 'export';

function App() {
  const [viewState, setViewState] = useState(VIEW_STATE.INPUT);
  const [result, setResult] = useState(null);
  const [analyzedShopId, setAnalyzedShopId] = useState('');
  const [analyzedShopUrl, setAnalyzedShopUrl] = useState('');


  const handleAnalyze = async (shopId, shopUrl = '') => {
    setViewState(VIEW_STATE.LOADING);
    setAnalyzedShopId(shopId);
    setAnalyzedShopUrl(shopUrl);

    try {
      const response = await analyzeShop(shopId, shopUrl);

      if (response.status === 'success') {
        setResult(response.data);
        setViewState(VIEW_STATE.RESULT);
      } else {
        throw new Error(response.message || '分析失敗');
      }
    } catch (err) {
      console.error('分析错误:', err);
      setViewState(VIEW_STATE.ERROR);
    }
  };

  const handleReset = () => {
    setViewState(VIEW_STATE.INPUT);
    setResult(null);
    setAnalyzedShopId('');
    setAnalyzedShopUrl('');
  };

  // 保存报告截图
  const handleSaveReport = () => {
    generateReportImage(analyzedShopId, analyzedShopUrl).catch(err => {
      console.error('截图导出失败:', err);
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* 背景装饰 - 导出模式下隐藏 */}
      {!isExportMode && (
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary-100 rounded-full blur-3xl opacity-30" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-primary-200 rounded-full blur-3xl opacity-20" />
        </div>
      )}

      {/* 主内容 */}
      <main className="relative max-w-6xl mx-auto px-6 py-16">
        <Header />

        {/* 输入视图 */}
        {viewState === VIEW_STATE.INPUT && (
          <ShopIdInput onSubmit={handleAnalyze} />
        )}

        {/* 加载视图 */}
        {viewState === VIEW_STATE.LOADING && (
          <LoadingState />
        )}

        {/* 错误视图 */}
        {viewState === VIEW_STATE.ERROR && (
          <ErrorState />
        )}

        {/* 结果视图 */}
        {viewState === VIEW_STATE.RESULT && result && (
          <>
            <div id="report-content" className={`space-y-8 ${isExportMode ? 'bg-white p-6 rounded-2xl' : ''}`}>
              {/* 重新分析按钮 - 仅正常模式显示 */}
              {!isExportMode && (
                <div className="flex justify-center mb-8 animate-fade-in">
                  <button
                    onClick={handleReset}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-primary-600 hover:text-primary-700 font-medium text-sm transition-colors"
                  >
                    <RefreshCw size={16} />
                    重新分析
                  </button>
                </div>
              )}

              {/* 分析结果 */}
              <AnalysisResult data={result} shopUrl={isExportMode ? '' : analyzedShopUrl} />

              {/* 产品推荐 */}
              <ProductRecommendations recommendations={result.recommendations} />

              {/* Excel 导出按钮 - 仅正常模式显示 */}
              {!isExportMode && (
                <>
                  <ExportButton downloadUrl={result.excel_download_url} />

                  {/* 保存报告按钮 - 正常模式也显示 */}
                  <div className="flex justify-center">
                    <button
                      onClick={handleSaveReport}
                      className="inline-flex items-center gap-2 px-6 py-3 bg-white text-slate-600 font-medium rounded-xl border border-slate-200 hover:bg-slate-50 hover:border-slate-300 transition-all duration-200 shadow-sm"
                    >
                      <FileDown size={18} />
                      下載報告
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* 保存报告按钮 - 仅导出模式显示，在截图区域外 */}
            {isExportMode && (
              <div className="mt-8 flex justify-center">
                <button
                  onClick={handleSaveReport}
                  className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-violet-500 to-purple-600 text-white font-semibold rounded-2xl hover:from-violet-600 hover:to-purple-700 transition-all duration-300 shadow-lg"
                >
                  <FileDown size={20} />
                  保存報告 HTML
                </button>
              </div>
            )}
          </>
        )}

        {/* 页脚 */}
        <footer className="mt-20 text-center text-slate-400 text-sm">
          <p>Powered by AI · Built with ShopVidi</p>
        </footer>
      </main>
    </div>
  );
}

export default App;
