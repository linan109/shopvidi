# ShopVidi - AI 店铺分析与选品推荐

一个受 Google Labs Pomelli 启发的极简风格单页应用，用于智能分析电商店铺并提供 AI 驱动的选品推荐。

## 功能特性

- **店铺分析**: 输入店铺 URL，获取全面的 AI 分析报告
- **选品推荐**: 基于店铺风格匹配的高利润产品推荐
- **Excel 导出**: 一键导出优化后的选品表格
- **优雅体验**: Pomelli 风格的极简 UI，流畅的加载动画

## 技术栈

- **React 19** + **Vite**
- **Tailwind CSS** - 原子化样式
- **Lucide React** - 图标库
- **React Markdown** - Markdown 渲染

## 快速开始

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build
```

## 项目结构

```
shopvidi/
├── src/
│   ├── components/          # React 组件
│   │   ├── Header.jsx       # 页面头部
│   │   ├── UrlInput.jsx     # URL 输入框
│   │   ├── LoadingState.jsx # 加载状态（骨架屏 + 动态文案）
│   │   ├── AnalysisResult.jsx      # 分析结果展示
│   │   ├── ProductRecommendations.jsx # 产品推荐卡片
│   │   └── ExportButton.jsx # 导出按钮
│   ├── services/            # API 服务
│   │   ├── api.js           # API 入口（自动切换 mock/真实）
│   │   ├── mockApi.js       # Mock 数据服务
│   │   └── n8nApi.js        # N8N Webhook 服务
│   ├── App.jsx              # 主应用组件
│   ├── main.jsx             # 入口文件
│   └── index.css            # 全局样式 + Tailwind
├── .env.example             # 环境变量示例
└── tailwind.config.js       # Tailwind 配置
```

## 配置 N8N 集成

1. 复制环境变量文件：
   ```bash
   cp .env.example .env
   ```

2. 编辑 `.env` 文件：
   ```env
   # 开发阶段使用 Mock 数据
   VITE_USE_MOCK=true

   # 连接真实 N8N 时的配置
   VITE_N8N_WEBHOOK_URL=https://your-n8n.com/webhook/shop-analyzer
   VITE_N8N_API_KEY=your-api-key
   ```

3. 当 N8N 工作流准备好后，将 `VITE_USE_MOCK` 设为 `false`

## N8N 接口规范

POST 请求体：
```json
{
  "shop_url": "https://example-shop.com",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

期望返回格式：
```json
{
  "status": "success",
  "data": {
    "analysis_summary": "### 店铺分析报告\n\n**优势**: ...",
    "recommendations": [
      {
        "id": "prod_001",
        "name": "产品名称",
        "reason": "推荐理由",
        "image_url": "https://...",
        "profit_margin": "45%"
      }
    ],
    "excel_download_url": "https://...",
    "meta": {
      "processed_time": "12.5s",
      "shop_name": "店铺名称"
    }
  }
}
```

## 开发模式

默认使用 Mock API，模拟 10-15 秒的分析延迟，方便调试 UI 效果。

---

Built with ShopVidi
