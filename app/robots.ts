import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/dashboard/',
          '/search/',
          '/leads/',
          '/credits/',
          '/prompts/',
          '/settings/',
          '/analyze/',
          '/history/',
          '/admin/',
          '/api/',
        ],
      },
    ],
    sitemap: 'https://leadscout-ashy.vercel.app/sitemap.xml',
  }
}
