// src/lib/hybrid-news.js - Supplemental RSS/API system
import { supabase } from './supa.js';
import { cleanTitle, cleanSummary } from './utils.js';

// RSS/API Sources Configuration
const EXTERNAL_SOURCES = {
  rss: [
    {
      name: 'Good News Network',
      url: 'https://www.goodnewsnetwork.org/feed/',
      category: 'Hope in Struggle'
    },
    {
      name: 'Solutions Journalism',
      url: 'https://www.solutionsjournalism.org/feed/',
      category: 'Movement Tracker + Accountability'
    },
    {
      name: 'Positive News',
      url: 'https://www.positive.news/feed/',
      category: 'Hope in Struggle'
    }
  ],
  apis: [
    {
      name: 'NewsAPI',
      endpoint: 'https://newsapi.org/v2/everything',
      apiKey: import.meta.env.VITE_NEWSAPI_KEY,
      params: {
        q: 'positive OR breakthrough OR "good news" OR community OR progress',
        sortBy: 'publishedAt',
        language: 'en',
        pageSize: 20
      }
    }
  ]
};

// Fargate Summarization Service
const FARGATE_SUMMARIZER_URL = import.meta.env.VITE_FARGATE_SUMMARIZER_URL || 'https://your-fargate-service.amazonaws.com/summarize';

// Send article to Fargate for BART-CNN summarization
async function summarizeWithFargate(title, content) {
  try {
    const response = await fetch(FARGATE_SUMMARIZER_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_FARGATE_API_KEY}`
      },
      body: JSON.stringify({
        title: title,
        content: content,
        model: 'facebook/bart-large-cnn',
        max_length: 150,
        min_length: 50
      })
    });

    if (!response.ok) {
      throw new Error(`Fargate API error: ${response.status}`);
    }

    const result = await response.json();
    return result.summary || '';
  } catch (error) {
    console.warn('Fargate summarization failed:', error);
    // Fallback to local cleaning
    return cleanSummary(content);
  }
}

// RSS Parser using CORS proxy
async function parseRSSFeed(source) {
  try {
    // Using rss2json.com as CORS proxy
    const proxyUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(source.url)}&count=10`;
    const response = await fetch(proxyUrl);
    const data = await response.json();
    
    if (data.status !== 'ok') {
      console.warn(`RSS error for ${source.name}:`, data.message);
      return [];
    }
    
    const articles = await Promise.all(
      data.items.map(async (item) => {
        // Use Fargate for summarization
        const summary = await summarizeWithFargate(item.title, item.description || item.content);
        
        return {
          id: `rss-${source.name}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          title: cleanTitle(item.title),
          summary: summary,
          content: item.content || item.description,
          url: item.link,
          published_at: item.pubDate,
          created_at: new Date().toISOString(),
          source_name: source.name,
          category: source.category,
          image_url: item.thumbnail || extractImageFromContent(item.content),
          positivity_score: 7, // Default for curated positive feeds
          virality_score: 0,
          is_ad: false,
          sentiment: 'positive',
          source_type: 'rss'
        };
      })
    );
    
    return articles;
  } catch (error) {
    console.error(`RSS parsing failed for ${source.name}:`, error);
    return [];
  }
}

// News API fetcher with Fargate summarization
async function fetchFromNewsAPI(source) {
  try {
    if (!source.apiKey) {
      console.warn(`No API key for ${source.name}`);
      return [];
    }

    const params = new URLSearchParams({
      ...source.params,
      apiKey: source.apiKey
    });
    
    const response = await fetch(`${source.endpoint}?${params}`);
    const data = await response.json();
    
    if (data.status !== 'ok') {
      console.warn(`API error for ${source.name}:`, data.message);
      return [];
    }
    
    const articles = await Promise.all(
      data.articles
        .filter(article => article.title && article.url && article.title !== '[Removed]')
        .slice(0, 10) // Limit to prevent rate limiting
        .map(async (article) => {
          // Use Fargate for summarization
          const summary = await summarizeWithFargate(article.title, article.description || article.content);
          
          return {
            id: `api-${article.url}`,
            title: cleanTitle(article.title),
            summary: summary,
            content: article.content,
            url: article.url,
            published_at: article.publishedAt,
            created_at: new Date().toISOString(),
            source_name: article.source.name,
            category: categorizeTopic(article.title + ' ' + (article.description || '')),
            image_url: article.urlToImage,
            positivity_score: 6,
            virality_score: 0,
            is_ad: false,
            sentiment: 'positive',
            source_type: 'api',
            author: article.author
          };
        })
    );
    
    return articles;
  } catch (error) {
    console.error(`API fetch failed for ${source.name}:`, error);
    return [];
  }
}

// Categorize articles based on content
function categorizeTopic(text) {
  const lowerText = text.toLowerCase();
  
  if (/(policy|government|democracy|voting|election|legislation|budget|accountability)/i.test(lowerText)) {
    return 'Movement Tracker + Accountability';
  }
  if (/(wage|inequality|ceo|tax|rent|housing|wealth|capitalism|worker)/i.test(lowerText)) {
    return 'Capitalism & Inequality Watch';
  }
  if (/(justice|civil rights|police|court|legal|discrimination|equality)/i.test(lowerText)) {
    return 'Justice Lens';
  }
  if (/(ai|artificial intelligence|machine learning|tech|robot|automation)/i.test(lowerText)) {
    return 'AI Watch';
  }
  
  return 'Hope in Struggle'; // Default category
}

// Extract image from HTML content
function extractImageFromContent(content) {
  if (!content) return null;
  
  const imgMatch = content.match(/<img[^>]+src="([^"]+)"/i);
  if (imgMatch && imgMatch[1]) {
    return imgMatch[1];
  }
  
  const urlMatch = content.match(/(https?:\/\/[^\s]+\.(jpg|jpeg|png|gif|webp))/i);
  return urlMatch ? urlMatch[0] : null;
}

// Main hybrid fetch function
export async function fetchHybridNews(limit = 30) {
  console.log('Fetching hybrid news from external sources...');
  const startTime = performance.now();
  const allArticles = [];
  
  try {
    // Fetch from RSS sources
    console.log('Fetching RSS feeds...');
    const rssPromises = EXTERNAL_SOURCES.rss.map(source => parseRSSFeed(source));
    const rssResults = await Promise.allSettled(rssPromises);
    
    rssResults.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        allArticles.push(...result.value);
        console.log(`RSS ${EXTERNAL_SOURCES.rss[index].name}: ${result.value.length} articles`);
      }
    });
    
    // Fetch from APIs
    console.log('Fetching from APIs...');
    const apiPromises = EXTERNAL_SOURCES.apis
      .filter(source => source.apiKey)
      .map(source => fetchFromNewsAPI(source));
    
    const apiResults = await Promise.allSettled(apiPromises);
    
    apiResults.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        allArticles.push(...result.value);
        console.log(`API ${EXTERNAL_SOURCES.apis[index].name}: ${result.value.length} articles`);
      }
    });
    
    // Remove duplicates
    const uniqueArticles = removeDuplicates(allArticles);
    
    // Sort by recency and positivity
    uniqueArticles.sort((a, b) => {
      const dateA = new Date(b.published_at || b.created_at);
      const dateB = new Date(a.published_at || a.created_at);
      return dateA - dateB;
    });
    
    const endTime = performance.now();
    console.log(`Hybrid fetch completed: ${uniqueArticles.length} articles in ${(endTime - startTime).toFixed(2)}ms`);
    
    return uniqueArticles.slice(0, limit);
    
  } catch (error) {
    console.error('Hybrid news fetch error:', error);
    return [];
  }
}

// Remove duplicates based on URL and title similarity
function removeDuplicates(articles) {
  const seen = new Map();
  return articles.filter(article => {
    const key = article.url || article.title.substring(0, 50);
    if (seen.has(key)) {
      return false;
    }
    seen.set(key, true);
    return true;
  });
}

// Cache hybrid articles to Supabase (optional)
export async function cacheHybridToSupabase(articles) {
  if (!articles.length) return;
  
  try {
    // Check for existing URLs
    const urls = articles.map(a => a.url);
    const { data: existing } = await supabase
      .from('news')
      .select('url')
      .in('url', urls);
    
    const existingUrls = new Set(existing?.map(item => item.url) || []);
    const newArticles = articles.filter(article => !existingUrls.has(article.url));
    
    if (newArticles.length > 0) {
      const { error } = await supabase
        .from('news')
        .insert(newArticles);
      
      if (!error) {
        console.log(`Cached ${newArticles.length} hybrid articles to Supabase`);
      } else {
        console.warn('Failed to cache hybrid articles:', error);
      }
    }
  } catch (error) {
    console.warn('Hybrid caching error:', error);
  }
}

// React hook for hybrid news
export function useHybridNews(limit = 20) {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const fetchHybrid = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const hybridArticles = await fetchHybridNews(limit);
      setArticles(hybridArticles);
      
      // Optionally cache to Supabase
      if (hybridArticles.length > 0) {
        cacheHybridToSupabase(hybridArticles);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [limit]);
  
  return {
    articles,
    loading,
    error,
    refresh: fetchHybrid
  };
}
