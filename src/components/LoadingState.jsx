import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { getAverageTime } from '../services/n8nApi.js';

const LOADING_MESSAGES = [
  "正在連接店舖數據...",
  "讀取近期銷量及訂單數據...",
  "分析暢銷品類及熱賣趨勢...",
  "發掘高利潤爆品機會...",
  "評估銷售增長空間...",
  "掃描新興市場及藍海賽道...",
  "比對供應鏈匹配度...",
  "篩選高潛力推薦商品...",
  "生成分析報告...",
  "即將完成，請稍候..."
];

const LoadingState = () => {
  const [messageIndex, setMessageIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const avg = getAverageTime();
    const estimatedTime = avg !== null ? avg : 600000; // 默认 600s
    const interval = estimatedTime / LOADING_MESSAGES.length;

    // 文案切换
    const messageInterval = setInterval(() => {
      setMessageIndex((prev) =>
        prev < LOADING_MESSAGES.length - 1 ? prev + 1 : prev
      );
    }, interval);

    // 进度条动画：基于预估时间匀速推进到 90%
    const progressTick = 1000; // 每秒更新一次
    const totalTicks = estimatedTime / progressTick;
    const stepPerTick = 90 / totalTicks;

    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) return prev;
        // 加少量随机波动，避免太机械
        const jitter = stepPerTick * 0.3 * (Math.random() - 0.5);
        return Math.min(90, prev + stepPerTick + jitter);
      });
    }, progressTick);

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
