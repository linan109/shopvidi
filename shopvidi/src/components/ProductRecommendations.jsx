import { Sparkles, TrendingUp } from 'lucide-react';

const ProductCard = ({ product, index }) => {
  return (
    <div
      className="bg-white rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-100 overflow-hidden hover:shadow-xl hover:border-primary-100 transition-all duration-300 animate-slide-up"
      style={{ animationDelay: `${index * 100}ms` }}
    >
      {/* 产品图片 */}
      <div className="relative aspect-square overflow-hidden bg-slate-100">
        <img
          src={product.image_url}
          alt={product.name}
          className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
          onError={(e) => {
            e.target.src = `https://via.placeholder.com/300x300/f1f5f9/64748b?text=${encodeURIComponent(product.name)}`;
          }}
        />

        {/* 利润标签 */}
        <div className="absolute top-3 right-3 px-3 py-1 bg-green-500/90 text-white text-sm font-medium rounded-full backdrop-blur-sm">
          <span className="flex items-center gap-1">
            <TrendingUp size={14} />
            利润 {product.profit_margin}
          </span>
        </div>
      </div>

      {/* 产品信息 */}
      <div className="p-5">
        <h3 className="font-semibold text-slate-800 text-lg mb-2">
          {product.name}
        </h3>

        <p className="text-slate-500 text-sm leading-relaxed">
          {product.reason}
        </p>
      </div>
    </div>
  );
};

const ProductRecommendations = ({ recommendations }) => {
  if (!recommendations || recommendations.length === 0) {
    return null;
  }

  return (
    <div className="mt-8 animate-fade-in">
      {/* 标题 */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/25">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-slate-800">
            AI 选品推荐
          </h2>
          <p className="text-sm text-slate-500">
            基于店铺风格智能匹配的高利润产品
          </p>
        </div>
      </div>

      {/* 产品网格 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {recommendations.map((product, index) => (
          <ProductCard key={product.id} product={product} index={index} />
        ))}
      </div>
    </div>
  );
};

export default ProductRecommendations;
