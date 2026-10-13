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
          '/prompts',
          '/settings/',
          '/settings',
          '/login',
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
