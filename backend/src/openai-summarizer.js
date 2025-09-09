// IAGN OpenAI Summarizer - Adapted for positive, solutions-focused news
import axios from 'axios';
import { supabase } from './supabase-client';

export class ProfessionalSummarizer {
  constructor() {
    this.openaiApiKey = process.env.OPENAI_API_KEY || '';
    this.maxConcurrent = 3;
    this.summaryLengthLimit = 800;
    this.retryConfig = {
      maxRetries: 3,
      delays: [500, 2000, 5000]
    };

    if (!this.openaiApiKey) {
      console.warn('OPENAI_API_KEY not configured - summaries will be skipped');
    }
  }

  async batchSummarize(articles) {
    if (!this.openaiApiKey) {
      return articles.map(() => '');
    }

    console.log(`Processing ${articles.length} articles for positive news summarization`);

    const cachedResults = await this.getCachedSummaries(articles);
    const needsSummarization = articles.filter((_, index) => !cachedResults[index]);
    
    if (needsSummarization.length === 0) {
      console.log('All summaries found in cache');
      return cachedResults.map(result => result || '');
    }

    console.log(`${needsSummarization.length} articles need new summaries`);

    const newSummaries = await this.processWithConcurrencyLimit(needsSummarization);
    await this.cacheSummaries(needsSummarization, newSummaries);

    // Merge cached and new results
    const finalResults = [];
    let newIndex = 0;
    
    for (let i = 0; i < articles.length; i++) {
      if (cachedResults[i] !== null) {
        finalResults[i] = cachedResults[i];
      } else {
        finalResults[i] = newSummaries[newIndex] || '';
        newIndex++;
      }
    }

    return finalResults;
  }

  generateContentHash(article) {
    const content = `${article.title}${article.content}${article.published_at}`;
    return Buffer.from(content).toString('base64').substring(0, 32);
  }

  async getCachedSummaries(articles) {
    try {
      const hashes = articles.map(article => this.generateContentHash(article));
      const urls = articles.map(article => article.url);

      const { data: cached } = await supabase
        .from('summary_cache')
        .select('url, content_hash, summary')
        .in('url', urls)
        .in('content_hash', hashes);

      if (!cached) return articles.map(() => null);

      return articles.map(article => {
        const hash = this.generateContentHash(article);
        const cachedEntry = cached.find(c => c.url === article.url && c.content_hash === hash);
        return cachedEntry?.summary || null;
      });
    } catch (error) {
      console.error('Cache lookup failed:', error);
      return articles.map(() => null);
    }
  }

  async cacheSummaries(articles, summaries) {
    if (articles.length !== summaries.length) return;

    try {
      const cacheEntries = articles.map((article, index) => ({
        url: article.url,
        content_hash: this.generateContentHash(article),
        summary: summaries[index] || '',
        created_at: new Date().toISOString()
      }));

      await supabase
        .from('summary_cache')
        .upsert(cacheEntries, { onConflict: 'url,content_hash' });

      console.log(`Cached ${cacheEntries.length} new summaries`);
    } catch (error) {
      console.error('Cache storage failed:', error);
    }
  }

  async processWithConcurrencyLimit(articles) {
    const results = [];
    const pool = [];

    for (let i = 0; i < articles.length; i++) {
      const promise = this.summarizeWithRetry(articles[i])
        .then(summary => {
          results[i] = summary;
        })
        .catch(error => {
          console.error(`Failed to summarize article ${articles[i].url}:`, error);
          results[i] = '';
        });

      pool.push(promise);

      if (pool.length >= this.maxConcurrent) {
        await Promise.race(pool);
        const finishedIndex = pool.findIndex(p => p === promise);
        if (finishedIndex !== -1) {
          pool.splice(finishedIndex, 1);
        }
      }
    }

    await Promise.all(pool);
    return results;
  }

  async summarizeWithRetry(article, attempt = 0) {
    try {
      return await this.summarizeArticle(article);
    } catch (error) {
      const isRateLimit = error.response?.status === 429;
      const shouldRetry = attempt < this.retryConfig.maxRetries && 
                         (isRateLimit || error.code === 'ECONNRESET');

      if (shouldRetry) {
        const delay = this.retryConfig.delays[attempt] || 5000;
        console.log(`Rate limited, retrying in ${delay}ms (attempt ${attempt + 1})`);
        
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.summarizeWithRetry(article, attempt + 1);
      }

      throw error;
    }
  }

  async summarizeArticle(article) {
    const content = `${article.title}\n\n${article.content}`.trim();
    
    // Truncate if too long (OpenAI has token limits)
    const truncatedContent = content.length > 8000 ? 
      content.substring(0, 8000) + '...' : content;

    const response = await axios.post('https://api.openai.com/v1/chat/completions', {
      model: 'gpt-3.5-turbo',
      messages: [{
        role: 'system',
        content: `You are a positive news summarizer for "It's Actually Good News" - a platform focused on constructive, solution-oriented journalism. Create engaging summaries that:

1. Highlight positive developments, solutions, and progress
2. Focus on community organizing, policy wins, and systemic improvements
3. Emphasize hope and actionable change rather than problems
4. Show how ordinary people are creating meaningful change
5. Keep summaries between 100-150 words for web display

Categories to consider: Movement Tracker & Accountability, Capitalism & Inequality, Justice Lens, Hope in Struggle, AI Watch.

Tone: Optimistic but grounded, celebrating progress while acknowledging the work ahead.`
      }, {
        role: 'user',
        content: `Summarize this positive news story, focusing on the constructive outcomes and what it means for broader change:\n\n${truncatedContent}`
      }],
      max_tokens: 200,
      temperature: 0.4,
      presence_penalty: 0.1
    }, {
      headers: {
        'Authorization': `Bearer ${this.openaiApiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: 15000
    });

    const summary = response.data.choices[0].message.content.trim();
    
    // Enforce length limit for professional display
    return summary.length > this.summaryLengthLimit ? 
      summary.substring(0, this.summaryLengthLimit) + '...' : summary;
  }

  async cleanupCache(olderThanDays = 30) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

      const { error } = await supabase
        .from('summary_cache')
        .delete()
        .lt('created_at', cutoffDate.toISOString());

      if (error) {
        console.error('Cache cleanup failed:', error);
      } else {
        console.log(`Cleaned up cache entries older than ${olderThanDays} days`);
      }
    } catch (error) {
      console.error('Cache cleanup error:', error);
    }
  }
}

export const summarizer = new ProfessionalSummarizer();
