// Optimized news-api.js - Updated with correct categories
import { supabase } from './supa.js';
import { placeholderArticles } from './placeholder-data.js';
import { useState, useEffect, useCallback } from 'react';
import { cleanTitle, cleanSummary, cleanContent } from './utils.js';

const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes
const CACHE_KEY = 'newsCache';
const LAST_FETCHED_KEY = 'newsLastFetched';

// Updated categories matching Header.jsx
const VALID_CATEGORIES = [
  'Movement Tracker + Accountability',
  'Capitalism & Inequality Watch', 
  'Justice Lens',
  'Hope in Struggle',
  'AI Watch'
];

// Simplified time filtering - only recent articles (last 48 hours)
const isRecentArticle = (article) => {
  if (!article.created_at && !article.published_at) return true;
  
  const articleDate = new Date(article.created_at || article.published_at);
  const hoursSincePublished = (Date.now() - articleDate.getTime()) / (1000 * 60 * 60);
  
  return hoursSincePublished <= 48; // 48 hours max
};

// Cache utilities
const getCache = (key) => {
  if (typeof window === 'undefined') return null;
  try {
    const cached = localStorage.getItem(key);
    const lastFetched = localStorage.getItem(LAST_FETCHED_KEY);
    
    if (cached && lastFetched) {
      const age = Date.now() - parseInt(lastFetched);
      if (age < CACHE_DURATION) {
        return JSON.parse(cached);
      }
    }
  } catch (e) {
    console.warn('Cache read error:', e);
  }
  return null;
};

const setCache = (key, data) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(data));
    localStorage.setItem(LAST_FETCHED_KEY, Date.now().toString());
  } catch (e) {
    console.warn('Cache write error:', e);
  }
};

// MAIN OPTIMIZED DATA FETCHER - Single API call for all data
export const fetchAllNewsData = async (bypassCache = false) => {
  const cacheKey = `${CACHE_KEY}_all`;
  
  // Check cache first
  if (!bypassCache) {
    const cached = getCache(cacheKey);
    if (cached) {
      console.log('Using cached data:', cached.total, 'articles');
      return cached;
    }
  }

  try {
    console.log('Fetching all news data...');
    const startTime = performance.now();

    // Single optimized query for ALL data
    const { data, error } = await supabase
      .from('news')
      .select(`
        id, title, url, summary, content, published_at, created_at,
        category, author, image_url, thumbnail_url, source_name,
        positivity_score, virality_score, is_ad, sentiment
      `)
      .eq('is_ad', false)
      .eq('sentiment', 'positive')
      .gte('positivity_score', 6)
      .gte('created_at', new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString()) // 48 hours
      .order('positivity_score', { ascending: false })
      .order('published_at', { ascending: false })
      .limit(100); // Reasonable limit

    if (error) throw error;

    const processedData = (data || [])
      .filter(isRecentArticle)
      .map(item => ({
        ...item,
        title: cleanTitle(item.title),
        summary: cleanSummary(item.summary),
        content: cleanContent(item.content),
        virality_score: item.virality_score || (item.positivity_score > 9 ? 8 : 0),
        // Normalize category to match new structure
        category: normalizeCategory(item.category)
      }));

    // Categorize data efficiently
    const result = {
      all: processedData,
      trending: processedData
        .filter(story => story.virality_score >= 7 || story.positivity_score >= 9)
        .slice(0, 15),
      dailyReads: getCategoryStories(processedData, VALID_CATEGORIES, 2), // 2 per category
      blindspot: processedData
        .filter(story => 
          story.category === 'Justice Lens' || 
          story.category === 'Hope in Struggle'
        )
        .slice(0, 8),
      categories: groupByCategory(processedData),
      total: processedData.length
    };

    // Cache the result
    setCache(cacheKey, result);

    const endTime = performance.now();
    console.log(`Fetched and processed ${result.total} articles in ${(endTime - startTime).toFixed(2)}ms`);

    return result;

  } catch (error) {
    console.error('Error fetching news:', error);
    
    // Return cached data as fallback
    const fallback = getCache(cacheKey);
    if (fallback) {
      console.log('Using stale cache as fallback');
      return fallback;
    }
    
    // Final fallback
    return {
      all: [],
      trending: [],
      dailyReads: [],
      blindspot: [],
      categories: {},
      total: 0
    };
  }
};

// Normalize old category names to new structure
const normalizeCategory = (oldCategory) => {
  if (!oldCategory) return 'Hope in Struggle';
  
  const categoryMap = {
    'Health': 'Hope in Struggle',
    'Innovation & Tech': 'AI Watch',
    'Environment & Sustainability': 'Hope in Struggle',
    'Education': 'Hope in Struggle',
    'Science & Space': 'AI Watch',
    'Humanitarian & Rescue': 'Hope in Struggle',
    'Blindspot': 'Justice Lens',
    'Viral': 'Hope in Struggle',
    // Keep new categories as-is
    'Movement Tracker + Accountability': 'Movement Tracker + Accountability',
    'Capitalism & Inequality Watch': 'Capitalism & Inequality Watch',
    'Justice Lens': 'Justice Lens',
    'Hope in Struggle': 'Hope in Struggle',
    'AI Watch': 'AI Watch'
  };
  
  return categoryMap[oldCategory] || 'Hope in Struggle';
};

// Helper function to get stories per category
const getCategoryStories = (stories, categories, perCategory = 2) => {
  const result = [];
  
  categories.forEach(category => {
    const categoryStories = stories
      .filter(story => story.category === category)
      .slice(0, perCategory);
    result.push(...categoryStories);
  });
  
  return result;
};

// Helper function to group stories by category
const groupByCategory = (stories) => {
  return stories.reduce((acc, story) => {
    const category = story.category || 'Hope in Struggle';
    if (!acc[category]) acc[category] = [];
    acc[category].push(story);
    return acc;
  }, {});
};

// SIMPLIFIED INDIVIDUAL FETCHERS (using cached data)
export const fetchTrendingNews = async (limit = 15) => {
  const allData = await fetchAllNewsData();
  return allData.trending.slice(0, limit);
};

export const fetchDailyReads = async (limit = 10) => {
  const allData = await fetchAllNewsData();
  return allData.dailyReads.slice(0, limit);
};

export const fetchBlindspotStories = async (limit = 8) => {
  const allData = await fetchAllNewsData();
  return allData.blindspot.slice(0, limit);
};

export const fetchNews = async (category = 'All', retryCount = 0, bypassCache = false) => {
  const allData = await fetchAllNewsData(bypassCache);
  
  if (!category || category.toLowerCase() === 'all') {
    return allData.all;
  }
  
  // Direct category match
  if (allData.categories[category]) {
    return allData.categories[category];
  }
  
  // Fuzzy search
  const normalizedCategory = category.toLowerCase().trim();
  return allData.all.filter(story => 
    story.category?.toLowerCase().includes(normalizedCategory) ||
    story.title?.toLowerCase().includes(normalizedCategory)
  );
};

// SIMPLIFIED HOMEPAGE DATA HOOK
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
      
      const allData = await fetchAllNewsData(bypassCache);
      
      setData({
        trending: allData.trending,
        dailyReads: allData.dailyReads,
        blindspot: allData.blindspot
      });
      
    } catch (err) {
      console.error('Homepage data error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    
    // Refresh every 15 minutes
    const interval = setInterval(() => fetchData(false), 15 * 60 * 1000);
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

// SIMPLIFIED CATEGORY HOOK
export const useCategoryNews = (category = 'All') => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async (bypassCache = false) => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await fetchNews(category, 0, bypassCache);
      setData(result);
      
    } catch (err) {
      console.error(`Category ${category} error:`, err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [category]);

  useEffect(() => {
    fetchData();
    
    // Refresh every 20 minutes for category pages
    const interval = setInterval(() => fetchData(false), 20 * 60 * 1000);
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

// UTILITY FUNCTIONS
export const clearNewsCache = () => {
  if (typeof window !== 'undefined') {
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith(CACHE_KEY) || key.startsWith(LAST_FETCHED_KEY)) {
        localStorage.removeItem(key);
      }
    });
    console.log('News cache cleared');
  }
};

export const forceRefreshData = async () => {
  clearNewsCache();
  return await fetchAllNewsData(true);
};

export const checkNewsHealth = async () => {
  try {
    const { data, error } = await supabase
      .from('news')
      .select('id, created_at')
      .limit(5);

    return {
      status: error ? 'error' : 'healthy',
      error: error?.message || null,
      total_articles: data?.length || 0,
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

// BACKWARD COMPATIBILITY
export const fetchHomepageData = async (bypassCache = false) => {
  const allData = await fetchAllNewsData(bypassCache);
  return {
    trending: allData.trending,
    dailyReads: allData.dailyReads,
    blindspot: allData.blindspot
  };
};
