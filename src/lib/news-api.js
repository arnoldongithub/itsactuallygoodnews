// Fixed news-api.js with working categories
import { supabase } from './supa.js';
import { placeholderArticles, getAllStories } from './placeholder-data.js';
import { useState, useEffect, useCallback } from 'react';
import { cleanTitle, cleanSummary, cleanContent } from './utils.js';

const LAST_FETCHED_KEY = 'newsLastFetched';
const NEWS_CACHE_KEY = 'newsCache';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// CRITICAL FIX: Category mapping that matches your database exactly
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

// NEW: Force clear all caches (updated for category-specific caches)
export const forceClearAllCaches = () => {
  if (typeof window !== 'undefined') {
    // Clear all category-specific caches
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith(NEWS_CACHE_KEY) || key.startsWith(LAST_FETCHED_KEY)) {
        localStorage.removeItem(key);
      }
    });
    console.log('🧹 All news caches cleared (including category-specific caches)');
  }
};

// FIXED: Main category-specific news fetcher
export const fetchNews = async (category = 'All', retryCount = 0, bypassCache = false) => {
  const now = Date.now();
  const isBrowser = typeof window !== 'undefined';
  const maxRetries = 3;

  console.log(`🔍 Fetching news for category: "${category}" (bypass cache: ${bypassCache})`);

  // Normalize category
  let decodedCategory = category;
  try {
    decodedCategory = decodeURIComponent(category);
  } catch (e) {
    console.warn('Failed to decode category:', e);
  }
  
  const normalizedCategory = decodedCategory.toLowerCase().trim();
  console.log(`🎯 Normalized category: "${normalizedCategory}"`);

  // Check cache
  let lastFetched, cachedNews;
  if (isBrowser && !bypassCache) {
    lastFetched = localStorage.getItem(LAST_FETCHED_KEY + '_' + normalizedCategory);
    cachedNews = localStorage.getItem(NEWS_CACHE_KEY + '_' + normalizedCategory);
  }

  if (!bypassCache && isBrowser && lastFetched && cachedNews && now - parseInt(lastFetched, 10) < CACHE_DURATION) {
    try {
      const parsedCache = JSON.parse(cachedNews);
      if (parsedCache.length > 0) {
        console.log(`📚 Using cached data for ${category}: ${parsedCache.length} articles`);
        return parsedCache;
      }
    } catch (e) {
      console.warn('⚠️ Failed to parse local cache:', e);
    }
  }

  try {
    let query = supabase
      .from('news')
      .select(`
        id, title, url, summary, content, published_at, created_at,
        category, author, image_url, thumbnail_url, source_name,
        positivity_score, virality_score, is_ad, sentiment
      `)
      .eq('is_ad', false)
      .eq('sentiment', 'positive')
      .gte('positivity_score', 6)
      .order('positivity_score', { ascending: false })
      .order('published_at', { ascending: false })
      .limit(50);

    // CRITICAL FIX: Apply category filter ONLY if not 'all'
    if (normalizedCategory && normalizedCategory !== 'all') {
      console.log(`🔍 Applying category filter: "${normalizedCategory}"`);
      
      // Direct exact match first
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
        console.log(`🎯 Using exact category match: "${exactCategory}"`);
        query = query.eq('category', exactCategory);
      } else {
        // Fallback to partial matching
        console.log(`🔍 Using partial match for: "${decodedCategory}"`);
        query = query.ilike('category', `%${decodedCategory}%`);
      }
    } else {
      console.log(`📰 Fetching ALL categories`);
    }

    const { data, error } = await query;

    if (error) throw new Error(`Supabase error: ${error.message}`);

    if (data && data.length > 0) {
      console.log(`✅ Fetched ${data.length} articles for category: ${category}`);
      
      // Clean and process data
      const processedData = data.map(item => ({
        ...item,
        title: cleanTitle(item.title),
        summary: cleanSummary(item.summary),
        content: cleanContent(item.content),
        virality_score: item.virality_score || (item.positivity_score > 9 ? 8 : 0)
      }));

      // Cache per category
      if (!bypassCache && isBrowser) {
        try {
          localStorage.setItem(NEWS_CACHE_KEY + '_' + normalizedCategory, JSON.stringify(processedData));
          localStorage.setItem(LAST_FETCHED_KEY + '_' + normalizedCategory, now.toString());
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

// HOMEPAGE DATA (unchanged - for homepage only)
export const fetchHomepageData = async (bypassCache = false) => {
  try {
    console.log('🚀 Using optimized homepage data fetch...');
    
    const startTime = performance.now();
    
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
    return {
      trending: [],
      dailyReads: [],
      blindspot: []
    };
  }
};

// Individual section fetchers (for homepage only)
export const fetchTrendingNews = async (limit = 15, bypassCache = false) => {
  try {
    console.log('🔥 Fetching trending stories...');
    
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

    const fromTime = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();

    const { data, error } = await supabase
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

export const fetchDailyReads = async (limit = 10, bypassCache = false) => {
  try {
    console.log('📰 Fetching daily reads...');
    
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

export const fetchBlindspotStories = async (limit = 8, bypassCache = false) => {
  try {
    console.log('🔍 Fetching blindspot stories...');
    
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

// Force refresh function
export const forceRefreshData = async () => {
  try {
    console.log('🔄 Force refreshing all data...');
    
    forceClearAllCaches();
    
    try {
      await refreshMaterializedViews();
      console.log('✅ Materialized views refreshed');
    } catch (mvError) {
      console.warn('⚠️ Could not refresh materialized views:', mvError);
    }
    
    const freshData = await fetchHomepageDataFallback(true);
    
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

// React hook for homepage
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
    
    const interval = setInterval(() => fetchData(false), 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchData]);

  return { 
    data, 
    loading, 
    error, 
    refetch: () => fetchData(false),
    forceRefresh: () => fetchData(true)
  };
};

// NEW: React hook for category-specific news
export const useCategoryNews = (category = 'All') => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async (bypassCache = false) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log(`🎯 Fetching category news: ${category}`);
      const result = await fetchNews(category, 0, bypassCache);
      
      console.log(`📊 Category ${category} result: ${result.length} articles`);
      setData(result);
      
    } catch (err) {
      console.error(`❌ Category ${category} fetch error:`, err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [category]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { 
    data, 
    loading, 
    error, 
    refetch: () => fetchData(false),
    forceRefresh: () => fetchData(true)
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
    // Clear all category caches
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith(NEWS_CACHE_KEY) || key.startsWith(LAST_FETCHED_KEY)) {
        localStorage.removeItem(key);
      }
    });
    console.log('🧹 All category caches cleared');
  }
};

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
