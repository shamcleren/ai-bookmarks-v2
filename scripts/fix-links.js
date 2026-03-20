const fs = require('fs')

// Fix broken href={} in page.tsx
let content = fs.readFileSync('/Users/shamcle/.openclaw/workspace/project/ai-bookmarks-v2/src/app/page.tsx', 'utf8')
// Fix the broken link
content = content.replace(
  '<Link href={} style={{ color: \'#00d9ff\', fontSize: 13 }}>\n          查看详情 →\n        </Link>',
  '<Link href={`/tools/${tool.id}-${nameToSlug(tool.name)}`} style={{ color: \'#00d9ff\', fontSize: 13 }}>\n          查看详情 →\n        </Link>'
)
fs.writeFileSync('/Users/shamcle/.openclaw/workspace/project/ai-bookmarks-v2/src/app/page.tsx', content)
console.log('Fixed page.tsx')

// Fix broken href={} in rank/page.tsx  
content = fs.readFileSync('/Users/shamcle/.openclaw/workspace/project/ai-bookmarks-v2/src/app/rank/page.tsx', 'utf8')
content = content.replace(
  '<Link href={} style={{ color: \'#00d9ff\', fontSize: 13 }}>\n                    查看 →\n                  </Link>',
  '<Link href={`/tools/${tool.id}-${nameToSlug(tool.name)}`} style={{ color: \'#00d9ff\', fontSize: 13 }}>\n                    查看 →\n                  </Link>'
)
fs.writeFileSync('/Users/shamcle/.openclaw/workspace/project/ai-bookmarks-v2/src/app/rank/page.tsx', content)
console.log('Fixed rank/page.tsx')

// Fix broken href={} in search/page.tsx
content = fs.readFileSync('/Users/shamcle/.openclaw/workspace/project/ai-bookmarks-v2/src/app/search/page.tsx', 'utf8')
content = content.replace(
  '<Link href={} style={{ color: \'#00d9ff\', fontSize: 13, marginTop: 8, display: \'inline-block\' }}>\n                  查看详情 →\n                </Link>',
  '<Link href={`/tools/${tool.id}-${nameToSlug(tool.name)}`} style={{ color: \'#00d9ff\', fontSize: 13, marginTop: 8, display: \'inline-block\' }}>\n                  查看详情 →\n                </Link>'
)
fs.writeFileSync('/Users/shamcle/.openclaw/workspace/project/ai-bookmarks-v2/src/app/search/page.tsx', content)
console.log('Fixed search/page.tsx')

console.log('All fixed!')
