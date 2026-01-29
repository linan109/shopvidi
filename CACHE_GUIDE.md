# ShopVidi 缓存策略与版本管理指南

## 📋 缓存架构

### 客户端缓存（IndexedDB）

```
┌─────────────┐
│   用户请求   │
└──────┬──────┘
       ↓
┌──────────────────┐
│  调用 N8N API    │ ← 始终优先调用
└──────┬───────────┘
       ↓
    成功？
    ├─ 是 → 保存到 IndexedDB（含版本号）
    └─ 否 → 尝试读取 IndexedDB 缓存
              ├─ 有缓存且版本匹配 → 返回缓存
              └─ 无缓存或版本不匹配 → 显示错误页面
```

---

## 🔧 N8N 侧缓存配置

### 方案 1：在 N8N Webhook 返回中添加版本号（推荐）

修改 N8N workflow，在返回 JSON 中添加 `version` 字段：

```json
{
  "status": "success",
  "version": "1.2.0",  // ← 添加 API 版本号
  "data": {
    "analysis_summary": "...",
    "recommendations": [...],
    "excel_download_url": "...",
    "meta": {
      "processed_time": "12.5s",
      "shop_name": "店铺名称"
    }
  }
}
```

**或者**在 `meta` 中添加 `workflow_version`：

```json
{
  "status": "success",
  "data": {
    "meta": {
      "workflow_version": "1.2.0",  // ← 也可以放这里
      "processed_time": "12.5s"
    }
  }
}
```

### 方案 2：N8N 内部实现缓存（可选）

如果需要 N8N 服务端也实现缓存，可以：

#### 使用数据库缓存

```
Webhook 接收 → 查询数据库缓存 → 有缓存？
                                  ├─ 是 → 返回缓存
                                  └─ 否 → 执行分析 → 保存缓存 → 返回结果
```

**N8N 节点配置：**

1. **Webhook** 节点接收请求
2. **Postgres/MySQL** 节点查询缓存表：
   ```sql
   SELECT result, created_at, version
   FROM cache
   WHERE shop_url = '{{ $json.shop_url }}'
     AND created_at > NOW() - INTERVAL '7 days'
     AND version = '1.2.0'
   ```
3. **IF** 节点判断是否有缓存
4. **Set** 节点返回缓存或执行分析逻辑

#### 使用 Redis 缓存

更快的方案，使用 Redis：

```
Key: shopvidi:cache:{shop_url}:{version}
Value: JSON 序列化的分析结果
TTL: 7 天
```

**N8N HTTP Request 节点示例：**

```
GET http://redis-server/get/shopvidi:cache:example.store:1.2.0
```

---

## 🔄 版本管理策略

### 何时更新版本号？

| 变更类型 | 是否更新版本 | 示例 |
|---------|-------------|------|
| **重大变更** | ✅ 必须 | 返回字段增删、分析算法升级 |
| **兼容性变更** | ✅ 建议 | 添加新字段（不影响旧字段）|
| **Bug 修复** | ⚠️ 可选 | 修复计算错误、优化性能 |
| **配置调整** | ❌ 不需要 | 调整超时时间、日志级别 |

### 版本号规范（语义化版本）

```
major.minor.patch
  │     │     └─ Bug 修复（兼容）
  │     └─────── 新功能（兼容）
  └───────────── 重大变更（不兼容）

示例：
1.0.0 → 初始版本
1.1.0 → 添加新推荐算法（兼容）
2.0.0 → 重构返回格式（不兼容）
```

---

## 🚀 更新 API 版本的步骤

### 步骤 1：修改 N8N workflow

更新返回数据中的 `version` 字段：

```json
{
  "status": "success",
  "version": "1.1.0",  // 从 1.0.0 升级到 1.1.0
  "data": { ... }
}
```

### 步骤 2：更新前端环境变量

在 Vercel 环境变量中更新：

```
VITE_API_VERSION = 1.1.0
```

或者在本地 `.env` 中：

```env
VITE_API_VERSION=1.1.0
```

### 步骤 3：重新部署前端

Vercel 会自动部署，或手动触发：

```bash
git commit --allow-empty -m "chore: bump API version to 1.1.0"
git push
```

### 步骤 4：验证缓存行为

1. 打开浏览器控制台
2. 输入之前查询过的店铺 URL
3. 应该看到日志：
   ```
   ⚠️ API 版本不匹配: 缓存 v1.0.0 vs 当前 v1.1.0
   💡 提示: 缓存被忽略，将重新请求最新数据
   🚀 Calling N8N API: ...
   ```

---

## 🛠️ 缓存管理工具

### 查看缓存统计

在浏览器控制台执行：

```javascript
import { getCacheStats } from './services/n8nApi';

getCacheStats().then(stats => {
  console.log('📊 缓存统计:');
  console.log('- 总数:', stats.total);
  console.log('- 有效:', stats.valid);
  console.log('- 过期:', stats.expired);
  console.log('- 版本过旧:', stats.outdated);
  console.log('- 版本分布:', stats.byVersion);
});
```

### 清空所有缓存

```javascript
import { clearAllCache } from './services/n8nApi';

clearAllCache().then(() => {
  console.log('✅ 缓存已清空');
  location.reload();
});
```

### 手动清理旧版本缓存

系统启动时会自动清理，也可以手动触发：

```javascript
import { cleanExpiredCache } from './services/cacheDb';

cleanExpiredCache();
```

---

## ❓ 常见问题

### Q1: 修改了 N8N workflow，但前端还在用旧数据？

**原因：** 版本号未更新。

**解决：**
1. 在 N8N 返回数据中更新 `version`
2. 在 Vercel 环境变量中更新 `VITE_API_VERSION`
3. 重新部署前端

### Q2: 如何强制刷新某个店铺的缓存？

**方法 1：** 更新版本号（影响所有缓存）

**方法 2：** 在浏览器控制台清除该店铺缓存：

```javascript
// 打开浏览器 DevTools → Application → IndexedDB → ShopVidiCache → analysisResults
// 找到对应 shop_url 的记录，右键删除
```

### Q3: 缓存多久会自动过期？

- **时间过期：** 7 天
- **版本过期：** API 版本号不匹配立即失效
- **自动清理：** 应用启动时自动清理过期和旧版本缓存

### Q4: 如何关闭缓存功能？

不推荐关闭，因为缓存是降级策略。如果确实需要：

修改 `n8nApi.js`，注释掉缓存相关代码：

```javascript
// 成功后不保存缓存
// await saveToCache(shopUrl, result, true);

// 失败后不读取缓存
// const cachedResult = await getFromCache(shopUrl);
```

---

## 📈 最佳实践

1. **版本号管理**
   - 使用 Git Tag 同步版本号
   - 在 N8N workflow 描述中记录版本变更

2. **渐进式部署**
   - 先部署 N8N（带新版本号）
   - 观察 1-2 小时
   - 再更新前端版本号

3. **监控日志**
   - 定期查看缓存命中率
   - 关注版本不匹配日志

4. **容量管理**
   - IndexedDB 容量约 50MB
   - 可存储数百次分析结果
   - 自动清理机制会维护容量

---

## 🎯 总结

| 维度 | 策略 |
|------|------|
| **缓存位置** | 浏览器 IndexedDB（客户端）|
| **缓存 Key** | 店铺 URL + API 版本号 |
| **有效期** | 7 天或版本更新 |
| **降级触发** | N8N API 请求失败 |
| **版本控制** | 环境变量 `VITE_API_VERSION` |
| **清理策略** | 自动清理 + 手动清空 |

**核心原则：始终优先调用 N8N，缓存仅作为降级！**
