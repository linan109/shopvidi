// 合作店铺 ID 列表
// N8N 后端支持直接使用 shop_id 查询

const shopIds = [
  "SV001", "SV002", "SV003", "SV004", "SV005", "SV006", "SV007", "SV008",
  "SV009", "SV010", "SV011", "SV012", "SV013", "SV014", "SV015", "SV016",
  "SV017", "SV018", "SV019", "SV020", "SV021", "SV022", "SV023", "SV024",
  "SV025", "SV026", "SV027", "SV028", "SV029", "SV030", "SV031", "SV032",
  "SV033", "SV034", "SV035", "SV036", "SV037", "SV038", "SV039", "SV040",
  "SV041", "SV042", "SV043", "SV044", "SV045", "SV046", "SV047", "SV048",
  "SV049", "SV050", "SV051", "SV052", "SV053", "SV054", "SV055", "SV056",
];

// 搜索匹配的店铺 ID（用于自动补全）
export const searchShopIds = (query) => {
  if (!query || query.length < 1) {
    return shopIds;
  }
  const q = query.trim().toUpperCase();
  return shopIds.filter(id => id.includes(q));
};

// 检查 shop_id 是否有效
export const isShopIdValid = (id) => {
  return shopIds.includes(id.trim().toUpperCase());
};

// 获取全部店铺 ID
export const getAllShopIds = () => shopIds;

export default shopIds;
