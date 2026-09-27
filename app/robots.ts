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
          '/history/',
          '/api/',
        ],
      },
    ],
    sitemap: 'https://leadscout-ashy.vercel.app/sitemap.xml',
  }
}
