import { supabase } from './supa.js';
import { useState, useEffect, useCallback } from 'react';
import { cleanTitle, cleanSummary, cleanContent } from './utils.js';

const CACHE_DURATION = 10 * 60 * 1000;
const CACHE_KEY = 'newsCache';
const LAST_FETCHED_KEY = 'newsLastFetched';

const VALID_CATEGORIES = [
  'Movement Tracker & Accountability',
  'Capitalism & Inequality',
  'Justice Lens',
  'Hope in Struggle',
  'AI Watch'
];

const isRecentArticle = (article) => {
  if (!article.created_at && !article.published_at) return true;
  const d = new Date(article.created_at || article.published_at);
  return (Date.now() - d.getTime()) / 36e5 <= 48;
};

const getCache = (key) => {
  if (typeof window === 'undefined') return null;
  try {
    const cached = localStorage.getItem(key);
    const last = localStorage.getItem(LAST_FETCHED_KEY);
    if (cached && last && Date.now() - Number(last) < CACHE_DURATION) {
      return JSON.parse(cached);
    }
  } catch {}
  return null;
};

const setCache = (key, data) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(data));
    localStorage.setItem(LAST_FETCHED_KEY, String(Date.now()));
  } catch {}
};

export const fetchAllNewsData = async (bypassCache = false) => {
  const cacheKey = `${CACHE_KEY}_all`;

  if (!bypassCache) {
    const cached = getCache(cacheKey);
    if (cached) return cached;
  }

  try {
    const since = new Date(Date.now() - 48 * 3600 * 1000).toISOString();

    const { data, error } = await supabase
      .from('news')
      .select(`
        id, title, url, summary, content,
        published_at, created_at,
        category, author, image_url, source_name,
        positivity_score, is_trending, is_featured
      `)
      .gte('created_at', since)
      .gte('positivity_score', 6)
      .order('positivity_score', { ascending: false })
      .order('published_at', { ascending: false })
      .limit(100);

    if (error) throw error;

    const processed = (data || [])
      .filter(isRecentArticle)
      .map((x) => ({
        ...x,
        title: cleanTitle(x.title),
        summary: cleanSummary(x.summary),
        content: cleanContent(x.content),
        category: normalizeCategory(x.category),
        virality_score: x.positivity_score >= 8 ? 8 : x.positivity_score >= 7 ? 6 : 0
      }));

    const result = {
      all: processed,
      trending: processed.filter(s => s.is_trending || s.positivity_score >= 8).slice(0, 15),
      dailyReads: getCategoryStories(processed, VALID_CATEGORIES, 2),
      blindspot: processed.filter(s => s.category === 'Justice Lens' || s.category === 'Hope in Struggle').slice(0, 8),
      categories: groupByCategory(processed),
      total: processed.length
    };

    setCache(cacheKey, result);
    return result;
  } catch (e) {
    console.error('fetchAllNewsData error:', e?.message || e);
    return getCache(`${CACHE_KEY}_all`) || {
      all: [], trending: [], dailyReads: [], blindspot: [], categories: {}, total: 0
    };
  }
};

const normalizeCategory = (c) => {
  if (!c) return 'Hope in Struggle';
  const m = {
    'Movement Tracker + Accountability': 'Movement Tracker & Accountability',
    'Capitalism & Inequality Watch': 'Capitalism & Inequality',
    'Blindspot': 'Justice Lens',
    'Innovation & Tech': 'AI Watch',
    'Science & Space': 'AI Watch',
    'Environment & Sustainability': 'Hope in Struggle',
    'Education': 'Hope in Struggle',
    'Humanitarian & Rescue': 'Hope in Struggle',
    'Viral': 'Hope in Struggle',
    'Movement Tracker & Accountability': 'Movement Tracker & Accountability',
    'Capitalism & Inequality': 'Capitalism & Inequality',
    'Justice Lens': 'Justice Lens',
    'Hope in Struggle': 'Hope in Struggle',
    'AI Watch': 'AI Watch'
  };
  return m[c] || 'Hope in Struggle';
};

const getCategoryStories = (stories, cats, per = 2) => {
  const out = [];
  cats.forEach((c) => {
    out.push(...stories.filter(s => s.category === c).slice(0, per));
  });
  return out;
};

const groupByCategory = (stories) =>
  stories.reduce((acc, s) => {
    const c = s.category || 'Hope in Struggle';
    (acc[c] ||= []).push(s);
    return acc;
  }, {});

export const fetchTrendingNews = async (limit = 15) => (await fetchAllNewsData()).trending.slice(0, limit);
export const fetchDailyReads = async (limit = 10) => (await fetchAllNewsData()).dailyReads.slice(0, limit);
export const fetchBlindspotStories = async (limit = 8) => (await fetchAllNewsData()).blindspot.slice(0, limit);

export const fetchNews = async (category = 'All', _retry = 0, bypassCache = false) => {
  const allData = await fetchAllNewsData(bypassCache);
  if (!category || category.toLowerCase() === 'all') return allData.all;
  if (allData.categories[category]) return allData.categories[category];
  const n = category.toLowerCase().trim();
  return allData.all.filter(s =>
    s.category?.toLowerCase().includes(n) || s.title?.toLowerCase().includes(n)
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
      setError(e?.message || 'Unknown error');
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

  const run = useCallback(async (bypass = false) => {
    try {
      setLoading(true);
      setError(null);
      setData(await fetchNews(category, 0, bypass));
    } catch (e) {
      setError(e?.message || 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [category]);

  useEffect(() => {
    run();
    const id = setInterval(() => run(false), 20 * 60 * 1000);
    return () => clearInterval(id);
  }, [run]);

  return { data, loading, error, refetch: () => run(false), forceRefresh: () => run(true) };
};

export const clearNewsCache = () => {
  if (typeof window === 'undefined') return;
  Object.keys(localStorage).forEach(k => {
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
