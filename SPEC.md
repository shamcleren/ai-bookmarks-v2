# AI Bookmarks V2 - 技术规格文档

## 1. Concept & Vision

**定位：** 每日 AI 工具深度评测平台，帮助程序员发现、收藏、评测 AI 编程工具。

**核心理念：** 拒绝云评测，实测才是真。每款工具都有真实使用体验。

**目标用户：** 程序员、AI 开发者、技术爱好者

---

## 2. 技术架构

### 前端
- **框架：** Next.js 14 (App Router)
- **样式：** Tailwind CSS
- **部署：** Vercel（免费）

### 后端 / 数据
- **BaaS：** Supabase
- **数据库：** PostgreSQL
- **认证：** Supabase Auth（邮箱 + 社交登录）

### 域名
- 暂用 `ai-bookmarks-v2.vercel.app`
- 域名待定

---

## 3. 功能规划

### Phase 1 - MVP
- [x] SPEC.md 创建
- [x] Next.js 项目初始化
- [ ] Supabase 项目创建
- [ ] 数据库表创建
- [ ] 环境变量配置
- [ ] 用户注册/登录
- [ ] 每日工具列表浏览
- [ ] 工具详情页
- [ ] 工具收藏功能
- [ ] Vercel 部署

### Phase 2 - 增强
- [ ] 标签筛选
- [ ] 工具搜索
- [ ] 用户提交工具入口
- [ ] 评分 + 评测功能
- [ ] 排行榜

### Phase 3 - 社区
- [ ] 用户评论
- [ ] 工具对比功能
- [ ] 订阅/通知

---

## 4. 数据库设计

### tools（工具表）
| 字段 | 类型 | 说明 |
|------|------|------|
| id | uuid | 主键 |
| name | text | 工具名称 |
| url | text | 工具链接 |
| desc | text | 简介 |
| source | text | 来源(HN/GitHub等) |
| source_url | text | 来源链接 |
| tags | text[] | 标签数组 |
| can_test | boolean | 是否可评测 |
| status | text | pending/rated |
| ease_score | int | 易用性评分(1-5) |
| useful_score | int | 有用性评分(1-5) |
| hype_score | int | 热度评分(1-5) |
| stars | int | GitHub stars |
| verdict | text | 评测结论 |
| created_at | timestamptz | 创建时间 |

### favorites（收藏表）
| 字段 | 类型 | 说明 |
|------|------|------|
| id | uuid | 主键 |
| user_id | uuid | 用户ID |
| tool_id | uuid | 工具ID |
| created_at | timestamptz | 收藏时间 |

### reviews（评测表）
| 字段 | 类型 | 说明 |
|------|------|------|
| id | uuid | 主键 |
| user_id | uuid | 用户ID |
| tool_id | uuid | 工具ID |
| rating | int | 评分(1-5) |
| content | text | 评测内容 |
| created_at | timestamptz | 发布时间 |

---

## 5. 页面结构

```
/                   首页 - 最新工具列表
/tools/[id]         工具详情页
/tools               全部工具（支持筛选）
/rank               排行榜
/profile            个人中心
/auth/login         登录
/auth/register      注册
/favorites          我的收藏
```

---

## 6. 部署信息

- **Vercel App:** https://ai-bookmarks-v2.vercel.app (待部署)
- **Supabase Project:** (待创建)
- **GitHub Repo:** (待创建)

---

## 7. 环境变量

```env
NEXT_PUBLIC_SUPABASE_URL=https://rcamsqvyibqzbphxutvc.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_xxx  # 在 Vercel 中配置
```

---

## 8. 部署信息

- **GitHub Repo:** https://github.com/shamcleren/ai-bookmarks-v2 ✅
- **Vercel App:** (待创建 - 导入 GitHub 仓库即可)
- **Supabase Project:** ✅ 已配置
