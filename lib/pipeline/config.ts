export const PIPELINE_CONFIG = {
  // Apify actor IDs
  actors: {
    googleMaps: "compass/crawler-google-places",
    instagram: "apify/instagram-profile-scraper",
    instagramSearch: "apify/instagram-search-scraper",
    website: "apify/website-content-crawler",
    facebook: "apify/facebook-pages-scraper",
  },

  // Timeouts in milliseconds
  timeouts: {
    googleMaps: 120000, // 2 minutes
    instagram: 90000, // 90 seconds
    website: 60000, // 1 minute
    ai: 30000, // 30 seconds per business
    totalPipeline: 600000, // 10 minutes max
  },

  // Retry settings
  retries: {
    googleMaps: 3,
    instagram: 2,
    ai: 2,
    delayBetweenRetries: 2000, // 2 seconds
  },

  // Batch sizes
  batches: {
    instagramPerBatch: 5, // check 5 Instagram at a time
    aiPerBatch: 3, // analyze 3 businesses at a time
    delayBetweenBatches: 1000, // 1 second between batches
  },

  // Filtering thresholds
  filters: {
    minReviewsToInclude: 3,
    maxRatingToInclude: 4.5, // skip perfect businesses
    minPhotoCountForGap: 5, // below 5 photos = gap
    maxPostAgeForActiveAccount: 30, // days
    minEngagementRateForHealthy: 1.5, // percent
  },

  // Credit costs
  credits: {
    mapsSearchPer10: 2,
    instagramCheckPer10: 3,
    aiAnalysisEach: 1,
    pitchGenerationEach: 1,
    analyzeLink: 5,
    csvExport: 2,
  },
};
