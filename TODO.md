# AI Bookmarks V2 - 待办清单

## 项目 Handoff

### 当前状态（2026-05-09）
- **仓库**: https://github.com/shamcleren/ai-bookmarks-v2 (master)
- **线上**: https://ai-bookmarks-v2.vercel.app
- **数据库**: Supabase (rcamsqvyibqzbphxutvc.supabase.co)
- **数据源仓库**: https://github.com/shamcleren/ai-bookmarks (tools.json 格式)

### 今日完成（2026-05-09）
- [x] 日历组件改为弹窗样式，默认选中最新日期
- [x] 排序下拉改为自定义组件，修复暗色主题对比度
- [x] 修复 globals.css 被误清空导致页面全白的问题
- [x] 数据管道脚本 `scripts/daily-pipeline.mjs` — GitHub Search API + HN API 自动抓取
- [x] 修复 `scripts/ai_paper_daily.py` — 修正日期取值 bug，增加 Supabase 同步
- [x] Cron 调度：8:30 跑数据管道，9:00 跑飞书推送

### 自动化流程
```
8:30  daily-pipeline.mjs → 抓 GitHub + HN → 生成 tools.json → 推 ai-bookmarks 仓库 + 同步 Supabase
9:00  ai_paper_daily.py  → 从仓库读最新数据 → 发飞书快讯（同时同步 Supabase）
```

### 已知问题
- [ ] ai-bookmarks 仓库 git push 偶尔超时（网络问题）
- [ ] 数据管道的 GitHub Trending 备用方案（页面抓取）不可靠，已改用 Search API

---

## P0 - 基础 ✅ 已完成
- [x] 首页精选区块、评分标签、部署图标
- [x] 详情页5维评分、优缺点、适合人群
- [x] 用户评分、收藏、筛选排序
- [x] 日历弹窗 + 默认选中最新日期
- [x] 排序下拉暗色主题适配
- [x] 数据管道自动化（GitHub + HN → Supabase）

## P1 - 下一步（按优先级）

### 1. 移动端适配 ⬅️ 当前
- [ ] 响应式布局优化（卡片、导航、筛选栏）
- [ ] 移动端筛选交互优化

### 2. 搜索功能
- [ ] 站内搜索框（接 Supabase 全文搜索）
- [ ] 支持按工具名/标签搜索
- [ ] 搜索结果高亮关键词

### 3. 详情页增强
- [ ] 详情页加「替代工具」推荐（同标签其他工具）
- [ ] 收藏后跳转回原页面

### 4. 标签系统
- [ ] 标签筛选页
- [ ] 热门标签展示

## P2 - 增长

### SEO
- [ ] URL改成工具名slug：`/tools/[name-slug]`
- [ ] JSON-LD 结构化数据
- [ ] sitemap.xml 已有，需确认覆盖所有工具页

### 内容增长
- [ ] RSS 订阅
- [ ] 详情页加社交分享按钮
- [ ] 每期合集可分享链接

### 对比功能
- [ ] 对比页面优化：维度高亮差异
- [ ] 对比页URL可分享

### 社区
- [ ] 用户提交工具入口（UGC）
- [ ] 用户评论

---

## 数据库字段扩展（已完成）

```sql
-- P0 字段（已添加）
ALTER TABLE tools ADD COLUMN IF NOT EXISTS deploy_type TEXT DEFAULT 'unknown';
ALTER TABLE tools ADD COLUMN IF NOT EXISTS suitable_for TEXT[] DEFAULT '{}';
ALTER TABLE tools ADD COLUMN IF NOT EXISTS pros TEXT[] DEFAULT '{}';
ALTER TABLE tools ADD COLUMN IF NOT EXISTS cons TEXT[] DEFAULT '{}';
ALTER TABLE tools ADD COLUMN IF NOT EXISTS tested_at TIMESTAMPTZ;
ALTER TABLE tools ADD COLUMN IF NOT EXISTS overall_score INT DEFAULT 0;

-- P1 用户评分表（已创建）
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
- 2026-05-09: 日历弹窗、排序下拉修复、数据管道自动化、Cron 调度
