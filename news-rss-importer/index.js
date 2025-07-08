// === Corrected RSS News Scraper with Security & Error Fixes ===
import RSSParser from 'rss-parser';
import { createClient } from '@supabase/supabase-js';
import { convert } from 'html-to-text';
import dotenv from 'dotenv';

dotenv.config();

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_KEY) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_KEY in .env');
  process.exit(1);
}

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
const parser = new RSSParser({
  timeout: 15000, // Increased timeout for better reliability
  customFields: { item: ['pubDate', 'description', 'content', 'author'] }
});

console.log('🚀 Starting RSS news scraper...');

const POSITIVE_KEYWORDS = [
  'breakthrough', 'success', 'achievement', 'innovation', 'cure', 'recovery',
  'improvement', 'progress', 'celebration', 'award', 'victory', 'solution',
  'discovery', 'advancement', 'positive', 'benefit', 'help', 'support',
  'launch', 'create', 'build', 'develop', 'honor', 'celebrate', 'win'
];

const NEGATIVE_KEYWORDS = [
  'death', 'killed', 'murder', 'attack', 'war', 'disaster', 'crisis',
  'threat', 'danger', 'problem', 'failure', 'crash', 'collapse', 'decline',
  'recession', 'unemployment', 'violence', 'crime', 'scandal', 'die',
  'destroy', 'fail', 'emergency', 'warn'
];

const FEEDS = {
  'Health': [
    'https://medicalxpress.com/rss-feed/health-news/',
    'https://www.sciencedaily.com/rss/health_medicine.xml'
  ],
  'Innovation & Tech': [
    'https://feeds.feedburner.com/TechCrunch/',
    'https://feeds.arstechnica.com/arstechnica/index',
    'https://www.theverge.com/rss/index.xml'
  ],
  'Environment & Sustainability': [
    'https://grist.org/feed/'
  ],
  'Education': [
    'https://hechingerreport.org/feed/'
  ],
  'Science & Space': [
    'https://feeds.feedburner.com/spaceflightnow',
    'https://www.sciencedaily.com/rss/space_time.xml',
    'https://phys.org/rss-feed/space-news/'
  ]
};

const clean = (html) => {
  if (!html) return '';
  try {
    return convert(html, {
      wordwrap: false,
      selectors: [{ selector: 'a', options: { ignoreHref: true } }]
    }).slice(0, 500);
  } catch (err) {
    console.error('❌ Error cleaning HTML:', err.message);
    return '';
  }
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

// 🔧 FIXED: Proper SQL escaping and error handling
const checkDuplicate = async (title, url) => {
  try {
    // Escape quotes in title and url to prevent SQL injection
    const escapedTitle = title.replace(/"/g, '""');
    const escapedUrl = url.replace(/"/g, '""');
    
    const { data, error } = await supabase
      .from('news')
      .select('id')
      .or(`title.eq."${escapedTitle}",url.eq."${escapedUrl}"`)
      .limit(1);

    if (error) {
      console.error('❌ Error checking duplicate:', error.message);
      return true; // Assume duplicate to avoid inserting on error
    }
    
    if (data?.length > 0) {
      console.log('🔄 Duplicate found:', title.slice(0, 30) + '...');
      return true;
    }
    
    return false;
  } catch (err) {
    console.error('❌ Database error in checkDuplicate:', err.message);
    return true; // Assume duplicate to avoid inserting on error
  }
};

const insertArticle = async (article) => {
  try {
    const { data, error } = await supabase.from('news').insert([article]);
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
    
    for (const item of feed.items.slice(0, 10)) {
      processed++;
      
      // Skip items without required fields
      if (!item.title || !item.link) {
        console.log('⚠️ Skipping item missing title or link');
        continue;
      }
      
      // Check for duplicates
      const isDuplicate = await checkDuplicate(item.title, item.link);
      if (isDuplicate) {
        continue;
      }
      
      // Clean and prepare content
      const content = clean(item.contentSnippet || item.description || '');
      
      // Filter for good news
      if (!isGoodNews(item.title, content)) {
        console.log('❌ Not good news:', item.title.slice(0, 30) + '...');
        continue;
      }
      
      // Parse published date
      const publishedAt = item.pubDate ? new Date(item.pubDate).toISOString() : null;
      
      // Prepare article object
      const article = {
        title: item.title.slice(0, 500),
        url: item.link,
        content,
        published_at: publishedAt,
        category,
        author: item.author || null,
        image_url: item.enclosure?.url || null,
        source_feed: feedUrl,
        sentiment: 'positive'
      };
      
      // Insert article
      const success = await insertArticle(article);
      if (success) inserted++;
      
      // Rate limiting
      await new Promise(res => setTimeout(res, 200));
    }
    
    console.log(`📊 ${category}: Processed ${processed}, Inserted ${inserted}`);
    return { processed, inserted, category };
    
  } catch (error) {
    console.error(`❌ Error processing feed ${feedUrl}:`, error.message);
    return { processed: 0, inserted: 0, category, error: error.message };
  }
};

// 🔧 FIXED: Better error handling for import logging
const logImport = async (results) => {
  try {
    const { error } = await supabase.from('import_logs').insert([{
      import_type: 'rss_scraper',
      results,
      import_date: new Date().toISOString(),
      status: 'completed'
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
    // Test database connection
    const { error } = await supabase.from('news').select('id').limit(1);
    if (error) {
      console.error('❌ Database connection failed:', error.message);
      return;
    }
    console.log('✅ Database connection successful');

    // Process all feeds
    for (const [category, urls] of Object.entries(FEEDS)) {
      console.log(`\n🔄 Processing category: ${category}`);
      
      for (const url of urls) {
        const result = await processFeed(url, category);
        results.push(result);
        
        // Delay between feeds to be respectful
        await new Promise(res => setTimeout(res, 1000));
      }
    }

    // Calculate final statistics
    const totalProcessed = results.reduce((sum, r) => sum + r.processed, 0);
    const totalInserted = results.reduce((sum, r) => sum + r.inserted, 0);
    const duration = Math.round((Date.now() - startTime) / 1000);
    
    console.log('\n📈 FINAL SUMMARY:');
    console.log(`⏱️  Duration: ${duration} seconds`);
    console.log(`📊 Total processed: ${totalProcessed}`);
    console.log(`✅ Total inserted: ${totalInserted}`);

    // Log the import results
    await logImport({ 
      totalProcessed, 
      totalInserted, 
      duration, 
      categories: results,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Fatal error in main:', error.message);
    
    // Log failed import
    await logImport({
      error: error.message,
      status: 'failed',
      timestamp: new Date().toISOString()
    });
  }

  console.log('\n🏁 Script completed!');
};

main().catch(console.error);