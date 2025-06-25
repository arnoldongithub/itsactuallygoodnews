// === Complete Working RSS News Scraper ===
import RSSParser from 'rss-parser';
import { createClient } from '@supabase/supabase-js';
import { convert } from 'html-to-text';
import dotenv from 'dotenv';

dotenv.config();

// Validate environment variables
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_KEY) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_KEY in .env');
  process.exit(1);
}

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
const parser = new RSSParser({
  timeout: 10000,
  customFields: {
    item: ['pubDate', 'description', 'content', 'author']
  }
});

console.log('🚀 Starting RSS news scraper...');

const POSITIVE_KEYWORDS = [
  'breakthrough', 'success', 'achievement', 'innovation', 'cure', 'recovery',
  'improvement', 'progress', 'celebration', 'award', 'victory', 'solution',
  'discovery', 'advancement', 'positive', 'benefit', 'help', 'support'
];

const NEGATIVE_KEYWORDS = [
  'death', 'killed', 'murder', 'attack', 'war', 'disaster', 'crisis',
  'threat', 'danger', 'problem', 'failure', 'crash', 'collapse', 'decline',
  'recession', 'unemployment', 'violence', 'crime', 'scandal'
];

const FEEDS = {
  'Health': [
    'https://feeds.feedburner.com/reuters/health',
    'https://medicalxpress.com/rss-feed/health-news/',
    'https://www.sciencedaily.com/rss/health_medicine.xml'
  ],
  'Innovation & Tech': [
    'https://feeds.feedburner.com/TechCrunch/',
    'https://www.wired.com/feed/rss',
    'https://feeds.arstechnica.com/arstechnica/index'
  ],
  'Environment & Sustainability': [
    'https://feeds.feedburner.com/EnvironmentalNews-ScienceDaily',
    'https://grist.org/feed/',
    'https://www.treehugger.com/feeds/atom.xml'
  ],
  'Education': [
    'https://hechingerreport.org/feed/',
    'https://www.edsurge.com/articles.rss'
  ],
  'Science & Space': [
    'https://feeds.feedburner.com/spaceflightnow',
    'https://www.sciencedaily.com/rss/space_time.xml',
    'https://phys.org/rss-feed/space-news/'
  ],
  'Policy & Governance': [
    'https://feeds.bbci.co.uk/news/politics/rss.xml',
    'https://www.brookings.edu/feed/'
  ],
  'Community & Culture': [
    'https://feeds.npr.org/1008/rss.xml'
  ],
  'Philanthropy': [
    'https://nonprofitquarterly.org/feed/'
  ]
};

const clean = (html) => {
  if (!html) return '';
  return convert(html, {
    wordwrap: false,
    selectors: [{ selector: 'a', options: { ignoreHref: true } }]
  }).slice(0, 500);
};

const isGoodNews = (title, content) => {
  const text = `${title} ${content}`.toLowerCase();
  const positiveMatches = POSITIVE_KEYWORDS.filter(k => text.includes(k)).length;
  const negativeMatches = NEGATIVE_KEYWORDS.filter(k => text.includes(k)).length;
  
  const positiveScore = positiveMatches * 2;
  const negativeScore = negativeMatches;
  
  const hasPositivePattern = /\b(celebrates?|honors?|wins?|succeeds?|helps?|saves?|improves?|launches?|creates?|builds?|develops?)\b/i.test(text);
  const hasNegativePattern = /\b(dies?|killed?|destroys?|fails?|crashes?|threatens?|warns?|crisis|emergency)\b/i.test(text);
  
  if (hasNegativePattern && !hasPositivePattern) return false;
  if (hasPositivePattern) return true;
  return positiveScore > negativeScore && positiveMatches > 0;
};

const checkDuplicate = async (title, url) => {
  try {
    const { data, error } = await supabase
      .from('news')
      .select('id')
      .or(`title.eq.${title},url.eq.${url}`)
      .limit(1);
    
    if (error) {
      console.error('❌ Error checking duplicate:', error.message);
      return true; // Assume duplicate to be safe
    }
    
    return data?.length > 0;
  } catch (err) {
    console.error('❌ Database error in checkDuplicate:', err.message);
    return true; // Assume duplicate to be safe
  }
};

const insertArticle = async (article) => {
  try {
    const { data, error } = await supabase
      .from('news')
      .insert([article]);
    
    if (error) {
      console.error('❌ Error inserting article:', error.message);
      return false;
    }
    
    console.log('✅ Inserted:', article.title.slice(0, 50) + '...');
    return true;
  } catch (err) {
    console.error('❌ Database error in insertArticle:', err.message);
    return false;
  }
};

const processFeed = async (feedUrl, category) => {
  console.log(`📡 Processing ${category}: ${feedUrl}`);
  
  try {
    const feed = await parser.parseURL(feedUrl);
    console.log(`📰 Found ${feed.items.length} items in ${category}`);
    
    let processed = 0;
    let inserted = 0;
    
    for (const item of feed.items.slice(0, 10)) { // Limit to 10 items per feed
      processed++;
      
      if (!item.title || !item.link) {
        console.log(`⚠️  Skipping item without title/link`);
        continue;
      }
      
      // Check for duplicates
      const isDuplicate = await checkDuplicate(item.title, item.link);
      if (isDuplicate) {
        console.log(`🔄 Duplicate found: ${item.title.slice(0, 30)}...`);
        continue;
      }
      
      const content = clean(item.contentSnippet || item.description || '');
      
      // Filter for good news
      if (!isGoodNews(item.title, content)) {
        console.log(`❌ Not good news: ${item.title.slice(0, 30)}...`);
        continue;
      }
      
      // Parse date
      let publishedAt = null;
      if (item.pubDate) {
        publishedAt = new Date(item.pubDate).toISOString();
      }
      
      const article = {
        title: item.title.slice(0, 500), // Ensure title fits
        url: item.link,
        content: content,
        published_at: publishedAt,
        category: category,
        author: item.author || null,
        image_url: item.enclosure?.url || null,
        source_feed: feedUrl,
        sentiment: 'positive'
      };
      
      const success = await insertArticle(article);
      if (success) {
        inserted++;
      }
      
      // Add small delay to avoid overwhelming the database
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log(`📊 ${category}: Processed ${processed}, Inserted ${inserted}`);
    return { processed, inserted, category };
    
  } catch (error) {
    console.error(`❌ Error processing feed ${feedUrl}:`, error.message);
    return { processed: 0, inserted: 0, category, error: error.message };
  }
};

const logImport = async (results) => {
  try {
    const { data, error } = await supabase
      .from('import_logs')
      .insert([{
        import_type: 'rss_scraper',
        results: results
      }]);
    
    if (error) {
      console.error('❌ Error logging import:', error.message);
    } else {
      console.log('📝 Import logged successfully');
    }
  } catch (err) {
    console.error('❌ Error in logImport:', err.message);
  }
};

const main = async () => {
  console.log('🌟 Starting RSS news import...');
  const startTime = Date.now();
  const results = [];
  
  try {
    // Test database connection first
    const { data, error } = await supabase.from('news').select('id').limit(1);
    if (error) {
      console.error('❌ Database connection failed:', error.message);
      return;
    }
    console.log('✅ Database connection successful');
    
    // Process all feeds
    for (const [category, feedUrls] of Object.entries(FEEDS)) {
      console.log(`\n🔄 Processing category: ${category}`);
      
      for (const feedUrl of feedUrls) {
        const result = await processFeed(feedUrl, category);
        results.push(result);
        
        // Add delay between feeds
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    
    // Summary
    const totalProcessed = results.reduce((sum, r) => sum + r.processed, 0);
    const totalInserted = results.reduce((sum, r) => sum + r.inserted, 0);
    const duration = Math.round((Date.now() - startTime) / 1000);
    
    console.log('\n📈 FINAL SUMMARY:');
    console.log(`⏱️  Duration: ${duration} seconds`);
    console.log(`📊 Total processed: ${totalProcessed}`);
    console.log(`✅ Total inserted: ${totalInserted}`);
    
    // Log results to database
    await logImport({
      totalProcessed,
      totalInserted,
      duration,
      categories: results
    });
    
    // Show sample of what was inserted
    const { data: sampleNews } = await supabase
      .from('news')
      .select('title, category, created_at')
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (sampleNews && sampleNews.length > 0) {
      console.log('\n📰 Latest articles inserted:');
      sampleNews.forEach(article => {
        console.log(`  • [${article.category}] ${article.title.slice(0, 60)}...`);
      });
    }
    
  } catch (error) {
    console.error('❌ Fatal error in main:', error.message);
    console.error(error.stack);
  }
  
  console.log('\n🏁 Script completed!');
};

// Run the script
main().catch(console.error);