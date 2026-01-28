// 合作店铺列表
// original: 原始网址（发送给 N8N）
// display: 清洗后的网址（用于显示和匹配）

const rawShopList = [
  "www.kaiten.store",
  "https://www.hawaiitoys.store/",
  "www.morningevening.store",
  "https://thit.store/",
  "starshinestore.boutir.com",
  "gpointhobby.store",
  "dreamstore.hk",
  "cardsvillage.com",
  "directbuyhk.com",
  "bgtcg.com",
  "yugicardcenter.store",
  "fanoey.store",
  "islandboardgame.boutir.com",
  "mikawish.com",
  "finegoods.boutir.com",
  "https://www.thecollectionshk.store/",
  "kumastore.hk",
  "dxtoys.com.my",
  "berryberryjapan.boutir.com",
  "https://forevergift.boutir.com/",
  "kuuruuco.boutir.com",
  "Nakakai.boutir.com",
  "https://nightowl-toys.store/",
  "https://www.tokyostation.store/",
  "https://kobygift.boutir.com/",
  "innerjoythailand.boutir.com",
  "definemarket.boutir.com",
  "https://clm126.com/",
  "figurecross.boutir.com",
  "https://tummyisgoingshop.boutir.com/",
  "porchai.boutir.com",
  "https://greencomebuy.hk/",
  "https://tcube.boutir.com/",
  "phoneshow.com.hk",
  "wavecat.boutir.com",
  "pickfresh.boutir.com",
  "4ccakehouse.online",
  "wswindsorglobalws.boutir.com",
  "luilok64715808.boutir.com",
  "sdreams.store",
  "litz.store",
  "allonetele.com",
  "2358.store",
  "mustelahk.store",
  "apapegarden.boutir.com",
  "greatzonehk.com",
  "https://m2store202407.boutir.com/",
  "https://sunsundayhk.com/",
  "https://miuuswardrobe.boutir.com/",
  "sharehouse.boutir.com",
  "https://dreamspossible.boutir.com/",
  "omiskin.boutir.com",
  "sleekstyle.com.my",
  "hiufung.store",
  "freshfreshcookies.boutir.com"
];

// 清洗网址：去掉 http(s):// 和 www. 前缀，以及尾部的 /
const cleanUrl = (url) => {
  return url
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .replace(/\/$/, '');
};

// 生成店铺列表，包含原始网址和清洗后的显示网址
export const shopList = rawShopList.map(original => ({
  original: original.trim(),
  display: cleanUrl(original)
}));

// 获取所有清洗后的网址（用于快速查找）
export const shopDisplayList = shopList.map(shop => shop.display);

// 根据清洗后的网址查找原始网址
export const findOriginalUrl = (displayUrl) => {
  const cleaned = cleanUrl(displayUrl);
  const shop = shopList.find(s => s.display === cleaned);
  return shop ? shop.original : null;
};

// 检查网址是否在白名单中
export const isShopInList = (url) => {
  const cleaned = cleanUrl(url);
  return shopDisplayList.includes(cleaned);
};

// 搜索匹配的店铺（用于自动补全）
export const searchShops = (query) => {
  // 无输入时返回全部店铺
  if (!query || query.length < 1) {
    return shopList; // 显示全部
  }
  const cleaned = cleanUrl(query);
  return shopList.filter(shop =>
    shop.display.includes(cleaned)
  ); // 返回所有匹配结果
};

// 获取全部店铺列表
export const getAllShops = () => shopList;

export default shopList;
