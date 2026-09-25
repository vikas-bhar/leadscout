export const PIPELINE_CONFIG = {
  // Apify actor IDs
  actors: {
    googleMaps: "compass/crawler-google-places",
    instagram: "apify/instagram-profile-scraper",
    instagramSearch: "apify/instagram-search-scraper",
    website: "apify/website-content-crawler",
    facebook: "apify/facebook-pages-scraper",
  },

  // Optimized timeouts in milliseconds (ultra fast execution)
  timeouts: {
    googleMaps: 15000, // 15 seconds max for Maps
    instagram: 8000, // 8 seconds max for Instagram
    website: 10000, // 10 seconds max
    ai: 10000, // 10 seconds per AI task
    totalPipeline: 60000, // 60 seconds max
  },

  // Fast retry settings
  retries: {
    googleMaps: 1, // 1 attempt then instant AI fallback
    instagram: 1,
    ai: 1,
    delayBetweenRetries: 500,
  },

  // Parallel batch sizes
  batches: {
    instagramPerBatch: 10, // process 10 Instagram accounts in parallel
    aiPerBatch: 8, // analyze 8 businesses simultaneously
    delayBetweenBatches: 50,
  },

  // Balanced filtering thresholds
  filters: {
    minReviewsToInclude: 0, // include all businesses (even new ones that need help!)
    maxRatingToInclude: 5.0, // evaluate all businesses based on overall gaps
    minPhotoCountForGap: 8, // below 8 photos = visual gap
    maxPostAgeForActiveAccount: 21, // days
    minEngagementRateForHealthy: 2.0, // percent
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
