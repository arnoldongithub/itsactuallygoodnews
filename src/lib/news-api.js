// OPTIMIZED: Updated to use the new optimized Supabase functions
import { supabase } from './supa.js';
import { placeholderArticles, getAllStories } from './placeholder-data.js';
import { useState, useEffect, useCallback } from 'react';

const LAST_FETCHED_KEY = 'newsLastFetched';
const NEWS_CACHE_KEY = 'newsCache';
const CACHE_DURATION = 15 * 60 * 1000; // Reduced to 15 minutes for fresher content

// Enhanced category mappings - FIXED to match database categories exactly
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

// === OPTIMIZED: Primary function using the new optimized schema ===
export const fetchHomepageData = async () => {
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
    return await fetchHomepageDataDirect();
  } catch (error) {
    console.error('❌ Error in optimized fetch:', error);
    return await fetchHomepageDataDirect();
  }
};

// FALLBACK: Direct function if materialized views fail
const fetchHomepageDataDirect = async () => {
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
    return await fetchHomepageDataFallback();
  } catch (error) {
    console.error('❌ Error in direct fetch:', error);
    return await fetchHomepageDataFallback();
  }
};

// LAST RESORT: Individual queries fallback
const fetchHomepageDataFallback = async () => {
  try {
    console.log('🔄 Using fallback individual queries...');
    
    const [trending, dailyReads, blindspot] = await Promise.all([
      fetchTrendingNews(15),
      fetchDailyReads(10), 
      fetchBlindspotStories(8)
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
export const fetchTrendingNews = async (limit = 15) => {
  try {
    console.log('🔥 Fetching trending stories...');
    
    // Try materialized view first
    const { data: mvData } = await supabase
      .from('mv_trending_news')
      .select('*')
      .limit(limit);
      
    if (mvData && mvData.length > 0) {
      console.log(`🔥 Trending from materialized view: ${mvData.length}`);
      return mvData;
    }

    // Fallback to direct query
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
    return data || [];

  } catch (error) {
    console.error('❌ fetchTrendingStories error:', error);
    return [];
  }
};

// OPTIMIZED: Daily reads with materialized view fallback
export const fetchDailyReads = async (limit = 10) => {
  try {
    console.log('📰 Fetching daily reads...');
    
    // Try materialized view first
    const { data: mvData } = await supabase
      .from('mv_daily_reads')
      .select('*')
      .limit(limit);
      
    if (mvData && mvData.length > 0) {
      console.log(`📰 Daily reads from materialized view: ${mvData.length}`);
      return mvData;
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
        dailyReads.push(data[0]);
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
export const fetchBlindspotStories = async (limit = 8) => {
  try {
    console.log('🔍 Fetching blindspot stories...');
    
    // Try materialized view first
    const { data: mvData } = await supabase
      .from('mv_blindspot_reads')
      .select('*')
      .limit(limit);
      
    if (mvData && mvData.length > 0) {
      console.log(`🔍 Blindspot from materialized view: ${mvData.length}`);
      return mvData;
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
    return data || [];

  } catch (error) {
    console.error('❌ fetchBlindspotStories error:', error);
    return [];
  }
};

// FIXED: Category filtering with exact database matching
export const fetchNews = async (category = 'All', retryCount = 0) => {
  const now = Date.now();
  const isBrowser = typeof window !== 'undefined';
  const maxRetries = 3;

  console.log(`🔍 Fetching news for category: "${category}"`);

  let lastFetched, cachedNews;
  if (isBrowser) {
    lastFetched = localStorage.getItem(LAST_FETCHED_KEY);
    cachedNews = localStorage.getItem(NEWS_CACHE_KEY);
  }

  const decodedCategory = decodeURIComponent(category);
  const normalizedCategory = decodedCategory.toLowerCase().trim();

  // Check cache first (reduced cache time for fresher content)
  if (isBrowser && lastFetched && cachedNews && now - parseInt(lastFetched, 10) < CACHE_DURATION) {
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
      .limit(50); // Reduced limit for better performance

    // FIXED: Proper category filtering
    if (normalizedCategory && normalizedCategory !== 'all') {
      const categoryMappings = CATEGORY_MAPPINGS[normalizedCategory];
      if (categoryMappings && categoryMappings.length > 0) {
        query = query.in('category', categoryMappings);
        console.log(`🎯 Filtering by categories: ${categoryMappings.join(', ')}`);
      } else {
        query = query.ilike('category', `%${decodedCategory}%`);
        console.log(`🔍 Using partial match for: ${decodedCategory}`);
      }
    }

    const { data, error } = await query;

    if (error) throw new Error(`Supabase error: ${error.message}`);

    if (data && data.length > 0) {
      console.log(`✅ Fetched ${data.length} articles for category: ${category}`);
      
      const processedData = data.map(item => ({
        ...item,
        virality_score: item.virality_score || (item.positivity_score > 9 ? 8 : 0)
      }));

      // Cache with shorter duration
      if (isBrowser) {
        try {
          localStorage.setItem(NEWS_CACHE_KEY, JSON.stringify(processedData));
          localStorage.setItem(LAST_FETCHED_KEY, now.toString());
        } catch (e) {
          console.warn('⚠️ Failed to cache news:', e);
        }
      }
      
      return processedData;
    }

    console.warn('⚠️ No news data from API, using placeholder data');
    
  } catch (error) {
    console.error(`❌ Error fetching news (attempt ${retryCount + 1}):`, error);
    
    if (retryCount < maxRetries) {
      await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
      return fetchNews(category, retryCount + 1);
    }
  }

  // Final fallback to placeholder data
  console.log('🔄 Using placeholder data');
  try {
    const fallbackData = getAllStories ? getAllStories() : placeholderArticles;
    return filterByCategory(fallbackData, normalizedCategory);
  } catch (placeholderError) {
    return [];
  }
};

// FIXED: Category filtering helper
const filterByCategory = (data, category) => {
  if (!category || category === 'all') return data;
  
  const categoryMappings = CATEGORY_MAPPINGS[category.toLowerCase()];
  
  if (categoryMappings && categoryMappings.length > 0) {
    return data.filter(article => 
      article.category && categoryMappings.includes(article.category)
    );
  }
  
  return data.filter(article => {
    if (!article.category) return false;
    const articleCategory = article.category.toLowerCase();
    return articleCategory.includes(category.toLowerCase()) || 
           category.toLowerCase().includes(articleCategory);
  });
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

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🏠 Fetching optimized homepage data...');
      const startTime = performance.now();
      
      const result = await fetchHomepageData();
      
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
    
    // Reduced refresh interval to match materialized view refresh
    const interval = setInterval(fetchData, 20 * 60 * 1000); // 20 minutes
    return () => clearInterval(interval);
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
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
