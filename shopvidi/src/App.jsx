import { useState } from 'react';
import {
  Header,
  UrlInput,
  LoadingState,
  AnalysisResult,
  ProductRecommendations,
  ExportButton
} from './components';
import { analyzeShop } from './services/api';
import { RefreshCw, AlertCircle } from 'lucide-react';

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
  const [analyzedUrl, setAnalyzedUrl] = useState('');

  const handleAnalyze = async (url) => {
    setViewState(VIEW_STATE.LOADING);
    setError('');
    setAnalyzedUrl(url);

    try {
      const response = await analyzeShop(url);

      if (response.status === 'success') {
        setResult(response.data);
        setViewState(VIEW_STATE.RESULT);
      } else {
        throw new Error(response.message || '分析失败');
      }
    } catch (err) {
      console.error('分析错误:', err);
      setError(err.message || '分析过程中发生错误，请稍后重试');
      setViewState(VIEW_STATE.ERROR);
    }
  };

  const handleReset = () => {
    setViewState(VIEW_STATE.INPUT);
    setResult(null);
    setError('');
    setAnalyzedUrl('');
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
          <UrlInput onSubmit={handleAnalyze} />
        )}

        {/* 加载视图 */}
        {viewState === VIEW_STATE.LOADING && (
          <LoadingState />
        )}

        {/* 错误视图 */}
        {viewState === VIEW_STATE.ERROR && (
          <div className="max-w-md mx-auto text-center animate-fade-in">
            <div className="bg-white rounded-2xl shadow-lg shadow-slate-200/50 border border-red-100 p-8">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-8 h-8 text-red-500" />
              </div>
              <h3 className="text-lg font-semibold text-slate-800 mb-2">
                分析失败
              </h3>
              <p className="text-slate-500 mb-6">{error}</p>
              <button
                onClick={handleReset}
                className="inline-flex items-center gap-2 px-6 py-3 bg-slate-800 text-white font-medium rounded-xl hover:bg-slate-700 transition-colors"
              >
                <RefreshCw size={18} />
                重新尝试
              </button>
            </div>
          </div>
        )}

        {/* 结果视图 */}
        {viewState === VIEW_STATE.RESULT && result && (
          <div className="space-y-8">
            {/* 已分析的 URL */}
            <div className="flex items-center justify-center gap-4 mb-8 animate-fade-in">
              <span className="text-slate-500">已分析:</span>
              <code className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-sm font-mono">
                {analyzedUrl}
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
            <ExportButton downloadUrl={result.excel_download_url} />
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
