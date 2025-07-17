import { supabase } from './supa.js';
import { placeholderArticles, getAllStories } from './placeholder-data.js';

const LAST_FETCHED_KEY = 'newsLastFetched';
const NEWS_CACHE_KEY = 'newsCache';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

// Enhanced category mappings for better filtering
const CATEGORY_MAPPINGS = {
  'health': ['health', 'healthcare', 'medical', 'wellness', 'mental health'],
  'humanitarian': ['humanitarian', 'rescue', 'aid', 'relief', 'charity', 'volunteer'],
  'humanitarian & rescue': ['humanitarian', 'rescue', 'aid', 'relief', 'charity', 'volunteer', 'heroism', 'hero'],
  'environment': ['environment', 'climate', 'sustainability', 'conservation', 'renewable'],
  'environment & sustainability': ['environment', 'climate', 'sustainability', 'conservation', 'renewable'],
  'education': ['education', 'learning', 'school', 'university', 'students'],
  'technology': ['technology', 'tech', 'innovation', 'digital', 'ai', 'robotics'],
  'innovation & tech': ['technology', 'tech', 'innovation', 'digital', 'ai', 'robotics'],
  'community': ['community', 'local', 'neighborhood', 'social', 'culture'],
  'community & culture': ['community', 'local', 'neighborhood', 'social', 'culture'],
  'heroism': ['heroism', 'hero', 'brave', 'courage', 'rescue', 'save'],
  'sports': ['sports', 'athletics', 'fitness', 'competition', 'team'],
  'science': ['science', 'research', 'discovery', 'breakthrough', 'study'],
  'science & space': ['science', 'research', 'discovery', 'breakthrough', 'study', 'space', 'nasa', 'astronomy']
};

const FALLBACK_NEWS = [
  {
    id: 'fallback-1',
    title: 'Welcome to ItsActuallyGoodNews',
    content: 'We are currently updating our news feed. Please check back shortly for the latest positive news stories.',
    category: 'Community & Culture',
    published_at: new Date().toISOString(),
    author: 'ItsActuallyGoodNews Team',
    url: '#',
    image_url: null,
    viral_score: 0,
    positivity_score: 8
  }
];

export const fetchNews = async (category = 'All', retryCount = 0) => {
  const now = Date.now();
  const isBrowser = typeof window !== 'undefined';
  const maxRetries = 3;

  let lastFetched, cachedNews;

  if (isBrowser) {
    lastFetched = localStorage.getItem(LAST_FETCHED_KEY);
    cachedNews = localStorage.getItem(NEWS_CACHE_KEY);
  }

  const decodedCategory = decodeURIComponent(category);

  // Check cache first
  if (
    isBrowser &&
    lastFetched &&
    cachedNews &&
    now - parseInt(lastFetched, 10) < CACHE_DURATION
  ) {
    try {
      const parsedCache = JSON.parse(cachedNews);
      const filteredCache = filterByCategory(parsedCache, decodedCategory);
      if (filteredCache.length > 0) return filteredCache;
    } catch (e) {
      console.warn('⚠️ Failed to parse local cache:', e);
    }
  }

  try {
    let query = supabase
      .from('news')
      .select('*')
      .eq('is_ad', false)
      .order('positivity_score', { ascending: false })
      .order('published_at', { ascending: false })
      .limit(100);

    // Enhanced category filtering
    if (decodedCategory && decodedCategory !== 'All') {
      const categoryTerms = CATEGORY_MAPPINGS[decodedCategory.toLowerCase()] || [decodedCategory];
      query = query.or(
        categoryTerms.map(term => `category.ilike.%${term}%`).join(',')
      );
    }

    const { data, error } = await query;

    if (error) throw new Error(`Supabase error: ${error.message}`);

    if (data && data.length > 0) {
      // Add viral_score if missing
      const processedData = data.map(item => ({
        ...item,
        viral_score: item.viral_score || (item.positivity_score > 9 ? 8 : 0)
      }));

      if (isBrowser) {
        try {
          localStorage.setItem(NEWS_CACHE_KEY, JSON.stringify(processedData));
          localStorage.setItem(LAST_FETCHED_KEY, now.toString());
        } catch (e) {
          console.warn('⚠️ Failed to cache news in localStorage:', e);
        }
      }
      
      return filterByCategory(processedData, decodedCategory);
    }

    // If no data from API, fall back to placeholder data
    console.warn('⚠️ No news data from API, using placeholder data');
    
  } catch (error) {
    console.error(`❌ Error fetching news (attempt ${retryCount + 1}):`, error);
    
    if (retryCount < maxRetries) {
      await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
      return fetchNews(category, retryCount + 1);
    }
    
    // If all retries failed, use cached data or placeholder
    if (isBrowser && cachedNews) {
      try {
        const parsedCache = JSON.parse(cachedNews);
        return filterByCategory(parsedCache, decodedCategory);
      } catch (e) {
        console.warn('⚠️ Failed to parse fallback cache:', e);
      }
    }
  }

  // Final fallback to placeholder data
  console.log('🔄 Using placeholder data');
  const fallbackData = getAllStories ? getAllStories() : placeholderArticles;
  return filterByCategory(fallbackData, decodedCategory);
};

// Helper function to filter by category with enhanced matching
const filterByCategory = (data, category) => {
  if (!category || category === 'All') return data;
  
  const normalizedCategory = category.toLowerCase().trim();
  const categoryTerms = CATEGORY_MAPPINGS[normalizedCategory] || [normalizedCategory];
  
  return data.filter(article => {
    if (!article.category) return false;
    
    const articleCategory = article.category.toLowerCase();
    
    // Direct match first
    if (articleCategory === normalizedCategory) return true;
    
    // Check if category contains any of the mapped terms
    return categoryTerms.some(term => 
      articleCategory.includes(term.toLowerCase()) || 
      term.toLowerCase().includes(articleCategory)
    );
  });
};

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

// Enhanced trending news with better viral detection
export const fetchTrendingNews = async (limit = 20) => {
  try {
    const fromTime = new Date(Date.now() - 36 * 60 * 60 * 1000).toISOString();

    const { data, error } = await supabase
      .from('news')
      .select('*')
      .eq('is_ad', false)
      .gte('published_at', fromTime)
      .order('positivity_score', { ascending: false })
      .order('published_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('❌ fetchTrendingNews error:', error.message);
      // Fallback to placeholder data
      const { getViralStories, getTrendingStories } = await import('./placeholder-data.js');
      return [...(getViralStories() || []), ...(getTrendingStories() || [])];
    }

    if (!data || data.length === 0) {
      // Fallback to placeholder data
      const { getViralStories, getTrendingStories } = await import('./placeholder-data.js');
      return [...(getViralStories() || []), ...(getTrendingStories() || [])];
    }

    // Add viral scores and filter for positive content
    return data.map(item => ({
      ...item,
      viral_score: item.viral_score || calculateViralScore(item)
    })).filter(item => 
      // Focus on heroic and positive content
      item.category && (
        item.category.toLowerCase().includes('heroism') ||
        item.category.toLowerCase().includes('rescue') ||
        item.category.toLowerCase().includes('humanitarian') ||
        item.positivity_score >= 8
      )
    );

  } catch (error) {
    console.error('❌ fetchTrendingNews error:', error);
    // Fallback to placeholder data
    const { getViralStories, getTrendingStories } = await import('./placeholder-data.js');
    return [...(getViralStories() || []), ...(getTrendingStories() || [])];
  }
};

export const fetchDailyReads = async (limit = 15) => {
  try {
    const { data, error } = await supabase
      .from('news')
      .select('*')
      .eq('is_ad', false)
      .order('positivity_score', { ascending: false })
      .order('published_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('❌ fetchDailyReads error:', error.message);
      const { getDailyReads } = await import('./placeholder-data.js');
      return getDailyReads() || [];
    }

    if (!data || data.length === 0) {
      const { getDailyReads } = await import('./placeholder-data.js');
      return getDailyReads() || [];
    }

    return data.filter(item => item.positivity_score >= 7);

  } catch (error) {
    console.error('❌ fetchDailyReads error:', error);
    const { getDailyReads } = await import('./placeholder-data.js');
    return getDailyReads() || [];
  }
};

export const fetchBlindspotStories = async (limit = 10) => {
  try {
    const cutoff = new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString();

    const { data, error } = await supabase
      .from('news')
      .select('*')
      .eq('is_ad', false)
      .lt('published_at', cutoff)
      .order('positivity_score', { ascending: false })
      .order('published_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('❌ fetchBlindspotStories error:', error.message);
      const { getBlindspotStories } = await import('./placeholder-data.js');
      return getBlindspotStories() || [];
    }

    if (!data || data.length === 0) {
      const { getBlindspotStories } = await import('./placeholder-data.js');
      return getBlindspotStories() || [];
    }

    return data.filter(item => item.positivity_score >= 7);

  } catch (error) {
    console.error('❌ fetchBlindspotStories error:', error);
    const { getBlindspotStories } = await import('./placeholder-data.js');
    return getBlindspotStories() || [];
  }
};

// Helper function to calculate viral score based on content
const calculateViralScore = (article) => {
  const viralKeywords = ['rescue', 'hero', 'save', 'amazing', 'incredible', 'inspiring', 'breakthrough', 'triumph'];
  const title = article.title?.toLowerCase() || '';
  const content = (article.content || article.summary || '').toLowerCase();
  
  const keywordCount = viralKeywords.filter(keyword => 
    title.includes(keyword) || content.includes(keyword)
  ).length;
  
  const baseScore = article.positivity_score || 0;
  const viralBonus = keywordCount * 2;
  
  return Math.min(baseScore + viralBonus, 10);
};

// Export category mappings for use in components
export const getCategoryMappings = () => CATEGORY_MAPPINGS;
