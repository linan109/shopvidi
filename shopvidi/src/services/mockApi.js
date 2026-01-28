// Mock API 服务 - 模拟 N8N 工作流返回
// 在真实 N8N 接口准备好后，可以切换到 n8nApi.js

const MOCK_RESPONSE = {
  status: "success",
  data: {
    analysis_summary: `### 店铺分析报告

**优势**: 页面加载速度快，商品图片清晰度高，整体视觉风格统一。

**改进点**:
- SEO 描述缺失，部分商品分类不明确
- 移动端导航体验有待优化
- 产品详情页缺少尺寸对照表

**优化建议**:
1. 建议增加首页的热销产品滑块，提升转化率
2. 优化移动端导航体验，增加底部固定菜单
3. 为每个产品添加详细的 SEO 元数据
4. 考虑增加客户评价展示模块`,
    recommendations: [
      {
        id: "prod_001",
        name: "极简智能加湿器",
        reason: "该店铺目前缺少生活家居类爆款，此款产品与现有风格匹配度 95%。",
        image_url: "https://images.unsplash.com/photo-1585620350266-d57f55c7bb12?auto=format&fit=crop&w=300",
        profit_margin: "45%"
      },
      {
        id: "prod_002",
        name: "便携式无线补光灯",
        reason: "目标客群对摄影配件有潜在需求，可作为凑单礼品。",
        image_url: "https://images.unsplash.com/photo-1590602847861-f357a9332bbc?auto=format&fit=crop&w=300",
        profit_margin: "60%"
      },
      {
        id: "prod_003",
        name: "北欧风陶瓷花瓶",
        reason: "家居装饰品类热度上升，与店铺极简风格完美契合。",
        image_url: "https://images.unsplash.com/photo-1612198188060-c7c2a3b66eae?auto=format&fit=crop&w=300",
        profit_margin: "55%"
      },
      {
        id: "prod_004",
        name: "磁吸式桌面收纳盒",
        reason: "办公用品需求稳定，复购率高，适合作为店铺长期SKU。",
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

// 模拟网络延迟（10-15秒）
const simulateDelay = () => {
  const delay = Math.random() * 5000 + 10000; // 10-15 秒
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
