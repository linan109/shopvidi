import { Zap } from 'lucide-react';

const Header = () => {
  return (
    <header className="text-center mb-12 animate-fade-in">
      {/* Logo */}
      <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-700 rounded-2xl shadow-lg shadow-primary-500/30 mb-6">
        <Zap className="w-8 h-8 text-white" />
      </div>

      {/* 标题 */}
      <h1 className="text-4xl md:text-5xl font-bold text-slate-800 mb-4">
        Shop<span className="text-primary-500">Vidi</span>
      </h1>

      {/* 副标题 */}
      <p className="text-lg text-slate-500 max-w-lg mx-auto leading-relaxed">
        AI 驱动的智能店铺分析工具
        <br />
        一键获取店铺诊断报告与高利润选品推荐
      </p>

      {/* 特性标签 */}
      <div className="flex flex-wrap justify-center gap-3 mt-6">
        {['店铺诊断', 'AI 选品', 'Excel 导出'].map((feature) => (
          <span
            key={feature}
            className="px-4 py-1.5 bg-white text-slate-600 text-sm font-medium rounded-full border border-slate-200 shadow-sm"
          >
            {feature}
          </span>
        ))}
      </div>
    </header>
  );
};

export default Header;
