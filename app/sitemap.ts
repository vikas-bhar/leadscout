import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: 'https://leadscout-ashy.vercel.app',
      lastModified: new Date('2026-10-11T12:00:00.000Z'),
      changeFrequency: 'weekly',
      priority: 1.0,
    },
    {
      url: 'https://leadscout-ashy.vercel.app/pricing',
      lastModified: new Date('2026-10-10T16:30:00.000Z'),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: 'https://leadscout-ashy.vercel.app/features',
      lastModified: new Date('2026-10-08T11:00:00.000Z'),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: 'https://leadscout-ashy.vercel.app/signup',
      lastModified: new Date('2026-10-09T14:20:00.000Z'),
      changeFrequency: 'monthly',
      priority: 0.9,
    },
    {
      url: 'https://leadscout-ashy.vercel.app/privacy',
      lastModified: new Date('2026-10-11T10:00:00.000Z'),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: 'https://leadscout-ashy.vercel.app/terms',
      lastModified: new Date('2026-10-11T09:15:00.000Z'),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
  ]
}
