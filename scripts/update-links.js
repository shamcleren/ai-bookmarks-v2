const fs = require('fs')

const files = [
  '/Users/shamcle/.openclaw/workspace/project/ai-bookmarks-v2/src/app/page.tsx',
  '/Users/shamcle/.openclaw/workspace/project/ai-bookmarks-v2/src/app/search/page.tsx',
  '/Users/shamcle/.openclaw/workspace/project/ai-bookmarks-v2/src/app/rank/page.tsx',
]

const importStmt = "\nimport { nameToSlug } from '@/lib/utils'"

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8')
  
  if (!content.includes("nameToSlug")) {
    content = content.replace(
      "import { createClient } from '@/lib/supabase/client'",
      "import { createClient } from '@/lib/supabase/client'" + importStmt
    )
  }
  
  content = content.replace(
    /href={\`\/tools\/\${tool\.id}\`}/g,
    'href={`/tools/${tool.id}-${nameToSlug(tool.name)}`}'
  )
  
  fs.writeFileSync(file, content)
  console.log(`Updated: ${file}`)
})

console.log('All done!')
