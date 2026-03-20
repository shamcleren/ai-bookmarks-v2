import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/auth/', '/favorites'],
    },
    sitemap: 'https://ai-bookmarks-v2.vercel.app/sitemap.xml',
  }
}
