import { supabase } from "./supa.js";

const LAST_FETCHED_KEY = 'newsLastFetched';
const NEWS_CACHE_KEY = 'newsCache';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

export const fetchNews = async (category = 'All') => {
  const now = Date.now();
  const lastFetched = localStorage.getItem(LAST_FETCHED_KEY);
  const cachedNews = localStorage.getItem(NEWS_CACHE_KEY);

  if (lastFetched && cachedNews && (now - parseInt(lastFetched, 10) < CACHE_DURATION)) {
    const parsedCache = JSON.parse(cachedNews);
    return category === 'All'
      ? parsedCache
      : parsedCache.filter(article => article.category === category);
  }

  let query = supabase
    .from('news')
    .select('*')
    .order('published_at', { ascending: false });

  if (category && category !== 'All') {
    query = query.eq('category', category);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching news from Supabase:', error);
    throw error;
  }

  localStorage.setItem(NEWS_CACHE_KEY, JSON.stringify(data));
  localStorage.setItem(LAST_FETCHED_KEY, now.toString());

  return data;
};
