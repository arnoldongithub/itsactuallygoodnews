import axios, { AxiosResponse } from 'axios';

interface NewsArticle {
  title: string;
  description: string;
  url: string;
  publishedAt: string;
  source: {
    name: string;
  };
  content?: string;
}

interface NewsAPIResponse {
  status: string;
  totalResults: number;
  articles: NewsArticle[];
}

interface SearchParams {
  q?: string;
  sources?: string;
  domains?: string;
  from?: string;
  to?: string;
  language?: string;
  sortBy?: 'relevancy' | 'popularity' | 'publishedAt';
  pageSize?: number;
  page?: number;
  maxPages?: number;
}

class NewsAPIClient {
  private apiKey: string;
  private baseUrl = 'https://newsapi.org/v2';

  constructor() {
    this.apiKey = process.env.NEWS_API_KEY || '';
    if (!this.apiKey) {
      console.warn('NEWS_API_KEY not found in environment variables');
    }
  }

  async searchWithRetry(params: SearchParams): Promise<{ articles: NewsArticle[] }> {
    if (!this.apiKey) {
      console.warn('NewsAPI key not available, returning empty results');
      return { articles: [] };
    }

    try {
      const response: AxiosResponse<NewsAPIResponse> = await axios.get(
        `${this.baseUrl}/everything`,
        {
          params: {
            apiKey: this.apiKey,
            ...params
          },
          timeout: 10000
        }
      );

      return { articles: response.data.articles || [] };
    } catch (error) {
      console.error('Error fetching from NewsAPI:', error);
      return { articles: [] };
    }
  }
}

export const newsAPI = new NewsAPIClient();

