// rss-news-importer.js
import { supabase } from "./supa.js"; // or "./supabaseClient.js" if that's your filename

// RSS Feed configurations mapped to your categories
const RSS_FEEDS = {
  'Health': [
    'https://feeds.feedburner.com/medscape/InternalMedicine',
    'https://www.medicalnewstoday.com/rss',
    'https://rss.cnn.com/rss/cnn_health.rss',
    'https://feeds.reuters.com/reuters/health'
  ],
  'Innovation & Tech': [
    'https://feeds.feedburner.com/techcrunch/startups',
    'https://rss.cnn.com/rss/cnn_tech.rss',
    'https://feeds.ars-technica.com/arstechnica/index',
    'https://www.wired.com/feed/rss'
  ],
  'Environment & Sustainability': [
    'https://feeds.reuters.com/reuters/environment',
    'https://www.eenews.net/rss/feed/1',
    'https://feeds.nationalgeographic.com/ng/News/News_Main'
  ],
  'Education': [
    'https://feeds.feedburner.com/TheEconomistEducation',
    'https://www.edweek.org/rss/blogs.xml'
  ],
  'Science & Space': [
    'https://feeds.space.com/space/news',
    'https://rss.nasa.gov/rss/dyn/breaking_news.rss',
    'https://feeds.sciencedaily.com/sciencedaily/top_news',
    'https://www.nature.com/nature/articles?type=news&format=rss'
  ],
  'Policy & Governance': [
    'https://feeds.reuters.com/Reuters/PoliticsNews',
    'https://rss.cnn.com/rss/cnn_allpolitics.rss',
    'https://feeds.bbci.co.uk/news/politics/rss.xml'
  ],
  'Community & Culture': [
    'https://feeds.npr.org/1008/rss.xml',
    'https://rss.cnn.com/rss/cnn_showbiz.rss'
  ],
  'Philanthropy / Nonprofits': [
    'https://feeds.guidestar.org/rss/news.xml',
    'https://www.philanthropy.com/rss/news.xml'
  ]
};

// CORS proxy for RSS feeds (since browsers block direct RSS access)
const CORS_PROXY = 'https://api.rss2json.com/v1/api.json?rss_url=';

class RSSNewsImporter {
  constructor() {
    this.importLog = [];
    this.duplicateCount = 0;
    this.successCount = 0;
    this.errorCount = 0;
  }

  // Fetch and parse RSS feed
  async fetchRSSFeed(feedUrl) {
    try {
      const response = await fetch(`${CORS_PROXY}${encodeURIComponent(feedUrl)}`, {
        headers: {
          'Accept': 'application/json',
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.status !== 'ok') {
        throw new Error(`RSS API error: ${data.message}`);
      }
      
      return data.items || [];
    } catch (error) {
      console.error(`❌ Error fetching RSS from ${feedUrl}:`, error);
      this.errorCount++;
      return [];
    }
  }

  // Clean and process article content
  cleanContent(htmlContent, maxLength = 500) {
    if (!htmlContent) return '';
    
    // Remove HTML tags
    const textContent = htmlContent.replace(/<[^>]*>/g, '');
    
    // Decode HTML entities
    const parser = new DOMParser();
    const decoded = parser.parseFromString(textContent, 'text/html').textContent;
    
    // Truncate if too long
    return decoded.length > maxLength 
      ? decoded.substring(0, maxLength) + '...'
      : decoded;
  }

  // Check if article already exists
  async checkDuplicate(title, url) {
    const { data, error } = await supabase
      .from('news')
      .select('id')
      .or(`title.eq.${title},url.eq.${url}`)
      .limit(1);
    
    if (error) {
      console.error('Error checking duplicate:', error);
      return false;
    }
    
    return data && data.length > 0;
  }

  // Extract and clean author information
  extractAuthor(item) {
    if (item.author) return item.author;
    if (item.creator) return item.creator;
    if (item['dc:creator']) return item['dc:creator'];
    return 'RSS Feed';
  }

  // Process single RSS item into news article
  async processRSSItem(item, category) {
    try {
      const title = item.title?.trim();
      const url = item.link || item.guid;
      
      if (!title || !url) {
        console.log('⚠️ Skipping item with missing title or URL');
        return false;
      }

      // Check for duplicates
      const isDuplicate = await this.checkDuplicate(title, url);
      if (isDuplicate) {
        this.duplicateCount++;
        return false;
      }

      const newsArticle = {
        title: title,
        content: this.cleanContent(item.description || item.content),
        category: category,
        published_at: item.pubDate || new Date().toISOString(),
        author: this.extractAuthor(item),
        url: url,
        image_url: item.enclosure?.link || item.thumbnail || null
      };

      // Insert into database
      const { data, error } = await supabase
        .from('news')
        .insert([newsArticle])
        .select();

      if (error) {
        console.error(`❌ Error inserting article "${title}":`, error);
        this.errorCount++;
        return false;
      }

      console.log(`✅ Imported: ${title}`);
      this.successCount++;
      return true;

    } catch (error) {
      console.error('Error processing RSS item:', error);
      this.errorCount++;
      return false;
    }
  }

  // Import news from all RSS feeds
  async importAllNews() {
    console.log('🚀 Starting RSS news import...');
    const startTime = Date.now();
    
    this.importLog = [];
    this.duplicateCount = 0;
    this.successCount = 0;
    this.errorCount = 0;

    for (const [category, feedUrls] of Object.entries(RSS_FEEDS)) {
      console.log(`\n📰 Processing category: ${category}`);
      
      for (const feedUrl of feedUrls) {
        console.log(`🔄 Fetching from: ${feedUrl}`);
        
        const items = await this.fetchRSSFeed(feedUrl);
        console.log(`📄 Found ${items.length} items`);
        
        // Process items (limit to avoid overwhelming the database)
        const itemsToProcess = items.slice(0, 10); // Limit to 10 most recent per feed
        
        for (const item of itemsToProcess) {
          await this.processRSSItem(item, category);
          
          // Small delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
    }

    const duration = (Date.now() - startTime) / 1000;
    const summary = {
      duration: `${duration}s`,
      successful: this.successCount,
      duplicates: this.duplicateCount,
      errors: this.errorCount,
      total_processed: this.successCount + this.duplicateCount + this.errorCount
    };

    console.log('\n🎉 Import completed!');
    console.log('📊 Summary:', summary);

    // Store import log in database for tracking
    await this.logImportResults(summary);
    
    return summary;
  }

  // Log import results for monitoring
  async logImportResults(summary) {
    try {
      const { error } = await supabase
        .from('import_logs') // You might want to create this table
        .insert([{
          import_type: 'rss_news',
          import_date: new Date().toISOString(),
          results: summary
        }]);
      
      if (error) {
        console.log('Note: Could not log import results (import_logs table may not exist)');
      }
    } catch (err) {
      console.log('Note: Import logging skipped');
    }
  }

  // Clean up old articles (optional - keep database size manageable)
  async cleanupOldArticles(daysToKeep = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
    
    try {
      const { data, error } = await supabase
        .from('news')
        .delete()
        .lt('published_at', cutoffDate.toISOString());
      
      if (error) {
        console.error('Error cleaning up old articles:', error);
      } else {
        console.log(`🧹 Cleaned up articles older than ${daysToKeep} days`);
      }
    } catch (err) {
      console.error('Error in cleanup:', err);
    }
  }
}

// Create importer instance
const newsImporter = new RSSNewsImporter();

// Manual import function
export const importNewsNow = async () => {
  return await newsImporter.importAllNews();
};

// Setup automatic import every 24 hours
export const setupAutoImport = () => {
  console.log('⏰ Setting up automatic news import every 24 hours...');
  
  // Run immediately on setup
  importNewsNow();
  
  // Then run every 24 hours
  setInterval(async () => {
    console.log('🕐 Running scheduled news import...');
    await importNewsNow();
    
    // Optional: cleanup old articles weekly
    const now = new Date();
    if (now.getDay() === 0) { // Sunday
      await newsImporter.cleanupOldArticles(30);
    }
  }, 24 * 60 * 60 * 1000); // 24 hours in milliseconds
};

// Export for direct use
export { newsImporter, RSS_FEEDS };
