import { supabase } from './supa.js';

const LAST_FETCHED_KEY = 'newsLastFetched';
const NEWS_CACHE_KEY = 'newsCache';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

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
        : parsedCache.filter(article => article.category === decodedCategory && article.is_ad === false);
      if (filteredCache.length > 0) return filteredCache;
    } catch (e) {
      console.warn('⚠️ Failed to parse local cache:', e);
    }
  }

  try {
    let query = supabase
      .from('news')
      .select('*')
      .order('published_at', { ascending: false })
      .limit(100);

    if (decodedCategory && decodedCategory !== 'All') {
      query = query
        .eq('category', decodedCategory)
        .eq('is_ad', false);
    }

    const { data, error } = await query;

    if (error) throw new Error(`Supabase error: ${error.message}`);

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

    if (data && data.length === 0) {
      console.warn('⚠️ No news data returned from Supabase');
      if (isBrowser && cachedNews) {
        try {
          const parsedCache = JSON.parse(cachedNews);
          return decodedCategory === 'All'
            ? parsedCache
            : parsedCache.filter(article => article.category === decodedCategory && article.is_ad === false);
        } catch (e) {
          console.warn('⚠️ Failed to parse fallback cache:', e);
        }
      }
    }

  } catch (error) {
    console.error(`❌ Error fetching news (attempt ${retryCount + 1}):`, error);
    if (retryCount < maxRetries) {
      await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
      return fetchNews(category, retryCount + 1);
    }
    if (isBrowser && cachedNews) {
      try {
        const parsedCache = JSON.parse(cachedNews);
        return decodedCategory === 'All'
          ? parsedCache
          : parsedCache.filter(article => article.category === decodedCategory && article.is_ad === false);
      } catch (e) {
        console.warn('⚠️ Failed to parse fallback cache:', e);
      }
    }
  }

  return FALLBACK_NEWS;
};

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

export const clearNewsCache = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(NEWS_CACHE_KEY);
    localStorage.removeItem(LAST_FETCHED_KEY);
    console.log('🧹 News cache cleared');
  }
};

