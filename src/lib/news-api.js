import { supabase } from './supa.js';

const LAST_FETCHED_KEY = 'newsLastFetched';
const NEWS_CACHE_KEY = 'newsCache';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

// Fallback news data in case everything fails
const FALLBACK_NEWS = [
  {
    id: 'fallback-1',
    title: 'Welcome to ItsActuallyGoodNews',
    content: 'We are currently updating our news feed. Please check back shortly for the latest positive news stories.',
    category: 'Community & Culture',
    published_at: new Date().toISOString(),
    author: 'ItsActuallyGoodNews Team',
    url: '#',
    image_url: null
  }
];

export const fetchNews = async (category = 'All', retryCount = 0) => {
  const now = Date.now();
  const isBrowser = typeof window !== 'undefined';
  const maxRetries = 3;
  
  let lastFetched, cachedNews;
  
  if (isBrowser) {
    lastFetched = localStorage.getItem(LAST_FETCHED_KEY);
    cachedNews = localStorage.getItem(NEWS_CACHE_KEY);
  }
  
  const decodedCategory = decodeURIComponent(category);
  
  // Try to use cache first
  if (
    isBrowser &&
    lastFetched &&
    cachedNews &&
    now - parseInt(lastFetched, 10) < CACHE_DURATION
  ) {
    try {
      const parsedCache = JSON.parse(cachedNews);
      const filteredCache = decodedCategory === 'All'
        ? parsedCache
        : parsedCache.filter(article => article.category === decodedCategory);
      
      // If cache has content, return it
      if (filteredCache.length > 0) {
        return filteredCache;
      }
    } catch (e) {
      console.warn('⚠️ Failed to parse local cache:', e);
    }
  }
  
  // Fetch from Supabase with retry logic
  try {
    let query = supabase
      .from('news')
      .select('*')
      .order('published_at', { ascending: false })
      .limit(100); // Limit to prevent huge queries
    
    if (decodedCategory && decodedCategory !== 'All') {
      query = query.eq('category', decodedCategory);
    }
    
    const { data, error } = await query;
    
    if (error) {
      throw new Error(`Supabase error: ${error.message}`);
    }
    
    // If we got data, cache it and return
    if (data && data.length > 0) {
      if (isBrowser) {
        try {
          localStorage.setItem(NEWS_CACHE_KEY, JSON.stringify(data));
          localStorage.setItem(LAST_FETCHED_KEY, now.toString());
        } catch (e) {
          console.warn('⚠️ Failed to cache news in localStorage:', e);
        }
      }
      return data;
    }
    
    // If no data returned, this might be a temporary issue
    if (data && data.length === 0) {
      console.warn('⚠️ No news data returned from Supabase');
      
      // Try to return old cache if available
      if (isBrowser && cachedNews) {
        try {
          const parsedCache = JSON.parse(cachedNews);
          console.log('📦 Using expired cache as fallback');
          return decodedCategory === 'All'
            ? parsedCache
            : parsedCache.filter(article => article.category === decodedCategory);
        } catch (e) {
          console.warn('⚠️ Failed to parse fallback cache:', e);
        }
      }
    }
    
  } catch (error) {
    console.error(`❌ Error fetching news (attempt ${retryCount + 1}):`, error);
    
    // Retry logic
    if (retryCount < maxRetries) {
      console.log(`🔄 Retrying... (${retryCount + 1}/${maxRetries})`);
      await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1))); // Exponential backoff
      return fetchNews(category, retryCount + 1);
    }
    
    // If all retries failed, try old cache
    if (isBrowser && cachedNews) {
      try {
        const parsedCache = JSON.parse(cachedNews);
        console.log('📦 Using expired cache after all retries failed');
        return decodedCategory === 'All'
          ? parsedCache
          : parsedCache.filter(article => article.category === decodedCategory);
      } catch (e) {
        console.warn('⚠️ Failed to parse fallback cache:', e);
      }
    }
  }
  
  // Last resort: return fallback news
  console.log('🚨 Using fallback news content');
  return FALLBACK_NEWS;
};

// Health check function to test connectivity
export const checkNewsHealth = async () => {
  try {
    const { data, error } = await supabase
      .from('news')
      .select('id')
      .limit(1);
    
    return {
      status: error ? 'error' : 'healthy',
      error: error?.message || null,
      timestamp: new Date().toISOString()
    };
  } catch (err) {
    return {
      status: 'error',
      error: err.message,
      timestamp: new Date().toISOString()
    };
  }
};

// Clear cache function for debugging
export const clearNewsCache = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(NEWS_CACHE_KEY);
    localStorage.removeItem(LAST_FETCHED_KEY);
    console.log('🧹 News cache cleared');
  }
};
