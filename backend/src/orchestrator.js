// IAGN Orchestrator - Positive news processing pipeline
import { PositiveContentFilter } from './positive-content-filter.js';
import { newsBridge } from './news-bridge.js';
import { supabase } from './supabase-client.js';

export class Orchestrator {
  constructor() {
    this.positiveFilter = new PositiveContentFilter();
  }

  async processAll(options = {}) {
    const { level = 'full', windowHrs = 24 } = options;
    
    console.log(`Starting IAGN processing - level: ${level}, window: ${windowHrs}hrs`);

    try {
      if (level === 'light') {
        // Hourly light processing - just recent articles
        await this.processRecentNews({ fast: true, windowHrs: 3 });
        return;
      }

      // Full processing - comprehensive news gathering and analysis
      await this.processRecentNews({ fast: false, windowHrs });
      await this.updateTrendingStories();
      await this.generateDailyDigest();
      
      console.log('IAGN processing completed successfully');
    } catch (error) {
      console.error('IAGN processing failed:', error);
      throw error;
    }
  }

  async processRecentNews(options = {}) {
    const { fast = false, windowHrs = 24 } = options;
    
    console.log(`Processing recent news - fast: ${fast}, window: ${windowHrs}hrs`);

    try {
      // Search for positive news across multiple sources
      const searchQueries = this.buildSearchQueries();
      const allArticles = [];

      for (const query of searchQueries) {
        try {
          const results = await newsBridge.searchSmart({
            q: query,
            sources: this.getPositiveNewsSources(),
            from: new Date(Date.now() - windowHrs * 3600 * 1000).toISOString(),
            pageSize: fast ? 20 : 50,
            sortBy: 'publishedAt',
            maxPages: fast ? 1 : 2
          });

          if (results.articles) {
            allArticles.push(...results.articles);
          }
        } catch (error) {
          console.error(`Search query failed: ${query}`, error);
        }
      }

      console.log(`Found ${allArticles.length} raw articles`);

      // Remove duplicates
      const uniqueArticles = this.deduplicateArticles(allArticles);
      console.log(`${uniqueArticles.length} unique articles after deduplication`);

      // Filter for positive content
      const positiveArticles = await this.positiveFilter.processArticles(uniqueArticles, { fast, windowHrs });
      console.log(`${positiveArticles.length} articles passed positive content filter`);

      // Store processed articles
      if (positiveArticles.length > 0) {
        await this.positiveFilter.storeProcessedArticles(positiveArticles);
      }

      return positiveArticles;
    } catch (error) {
      console.error('Error processing recent news:', error);
      throw error;
    }
  }

  buildSearchQueries() {
    // Search queries focused on positive developments and solutions
    return [
      // Movement & Accountability
      'policy reform victory OR transparency initiative OR democratic progress',
      'voter registration success OR election reform OR lobbying reform',
      'budget oversight OR accountability measure OR ethics investigation',
      
      // Capitalism & Inequality  
      'wage increase OR union victory OR worker protection OR strike success',
      'housing affordability OR debt relief OR tax reform OR wealth redistribution',
      'labor rights OR minimum wage OR healthcare access OR pension protection',
      
      // Justice Lens
      'wrongful conviction overturned OR police reform OR criminal justice reform',
      'civil rights victory OR racial equity OR LGBTQ rights OR disability rights',
      'surveillance reform OR prison reform OR restorative justice',
      
      // Hope in Struggle
      'grassroots victory OR community organizing OR mutual aid OR solidarity',
      'youth activism OR environmental victory OR education funding',
      'community garden OR neighborhood improvement OR volunteer effort',
      
      // AI Watch
      'AI bias reduction OR algorithmic fairness OR worker protection automation',
      'AI transparency OR tech monopoly regulation OR AI for climate',
      'ethical AI development OR AI governance OR facial recognition ban'
    ];
  }

  getPositiveNewsSources() {
    return [
      // Mainstream sources that cover positive developments
      'reuters.com,ap.org,npr.org,bbc.com',
      // Progressive and solution-oriented sources
      'goodnewsnetwork.org,positive.news,upworthy.com,yeson30.org',
      // Labor and movement sources
      'labornotes.org,inthesetimes.com,jacobinmag.com,thenation.com',
      // Environmental and justice sources  
      'grist.org,treehugger.com,commondreams.org,truthout.org',
      // Tech and AI sources
      'techcrunch.com,theverge.com,wired.com,arstechnica.com'
    ].join(',');
  }

  deduplicateArticles(articles) {
    const seen = new Set();
    const unique = [];

    for (const article of articles) {
      const key = `${article.title?.toLowerCase().trim()}_${article.url}`;
      if (!seen.has(key) && article.title && article.url) {
        seen.add(key);
        unique.push(article);
      }
    }

    return unique;
  }

  async updateTrendingStories() {
    try {
      console.log('Updating trending stories...');

      // Get top stories from last 24 hours by positivity score
      const { data: trending, error } = await supabase
        .from('stories')
        .select('*')
        .gte('created_at', new Date(Date.now() - 24 * 3600 * 1000).toISOString())
        .eq('impact_level', 'high')
        .order('positivity_score', { ascending: false })
        .limit(10);

      if (error) throw error;

      // Update trending flags
      if (trending?.length > 0) {
        const trendingIds = trending.map(story => story.id);
        
        // Clear old trending flags
        await supabase
          .from('stories')
          .update({ is_trending: false })
          .eq('is_trending', true);

        // Set new trending stories
        await supabase
          .from('stories')
          .update({ is_trending: true })
          .in('id', trendingIds);

        console.log(`Updated ${trending.length} trending stories`);
      }
    } catch (error) {
      console.error('Error updating trending stories:', error);
    }
  }

  async generateDailyDigest() {
    try {
      console.log('Generating daily digest...');

      // Get best stories from each category from last 24 hours
      const categories = [
        'Movement Tracker & Accountability',
        'Capitalism & Inequality', 
        'Justice Lens',
        'Hope in Struggle',
        'AI Watch'
      ];

      const digestStories = [];

      for (const category of categories) {
        const { data: categoryStories, error } = await supabase
          .from('stories')
          .select('*')
          .eq('category', category)
          .gte('created_at', new Date(Date.now() - 24 * 3600 * 1000).toISOString())
          .gte('positivity_score', 6)
          .order('positivity_score', { ascending: false })
          .limit(2);

        if (!error && categoryStories?.length > 0) {
          digestStories.push(...categoryStories);
        }
      }

      if (digestStories.length > 0) {
        // Store daily digest
        const { error: digestError } = await supabase
          .from('daily_digests')
          .insert({
            date: new Date().toISOString().split('T')[0],
            story_ids: digestStories.map(s => s.id),
            story_count: digestStories.length,
            generated_at: new Date().toISOString()
          });

        if (digestError) {
          console.error('Error storing daily digest:', digestError);
        } else {
          console.log(`Generated daily digest with ${digestStories.length} stories`);
        }
      }
    } catch (error) {
      console.error('Error generating daily digest:', error);
    }
  }

  async runCleanup() {
    try {
      console.log('Running IAGN cleanup...');

      // Clean up old stories (keep 60 days)
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - 60);

      const { error: storiesError } = await supabase
        .from('stories')
        .delete()
        .lt('created_at', cutoffDate.toISOString());

      if (storiesError) {
        console.error('Stories cleanup failed:', storiesError);
      }

      // Clean up old digests (keep 90 days)
      const digestCutoff = new Date();
      digestCutoff.setDate(digestCutoff.getDate() - 90);

      const { error: digestError } = await supabase
        .from('daily_digests')
        .delete()
        .lt('generated_at', digestCutoff.toISOString());

      if (digestError) {
        console.error('Digest cleanup failed:', digestError);
      }

      // Clean up summary cache (handled by summarizer)
      await this.positiveFilter.cleanupCache?.(30);

      console.log('IAGN cleanup completed');
    } catch (error) {
      console.error('Cleanup failed:', error);
    }
  }
}

export const orchestrator = new Orchestrator();
