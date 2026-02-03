import { useState, useEffect, useMemo } from 'react';
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
import { RefreshCw, Camera } from 'lucide-react';

// 应用状态
const VIEW_STATE = {
  INPUT: 'input',
  LOADING: 'loading',
  RESULT: 'result',
  ERROR: 'error'
};

// 检查是否为导出模式
const isExportMode = new URLSearchParams(window.location.search).get('mode') === 'export';

// 脱敏处理
function sanitizeData(data) {
  if (!data) return data;
  const clone = JSON.parse(JSON.stringify(data));
  const originalName = clone.meta?.shop_name || '';
  const placeholder = '店鋪 A';

  if (clone.meta?.shop_name) clone.meta.shop_name = placeholder;
  if (clone.shop_name) clone.shop_name = placeholder;
  if (clone.analysis_summary && originalName) {
    clone.analysis_summary = clone.analysis_summary.replaceAll(originalName, placeholder);
  }
  return clone;
}

function App() {
  const [viewState, setViewState] = useState(VIEW_STATE.INPUT);
  const [result, setResult] = useState(null);
  const [analyzedShopId, setAnalyzedShopId] = useState('');

  // 导出模式下使用脱敏数据
  const displayData = useMemo(() => {
    return isExportMode ? sanitizeData(result) : result;
  }, [result]);

  const handleAnalyze = async (shopId) => {
    setViewState(VIEW_STATE.LOADING);
    setAnalyzedShopId(shopId);

    try {
      const response = await analyzeShop(shopId);

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
  };

  // 保存报告截图
  const handleSaveReport = () => {
    generateReportImage().catch(err => {
      console.error('截图导出失败:', err);
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* 背景装饰 */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary-100 rounded-full blur-3xl opacity-30" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-primary-200 rounded-full blur-3xl opacity-20" />
      </div>

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
        {viewState === VIEW_STATE.RESULT && displayData && (
          <>
            <div id="report-content" className="space-y-8">
              {/* 已分析的 Shop ID - 导出模式下显示脱敏信息 */}
              <div className="flex items-center justify-center gap-4 mb-8 animate-fade-in">
                <span className="text-slate-500">已分析:</span>
                <code className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-sm font-mono">
                  {isExportMode ? '店鋪 A' : `Shop ID ${analyzedShopId}`}
                </code>
                {!isExportMode && (
                  <button
                    onClick={handleReset}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-primary-600 hover:text-primary-700 font-medium text-sm transition-colors"
                  >
                    <RefreshCw size={16} />
                    重新分析
                  </button>
                )}
              </div>

              {/* 分析结果 */}
              <AnalysisResult data={displayData} />

              {/* 产品推荐 */}
              <ProductRecommendations recommendations={displayData.recommendations} />

              {/* Excel 导出按钮 - 仅正常模式显示 */}
              {!isExportMode && (
                <ExportButton downloadUrl={displayData.excel_download_url} />
              )}
            </div>

            {/* 保存报告按钮 - 仅导出模式显示，在截图区域外 */}
            {isExportMode && (
              <div className="mt-8 flex justify-center">
                <button
                  onClick={handleSaveReport}
                  className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-violet-500 to-purple-600 text-white font-semibold rounded-2xl hover:from-violet-600 hover:to-purple-700 transition-all duration-300 shadow-lg"
                >
                  <Camera size={20} />
                  保存報告圖片
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
