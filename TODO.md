# AI Bookmarks V2 - 待办清单

## P0 - 立即落地 ✅ 大部分完成

### 首页优化
- [x] 首页增加「精选」区块
- [x] 卡片增加评分等级标签：✅推荐 / 🔧一般 / ⏳观望
- [x] 卡片增加部署方式图标(本地🖥️/浏览器🌐/API☁️)
- [x] 卡片增加适合人群标签
- [x] 本周热榜模块

### 详情页优化
- [x] 详情页加5维评分
- [x] 详情页加优缺点列表
- [x] 详情页加适合人群标签
- [x] 详情页加实测时间和环境信息
- [ ] 详情页加「替代工具」推荐

### 数据维度增强
- [x] 数据库增加字段：deploy_type, platform, license, price_model, commit_frequency
- [ ] 同步脚本自动从GitHub API抓取commits/releases数据

## P1 - 核心功能 ✅ 基本完成

### 评分体系
- [x] 实现用户评分功能（1-5星）
- [x] 详情页显示平均用户评分
- [x] 首页/列表显示综合评分

### 收藏功能完善
- [x] 详情页加「收藏」按钮
- [ ] 收藏后跳转回原页面

### 筛选和排序
- [x] 增加筛选：部署方式
- [x] 增加排序：综合评分/GitHub Stars/最新收录/活跃度
- [x] 筛选UI：顶部标签式筛选

## P2 - 增强功能

### 对比功能
- [ ] 工具列表页支持勾选对比（最多3个）
- [ ] 对比页面：并排显示+维度表格
- [ ] 对比页URL可分享

### 搜索功能
- [ ] 站内搜索框
- [ ] 支持按工具名/标签搜索
- [ ] 搜索结果高亮关键词

### 标签系统
- [ ] 标签筛选页
- [ ] 热门标签展示
- [ ] 标签相关工具推荐

## P3 - 增长和SEO

### SEO优化
- [ ] URL改成工具名slug：`/tools/[name-slug]`
- [ ] 每页独立meta title/description
- [ ] 加JSON-LD结构化数据
- [ ] 生成sitemap.xml

### 内容增长
- [ ] 每期合集可分享链接
- [ ] 详情页加社交分享按钮
- [ ] RSS订阅

### 移动端适配
- [ ] 响应式布局优化
- [ ] 移动端筛选交互优化

---

## 数据库字段扩展

```sql
-- P0 字段
ALTER TABLE tools ADD COLUMN IF NOT EXISTS deploy_type TEXT DEFAULT 'unknown';
ALTER TABLE tools ADD COLUMN IF NOT EXISTS suitable_for TEXT[] DEFAULT '{}';
ALTER TABLE tools ADD COLUMN IF NOT EXISTS pros TEXT[] DEFAULT '{}';
ALTER TABLE tools ADD COLUMN IF NOT EXISTS cons TEXT[] DEFAULT '{}';
ALTER TABLE tools ADD COLUMN IF NOT EXISTS tested_at TIMESTAMPTZ;
ALTER TABLE tools ADD COLUMN IF NOT EXISTS overall_score INT DEFAULT 0;

-- P1 用户评分表
CREATE TABLE IF NOT EXISTS user_ratings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tool_id UUID NOT NULL REFERENCES tools(id) ON DELETE CASCADE,
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, tool_id)
);
```

---

## 更新日志

- 2026-03-20: 创建TODO清单
- 2026-03-20: P0首页+详情页基础优化完成
- 2026-03-20: P1用户评分+筛选排序完成
