// Complete news-api.js with time-based filtering and no duplicate exports
import { supabase } from './supa.js';
import { placeholderArticles, getAllStories } from './placeholder-data.js';
import { useState, useEffect, useCallback } from 'react';
import { cleanTitle, cleanSummary, cleanContent } from './utils.js';

const LAST_FETCHED_KEY = 'newsLastFetched';
const NEWS_CACHE_KEY = 'newsCache';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// === TIME-BASED FILTERING CONFIGURATION ===
const TIME_FILTERS = {
  viral: 24 * 60 * 60 * 1000, // 24 hours for viral content
  regular: 36 * 60 * 60 * 1000 // 36 hours for regular categories
};

// Category mappings
const CATEGORY_MAPPINGS = {
  'all': ['Health', 'Innovation & Tech', 'Environment & Sustainability', 'Education', 'Science & Space', 'Humanitarian & Rescue', 'Blindspot', 'Viral'],
  'health': ['Health'],
  'innovation & tech': ['Innovation & Tech'],
  'environment & sustainability': ['Environment & Sustainability'], 
  'education': ['Education'],
  'science & space': ['Science & Space'],
  'humanitarian & rescue': ['Humanitarian & Rescue'],
  'blindspot': ['Blindspot'],
  'viral': ['Viral']
};

// === TIME-BASED FILTERING FUNCTION ===
const applyTimeBasedFilter = (articles) => {
  const now = new Date();
  
  return articles.filter(article => {
    if (!article.created_at && !article.published_at) {
      return true; // Keep articles without timestamps
    }
    
    const articleDate = new Date(article.created_at || article.published_at);
    const articleAge = now.getTime() - articleDate.getTime();
    
    // Apply different time filters based on category
    if (article.category === 'Viral') {
      const isWithinViralWindow = articleAge <= TIME_FILTERS.viral;
      if (!isWithinViralWindow) {
        console.log(`🔥 Filtering out old viral article: ${article.title?.slice(0, 50)}... (${Math.round(articleAge / (1000 * 60 * 60))}h old)`);
      }
      return isWithinViralWindow;
    } else {
      const isWithinRegularWindow = articleAge <= TIME_FILTERS.regular;
      if (!isWithinRegularWindow) {
        console.log(`📰 Filtering out old regular article: ${article.title?.slice(0, 50)}... (${Math.round(articleAge / (1000 * 60 * 60))}h old)`);
      }
      return isWithinRegularWindow;
    }
  });
};

// Force clear all caches
export const forceClearAllCaches = () => {
  if (typeof window !== 'undefined') {
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith(NEWS_CACHE_KEY) || key.startsWith(LAST_FETCHED_KEY)) {
        localStorage.removeItem(key);
      }
    });
    console.log('🧹 All news caches cleared (including time-filtered caches)');
  }
};

// === ENHANCED MAIN NEWS FETCHER WITH TIME FILTERING ===
export const fetchNews = async (category = 'All', retryCount = 0, bypassCache = false) => {
  const now = Date.now();
  const isBrowser = typeof window !== 'undefined';
  const maxRetries = 3;

  console.log(`🔍 Fetching news for category: "${category}" with time filtering`);

  // Normalize category
  let decodedCategory = category;
  try {
    decodedCategory = decodeURIComponent(category);
  } catch (e) {
    console.warn('Failed to decode category:', e);
  }
  
  const normalizedCategory = decodedCategory.toLowerCase().trim();

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
        // Apply time filtering to cached data too
        const timeFilteredCache = applyTimeBasedFilter(parsedCache);
        console.log(`⏰ After time filtering: ${timeFilteredCache.length} articles`);
        return timeFilteredCache;
      }
    } catch (e) {
      console.warn('⚠️ Failed to parse local cache:', e);
    }
  }

  try {
    // === ENHANCED QUERY WITH TIME-BASED PRE-FILTERING ===
    const viralCutoff = new Date(now - TIME_FILTERS.viral).toISOString();
    const regularCutoff = new Date(now - TIME_FILTERS.regular).toISOString();
    
    let query = supabase
      .from('news')
      .select(`
        id, title, url, summary, content, published_at, created_at,
        category, author, image_url, thumbnail_url, source_name,
        positivity_score, virality_score, is_ad, sentiment
      `)
      .eq('is_ad', false)
      .eq('sentiment', 'positive')
      .gte('positivity_score', 6);

    // Apply category filter if not 'all'
    if (normalizedCategory && normalizedCategory !== 'all') {
      const exactMatches = {
        'health': 'Health',
        'innovation & tech': 'Innovation & Tech',
        'environment & sustainability': 'Environment & Sustainability',
        'education': 'Education',
        'science & space': 'Science & Space',
        'humanitarian & rescue': 'Humanitarian & Rescue',
        'blindspot': 'Blindspot',
        'viral': 'Viral'
      };
      
      const exactCategory = exactMatches[normalizedCategory];
      
      if (exactCategory) {
        console.log(`🎯 Using exact category match: "${exactCategory}"`);
        query = query.eq('category', exactCategory);
        
        // Apply time-based filtering at database level for better performance
        if (exactCategory === 'Viral') {
          query = query.gte('created_at', viralCutoff);
          console.log(`🔥 Applying 24-hour filter for viral content (since ${viralCutoff})`);
        } else {
          query = query.gte('created_at', regularCutoff);
          console.log(`📰 Applying 36-hour filter for regular content (since ${regularCutoff})`);
        }
      } else {
        query = query.ilike('category', `%${decodedCategory}%`);
        query = query.gte('created_at', regularCutoff); // Default to regular filter
      }
    } else {
      // For 'all' categories, use a compound filter
      console.log(`📰 Fetching ALL categories with time-based filtering`);
      query = query.or(`and(category.eq.Viral,created_at.gte.${viralCutoff}),and(category.neq.Viral,created_at.gte.${regularCutoff})`);
    }

    // Order by relevance and recency
    query = query
      .order('positivity_score', { ascending: false })
      .order('published_at', { ascending: false })
      .limit(50);

    const { data, error } = await query;

    if (error) throw new Error(`Supabase error: ${error.message}`);

    if (data && data.length > 0) {
      console.log(`✅ Fetched ${data.length} articles for category: ${category}`);
      
      // Apply additional client-side time filtering as backup
      const timeFilteredData = applyTimeBasedFilter(data);
      console.log(`⏰ After client-side time filtering: ${timeFilteredData.length} articles`);
      
      // Clean and process data
      const processedData = timeFilteredData.map(item => ({
        ...item,
        title: cleanTitle(item.title),
        summary: cleanSummary(item.summary),
        content: cleanContent(item.content),
        virality_score: item.virality_score || (item.positivity_score > 9 ? 8 : 0),
        // Add age indicator for debugging
        age_hours: Math.round((now - new Date(item.created_at || item.published_at).getTime()) / (1000 * 60 * 60))
      }));

      // Cache the processed data
      if (!bypassCache && isBrowser) {
        try {
          localStorage.setItem(NEWS_CACHE_KEY + '_' + normalizedCategory, JSON.stringify(processedData));
          localStorage.setItem(LAST_FETCHED_KEY + '_' + normalizedCategory, now.toString());
          console.log(`💾 Cached ${processedData.length} time-filtered articles for ${category}`);
        } catch (e) {
          console.warn('⚠️ Failed to cache news:', e);
        }
      }
      
      return processedData;
    }

    console.warn(`⚠️ No recent news data for category: ${category}`);
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

// === TIME-FILTERED INDIVIDUAL SECTION FETCHERS ===
export const fetchTrendingNewsTimeFiltered = async (limit = 15, bypassCache = false) => {
  try {
    console.log('🔥 Fetching time-filtered trending stories...');
    
    const now = Date.now();
    const viralCutoff = new Date(now - TIME_FILTERS.viral).toISOString();
    const regularCutoff = new Date(now - TIME_FILTERS.regular).toISOString();
    
    // Query with time-based filtering
    const { data, error } = await supabase
      .from('news')
      .select(`
        id, title, url, summary, content, image_url, thumbnail_url,
        category, published_at, created_at, positivity_score, virality_score, author, source_name
      `)
      .eq('is_ad', false)
      .eq('sentiment', 'positive')
      .gte('positivity_score', 6)
      .or(`and(category.eq.Viral,created_at.gte.${viralCutoff}),and(category.neq.Viral,created_at.gte.${regularCutoff})`)
      .order('virality_score', { ascending: false })
      .order('positivity_score', { ascending: false })
      .order('published_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    
    const timeFilteredData = applyTimeBasedFilter(data || []);
    console.log(`🔥 Time-filtered trending stories: ${timeFilteredData.length}`);
    
    return timeFilteredData.map(item => ({
      ...item,
      title: cleanTitle(item.title),
      summary: cleanSummary(item.summary),
      content: cleanContent(item.content)
    }));

  } catch (error) {
    console.error('❌ fetchTrendingNewsTimeFiltered error:', error);
    return [];
  }
};

export const fetchDailyReadsTimeFiltered = async (limit = 10, bypassCache = false) => {
  try {
    console.log('📰 Fetching time-filtered daily reads...');
    
    const now = Date.now();
    const regularCutoff = new Date(now - TIME_FILTERS.regular).toISOString();
    
    const categories = ['Health', 'Innovation & Tech', 'Environment & Sustainability', 'Education', 'Science & Space', 'Humanitarian & Rescue'];
    const dailyReads = [];
    
    for (const category of categories) {
      const { data } = await supabase
        .from('news')
        .select(`
          id, title, url, summary, content, image_url, thumbnail_url,
          category, published_at, created_at, positivity_score, author, source_name
        `)
        .eq('category', category)
        .eq('is_ad', false)
        .eq('sentiment', 'positive')
        .gte('positivity_score', 6)
        .gte('created_at', regularCutoff) // 36-hour filter
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
    
    console.log(`📰 Time-filtered daily reads: ${dailyReads.length} stories`);
    return dailyReads;

  } catch (error) {
    console.error('❌ fetchDailyReadsTimeFiltered error:', error);
    return [];
  }
};

export const fetchBlindspotStoriesTimeFiltered = async (limit = 8, bypassCache = false) => {
  try {
    console.log('🔍 Fetching time-filtered blindspot stories...');
    
    const now = Date.now();
    const regularCutoff = new Date(now - TIME_FILTERS.regular).toISOString();
    
    let { data, error } = await supabase
      .from('news')
      .select(`
        id, title, url, summary, content, image_url, thumbnail_url,
        category, published_at, created_at, positivity_score, author, source_name
      `)
      .or('category.eq.Blindspot,is_blindspot.eq.true')
      .eq('is_ad', false)
      .eq('sentiment', 'positive')
      .gte('created_at', regularCutoff) // 36-hour filter
      .order('positivity_score', { ascending: false })
      .order('published_at', { ascending: false })
      .limit(limit);

    if (error || !data || data.length === 0) {
      console.warn('⚠️ No time-filtered Blindspot data, using Humanitarian as fallback');
      
      ({ data } = await supabase
        .from('news')
        .select(`
          id, title, url, summary, content, image_url, thumbnail_url,
          category, published_at, created_at, positivity_score, author, source_name
        `)
        .eq('category', 'Humanitarian & Rescue')
        .eq('is_ad', false)
        .eq('sentiment', 'positive')
        .gte('positivity_score', 6)
        .gte('created_at', regularCutoff) // 36-hour filter
        .order('positivity_score', { ascending: false })
        .limit(limit)
      );
    }

    const timeFilteredData = applyTimeBasedFilter(data || []);
    console.log(`🔍 Time-filtered blindspot stories: ${timeFilteredData.length}`);
    
    return timeFilteredData.map(item => ({
      ...item,
      title: cleanTitle(item.title),
      summary: cleanSummary(item.summary),
      content: cleanContent(item.content)
    }));

  } catch (error) {
    console.error('❌ fetchBlindspotStoriesTimeFiltered error:', error);
    return [];
  }
};

// === ENHANCED HOMEPAGE DATA WITH TIME FILTERING ===
export const fetchHomepageData = async (bypassCache = false) => {
  try {
    console.log('🚀 Fetching homepage data with time-based filtering...');
    
    const startTime = performance.now();
    
    // Fallback to individual queries with time filtering
    const [trending, dailyReads, blindspot] = await Promise.all([
      fetchTrendingNewsTimeFiltered(15, bypassCache),
      fetchDailyReadsTimeFiltered(10, bypassCache), 
      fetchBlindspotStoriesTimeFiltered(8, bypassCache)
    ]);

    const endTime = performance.now();
    console.log(`⚡ Total homepage fetch time: ${(endTime - startTime).toFixed(2)}ms`);
    console.log(`📊 Time-filtered results: ${trending.length} trending, ${dailyReads.length} daily, ${blindspot.length} blindspot`);
    
    return { 
      trending: trending || [], 
      dailyReads: dailyReads || [], 
      blindspot: blindspot || [] 
    };
  } catch (error) {
    console.error('❌ Error in homepage fetch:', error);
    return {
      trending: [],
      dailyReads: [],
      blindspot: []
    };
  }
};

// === ENHANCED FORCE REFRESH WITH TIME FILTERING ===
export const forceRefreshData = async () => {
  try {
    console.log('🔄 Force refreshing all data with time-based filtering...');
    
    forceClearAllCaches();
    
    // Refresh materialized views if available
    try {
      await refreshMaterializedViews();
      console.log('✅ Materialized views refreshed');
    } catch (mvError) {
      console.warn('⚠️ Could not refresh materialized views:', mvError);
    }
    
    const freshData = await fetchHomepageData(true);
    
    console.log('✅ Fresh time-filtered data fetched:', {
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

// === ENHANCED REACT HOOKS WITH TIME FILTERING ===
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
      
      console.log('🏠 Fetching time-filtered homepage data...');
      const startTime = performance.now();
      
      const result = bypassCache ? 
        await forceRefreshData() : 
        await fetchHomepageData();
      
      const endTime = performance.now();
      console.log(`⚡ Total time-filtered homepage fetch: ${(endTime - startTime).toFixed(2)}ms`);
      
      console.log('📊 Time-filtered homepage result:', {
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
    
    // Auto-refresh more frequently to handle time-based filtering
    const interval = setInterval(() => fetchData(false), 8 * 60 * 1000); // Every 8 minutes
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

export const useCategoryNews = (category = 'All') => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async (bypassCache = false) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log(`🎯 Fetching time-filtered category news: ${category}`);
      const result = await fetchNews(category, 0, bypassCache);
      
      console.log(`📊 Time-filtered category ${category} result: ${result.length} articles`);
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
    
    // Auto-refresh more frequently for time-sensitive content
    const interval = setInterval(() => fetchData(false), 10 * 60 * 1000); // Every 10 minutes
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

// === UTILITY FUNCTIONS ===
export const checkNewsHealth = async () => {
  try {
    const { data, error } = await supabase
      .from('news')
      .select('id, created_at, category')
      .limit(10);

    const now = Date.now();
    const recentCount = data?.filter(article => {
      const articleAge = now - new Date(article.created_at).getTime();
      return articleAge <= TIME_FILTERS.regular;
    }).length || 0;

    return {
      status: error ? 'error' : 'healthy',
      error: error?.message || null,
      total_articles: data?.length || 0,
      recent_articles: recentCount,
      time_filtering_active: true,
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
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith(NEWS_CACHE_KEY) || key.startsWith(LAST_FETCHED_KEY)) {
        localStorage.removeItem(key);
      }
    });
    console.log('🧹 All time-filtered category caches cleared');
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

// === BACKWARD COMPATIBILITY EXPORTS ===
// These maintain the original function names that App.jsx expects
export const fetchTrendingNews = fetchTrendingNewsTimeFiltered;
export const fetchDailyReads = fetchDailyReadsTimeFiltered; 
export const fetchBlindspotStories = fetchBlindspotStoriesTimeFiltered;

// Export the time filter configuration
export { TIME_FILTERS };
