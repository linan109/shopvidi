# N8N 缓存 Workflow 配置指南

## 📋 Workflow 架构

```
Webhook
   ↓
设置版本号（Set Node）
   ↓
查询缓存（Postgres/MySQL）
   ↓
IF：有缓存且未过期？
   ├─ YES → 返回缓存
   └─ NO  → 执行分析逻辑
              ↓
           保存缓存
              ↓
           返回结果
```

---

## 🔧 详细节点配置

### 节点 1：Webhook

**配置：**
```
Method: POST
Path: /webhook/analyse
Response Mode: Last Node
```

**接收参数：**
```json
{
  "shop_url": "https://example.store",
  "timestamp": "2024-01-01T00:00:00Z"
}
```

---

### 节点 2：设置版本号

**节点类型：** Set

**配置：**
```json
{
  "values": {
    "workflow_version": "1.2.0",  // ⚠️ 修改 workflow 时更新此版本号
    "shop_url": "={{ $json.shop_url }}",
    "cache_ttl_days": 7
  }
}
```

**重要：每次修改 workflow 分析逻辑时，必须更新 `workflow_version`！**

---

### 节点 3：查询缓存

**节点类型：** Postgres / MySQL

**操作：** Execute Query

**SQL：**
```sql
SELECT
    result,
    created_at,
    workflow_version,
    EXTRACT(EPOCH FROM (NOW() - created_at)) / 86400 AS age_days
FROM shop_analysis_cache
WHERE shop_url = $1
  AND workflow_version = $2
  AND created_at > NOW() - INTERVAL '7 days'
LIMIT 1;
```

**参数绑定：**
```
$1 = {{ $json.shop_url }}
$2 = {{ $json.workflow_version }}
```

---

### 节点 4：判断缓存是否有效

**节点类型：** IF

**条件：**
```javascript
{{ $json.length > 0 }}
```

**说明：** 如果查询返回结果，说明有有效缓存。

---

### 节点 5A：返回缓存（IF = true）

**节点类型：** Set

**配置：**
```json
{
  "values": {
    "status": "success",
    "version": "={{ $('Set Version').item.json.workflow_version }}",
    "data": "={{ $json[0].result }}",
    "_from_cache": true,
    "_cache_age_days": "={{ $json[0].age_days }}"
  }
}
```

---

### 节点 5B：执行分析逻辑（IF = false）

**这里是你的核心分析逻辑，例如：**

#### 节点：爬取店铺数据
```
HTTP Request / Scraper / API 调用
```

#### 节点：AI 分析
```
OpenAI / Claude / 自定义 API
```

#### 节点：生成推荐
```
处理逻辑，生成推荐商品列表
```

---

### 节点 6：保存缓存到数据库

**节点类型：** Postgres / MySQL

**操作：** Insert

**SQL：**
```sql
INSERT INTO shop_analysis_cache (
    shop_url,
    workflow_version,
    result
) VALUES (
    $1,
    $2,
    $3
)
ON CONFLICT (shop_url, workflow_version)
DO UPDATE SET
    result = EXCLUDED.result,
    created_at = NOW();
```

**参数绑定：**
```
$1 = {{ $('Set Version').item.json.shop_url }}
$2 = {{ $('Set Version').item.json.workflow_version }}
$3 = {{ JSON.stringify($json) }}  // 整个分析结果
```

---

### 节点 7：格式化返回结果

**节点类型：** Set

**配置：**
```json
{
  "values": {
    "status": "success",
    "version": "={{ $('Set Version').item.json.workflow_version }}",
    "data": {
      "analysis_summary": "={{ $json.analysis_summary }}",
      "recommendations": "={{ $json.recommendations }}",
      "excel_download_url": "={{ $json.excel_url }}",
      "meta": {
        "processed_time": "={{ $json.processing_time }}",
        "shop_name": "={{ $json.shop_name }}",
        "workflow_version": "={{ $('Set Version').item.json.workflow_version }}"
      }
    }
  }
}
```

---

## 🔄 版本更新流程

### 步骤 1：修改 workflow 分析逻辑

例如：改进 AI prompt、添加新的推荐算法等。

### 步骤 2：更新版本号

在 **Set Version** 节点中：
```json
{
  "workflow_version": "1.3.0"  // 从 1.2.0 升级到 1.3.0
}
```

### 步骤 3：发布（Activate）workflow

点击 N8N 右上角 **Active** 开关。

### 步骤 4：测试验证

发送测试请求，检查：
- ✅ 返回数据中 `version` 字段是否为 `1.3.0`
- ✅ 数据库中是否创建了新版本的缓存记录
- ✅ 旧版本缓存不再被使用

### 步骤 5：更新前端环境变量

在 Vercel 中更新：
```
VITE_API_VERSION = 1.3.0
```

### 步骤 6：清理旧缓存（可选）

执行 SQL 清理旧版本缓存：
```sql
DELETE FROM shop_analysis_cache
WHERE workflow_version < '1.3.0';
```

或者设置自动清理任务（见下文）。

---

## 🗑️ 自动清理旧缓存

### 方案 A：定时任务（推荐）

创建另一个 N8N workflow：

**触发器：** Schedule (Cron)
```
0 2 * * *  // 每天凌晨 2 点
```

**节点：** Postgres
```sql
-- 清理 7 天前的缓存
DELETE FROM shop_analysis_cache
WHERE created_at < NOW() - INTERVAL '7 days';

-- 清理旧版本缓存（保留最新 2 个版本）
DELETE FROM shop_analysis_cache
WHERE workflow_version NOT IN (
    SELECT DISTINCT workflow_version
    FROM shop_analysis_cache
    ORDER BY created_at DESC
    LIMIT 2
);
```

### 方案 B：在查询缓存时顺便清理

在 **节点 3** 的 SQL 中添加：
```sql
-- 先清理旧数据
DELETE FROM shop_analysis_cache
WHERE created_at < NOW() - INTERVAL '7 days'
   OR workflow_version < '1.0.0';  // 清理指定版本前的缓存

-- 再查询缓存
SELECT ...
```

---

## 🔐 方案 2：Redis 缓存（更快）

### Redis Key 设计

```
Key: shopvidi:v{version}:{normalized_url}
例如: shopvidi:v1.2.0:example.store

TTL: 7 天（604800 秒）
```

### N8N Workflow 配置

#### 节点：查询 Redis 缓存

**节点类型：** HTTP Request (调用 Redis REST API)

或使用 **Redis** 节点（需要安装插件）

**命令：**
```
GET shopvidi:v{{ $json.workflow_version }}:{{ $json.normalized_url }}
```

#### 节点：保存到 Redis

**命令：**
```
SETEX shopvidi:v{{ $json.workflow_version }}:{{ $json.normalized_url }} 604800 {{ JSON.stringify($json) }}
```

**优势：**
- ✅ 更快（内存存储）
- ✅ 自动过期（TTL）
- ✅ 版本切换时旧缓存自动失效（Key 不同）

---

## 📊 版本管理最佳实践

### 1. 语义化版本号

```
major.minor.patch

1.0.0 → 初始版本
1.1.0 → 添加新功能（兼容）
2.0.0 → 重大变更（不兼容）
```

### 2. 版本号存储位置

**推荐：** 在 workflow 变量中统一管理

N8N workflow 设置中添加环境变量：
```
WORKFLOW_VERSION = 1.2.0
```

在节点中引用：
```
{{ $env.WORKFLOW_VERSION }}
```

### 3. 版本变更记录

在 N8N workflow 备注中记录：
```
v1.3.0 - 2024-01-20
- 改进推荐算法
- 添加利润率计算
- 优化图片处理

v1.2.0 - 2024-01-10
- 初始版本
```

### 4. 多版本并存（可选）

如果需要支持多个版本同时运行：

创建多个 webhook 端点：
```
/webhook/analyse/v1
/webhook/analyse/v2
```

每个端点对应不同版本的 workflow。

---

## ⚠️ 常见问题

### Q1: 忘记更新版本号怎么办？

**后果：** 新逻辑生成的数据会覆盖旧缓存，但缓存表中版本号仍是旧的。

**解决：**
1. 手动更新数据库中的版本号：
   ```sql
   UPDATE shop_analysis_cache
   SET workflow_version = '1.3.0'
   WHERE created_at > '2024-01-20';
   ```

2. 或清空所有缓存重新生成：
   ```sql
   TRUNCATE TABLE shop_analysis_cache;
   ```

### Q2: 如何回滚到旧版本？

**方法 1：** N8N 版本历史

N8N 会保存 workflow 历史版本，可以恢复。

**方法 2：** 手动修改版本号

在 Set Version 节点改回旧版本号：
```json
{
  "workflow_version": "1.2.0"  // 回滚到旧版本
}
```

### Q3: Redis vs 数据库，选哪个？

| 特性 | Redis | 数据库 |
|------|-------|--------|
| **速度** | ✅ 极快（毫秒级）| ⚠️ 较慢（几十毫秒）|
| **持久化** | ⚠️ 可能丢失 | ✅ 可靠 |
| **查询能力** | ❌ 简单 KV | ✅ 复杂查询 |
| **成本** | 💰 需要 Redis 服务 | 💰 复用现有数据库 |

**推荐：**
- 高并发场景 → Redis
- 数据重要性高 → 数据库
- 预算有限 → 数据库

---

## 🎯 总结

### 关键要点

1. **N8N 没有内置缓存** - 需要手动实现
2. **版本号是关键** - 每次改 workflow 必须更新版本号
3. **缓存 Key 包含版本** - 确保新旧版本数据隔离
4. **自动清理** - 定时任务清理旧版本和过期数据
5. **前后端同步** - N8N 版本号和前端环境变量保持一致

### 推荐方案

**小型项目（<1000 请求/天）：**
- 数据库缓存 + 版本号
- 每日清理旧缓存

**中型项目（1000-10000 请求/天）：**
- Redis 缓存 + 版本号
- TTL 自动过期

**大型项目（>10000 请求/天）：**
- Redis 主缓存 + 数据库备份
- 多级缓存策略
- CDN 边缘缓存
