// FIXED: Proper import from supa.js
import { supabase } from './supa.js';
import { placeholderArticles, getAllStories } from './placeholder-data.js';
import { useState, useEffect, useCallback } from 'react';

const LAST_FETCHED_KEY = 'newsLastFetched';
const NEWS_CACHE_KEY = 'newsCache';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

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

// === ENHANCED: Single optimized call for homepage data ===
export const fetchHomepageData = async () => {
  try {
    console.log('🔄 Fetching homepage data...');
    
    // Try database function first
    const { data, error } = await supabase.rpc('get_homepage_data');
    
    if (!error && data && data.trending?.length > 0) {
      console.log('✅ Got data from RPC function');
      return {
        trending: data.trending || [],
        dailyReads: data.daily_reads || [],
        blindspot: data.blindspot || []
      };
    }
    
    console.warn('⚠️ RPC function failed or empty, using fallback queries');
    return await fetchHomepageDataFallback();
  } catch (error) {
    console.error('❌ Error in fetchHomepageData:', error);
    return await fetchHomepageDataFallback();
  }
};

// ENHANCED fallback with better filtering
const fetchHomepageDataFallback = async () => {
  try {
    console.log('🔄 Using fallback individual queries...');
    
    const [trending, dailyReads, blindspot] = await Promise.all([
      fetchTrendingNews(20),
      fetchDailyReads(15), 
      fetchBlindspotStories(10)
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

// ENHANCED: Trending with viral content
export const fetchTrendingNews = async (limit = 20) => {
  try {
    console.log('🔥 Fetching trending stories...');
    
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
      .gte('positivity_score', 6) // Only high-quality content
      .order('virality_score', { ascending: false })
      .order('positivity_score', { ascending: false })
      .order('published_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    if (!data || data.length === 0) {
      console.warn('⚠️ No recent trending data, trying without time restriction');
      // Try without time restriction
      const { data: fallbackData } = await supabase
        .from('news')
        .select(`
          id, title, url, summary, content, image_url, thumbnail_url,
          category, published_at, positivity_score, virality_score, author, source_name
        `)
        .eq('is_ad', false)
        .eq('sentiment', 'positive')
        .gte('positivity_score', 7)
        .order('positivity_score', { ascending: false })
        .limit(limit);
      
      console.log(`📈 Fallback trending: ${fallbackData?.length || 0} stories`);
      return fallbackData || [];
    }

    console.log(`🔥 Trending stories: ${data.length}`);
    return data;

  } catch (error) {
    console.error('❌ fetchTrendingStories error:', error);
    return [];
  }
};

// ENHANCED: Daily reads with category diversity
export const fetchDailyReads = async (limit = 15) => {
  try {
    console.log('📰 Fetching daily reads...');
    
    // Try to get one story from each category
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
        .limit(2); // Get 2 per category, pick best one
      
      if (data && data.length > 0) {
        dailyReads.push(data[0]); // Take the best one from each category
      }
    }
    
    console.log(`📰 Daily reads: ${dailyReads.length} stories`);
    return dailyReads;

  } catch (error) {
    console.error('❌ fetchDailyReads error:', error);
    return [];
  }
};

// ENHANCED: Blindspot with proper fallback
export const fetchBlindspotStories = async (limit = 10) => {
  try {
    console.log('🔍 Fetching blindspot stories...');
    
    // First try to get actual Blindspot category stories
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
      
      // Fallback to Humanitarian & Rescue stories
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

  // Check cache first
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
    // Build query with proper category filtering
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
      .limit(100);

    // FIXED: Proper category filtering
    if (normalizedCategory && normalizedCategory !== 'all') {
      const categoryMappings = CATEGORY_MAPPINGS[normalizedCategory];
      if (categoryMappings && categoryMappings.length > 0) {
        // Use exact category matching
        query = query.in('category', categoryMappings);
        console.log(`🎯 Filtering by categories: ${categoryMappings.join(', ')}`);
      } else {
        // Fallback to partial matching
        query = query.ilike('category', `%${decodedCategory}%`);
        console.log(`🔍 Using partial match for: ${decodedCategory}`);
      }
    }

    const { data, error } = await query;

    if (error) throw new Error(`Supabase error: ${error.message}`);

    if (data && data.length > 0) {
      console.log(`✅ Fetched ${data.length} articles for category: ${category}`);
      
      // Process and cache data
      const processedData = data.map(item => ({
        ...item,
        virality_score: item.virality_score || (item.positivity_score > 9 ? 8 : 0)
      }));

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
    // Use exact category matching
    return data.filter(article => 
      article.category && categoryMappings.includes(article.category)
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

// Export other utility functions
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

// ENHANCED: React hook with better error handling
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
      
      console.log('🏠 Fetching homepage data...');
      const result = await fetchHomepageData();
      
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
    
    // Optional: Refresh every 15 minutes
    const interval = setInterval(fetchData, 15 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
};
