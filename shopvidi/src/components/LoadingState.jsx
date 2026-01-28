import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';

const LOADING_MESSAGES = [
  "正在连接店铺...",
  "正在解析页面结构...",
  "正在抓取商品数据...",
  "正在分析店铺风格...",
  "正在评估 SEO 表现...",
  "正在分析竞品数据...",
  "正在匹配选品库...",
  "正在生成 AI 推荐...",
  "正在优化产品组合...",
  "即将完成分析..."
];

const LoadingState = () => {
  const [messageIndex, setMessageIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // 文案切换
    const messageInterval = setInterval(() => {
      setMessageIndex((prev) =>
        prev < LOADING_MESSAGES.length - 1 ? prev + 1 : prev
      );
    }, 2500);

    // 进度条动画
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) return prev;
        return prev + Math.random() * 8;
      });
    }, 1000);

    return () => {
      clearInterval(messageInterval);
      clearInterval(progressInterval);
    };
  }, []);

  return (
    <div className="w-full max-w-xl mx-auto animate-fade-in">
      {/* 骨架屏卡片 */}
      <div className="bg-white rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-100 p-8 mb-6">
        {/* 顶部骨架 */}
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 rounded-xl skeleton" />
          <div className="flex-1">
            <div className="h-4 w-3/4 rounded skeleton mb-2" />
            <div className="h-3 w-1/2 rounded skeleton" />
          </div>
        </div>

        {/* 内容骨架 */}
        <div className="space-y-3 mb-6">
          <div className="h-3 w-full rounded skeleton" />
          <div className="h-3 w-5/6 rounded skeleton" />
          <div className="h-3 w-4/6 rounded skeleton" />
        </div>

        {/* 卡片骨架 */}
        <div className="grid grid-cols-2 gap-4">
          <div className="h-24 rounded-xl skeleton" />
          <div className="h-24 rounded-xl skeleton" />
        </div>
      </div>

      {/* 进度指示器 */}
      <div className="text-center">
        <div className="inline-flex items-center gap-3 px-6 py-3 bg-white rounded-full shadow-md">
          <Loader2 className="w-5 h-5 text-primary-500 animate-spin" />
          <span className="text-slate-600 font-medium transition-all duration-300">
            {LOADING_MESSAGES[messageIndex]}
          </span>
        </div>

        {/* 进度条 */}
        <div className="mt-4 w-64 mx-auto">
          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary-400 to-primary-600 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${Math.min(progress, 95)}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoadingState;
