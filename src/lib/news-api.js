// Complete Corrected news-api.js - Cache Fixed Version
import { supabase } from './supa.js';
import { placeholderArticles, getAllStories } from './placeholder-data.js';
import { useState, useEffect, useCallback } from 'react';
import { cleanTitle, cleanSummary, cleanContent } from './utils.js';

const LAST_FETCHED_KEY = 'newsLastFetched';
const NEWS_CACHE_KEY = 'newsCache';
const CACHE_DURATION = 5 * 60 * 1000; // REDUCED: 5 minutes for fresher content

// ENHANCED category mappings - EXACT database matching for working categories
const CATEGORY_MAPPINGS = {
  'all': ['Health', 'Innovation & Tech', 'Environment & Sustainability', 'Education', 'Science & Space', 'Humanitarian & Rescue', 'Blindspot'],
  'health': ['Health'],
  'innovation & tech': ['Innovation & Tech'],
  'environment & sustainability': ['Environment & Sustainability'], 
  'education': ['Education'],
  'science & space': ['Science & Space'],
  'humanitarian & rescue': ['Humanitarian & Rescue'],
  'blindspot': ['Blindspot']
};

// NEW: Force clear all caches
export const forceClearAllCaches = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(NEWS_CACHE_KEY);
    localStorage.removeItem(LAST_FETCHED_KEY);
    console.log('🧹 All news caches cleared');
  }
};

// NEW: Cache-busting fetch with timestamp
const fetchWithCacheBust = async (url, options = {}) => {
  const cacheBuster = Date.now();
  const separator = url.includes('?') ? '&' : '?';
  return fetch(`${url}${separator}_cb=${cacheBuster}`, options);
};

// === OPTIMIZED: Primary function using materialized views ===
export const fetchHomepageData = async (bypassCache = false) => {
  try {
    console.log('🚀 Using optimized homepage data fetch...');
    
    const startTime = performance.now();
    
    // Try the optimized function first
    const { data, error } = await supabase.rpc('get_homepage_data_optimized');
    
    const endTime = performance.now();
    console.log(`⚡ Optimized fetch took: ${(endTime - startTime).toFixed(2)}ms`);
    
    if (!error && data) {
      console.log('✅ Got optimized data from materialized views');
      return {
        trending: data.trending || [],
        dailyReads: data.daily_reads || [],
        blindspot: data.blindspot || []
      };
    }
    
    console.warn('⚠️ Optimized function failed, trying direct function');
    return await fetchHomepageDataDirect(bypassCache);
  } catch (error) {
    console.error('❌ Error in optimized fetch:', error);
    return await fetchHomepageDataDirect(bypassCache);
  }
};

// FALLBACK: Direct function if materialized views fail
const fetchHomepageDataDirect = async (bypassCache = false) => {
  try {
    console.log('🔄 Using direct homepage data fetch...');
    
    const { data, error } = await supabase.rpc('get_homepage_data_direct');
    
    if (!error && data) {
      console.log('✅ Got data from direct function');
      return {
        trending: data.trending || [],
        dailyReads: data.daily_reads || [],
        blindspot: data.blindspot || []
      };
    }
    
    console.warn('⚠️ Direct function failed, using individual queries');
    return await fetchHomepageDataFallback(bypassCache);
  } catch (error) {
    console.error('❌ Error in direct fetch:', error);
    return await fetchHomepageDataFallback(bypassCache);
  }
};

// LAST RESORT: Individual queries fallback
const fetchHomepageDataFallback = async (bypassCache = false) => {
  try {
    console.log('🔄 Using fallback individual queries...');
    
    const [trending, dailyReads, blindspot] = await Promise.all([
      fetchTrendingNews(15, bypassCache),
      fetchDailyReads(10, bypassCache), 
      fetchBlindspotStories(8, bypassCache)
    ]);

    console.log(`📊 Fallback results: ${trending.length} trending, ${dailyReads.length} daily, ${blindspot.length} blindspot`);
    
    return { 
      trending: trending || [], 
      dailyReads: dailyReads || [], 
      blindspot: blindspot || [] 
    };
  } catch (error) {
    console.error('❌ Error in fallback fetch:', error);
    
    // Last resort: use placeholder data if available
    try {
      const { getViralStories, getTrendingStories, getDailyReads, getBlindspotStories } = await import('./placeholder-data.js');
      return {
        trending: [...(getViralStories() || []), ...(getTrendingStories() || [])],
        dailyReads: getDailyReads() || [],
        blindspot: getBlindspotStories() || []
      };
    } catch (placeholderError) {
      console.warn('⚠️ No placeholder data available');
      return {
        trending: [],
        dailyReads: [],
        blindspot: []
      };
    }
  }
};

// OPTIMIZED: Trending with materialized view fallback
export const fetchTrendingNews = async (limit = 15, bypassCache = false) => {
  try {
    console.log('🔥 Fetching trending stories...');
    
    // Try materialized view first
    const { data: mvData } = await supabase
      .from('mv_trending_news')
      .select('*')
      .limit(limit);
      
    if (mvData && mvData.length > 0) {
      console.log(`🔥 Trending from materialized view: ${mvData.length}`);
      return mvData.map(item => ({
        ...item,
        title: cleanTitle(item.title),
        summary: cleanSummary(item.summary),
        content: cleanContent(item.content)
      }));
    }

    // Fallback to direct query with cache busting
    const fromTime = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();

    let query = supabase
      .from('news')
      .select(`
        id, title, url, summary, content, image_url, thumbnail_url,
        category, published_at, positivity_score, virality_score, author, source_name
      `)
      .eq('is_ad', false)
      .eq('sentiment', 'positive')
      .gte('published_at', fromTime)
      .gte('positivity_score', 6)
      .order('virality_score', { ascending: false })
      .order('positivity_score', { ascending: false })
      .order('published_at', { ascending: false })
      .limit(limit);

    const { data, error } = await query;

    if (error) throw error;
    console.log(`🔥 Trending stories: ${data?.length || 0}`);
    
    return (data || []).map(item => ({
      ...item,
      title: cleanTitle(item.title),
      summary: cleanSummary(item.summary),
      content: cleanContent(item.content)
    }));

  } catch (error) {
    console.error('❌ fetchTrendingStories error:', error);
    return [];
  }
};

// OPTIMIZED: Daily reads with materialized view fallback
export const fetchDailyReads = async (limit = 10, bypassCache = false) => {
  try {
    console.log('📰 Fetching daily reads...');
    
    // Try materialized view first
    const { data: mvData } = await supabase
      .from('mv_daily_reads')
      .select('*')
      .limit(limit);
      
    if (mvData && mvData.length > 0) {
      console.log(`📰 Daily reads from materialized view: ${mvData.length}`);
      return mvData.map(item => ({
        ...item,
        title: cleanTitle(item.title),
        summary: cleanSummary(item.summary),
        content: cleanContent(item.content)
      }));
    }

    // Fallback to category-based fetch
    const categories = ['Health', 'Innovation & Tech', 'Environment & Sustainability', 'Education', 'Science & Space', 'Humanitarian & Rescue'];
    const dailyReads = [];
    
    for (const category of categories) {
      const { data } = await supabase
        .from('news')
        .select(`
          id, title, url, summary, content, image_url, thumbnail_url,
          category, published_at, positivity_score, author, source_name
        `)
        .eq('category', category)
        .eq('is_ad', false)
        .eq('sentiment', 'positive')
        .gte('positivity_score', 6)
        .order('positivity_score', { ascending: false })
        .order('published_at', { ascending: false })
        .limit(1);
      
      if (data && data.length > 0) {
        dailyReads.push({
          ...data[0],
          title: cleanTitle(data[0].title),
          summary: cleanSummary(data[0].summary),
          content: cleanContent(data[0].content)
        });
      }
    }
    
    console.log(`📰 Daily reads: ${dailyReads.length} stories`);
    return dailyReads;

  } catch (error) {
    console.error('❌ fetchDailyReads error:', error);
    return [];
  }
};

// OPTIMIZED: Blindspot with materialized view fallback
export const fetchBlindspotStories = async (limit = 8, bypassCache = false) => {
  try {
    console.log('🔍 Fetching blindspot stories...');
    
    // Try materialized view first
    const { data: mvData } = await supabase
      .from('mv_blindspot_reads')
      .select('*')
      .limit(limit);
      
    if (mvData && mvData.length > 0) {
      console.log(`🔍 Blindspot from materialized view: ${mvData.length}`);
      return mvData.map(item => ({
        ...item,
        title: cleanTitle(item.title),
        summary: cleanSummary(item.summary),
        content: cleanContent(item.content)
      }));
    }

    // Fallback to direct query
    let { data, error } = await supabase
      .from('news')
      .select(`
        id, title, url, summary, content, image_url, thumbnail_url,
        category, published_at, positivity_score, author, source_name
      `)
      .or('category.eq.Blindspot,is_blindspot.eq.true')
      .eq('is_ad', false)
      .eq('sentiment', 'positive')
      .order('positivity_score', { ascending: false })
      .order('published_at', { ascending: false })
      .limit(limit);

    if (error || !data || data.length === 0) {
      console.warn('⚠️ No Blindspot data, using Humanitarian as fallback');
      
      ({ data } = await supabase
        .from('news')
        .select(`
          id, title, url, summary, content, image_url, thumbnail_url,
          category, published_at, positivity_score, author, source_name
        `)
        .eq('category', 'Humanitarian & Rescue')
        .eq('is_ad', false)
        .eq('sentiment', 'positive')
        .gte('positivity_score', 6)
        .order('positivity_score', { ascending: false })
        .limit(limit)
      );
    }

    console.log(`🔍 Blindspot stories: ${data?.length || 0}`);
    return (data || []).map(item => ({
      ...item,
      title: cleanTitle(item.title),
      summary: cleanSummary(item.summary),
      content: cleanContent(item.content)
    }));

  } catch (error) {
    console.error('❌ fetchBlindspotStories error:', error);
    return [];
  }
};

// FIXED: Category filtering with EXACT database matching - CATEGORIES NOW WORK!
export const fetchNews = async (category = 'All', retryCount = 0, bypassCache = false) => {
  const now = Date.now();
  const isBrowser = typeof window !== 'undefined';
  const maxRetries = 3;

  console.log(`🔍 Fetching news for category: "${category}" (bypass cache: ${bypassCache})`);

  // CRITICAL FIX: Proper category decoding and normalization
  let decodedCategory = category;
  try {
    decodedCategory = decodeURIComponent(category);
  } catch (e) {
    console.warn('Failed to decode category:', e);
  }
  
  const normalizedCategory = decodedCategory.toLowerCase().trim();
  console.log(`🎯 Normalized category: "${normalizedCategory}"`);

  let lastFetched, cachedNews;
  if (isBrowser && !bypassCache) { // Only check cache if not bypassing
    lastFetched = localStorage.getItem(LAST_FETCHED_KEY);
    cachedNews = localStorage.getItem(NEWS_CACHE_KEY);
  }

  // Check cache first (but skip if bypassCache is true)
  if (!bypassCache && isBrowser && lastFetched && cachedNews && now - parseInt(lastFetched, 10) < CACHE_DURATION) {
    try {
      const parsedCache = JSON.parse(cachedNews);
      const filteredCache = filterByCategory(parsedCache, normalizedCategory);
      if (filteredCache.length > 0) {
        console.log(`📚 Using cached data for ${category}: ${filteredCache.length} articles`);
        return filteredCache;
      }
    } catch (e) {
      console.warn('⚠️ Failed to parse local cache:', e);
    }
  }

  try {
    // Build optimized query
    let query = supabase
      .from('news')
      .select(`
        id, title, url, summary, content, published_at, created_at,
        category, author, image_url, thumbnail_url, source_name,
        positivity_score, virality_score, is_ad, sentiment
      `)
      .eq('is_ad', false)
      .eq('sentiment', 'positive')
      .order('positivity_score', { ascending: false })
      .order('published_at', { ascending: false })
      .limit(50);

    // CRITICAL FIX: Exact category matching - THIS MAKES CATEGORIES WORK!
    if (normalizedCategory && normalizedCategory !== 'all') {
      console.log(`🔍 Filtering for category: "${normalizedCategory}"`);
      
      // Direct exact match first - CRITICAL FOR WORKING CATEGORIES
      const exactMatches = {
        'health': 'Health',
        'innovation & tech': 'Innovation & Tech',
        'environment & sustainability': 'Environment & Sustainability',
        'education': 'Education',
        'science & space': 'Science & Space',
        'humanitarian & rescue': 'Humanitarian & Rescue',
        'blindspot': 'Blindspot'
      };
      
      const exactCategory = exactMatches[normalizedCategory];
      
      if (exactCategory) {
        console.log(`🎯 Using exact match: "${exactCategory}"`);
        query = query.eq('category', exactCategory);
      } else {
        // Fallback: try partial matching
        console.log(`🔍 Using partial match for: "${decodedCategory}"`);
        query = query.ilike('category', `%${decodedCategory}%`);
      }
    }

    const { data, error } = await query;

    if (error) throw new Error(`Supabase error: ${error.message}`);

    if (data && data.length > 0) {
      console.log(`✅ Fetched ${data.length} articles for category: ${category}`);
      
      // CLEAN and process data
      const processedData = data.map(item => ({
        ...item,
        title: cleanTitle(item.title),
        summary: cleanSummary(item.summary),
        content: cleanContent(item.content),
        virality_score: item.virality_score || (item.positivity_score > 9 ? 8 : 0)
      }));

      // Cache with shorter duration (but skip if bypassing cache)
      if (!bypassCache && isBrowser) {
        try {
          localStorage.setItem(NEWS_CACHE_KEY, JSON.stringify(processedData));
          localStorage.setItem(LAST_FETCHED_KEY, now.toString());
        } catch (e) {
          console.warn('⚠️ Failed to cache news:', e);
        }
      }
      
      return processedData;
    }

    console.warn(`⚠️ No news data for category: ${category}`);
    return [];
    
  } catch (error) {
    console.error(`❌ Error fetching news (attempt ${retryCount + 1}):`, error);
    
    if (retryCount < maxRetries) {
      await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
      return fetchNews(category, retryCount + 1, bypassCache);
    }
    
    return [];
  }
};

// UPDATED: filterByCategory helper with exact matching - MAKES CATEGORIES WORK
const filterByCategory = (data, category) => {
  if (!category || category === 'all') return data;
  
  // Direct exact matching first - CRITICAL FOR WORKING CATEGORIES
  const exactMatches = {
    'health': 'Health',
    'innovation & tech': 'Innovation & Tech', 
    'environment & sustainability': 'Environment & Sustainability',
    'education': 'Education',
    'science & space': 'Science & Space',
    'humanitarian & rescue': 'Humanitarian & Rescue',
    'blindspot': 'Blindspot'
  };
  
  const exactCategory = exactMatches[category.toLowerCase()];
  
  if (exactCategory) {
    return data.filter(article => 
      article.category && article.category === exactCategory
    );
  }
  
  // Fallback to partial matching
  return data.filter(article => {
    if (!article.category) return false;
    const articleCategory = article.category.toLowerCase();
    return articleCategory.includes(category.toLowerCase()) || 
           category.toLowerCase().includes(articleCategory);
  });
};

// NEW: Force refresh function that bypasses all caches
export const forceRefreshData = async () => {
  try {
    console.log('🔄 Force refreshing all data...');
    
    // Clear local caches
    forceClearAllCaches();
    
    // Try to refresh materialized views
    try {
      await refreshMaterializedViews();
      console.log('✅ Materialized views refreshed');
    } catch (mvError) {
      console.warn('⚠️ Could not refresh materialized views:', mvError);
    }
    
    // Fetch fresh data bypassing all caches
    const freshData = await fetchHomepageDataFallback(true); // Force bypass cache
    
    console.log('✅ Fresh data fetched:', {
      trending: freshData.trending?.length || 0,
      dailyReads: freshData.dailyReads?.length || 0,
      blindspot: freshData.blindspot?.length || 0
    });
    
    return freshData;
  } catch (error) {
    console.error('❌ Failed to force refresh:', error);
    throw error;
  }
};

// ENHANCED: React hook with performance optimizations
export const useHomepageData = () => {
  const [data, setData] = useState({
    trending: [],
    dailyReads: [],
    blindspot: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async (bypassCache = false) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🏠 Fetching optimized homepage data...');
      const startTime = performance.now();
      
      const result = bypassCache ? 
        await forceRefreshData() : 
        await fetchHomepageData();
      
      const endTime = performance.now();
      console.log(`⚡ Total homepage fetch time: ${(endTime - startTime).toFixed(2)}ms`);
      
      console.log('📊 Homepage data result:', {
        trending: result.trending?.length || 0,
        dailyReads: result.dailyReads?.length || 0, 
        blindspot: result.blindspot?.length || 0
      });
      
      setData(result);
      
    } catch (err) {
      console.error('❌ Homepage data fetch error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    
    // Reduced refresh interval for fresher data
    const interval = setInterval(() => fetchData(false), 10 * 60 * 1000); // 10 minutes
    return () => clearInterval(interval);
  }, [fetchData]);

  return { 
    data, 
    loading, 
    error, 
    refetch: () => fetchData(false),
    forceRefresh: () => fetchData(true) // NEW: Force refresh bypassing cache
  };
};

// Utility functions
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

// Manual refresh function for materialized views
export const refreshMaterializedViews = async () => {
  try {
    const { data, error } = await supabase.rpc('refresh_homepage_views');
    
    if (error) throw error;
    
    console.log('🔄 Materialized views refreshed:', data);
    return { success: true, message: data };
  } catch (error) {
    console.error('❌ Failed to refresh materialized views:', error);
    return { success: false, error: error.message };
  }
};
