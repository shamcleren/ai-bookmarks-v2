const fs = require('fs')
let c = fs.readFileSync('src/app/tools/[slug]/page.tsx', 'utf8')

const shareSection = `        {/* 分享 */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 25, flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ color: '#666', fontSize: 13 }}>分享：</span>
          <a
            href={\`https://twitter.com/intent/tweet?text=\${encodeURIComponent(tool.name + ' - AI 工具评测')}&url=\${encodeURIComponent(window.location.href)}\`}
            target="_blank"
            rel="noopener noreferrer"
            style={{ padding: '8px 16px', background: 'rgba(29,161,242,0.15)', border: '1px solid rgba(29,161,242,0.3)', borderRadius: 8, color: '#1da1f2', fontSize: 13, textDecoration: 'none' }}
          >
            𝕏 Twitter
          </a>
          <a
            href={\`https://www.facebook.com/sharer/sharer.php?u=\${encodeURIComponent(window.location.href)}\`}
            target="_blank"
            rel="noopener noreferrer"
            style={{ padding: '8px 16px', background: 'rgba(24,119,242,0.15)', border: '1px solid rgba(24,119,242,0.3)', borderRadius: 8, color: '#1877f2', fontSize: 13, textDecoration: 'none' }}
          >
            f Facebook
          </a>
          <button
            onClick={() => { navigator.clipboard.writeText(window.location.href).catch(() => {}); alert('链接已复制！') }}
            style={{ padding: '8px 16px', background: 'rgba(0,217,255,0.1)', border: '1px solid rgba(0,217,255,0.2)', borderRadius: 8, color: '#00d9ff', fontSize: 13, cursor: 'pointer' }}
          >
            📋 复制链接
          </button>
        </div>

`

// 在简介 borderTop 之前插入
if (c.includes('{/* 简介 */}')) {
  c = c.replace(
    '{/* 简介 */}\n        <div style={{ borderTop',
    shareSection + '{/* 简介 */}\n        <div style={{ borderTop'
  )
  fs.writeFileSync('src/app/tools/[slug]/page.tsx', c)
  console.log('done')
} else {
  console.log('NOT FOUND -简介- section')
}
