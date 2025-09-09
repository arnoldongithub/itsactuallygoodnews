// Unified news fetcher with NewsAPI primary + RSS fallback
import { newsAPI } from './news-api-client';
import { fetchByOutlet, RssResult } from './rss-fallback';
import { normalizeArticles, dedupeArticles } from './utils/normalize';

export interface SearchInput {
  q: string;                 // query
  sources?: string;          // csv domains (same as NewsAPI)
  from?: string;             // ISO date
  pageSize?: number;         // default 50
  sortBy?: 'publishedAt' | 'relevancy';
  maxPages?: number;         // safety cap
}

export interface Article {
  title?: string;
  description?: string;
  url?: string;
  urlToImage?: string;
  source?: { name?: string; id?: string };
  publishedAt?: string;
}

export interface SearchResult {
  articles: Article[];
}

function csvToList(csv?: string): string[] {
  return csv ? csv.split(',').map(s => s.trim()).filter(Boolean) : [];
}

export const newsBridge = {
  async searchSmart(input: SearchInput): Promise<SearchResult> {
    const { q, sources, from, pageSize = 50, sortBy = 'publishedAt', maxPages = 2 } = input;
    const domains = csvToList(sources);
    
    // 1) Try NewsAPI first
    let res = await newsAPI.searchWithRetry({ q, sources, from, pageSize, sortBy, maxPages });
    let articles: Article[] = res.articles || [];
    
    // 2) If empty or missing images for many results, backfill with RSS per outlet
    const needBackfill = articles.length === 0 || articles.filter((a: Article) => !a?.urlToImage).length > (articles.length * 0.4);
    
    if (needBackfill && domains.length) {
      const since = from ? new Date(from) : new Date(Date.now() - 24 * 3600 * 1000);
      const rssPulls = await Promise.allSettled(domains.map((d: string) => fetchByOutlet(d, since)));
      const rssArticles: Article[] = rssPulls.flatMap(p => p.status === 'fulfilled' ? p.value.articles : []);
      
      // Type-safe concatenation
      articles = articles.concat(rssArticles.filter(a => a.title && a.url));
    }
    
    // 3) Normalize + dedupe + choose best image
    const norm = normalizeArticles(articles);
    const unique = dedupeArticles(norm);
    return { articles: unique };
  }
};

