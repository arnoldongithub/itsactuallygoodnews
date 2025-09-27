import { supabase } from './supa.js';
import { useState, useEffect, useCallback } from 'react';
import { cleanTitle, cleanSummary, cleanContent } from './utils.js';

const CACHE_DURATION = 10 * 60 * 1000;
const CACHE_KEY = 'newsCache';
const LAST_FETCHED_KEY = 'newsLastFetched';

// DB category names (match SQL)
const VALID_CATEGORIES = [
  'Movement Tracker & Accountability',
  'Capitalism & Inequality',
  'Justice Lens',
  'Hope in Struggle',
  'AI Watch'
];

// Map UI variants → DB categories
const categoryMap = {
  'Movement Tracker + Accountability': 'Movement Tracker & Accountability',
  'Capitalism & Inequality Watch': 'Capitalism & Inequality',
  Blindspot: 'Justice Lens',
};

const normalizeCategory = (c) => categoryMap[c] || c || 'Hope in Struggle';

const isRecentArticle = (a) => {
  if (!a.created_at && !a.published_at) return true;
  const d = new Date(a.created_at || a.published_at);
  return (Date.now() - d.getTime()) / 36e5 <= 48;
};

const getCache = (k) => {
  if (typeof window === 'undefined') return null;
  try {
    const cached = localStorage.getItem(k);
    const ts = localStorage.getItem(LAST_FETCHED_KEY);
    if (cached && ts && Date.now() - parseInt(ts, 10) < CACHE_DURATION) {
      return JSON.parse(cached);
    }
  } catch {}
  return null;
};
const setCache = (k, v) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(k, JSON.stringify(v));
    localStorage.setItem(LAST_FETCHED_KEY, Date.now().toString());
  } catch {}
};

// Main fetcher (aligns with SQL schema)
export const fetchAllNewsData = async (bypassCache = false) => {
  const cacheKey = `${CACHE_KEY}_all`;
  if (!bypassCache) {
    const cached = getCache(cacheKey);
    if (cached) return cached;
  }

  try {
    const { data, error } = await supabase
      .from('news')
      .select(`
        id, title, url, summary, content, published_at, created_at,
        category, author, image_url, source_name,
        positivity_score, is_trending, is_featured
      `)
      .gte('created_at', new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString())
      .in('category', VALID_CATEGORIES)
      .order('positivity_score', { ascending: false })
      .order('published_at', { ascending: false })
      .limit(100);

    if (error) throw error;

    const processed = (data || [])
      .filter(isRecentArticle)
      .map((item) => ({
        ...item,
        title: cleanTitle(item.title),
        summary: cleanSummary(item.summary),
        content: cleanContent(item.content),
        category: normalizeCategory(item.category),
        // computed helper for UI sorting
        virality_score: item.positivity_score >= 9 ? 8 : (item.is_trending ? 7 : 0),
      }));

    const result = {
      all: processed,
      trending: processed
        .filter((s) => s.virality_score >= 7 || s.positivity_score >= 9 || s.is_trending)
        .slice(0, 15),
      dailyReads: getCategoryStories(processed, VALID_CATEGORIES, 2),
      blindspot: processed.filter((s) => s.category === 'Justice Lens').slice(0, 8),
      categories: groupByCategory(processed),
      total: processed.length,
    };

    setCache(cacheKey, result);
    return result;
  } catch (err) {
    const fallback = getCache(cacheKey);
    if (fallback) return fallback;
    return { all: [], trending: [], dailyReads: [], blindspot: [], categories: {}, total: 0 };
  }
};

const getCategoryStories = (stories, cats, per = 2) => {
  const out = [];
  cats.forEach((c) => out.push(...stories.filter((s) => s.category === c).slice(0, per)));
  return out;
};
const groupByCategory = (stories) =>
  stories.reduce((acc, s) => ((acc[s.category || 'Hope in Struggle'] ||= []).push(s), acc), {});

export const fetchTrendingNews = async (limit = 15) => {
  const all = await fetchAllNewsData();
  return all.trending.slice(0, limit);
};
export const fetchDailyReads = async (limit = 10) => {
  const all = await fetchAllNewsData();
  return all.dailyReads.slice(0, limit);
};
export const fetchBlindspotStories = async (limit = 8) => {
  const all = await fetchAllNewsData();
  return all.blindspot.slice(0, limit);
};
export const fetchNews = async (category = 'All', _retry = 0, bypassCache = false) => {
  const all = await fetchAllNewsData(bypassCache);
  if (!category || category.toLowerCase() === 'all') return all.all;
  const cat = normalizeCategory(category);
  if (all.categories[cat]) return all.categories[cat];
  const needle = cat.toLowerCase();
  return all.all.filter(
    (s) => s.category?.toLowerCase().includes(needle) || s.title?.toLowerCase().includes(needle)
  );
};

export const useHomepageData = () => {
  const [data, setData] = useState({ trending: [], dailyReads: [], blindspot: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const fetchData = useCallback(async (bypass = false) => {
    try {
      setLoading(true);
      setError(null);
      const all = await fetchAllNewsData(bypass);
      setData({ trending: all.trending, dailyReads: all.dailyReads, blindspot: all.blindspot });
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    fetchData();
    const id = setInterval(() => fetchData(false), 15 * 60 * 1000);
    return () => clearInterval(id);
  }, [fetchData]);
  return { data, loading, error, refetch: () => fetchData(false), forceRefresh: () => fetchData(true) };
};

export const useCategoryNews = (category = 'All') => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const fetchData = useCallback(async (bypass = false) => {
    try {
      setLoading(true);
      setError(null);
      const result = await fetchNews(category, 0, bypass);
      setData(result);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [category]);
  useEffect(() => {
    fetchData();
    const id = setInterval(() => fetchData(false), 20 * 60 * 1000);
    return () => clearInterval(id);
  }, [fetchData]);
  return { data, loading, error, refetch: () => fetchData(false), forceRefresh: () => fetchData(true) };
};

export const clearNewsCache = () => {
  if (typeof window === 'undefined') return;
  Object.keys(localStorage).forEach((k) => {
    if (k.startsWith(CACHE_KEY) || k.startsWith(LAST_FETCHED_KEY)) localStorage.removeItem(k);
  });
};
export const forceRefreshData = async () => {
  clearNewsCache();
  return await fetchAllNewsData(true);
};
export const checkNewsHealth = async () => {
  try {
    const { data, error } = await supabase.from('news').select('id, created_at').limit(5);
    return { status: error ? 'error' : 'healthy', error: error?.message || null, total_articles: data?.length || 0, timestamp: new Date().toISOString() };
  } catch (e) {
    return { status: 'error', error: e.message, timestamp: new Date().toISOString() };
  }
};
export const fetchHomepageData = async (bypassCache = false) => {
  const all = await fetchAllNewsData(bypassCache);
  return { trending: all.trending, dailyReads: all.dailyReads, blindspot: all.blindspot };
};

