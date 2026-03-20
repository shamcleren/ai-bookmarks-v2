# AI Bookmarks V2 - 待办清单

## P0 - 立即落地

### 首页优化
- [ ] 首页增加「精选」区块，人工挑选3-5个最值得看的
- [ ] 卡片增加评分等级标签：✅推荐 / 🔧一般 / ⏳观望
- [ ] 卡片增加核心数据：部署方式图标(本地🖥️/浏览器🌐/API☁️)
- [ ] 卡片增加适合人群标签
- [ ] 右侧加「本周热榜」小模块

### 详情页优化
- [ ] 详情页加5维评分（易用性/性能/文档/社区/稳定性）
- [ ] 详情页加优缺点列表
- [ ] 详情页加适合人群标签
- [ ] 详情页加实测时间和环境信息
- [ ] 详情页加「替代工具」推荐

### 数据维度增强
- [ ] 数据库增加字段：deploy_type, platform, license, price_model, last_updated, commit_frequency
- [ ] 同步脚本自动从GitHub API抓取commits/releases数据
- [ ] 增加「更新时间」信号：7天内🟢/30天🟡/半年❌

## P1 - 核心功能

### 评分体系
- [ ] 实现用户评分功能（1-5星）
- [ ] 详情页显示平均用户评分
- [ ] 首页/列表显示综合评分

### 收藏功能完善
- [ ] 详情页加「收藏」按钮
- [ ] 收藏后跳转回原页面

### 筛选和排序
- [ ] 增加筛选：部署方式、授权类型、平台
- [ ] 增加排序：更新时间、评分、综合排序
- [ ] 筛选UI：顶部标签式筛选

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
ALTER TABLE tools ADD COLUMN IF NOT EXISTS deploy_type TEXT;  -- local/cloud/api/browser
ALTER TABLE tools ADD COLUMN IF NOT EXISTS platform TEXT;       -- macos/linux/windows
ALTER TABLE tools ADD COLUMN IF NOT EXISTS license TEXT;       -- MIT/Apache/proprietary
ALTER TABLE tools ADD COLUMN IF NOT EXISTS price_model TEXT;   -- free/freemium/paid
ALTER TABLE tools ADD COLUMN IF NOT EXISTS last_commit_at TIMESTAMPTZ;
ALTER TABLE tools ADD COLUMN IF NOT EXISTS commit_frequency TEXT; -- high/medium/low
ALTER TABLE tools ADD COLUMN IF NOT EXISTS screenshot_urls TEXT[];
ALTER TABLE tools ADD COLUMN IF NOT EXISTS pros TEXT[];
ALTER TABLE tools ADD COLUMN IF NOT EXISTS cons TEXT[];
ALTER TABLE tools ADD COLUMN IF NOT EXISTS suitable_for TEXT[]; -- indie-dev/team/enterprise
ALTER TABLE tools ADD COLUMN IF NOT EXISTS tested_at TIMESTAMPTZ;
ALTER TABLE tools ADD COLUMN IF NOT EXISTS test_environment TEXT;
```

---

## 更新日志

- 2026-03-20: 创建TODO清单
