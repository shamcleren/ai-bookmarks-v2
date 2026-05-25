# 数据管道 & Cron 任务文档

## 概述

ai-bookmarks-v2 的数据来源通过自动化管道每天定时抓取，写入 Supabase，再由前端展示。

## Cron 任务配置

- **任务名：** `ai-bookmarks-v2-pipeline`
- **调度：** 每天 08:30（Asia/Shanghai）
- **运行环境：** OpenClaw isolated session
- **脚本位置：** `~/.openclaw/workspace/scripts/daily-pipeline.mjs`
- **通知：** 飞书私信

### Cron 原始配置（JSON）

```json
{
  "name": "ai-bookmarks-v2-pipeline",
  "description": "每天 8:30 抓取 GitHub+HN AI 工具 → 写入 Supabase → 飞书通知",
  "schedule": {
    "kind": "cron",
    "expr": "30 8 * * *",
    "tz": "Asia/Shanghai"
  },
  "sessionTarget": "isolated",
  "payload": {
    "kind": "agentTurn",
    "message": "你的任务：\n1. 运行数据管道脚本：cd /Users/shamcle/.openclaw/workspace/scripts && set -a && . ./.env && set +a && /opt/homebrew/bin/node daily-pipeline.mjs\n2. 读取今天的备份文件：/Users/shamcle/.openclaw/workspace/scripts/pipeline-backup/$(date +%Y-%m-%d).json（用今天日期）\n3. 用简短中文汇报结果，格式：\n   📡 AI 日报 — YYYY-MM-DD\n   🔧 抓取 X 个工具，写入 Y 条\n   📋 列出工具名称（每行一个，带 star 数）\n   如果有失败的也提一下",
    "timeoutSeconds": 120,
    "toolsAllow": ["exec", "read"]
  },
  "delivery": {
    "mode": "announce",
    "channel": "feishu"
  }
}
```

## 数据管道流程

```
┌─────────────┐     ┌──────────────┐     ┌───────────┐     ┌──────────┐
│ GitHub API  │────▶│              │     │           │     │          │
│ (Search)    │     │  daily-      │────▶│ Supabase  │────▶│ Next.js  │
│             │     │  pipeline    │     │ (Postgres)│     │ 前端展示  │
│ HN Firebase │────▶│  .mjs        │     │           │     │          │
│ API         │     │              │     │           │     │          │
└─────────────┘     └──────────────┘     └───────────┘     └──────────┘
                           │
                           ▼
                    pipeline-backup/
                    YYYY-MM-DD.json
```

### 1. 数据采集

- **GitHub Search API**：搜索 3 天内创建、star > 100 的 AI 相关仓库（两组关键词覆盖）
- **Hacker News Firebase API**：抓取 Top 50 热帖

### 2. 筛选逻辑

- 关键词匹配（AI_KEYWORDS 列表，约 40 个关键词）
- 至少命中 2 个关键词，或命中 1 个 + 包含 "tool"
- GitHub 最多取 7 个，HN 最多补到 10 个

### 3. 写入 Supabase

- 表：`tools`
- 使用 `resolution=merge-duplicates` 避免重复
- 每条记录自动关联当天日期（`created_at`）

### 4. 本地备份

- 路径：`~/.openclaw/workspace/scripts/pipeline-backup/YYYY-MM-DD.json`
- 用于排查和审计

## 依赖的环境变量

```env
NEXT_PUBLIC_SUPABASE_URL=https://rcamsqvyibqzbphxutvc.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_pub_xxx
```

存储在 `~/.openclaw/workspace/scripts/.env`，运行时通过 `set -a && . ./.env && set +a` 加载。

## 手动运行

```bash
cd ~/.openclaw/workspace/scripts
set -a && . ./.env && set +a
node daily-pipeline.mjs                    # 正常运行
node daily-pipeline.mjs --dry-run          # 干跑，不写 Supabase
node daily-pipeline.mjs --date=2026-05-20  # 指定日期
```
