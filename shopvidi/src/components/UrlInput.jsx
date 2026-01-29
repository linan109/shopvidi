import { useState, useRef, useEffect } from 'react';
import { Search, ArrowRight, Store, AlertTriangle } from 'lucide-react';
import { searchShops, isShopInList, findOriginalUrl } from '../data/shopList';

const UrlInput = ({ onSubmit, disabled }) => {
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef(null);
  const suggestionsRef = useRef(null);

  // 简单的 URL 格式验证（域名格式）
  const isValidUrlFormat = (value) => {
    // 匹配基本域名格式：xxx.xxx 或 xxx.xxx.xxx
    const domainPattern = /^[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?)+$/;
    const cleaned = value
      .trim()
      .toLowerCase()
      .replace(/^https?:\/\//, '')
      .replace(/^www\./, '')
      .replace(/\/$/, '');
    return domainPattern.test(cleaned);
  };

  // 处理输入变化
  const handleInputChange = (e) => {
    const value = e.target.value;
    setUrl(value);
    setError('');
    setSelectedIndex(-1);

    // 搜索匹配的店铺（空输入也会返回默认列表）
    const matches = searchShops(value);
    setSuggestions(matches);
    setShowSuggestions(matches.length > 0);
  };

  // 选择建议项
  const handleSelectSuggestion = (shop) => {
    setUrl(shop.display);
    setSuggestions([]);
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  // 键盘导航
  const handleKeyDown = (e) => {
    // Shift+Enter 不触发提交（符合其他平台习惯）
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

    const trimmedUrl = url.trim();

    if (!trimmedUrl) {
      setError('請輸入店舖 URL');
      return;
    }

    // 验证 URL 格式
    if (!isValidUrlFormat(trimmedUrl)) {
      setError('請輸入有效的網址格式，例如 shop.example.com');
      return;
    }

    // 检查是否在白名单中
    if (!isShopInList(trimmedUrl)) {
      setError('該店舖尚未開通服務，敬請期待！');
      return;
    }

    // 获取原始网址发送给 N8N
    const originalUrl = findOriginalUrl(trimmedUrl);
    if (originalUrl) {
      onSubmit(originalUrl);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-2xl mx-auto">
      <div className="relative group">
        <div className="absolute inset-0 bg-gradient-to-r from-primary-400 to-primary-600 rounded-2xl blur-lg opacity-20 group-hover:opacity-30 transition-opacity duration-300" />

        <div className="relative">
          <div className="bg-white rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-100 overflow-hidden">
            <div className="flex items-center">
              <div className="pl-5 text-slate-400">
                <Search size={22} />
              </div>

              <input
                ref={inputRef}
                type="text"
                value={url}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                onFocus={() => {
                  // 获取焦点时显示建议列表
                  const matches = searchShops(url);
                  setSuggestions(matches);
                  setShowSuggestions(matches.length > 0);
                }}
                placeholder="輸入合作店舖網址，例如 kaiten.store"
                disabled={disabled}
                autoComplete="off"
                className="flex-1 px-4 py-5 text-lg text-slate-700 placeholder-slate-400 bg-transparent outline-none disabled:opacity-50"
              />

              <button
                type="submit"
                disabled={disabled || !url.trim()}
                className="m-2 px-6 py-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white font-medium rounded-xl hover:from-primary-600 hover:to-primary-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg shadow-primary-500/25"
              >
                開始分析
                <ArrowRight size={18} />
              </button>
            </div>
          </div>

          {/* 自动补全建议列表 - 移到 overflow-hidden 外面 */}
          {showSuggestions && suggestions.length > 0 && (
            <div
              ref={suggestionsRef}
              className="absolute left-0 right-0 top-full mt-2 bg-white rounded-xl shadow-xl border border-slate-100 z-50 animate-fade-in max-h-80 overflow-y-auto"
            >
              <div className="py-2">
                <div className="px-4 py-2 text-xs text-slate-400 uppercase tracking-wide">
                  合作店舖
                </div>
                {suggestions.map((shop, index) => (
                  <button
                    key={shop.display}
                    type="button"
                    onClick={() => handleSelectSuggestion(shop)}
                    className={`w-full px-4 py-3 flex items-center gap-3 hover:bg-slate-50 transition-colors ${
                      index === selectedIndex ? 'bg-primary-50' : ''
                    }`}
                  >
                    <div className="w-8 h-8 bg-gradient-to-br from-primary-100 to-primary-200 rounded-lg flex items-center justify-center">
                      <Store size={16} className="text-primary-600" />
                    </div>
                    <span className="text-slate-700 font-medium">
                      {shop.display}
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

      {/* 提示文案 */}
      <p className="mt-4 text-center text-slate-400 text-sm">
        目前僅支持已合作店舖，輸入網址即可快速匹配
      </p>
    </form>
  );
};

export default UrlInput;
