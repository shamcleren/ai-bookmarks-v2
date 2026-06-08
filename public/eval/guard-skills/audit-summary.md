# guard-skills 审计实测

## 测试文件
`test-flawed.ts` — 故意埋入 15+ 违规的 TypeScript 文件

## 审计结果
- 23 条规则中 **17 条触发**
- 🔴 严重: 6 条（假 import、硬编码成功、catch-all 吞错、5 参数、SRP 违反、LSP 违反）
- 🟡 重要: 7 条（通用命名、评论解释 what、函数过长、死代码、防御性 null 检查等）
- 🟢 风格: 1 条

## AI 专属问题命中
| 规则 | 行号 | 说明 |
|------|------|------|
| Rule 17: 假 import | L2 | `import { fetch } from 'some-lib'` — 库不存在 |
| Rule 15: 吞错误 | L21-24 | `catch(e) { return {status:'ok', data:[]} }` |
| Rule 18: 硬编码成功 | L20,24 | `return {status:'ok'}` 替代真实实现 |
| Rule 7: 命名空洞 | L3,L7 | `data`, `data2`, `Manager` |
