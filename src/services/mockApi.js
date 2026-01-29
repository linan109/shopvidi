// Mock API 服务 - 模拟 N8N 工作流返回
// 在真实 N8N 接口准备好后，可以切换到 n8nApi.js

import { getAverageTime } from './n8nApi.js';

const MOCK_RESPONSE = {
  status: "success",
  data: {
    analysis_summary: `### 店舖分析報告

**優勢**: 頁面載入速度快，商品圖片清晰度高，整體視覺風格統一。

**改進點**:
- SEO 描述缺失，部分商品分類不明確
- 手機端導航體驗有待優化
- 產品詳情頁缺少尺寸對照表

**優化建議**:
1. 建議增加首頁的熱銷產品滑塊，提升轉化率
2. 優化手機端導航體驗，增加底部固定選單
3. 為每個產品添加詳細的 SEO 元數據
4. 考慮增加客戶評價展示模組`,
    recommendations: [
      {
        id: "prod_001",
        name: "極簡智能加濕器",
        reason: "該店舖目前缺少生活家居類爆款，此款產品與現有風格匹配度 95%。",
        image_url: "https://images.unsplash.com/photo-1585620350266-d57f55c7bb12?auto=format&fit=crop&w=300",
        profit_margin: "45%"
      },
      {
        id: "prod_002",
        name: "便攜式無線補光燈",
        reason: "目標客群對攝影配件有潛在需求，可作為湊單禮品。",
        image_url: "https://images.unsplash.com/photo-1590602847861-f357a9332bbc?auto=format&fit=crop&w=300",
        profit_margin: "60%"
      },
      {
        id: "prod_003",
        name: "北歐風陶瓷花瓶",
        reason: "家居裝飾品類熱度上升，與店舖極簡風格完美契合。",
        image_url: "https://images.unsplash.com/photo-1612198188060-c7c2a3b66eae?auto=format&fit=crop&w=300",
        profit_margin: "55%"
      },
      {
        id: "prod_004",
        name: "磁吸式桌面收納盒",
        reason: "辦公用品需求穩定，復購率高，適合作為店舖長期SKU。",
        image_url: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=300",
        profit_margin: "50%"
      }
    ],
    excel_download_url: "https://example.com/files/shopvidi_optimized_products.xlsx",
    meta: {
      processed_time: "12.5s",
      shop_name: "Modern Minimalist Home"
    }
  }
};

// 模拟网络延迟，与真实调用时间同步
const simulateDelay = () => {
  const avg = getAverageTime();
  const base = avg !== null ? avg : 300000; // 无记录默认 300s
  // 加减 10% 随机波动
  const jitter = base * 0.1 * (Math.random() * 2 - 1);
  const delay = base + jitter;
  return new Promise(resolve => setTimeout(resolve, delay));
};

/**
 * 模拟调用 N8N 工作流分析店铺
 * @param {string} shopUrl - 店铺 URL
 * @returns {Promise<object>} - 分析结果
 */
export const analyzeShop = async (shopUrl) => {
  console.log(`[Mock API] 开始分析店铺: ${shopUrl}`);

  // 模拟延迟
  await simulateDelay();

  // 返回 mock 数据，并根据 URL 稍作修改
  const response = {
    ...MOCK_RESPONSE,
    data: {
      ...MOCK_RESPONSE.data,
      meta: {
        ...MOCK_RESPONSE.data.meta,
        shop_url: shopUrl,
        analyzed_at: new Date().toISOString()
      }
    }
  };

  console.log('[Mock API] 分析完成');
  return response;
};

export default { analyzeShop };
