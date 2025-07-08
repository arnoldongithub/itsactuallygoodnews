import { supabase } from './supa.js';

const LAST_FETCHED_KEY = 'newsLastFetched';
const NEWS_CACHE_KEY = 'newsCache';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

export const fetchNews = async (category = 'All') => {
  const now = Date.now();
  const isBrowser = typeof window !== 'undefined';

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
      return decodedCategory === 'All'
        ? parsedCache
        : parsedCache.filter(article => article.category === decodedCategory);
    } catch (e) {
      console.warn('⚠️ Failed to parse local cache:', e);
      // fall through to Supabase fetch
    }
  }

  // Fetch from Supabase
  let query = supabase
    .from('news')
    .select('*')
    .order('published_at', { ascending: false });

  if (decodedCategory && decodedCategory !== 'All') {
    query = query.eq('category', decodedCategory);
  }

  const { data, error } = await query;

  if (error) {
    console.error('❌ Error fetching news from Supabase:', error);
    return []; // fallback to empty list
  }

  if (isBrowser) {
    try {
      localStorage.setItem(NEWS_CACHE_KEY, JSON.stringify(data));
      localStorage.setItem(LAST_FETCHED_KEY, now.toString());
    } catch (e) {
      console.warn('⚠️ Failed to cache news in localStorage:', e);
    }
  }

  return data || [];
};

