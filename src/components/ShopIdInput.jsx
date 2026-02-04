import { useState, useRef, useEffect } from 'react';
import { Search, ArrowRight, Store, AlertTriangle, Link } from 'lucide-react';
import { searchShopIds } from '../data/shopIdList';

const ShopIdInput = ({ onSubmit, disabled }) => {
  const [shopId, setShopId] = useState('');
  const [shopUrl, setShopUrl] = useState('');
  const [error, setError] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef(null);
  const suggestionsRef = useRef(null);

  // 处理网址，确保带 https
  const normalizeUrl = (url) => {
    if (!url) return '';
    let normalized = url.trim();
    // 移除协议头
    normalized = normalized.replace(/^(https?:\/\/)?/, '');
    // 添加 https
    return `https://${normalized}`;
  };

  // 处理输入变化
  const handleInputChange = (e) => {
    const value = e.target.value;
    setShopId(value);
    setError('');
    setSelectedIndex(-1);

    const matches = searchShopIds(value);
    setSuggestions(matches);
    setShowSuggestions(matches.length > 0);
  };

  // 选择建议项
  const handleSelectSuggestion = (id) => {
    setShopId(id);
    setSuggestions([]);
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  // 键盘导航
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && e.shiftKey) {
      e.preventDefault();
      return;
    }

    if (!showSuggestions || suggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev =>
        prev < suggestions.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
    } else if (e.key === 'Enter' && selectedIndex >= 0) {
      e.preventDefault();
      handleSelectSuggestion(suggestions[selectedIndex]);
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  // 点击外部关闭建议列表
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(e.target) &&
        !inputRef.current?.contains(e.target)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    const trimmed = shopId.trim().toUpperCase();

    if (!trimmed) {
      setError('請輸入店鋪 ID');
      return;
    }

    // 处理网址并传递
    const normalizedUrl = normalizeUrl(shopUrl);
    onSubmit(trimmed, normalizedUrl);
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-2xl mx-auto">
      <div className="relative group">
        <div className="absolute inset-0 bg-gradient-to-r from-primary-400 to-primary-600 rounded-2xl blur-lg opacity-20 group-hover:opacity-30 transition-opacity duration-300" />

        <div className="relative">
          <div className="bg-white rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-100 overflow-hidden">
            {/* 店铺 ID 输入 */}
            <div className="flex items-center border-b border-slate-100">
              <div className="pl-5 text-slate-400">
                <Search size={22} />
              </div>

              <input
                ref={inputRef}
                type="text"
                value={shopId}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder="輸入店鋪 ID"
                disabled={disabled}
                autoComplete="off"
                className="flex-1 px-4 py-4 text-lg text-slate-700 placeholder-slate-400 bg-transparent outline-none disabled:opacity-50"
              />
            </div>

            {/* 店铺网址输入 */}
            <div className="flex items-center">
              <div className="pl-5 text-slate-400">
                <Link size={22} />
              </div>

              <input
                type="text"
                value={shopUrl}
                onChange={(e) => setShopUrl(e.target.value)}
                placeholder="輸入店鋪網址（選填）"
                disabled={disabled}
                autoComplete="off"
                className="flex-1 px-4 py-4 text-lg text-slate-700 placeholder-slate-400 bg-transparent outline-none disabled:opacity-50"
              />

              <button
                type="submit"
                disabled={disabled || !shopId.trim()}
                className="m-2 px-6 py-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white font-medium rounded-xl hover:from-primary-600 hover:to-primary-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg shadow-primary-500/25"
              >
                開始分析
                <ArrowRight size={18} />
              </button>
            </div>
          </div>

          {/* 自动补全建议列表 */}
          {showSuggestions && suggestions.length > 0 && (
            <div
              ref={suggestionsRef}
              className="absolute left-0 right-0 top-full mt-2 bg-white rounded-xl shadow-xl border border-slate-100 z-50 animate-fade-in max-h-80 overflow-y-auto"
            >
              <div className="py-2">
                <div className="px-4 py-2 text-xs text-slate-400 uppercase tracking-wide">
                  合作店鋪
                </div>
                {suggestions.map((id, index) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => handleSelectSuggestion(id)}
                    className={`w-full px-4 py-3 flex items-center gap-3 hover:bg-slate-50 transition-colors ${
                      index === selectedIndex ? 'bg-primary-50' : ''
                    }`}
                  >
                    <div className="w-8 h-8 bg-gradient-to-br from-primary-100 to-primary-200 rounded-lg flex items-center justify-center">
                      <Store size={16} className="text-primary-600" />
                    </div>
                    <span className="text-slate-700 font-medium">
                      {id}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="mt-4 flex items-center justify-center gap-2 text-amber-600 animate-fade-in">
          <AlertTriangle size={18} />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

    </form>
  );
};

export default ShopIdInput;
