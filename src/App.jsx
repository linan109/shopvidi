import { useState } from 'react';
import {
  Header,
  ShopIdInput,
  LoadingState,
  AnalysisResult,
  ProductRecommendations,
  ExportButton
} from './components';
import ErrorState from './components/ErrorState';
import { analyzeShop } from './services/api';
import { RefreshCw } from 'lucide-react';

// 应用状态
const VIEW_STATE = {
  INPUT: 'input',
  LOADING: 'loading',
  RESULT: 'result',
  ERROR: 'error'
};

function App() {
  const [viewState, setViewState] = useState(VIEW_STATE.INPUT);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [analyzedShopId, setAnalyzedShopId] = useState('');

  const handleAnalyze = async (shopId) => {
    setViewState(VIEW_STATE.LOADING);
    setError('');
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
      setError(err.message || '分析過程中發生錯誤，請稍後重試');
      setViewState(VIEW_STATE.ERROR);
    }
  };

  const handleReset = () => {
    setViewState(VIEW_STATE.INPUT);
    setResult(null);
    setError('');
    setAnalyzedShopId('');
  };

  const handleRetry = () => {
    if (analyzedShopId) {
      handleAnalyze(analyzedShopId);
    } else {
      handleReset();
    }
  };

  const handleSelectShop = (shopId) => {
    handleAnalyze(shopId);
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
          <ErrorState
            error={error}
            onRetry={handleRetry}
            onSelectShop={handleSelectShop}
          />
        )}

        {/* 结果视图 */}
        {viewState === VIEW_STATE.RESULT && result && (
          <div className="space-y-8">
            {/* 已分析的 Shop ID */}
            <div className="flex items-center justify-center gap-4 mb-8 animate-fade-in">
              <span className="text-slate-500">已分析:</span>
              <code className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-sm font-mono">
                Shop ID {analyzedShopId}
              </code>
              <button
                onClick={handleReset}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-primary-600 hover:text-primary-700 font-medium text-sm transition-colors"
              >
                <RefreshCw size={16} />
                重新分析
              </button>
            </div>

            {/* 分析结果 */}
            <AnalysisResult data={result} />

            {/* 产品推荐 */}
            <ProductRecommendations recommendations={result.recommendations} />

            {/* 导出按钮 */}
            <ExportButton downloadUrl={result.excel_download_url} resultData={result} />
          </div>
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
