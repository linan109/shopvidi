# ShopVidi 项目状态

## 项目概述
ShopVidi - AI 店铺分析与选品推荐工具，受 Google Labs Pomelli 启发的极简风格单页应用。

## 项目位置
`E:/claude_projects/ai_merchantiser_demo/shopvidi/`

## 技术栈
- React 19 + Vite
- Tailwind CSS
- Lucide React (图标)
- React Markdown (Markdown 渲染)

## 当前状态
✅ 项目搭建完成，开发服务器运行在 http://localhost:5173/

## 已实现功能

### 核心组件
- `src/components/Header.jsx` - Logo + 标题
- `src/components/UrlInput.jsx` - URL 输入 + 自动补全 + 白名单验证
- `src/components/LoadingState.jsx` - 骨架屏 + 动态文案
- `src/components/AnalysisResult.jsx` - Markdown 分析报告
- `src/components/ProductRecommendations.jsx` - 产品推荐卡片
- `src/components/ExportButton.jsx` - Excel 导出按钮

### 数据与服务
- `src/data/shopList.js` - 55 家合作店铺白名单
- `src/services/api.js` - API 入口（自动切换 mock/真实）
- `src/services/mockApi.js` - Mock 数据（10-15s 延迟）
- `src/services/n8nApi.js` - N8N Webhook 调用

### 店铺白名单功能
- 输入时自动补全匹配
- 清洗网址显示（去掉 https/www/尾部斜杠）
- 发送给 N8N 的是原始网址
- 非白名单提示"还未开通服务"

## 待办事项
- [ ] 连接真实 N8N Webhook
- [ ] 配置 .env 文件
- [ ] 生产环境部署

## 启动命令
```bash
cd E:/claude_projects/ai_merchantiser_demo/shopvidi
npm run dev
```

## N8N 接口规范
POST 请求体：
```json
{
  "shop_url": "原始店铺网址",
  "timestamp": "ISO时间戳"
}
```

期望返回：
```json
{
  "status": "success",
  "data": {
    "analysis_summary": "Markdown 格式分析报告",
    "recommendations": [{ "id", "name", "reason", "image_url", "profit_margin" }],
    "excel_download_url": "下载链接",
    "meta": { "processed_time", "shop_name" }
  }
}
```

## 合作店铺列表（55家）
完整列表在 `src/data/shopList.js`，包括：
- kaiten.store, hawaiitoys.store, thit.store 等独立域名
- 多个 boutir.com 子域名店铺
- 港台地区店铺（kumastore.hk, dreamstore.hk 等）
