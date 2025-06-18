import { supabase } from "./supa.js";

const LAST_FETCHED_KEY = 'newsLastFetched';
const NEWS_CACHE_KEY = 'newsCache';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

// Normalize frontend category labels to match DB values
const normalizeCategory = (label) => {
  const map = {
    'health': 'Health',
    'innovation&tech': 'Innovation & Tech',
    'environment&sustainability': 'Environment & Sustainability',
    'education': 'Education',
    'science and space': 'Science and Space',
    'policy&governance': 'Policy & Governance',
    'community&culture': 'Community & Culture',
    'philanthropy/non-profits': 'Philanthropy/Non-Profits',
    'all': 'All'
  };

  return map[label.toLowerCase()] || 'All';
};

export const fetchNews = async (category = 'All') => {
  const normalizedCategory = normalizeCategory(category);
  const now = Date.now();
  const lastFetched = localStorage.getItem(LAST_FETCHED_KEY);
  const cachedNews = localStorage.getItem(NEWS_CACHE_KEY);

  // Return from cache if valid
  if (lastFetched && cachedNews && (now - parseInt(lastFetched, 10) < CACHE_DURATION)) {
    const parsedCache = JSON.parse(cachedNews);
    return normalizedCategory === 'All'
      ? parsedCache
      : parsedCache.filter(article => article.category === normalizedCategory);
  }

  // Query Supabase
  let query = supabase
    .from('news')
    .select('*')
    .order('published_at', { ascending: false });

  if (normalizedCategory !== 'All') {
    query = query.eq('category', normalizedCategory);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching news from Supabase:', error);
    throw error;
  }

  // Cache the result
  localStorage.setItem(NEWS_CACHE_KEY, JSON.stringify(data));
  localStorage.setItem(LAST_FETCHED_KEY, now.toString());

  return data;
};

// Optional helper to manually clear cache
export const clearNewsCache = () => {
  localStorage.removeItem(NEWS_CACHE_KEY);
  localStorage.removeItem(LAST_FETCHED_KEY);
};

