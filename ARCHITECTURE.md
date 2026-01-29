# ShopVidi 架构文档

## 📐 整体架构

```
┌─────────────────────────────────────────────────────────────┐
│                         用户浏览器                            │
├─────────────────────────────────────────────────────────────┤
│  React 19 SPA (纯静态)                                       │
│  ├─ UI 组件层                                                │
│  ├─ 状态管理 (useState)                                      │
│  ├─ API 服务层                                               │
│  └─ IndexedDB 缓存层 ─────────┐                             │
└────────────┬────────────────────┼─────────────────────────────┘
             │                    │
             │ HTTPS              │ 读写缓存
             ↓                    ↓
    ┌────────────────┐   ┌──────────────┐
    │  N8N Webhook   │   │  IndexedDB   │
    │  (外部 API)    │   │  (本地存储)  │
    └────────────────┘   └──────────────┘
             │
             ↓
    ┌────────────────┐
    │  AI 分析引擎   │
    │  数据处理逻辑  │
    └────────────────┘
```

---

## 🏗️ 技术栈

### 前端核心

| 技术 | 版本 | 用途 |
|------|------|------|
| **React** | 19.2.0 | UI 框架 |
| **Vite** | 7.2.4 | 构建工具 |
| **Tailwind CSS** | 3.4.19 | 样式框架 |
| **Lucide React** | 0.563.0 | 图标库 |
| **React Markdown** | 10.1.0 | Markdown 渲染 |

### 数据存储

| 技术 | 用途 | 容量 |
|------|------|------|
| **IndexedDB** | 客户端缓存 | ~50MB |
| **localStorage** | 性能统计 | ~10MB |

### 部署

| 服务 | 用途 |
|------|------|
| **Vercel** | 静态托管 + CDN |
| **GitHub** | 代码仓库 + CI/CD |

---

## 📁 项目目录结构

```
shopvidi/
├── public/                      # 静态资源
│   └── vite.svg                 # 网站图标
│
├── src/
│   ├── components/              # React 组件
│   │   ├── Header.jsx           # 页面头部 (Logo + 标题)
│   │   ├── UrlInput.jsx         # URL 输入框 (自动补全 + 验证)
│   │   ├── LoadingState.jsx     # 加载状态 (骨架屏 + 动态文案)
│   │   ├── AnalysisResult.jsx   # 分析报告展示 (Markdown 渲染)
│   │   ├── ProductRecommendations.jsx  # 产品推荐卡片
│   │   ├── ExportButton.jsx     # Excel 导出按钮
│   │   ├── ErrorState.jsx       # 错误页面 (推荐缓存店铺)
│   │   └── index.js             # 组件统一导出
│   │
│   ├── services/                # 服务层
│   │   ├── api.js               # API 入口 (统一接口)
│   │   ├── n8nApi.js            # N8N API 调用 + 降级逻辑
│   │   └── cacheDb.js           # IndexedDB 封装 + 版本控制
│   │
│   ├── data/
│   │   └── shopList.js          # 55 家合作店铺白名单
│   │
│   ├── App.jsx                  # 主应用组件 (状态管理)
│   ├── main.jsx                 # 应用入口
│   └── index.css                # 全局样式 + Tailwind 配置
│
├── .env.example                 # 环境变量示例
├── .gitignore                   # Git 忽略文件
├── package.json                 # 依赖配置
├── vite.config.js               # Vite 配置
├── tailwind.config.js           # Tailwind 配置
├── index.html                   # HTML 入口
│
├── README.md                    # 项目文档
├── ARCHITECTURE.md              # 架构文档（本文件）
├── CACHE_GUIDE.md               # 缓存配置指南
└── n8n_cache_workflow.md        # N8N 缓存配置（可选）
```

---

## 🔄 数据流详解

### 1. 用户提交店铺 URL

```
UrlInput.jsx
    ↓ (onSubmit)
App.jsx (handleAnalyze)
    ↓ (调用 API)
services/api.js
    ↓ (转发到 N8N API)
services/n8nApi.js
```

### 2. N8N API 调用流程

```javascript
// n8nApi.js - analyzeShop()

1. 发送 POST 请求到 N8N Webhook
   ├─ URL: VITE_N8N_WEBHOOK_URL
   ├─ Body: { shop_url, timestamp }
   └─ Headers: { Content-Type, Authorization? }

2. 等待响应 (动态超时 5-20 分钟)
   │
   ├─ 成功 ✅
   │  ├─ 规范化数据格式
   │  ├─ 保存到 IndexedDB (含版本号)
   │  └─ 返回结果给前端
   │
   └─ 失败 ❌
      ├─ 尝试读取 IndexedDB 缓存
      │  ├─ 有缓存且版本匹配 → 返回缓存 (标记 _fromCache)
      │  └─ 无缓存或版本不匹配 → 抛出错误
      │
      └─ 前端显示 ErrorState 组件
```

### 3. 数据规范化流程

```javascript
// N8N 返回数据
{
  "status": "success",
  "version": "1.0.0",  // API 版本号
  "data": {
    "analysis_summary": "...",      // Markdown 格式
    "recommendations": [...],       // 推荐商品数组
    "excel_download_url": "...",
    "meta": {
      "shop_name": "店铺名称",
      "processed_time": "12.5s"
    }
  }
}

// 前端规范化处理
normalizeResponse() {
  ├─ 格式化 analysis_summary (对象转 Markdown)
  ├─ 提取 shop_name 到 meta
  ├─ 处理推荐商品
  │  ├─ 过滤无效商品 (包含 🛑 标记)
  │  ├─ 去重 (相同图片 URL)
  │  ├─ 限制数量 (最多 12 个)
  │  ├─ 清洗推荐理由
  │  └─ 提取特色标签
  └─ 返回标准格式
}
```

---

## 🧩 核心模块详解

### Module 1: 输入与验证

**组件:** `UrlInput.jsx`

**功能:**
- 输入框自动补全 (基于 55 家白名单)
- URL 格式验证
- 白名单检查
- URL 清洗显示 (去除 https/www)

**状态流:**
```
用户输入
  ↓
实时匹配白名单 (fuzzy search)
  ↓
显示建议列表
  ↓
用户选择/提交
  ↓
验证白名单
  ├─ 在白名单 → 提交分析
  └─ 不在白名单 → 提示"还未开通服务"
```

**白名单数据源:** `src/data/shopList.js` (55 家店铺)

---

### Module 2: 加载状态

**组件:** `LoadingState.jsx`

**功能:**
- 骨架屏动画 (模拟内容加载)
- 动态加载文案 (每 2 秒切换)
- 进度提示

**文案列表:**
```javascript
[
  '正在連接店舖...',
  '分析商品數據中...',
  '計算推薦指數...',
  '生成選品報告...',
  '即將完成...'
]
```

**设计理念:** Google Pomelli 风格骨架屏

---

### Module 3: 分析结果展示

**组件:** `AnalysisResult.jsx`

**功能:**
- 店铺信息头部
- Markdown 报告渲染
- 缓存数据标记 (离线数据提示)

**数据结构:**
```javascript
{
  analysis_summary: "Markdown 格式文本",
  meta: {
    shop_name: "店铺名称",
    processed_time: "12.5s"
  },
  _fromCache: true,        // 是否来自缓存
  _cacheAge: 3600000       // 缓存年龄 (毫秒)
}
```

**UI 特性:**
- 缓存数据显示琥珀色标签 "離線數據"
- 显示缓存时间 "3 小时前"

---

### Module 4: 产品推荐

**组件:** `ProductRecommendations.jsx`

**功能:**
- 网格布局展示推荐商品
- 产品卡片 (图片 + 名称 + 理由 + 利润率)
- 特色标签系统

**标签规则:**
```javascript
标签系统 (8 种):
├─ 熱銷潛力 (rose)      - 关键词: 高動銷、銷量良好
├─ 實用周邊 (sky)       - 关键词: 實用、多功能
├─ 新品類 (violet)      - 关键词: 新穎、新鮮感
├─ 話題性 (amber)       - 关键词: 話題、社交媒體
├─ 拓展客群 (teal)      - 关键词: 擴大、不同客群
├─ 親民入門 (emerald)   - 关键词: 親民、低門檻
├─ 季節限定 (pink)      - 关键词: 季節、情人節
└─ 高復購 (indigo)      - 关键词: 復購、重複購買
```

**数据过滤:**
```
原始推荐
  ↓
过滤 🛑 标记商品
  ↓
去重 (相同图片 URL)
  ↓
限制数量 (最多 12 个)
  ↓
提取特色标签
  ↓
显示
```

---

### Module 5: 缓存系统

**服务:** `cacheDb.js`

**架构:**
```
IndexedDB
  └─ Database: ShopVidiCache
      └─ ObjectStore: analysisResults
          ├─ KeyPath: shop_url (标准化 URL)
          ├─ Index: timestamp
          ├─ Index: success
          └─ Index: api_version
```

**数据结构:**
```javascript
{
  shop_url: "example.store",          // 标准化 URL (主键)
  original_url: "https://example.store",
  result: { /* 完整分析结果 */ },
  success: true,                      // 是否成功
  timestamp: 1706000000000,           // 保存时间戳
  api_version: "1.0.0"                // API 版本号
}
```

**核心函数:**

```javascript
// 保存缓存
saveToCache(shopUrl, result, success)
  ├─ 标准化 URL
  ├─ 提取 API 版本号
  ├─ 保存到 IndexedDB
  └─ 返回 Promise

// 读取缓存
getFromCache(shopUrl, ignoreVersion = false)
  ├─ 标准化 URL
  ├─ 从 IndexedDB 读取
  ├─ 检查是否过期 (7 天)
  ├─ 检查版本号是否匹配
  │  ├─ 匹配 → 返回缓存
  │  └─ 不匹配 → 返回 null
  └─ 返回 { ...result, _fromCache: true }

// 获取缓存店铺列表
getCachedShops()
  ├─ 读取所有成功缓存
  ├─ 过滤过期数据
  ├─ 按时间倒序
  └─ 返回 [{ url, shop_name, timestamp, age }]

// 清理过期缓存
cleanExpiredCache()
  ├─ 删除 7 天前的缓存
  ├─ 删除版本号不匹配的缓存
  └─ 返回清理统计

// 缓存统计
getCacheStats()
  └─ 返回 { total, valid, expired, outdated, byVersion }
```

---

### Module 6: 错误处理

**组件:** `ErrorState.jsx`

**功能:**
- 显示错误信息
- 重试按钮
- **智能推荐:** 显示有缓存的店铺列表 (最多 10 个)

**推荐逻辑:**
```
用户请求失败
  ↓
ErrorState 组件渲染
  ↓
getCachedShops() 读取所有缓存
  ↓
显示推荐列表 (按时间倒序)
  ├─ 店铺名称
  ├─ URL
  └─ 缓存时间 "3 小时前"
  ↓
用户点击推荐店铺
  ↓
重新调用 N8N API
  ├─ 成功 → 更新缓存，显示最新结果
  └─ 失败 → 使用该店铺的缓存
```

---

## 🔐 版本控制机制

### 前后端版本同步

```
┌──────────────────┐         ┌──────────────────┐
│   N8N Webhook    │         │   前端 (Vercel)  │
├──────────────────┤         ├──────────────────┤
│ 返回数据包含:    │         │ 环境变量:        │
│ version: "1.2.0" │ ◄─────► │ VITE_API_VERSION │
└──────────────────┘         └──────────────────┘
         │                            │
         └────────────┬───────────────┘
                      ↓
            ┌──────────────────┐
            │   缓存数据       │
            ├──────────────────┤
            │ api_version:     │
            │   "1.2.0"        │
            └──────────────────┘
```

### 版本检查流程

```javascript
// 1. N8N 返回数据 (带版本号)
response = {
  version: "1.2.0",
  data: { ... }
}

// 2. 保存缓存时记录版本
cache = {
  shop_url: "example.store",
  result: response,
  api_version: "1.2.0"  // ← 记录
}

// 3. 读取缓存时检查版本
if (cache.api_version !== ENV.VITE_API_VERSION) {
  console.log('版本不匹配，忽略缓存');
  return null;  // 触发重新请求
}
```

### 版本更新场景

**场景 1: N8N 算法升级**
```
1. 修改 N8N workflow 分析逻辑
2. 更新 N8N 返回数据 version: "1.3.0"
3. 更新 Vercel 环境变量 VITE_API_VERSION=1.3.0
4. 重新部署前端

结果:
✅ 旧缓存 (v1.2.0) 自动失效
✅ 所有请求重新调用 N8N
✅ 生成新版本缓存 (v1.3.0)
```

**场景 2: Bug 修复 (不改数据格式)**
```
1. 修改 N8N workflow 修复 bug
2. 不更新版本号 (仍是 1.2.0)
3. 不更新前端环境变量

结果:
✅ 旧缓存继续使用 (因为版本号相同)
⚠️ 修复后的逻辑逐步替换旧缓存
```

---

## 🚀 部署架构

### Vercel 部署流程

```
GitHub 仓库
    ↓ (git push)
Vercel Webhook 触发
    ↓
自动构建
    ├─ npm install
    ├─ npm run build
    └─ 生成 dist/
    ↓
部署到 CDN
    ├─ 全球边缘节点
    ├─ 自动 HTTPS
    └─ Gzip 压缩
    ↓
用户访问
    └─ https://shopvidi.vercel.app
```

### 构建产物

```
dist/
├── index.html                    # 入口 HTML
├── assets/
│   ├── index-[hash].js          # 打包的 JavaScript
│   ├── index-[hash].css         # 打包的 CSS
│   └── react-[hash].svg         # 静态资源
└── vite.svg
```

**特性:**
- ✅ 文件名 Hash 化 (缓存控制)
- ✅ Tree-shaking (移除未使用代码)
- ✅ Code-splitting (按需加载)
- ✅ 压缩优化 (Minify + Gzip)

---

## 📊 性能优化策略

### 1. 构建优化

```javascript
// vite.config.js
export default {
  build: {
    target: 'es2015',
    minify: 'terser',
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'markdown': ['react-markdown']
        }
      }
    }
  }
}
```

### 2. 运行时优化

**缓存策略:**
- IndexedDB 缓存 (50MB+)
- 7 天有效期
- 版本控制

**API 优化:**
- 动态超时 (基于历史平均时间)
- 失败自动降级
- 请求去重

**UI 优化:**
- 骨架屏 (感知性能)
- 懒加载图片
- Tailwind JIT (按需生成 CSS)

### 3. 网络优化

**CDN 加速:**
- Vercel 全球 CDN
- 边缘节点缓存
- HTTP/2

**资源优化:**
- 图片懒加载
- Code-splitting
- Gzip 压缩

---

## 🔒 安全性

### 前端安全

**✅ 优势:**
- 无服务器端代码 (无注入风险)
- 无数据库 (无 SQL 注入)
- 无文件上传 (无上传漏洞)

**⚠️ 注意点:**
1. **API Key 保护**
   - 使用环境变量 (VITE_N8N_API_KEY)
   - 不提交到 Git

2. **HTTPS 强制**
   - Vercel 自动配置 SSL
   - 所有请求走 HTTPS

3. **CORS 配置**
   - N8N Webhook 需要配置跨域
   - 允许来源: Vercel 域名

4. **白名单验证**
   - 仅允许 55 家合作店铺
   - 防止滥用 API

### 数据隐私

**✅ 隐私友好:**
- 无用户追踪
- 无 Cookie
- 数据仅存储在用户浏览器
- 不上传到第三方服务器

---

## 📈 可扩展性

### 横向扩展

**静态站特性:**
- ✅ 无限扩展 (CDN 自动分发)
- ✅ 无需负载均衡
- ✅ 全球加速

**限制点:**
- N8N API 并发能力
- 解决: 在 N8N 侧加队列/限流

### 纵向扩展

**功能扩展:**
- 添加新组件 → `src/components/`
- 添加新服务 → `src/services/`
- 添加新页面 → React Router

**数据扩展:**
- 扩展白名单 → `src/data/shopList.js`
- 扩展缓存容量 → IndexedDB 自动管理
- 添加新数据源 → 新增 API 服务

---

## 🎯 架构优势总结

| 维度 | 优势 |
|------|------|
| **成本** | ✅ 零成本 (Vercel 免费版) |
| **性能** | ✅ 全球 CDN + 本地缓存 |
| **可靠性** | ✅ 降级策略 + 离线可用 |
| **安全性** | ✅ 纯静态 + 无服务器 |
| **扩展性** | ✅ 无限横向扩展 |
| **维护性** | ✅ 简单架构 + 自动部署 |

---

## 🔄 数据流完整示例

### 完整请求周期

```
1. 用户输入 URL
   └─ UrlInput.jsx

2. 提交分析
   └─ App.jsx (handleAnalyze)

3. 调用 API
   └─ services/api.js → n8nApi.js

4. 发送 HTTP 请求
   POST https://n8n.merakku.ai/webhook/analyse
   Body: { shop_url, timestamp }

5. N8N 处理
   ├─ 爬取店铺数据
   ├─ AI 分析
   ├─ 生成推荐
   └─ 返回结果

6. 前端接收响应
   └─ n8nApi.js

7. 规范化数据
   ├─ normalizeResponse()
   ├─ processRecommendations()
   └─ formatAnalysisSummary()

8. 保存缓存
   └─ cacheDb.js (saveToCache)

9. 更新 UI
   ├─ App.jsx (setResult)
   ├─ AnalysisResult.jsx
   ├─ ProductRecommendations.jsx
   └─ ExportButton.jsx

10. 用户查看结果
```

### 降级流程示例

```
1. 用户输入 URL
   └─ UrlInput.jsx

2. 调用 N8N API
   └─ n8nApi.js

3. N8N 请求失败
   └─ fetch() throws Error

4. 触发降级逻辑
   └─ catch 块

5. 读取缓存
   └─ getFromCache(shopUrl)

6. 检查缓存
   ├─ 有缓存且版本匹配
   │  └─ 返回 { ...result, _fromCache: true }
   │
   └─ 无缓存或版本不匹配
      └─ throw Error

7. 显示结果/错误
   ├─ 有缓存 → AnalysisResult (带"離線數據"标签)
   └─ 无缓存 → ErrorState (推荐其他店铺)
```

---

## 📚 相关文档

- **README.md** - 项目说明、快速开始
- **CACHE_GUIDE.md** - 缓存配置详细指南
- **n8n_cache_workflow.md** - N8N 服务端缓存方案
- **ARCHITECTURE.md** - 架构文档（本文件）

---

**更新时间:** 2024-01-29
**版本:** 1.0.0
**维护者:** ShopVidi Team
