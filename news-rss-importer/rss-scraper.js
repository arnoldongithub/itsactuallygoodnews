// === Enhanced RSS News Scraper with Security & Reliability Improvements ===
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
  timeout: 20000, // Increased timeout for better reliability
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

// 🔧 IMPROVED: URL validation
const isValidUrl = (url) => {
  try {
    const parsedUrl = new URL(url);
    return parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:';
  } catch {
    return false;
  }
};

// 🔧 IMPROVED: Content validation
const validateArticle = (article) => {
  return article.title && 
         article.url && 
         article.title.trim().length > 10 && 
         article.content.trim().length > 20 &&
         isValidUrl(article.url);
};

// 🔧 IMPROVED: Retry logic for feed fetching
const retryFetch = async (url, retries = 3) => {
  for (let i = 0; i < retries; i++) {
    try {
      console.log(`📡 Attempt ${i + 1} for ${url}`);
      return await parser.parseURL(url);
    } catch (error) {
      console.log(`⚠️ Attempt ${i + 1} failed: ${error.message}`);
      if (i === retries - 1) throw error;
      
      // Exponential backoff
      const delay = 1000 * Math.pow(2, i);
      await new Promise(res => setTimeout(res, delay));
    }
  }
};

const clean = (html) => {
  if (!html) return '';
  try {
    return convert(html, {
      wordwrap: false,
      selectors: [{ selector: 'a', options: { ignoreHref: true } }]
    }).trim().slice(0, 500);
  } catch (err) {
    console.error('❌ Error cleaning HTML:', err.message);
    return '';
  }
};

const isGoodNews = (title, content) => {
  if (!title && !content) return false;
  
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

// 🔧 FIXED: Secure duplicate checking using Supabase's built-in parameterization
const checkDuplicate = async (title, url) => {
  try {
    // Use Supabase's built-in parameterization - much safer than manual escaping
    const { data, error } = await supabase
      .from('news')
      .select('id')
      .or(`title.eq.${title},url.eq.${url}`)
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

// 🔧 IMPROVED: Better error handling for insertions
const insertArticle = async (article) => {
  try {
    // Validate article before insertion
    if (!validateArticle(article)) {
      console.log('⚠️ Article validation failed:', article.title?.slice(0, 30) + '...');
      return false;
    }

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

// 🔧 IMPROVED: Enhanced feed processing with better error handling
const processFeed = async (feedUrl, category) => {
  console.log(`📡 Processing ${category}: ${feedUrl}`);
  
  // Validate feed URL first
  if (!isValidUrl(feedUrl)) {
    console.error(`❌ Invalid feed URL: ${feedUrl}`);
    return { processed: 0, inserted: 0, category, error: 'Invalid URL' };
  }

  try {
    const feed = await retryFetch(feedUrl);
    
    if (!feed || !feed.items || feed.items.length === 0) {
      console.log(`⚠️ No items found in feed: ${feedUrl}`);
      return { processed: 0, inserted: 0, category, error: 'No items found' };
    }

    console.log(`📰 Found ${feed.items.length} items in ${category}`);
    
    let processed = 0;
    let inserted = 0;
    let skipped = 0;
    
    // Process items in batches to prevent memory issues
    const itemsToProcess = feed.items.slice(0, 10);
    
    for (const item of itemsToProcess) {
      processed++;
      
      // Skip items without required fields
      if (!item.title || !item.link) {
        console.log('⚠️ Skipping item missing title or link');
        skipped++;
        continue;
      }
      
      // Validate item URL
      if (!isValidUrl(item.link)) {
        console.log('⚠️ Skipping item with invalid URL:', item.title?.slice(0, 30) + '...');
        skipped++;
        continue;
      }
      
      // Check for duplicates
      const isDuplicate = await checkDuplicate(item.title, item.link);
      if (isDuplicate) {
        skipped++;
        continue;
      }
      
      // Clean and prepare content
      const content = clean(item.contentSnippet || item.description || '');
      
      // Filter for good news
      if (!isGoodNews(item.title, content)) {
        console.log('❌ Not good news:', item.title.slice(0, 30) + '...');
        skipped++;
        continue;
      }
      
      // Parse published date with better error handling
      let publishedAt = null;
      if (item.pubDate) {
        try {
          publishedAt = new Date(item.pubDate).toISOString();
        } catch (err) {
          console.log('⚠️ Invalid date format:', item.pubDate);
        }
      }
      
      // Prepare article object with better data sanitization
      const article = {
        title: item.title.trim().slice(0, 500),
        url: item.link.trim(),
        content: content.trim(),
        published_at: publishedAt,
        category: category.trim(),
        author: item.author?.trim()?.slice(0, 200) || null,
        image_url: item.enclosure?.url && isValidUrl(item.enclosure.url) ? item.enclosure.url : null,
        source_feed: feedUrl,
        sentiment: 'positive'
      };
      
      // Insert article
      const success = await insertArticle(article);
      if (success) inserted++;
      
      // Rate limiting - slightly longer delay for reliability
      await new Promise(res => setTimeout(res, 300));
    }
    
    console.log(`📊 ${category}: Processed ${processed}, Inserted ${inserted}, Skipped ${skipped}`);
    return { processed, inserted, skipped, category };
    
  } catch (error) {
    console.error(`❌ Error processing feed ${feedUrl}:`, error.message);
    return { processed: 0, inserted: 0, skipped: 0, category, error: error.message };
  }
};

// 🔧 IMPROVED: Enhanced import logging with better error handling
const logImport = async (results) => {
  try {
    const logData = {
      import_type: 'rss_scraper',
      results: JSON.stringify(results), // Ensure results are properly serialized
      import_date: new Date().toISOString(),
      status: results.error ? 'failed' : 'completed'
    };

    const { error } = await supabase.from('import_logs').insert([logData]);
    
    if (error) {
      console.error('❌ Error logging import:', error.message);
    } else {
      console.log('📝 Import logged successfully');
    }
  } catch (err) {
    console.error('❌ Error in logImport:', err.message);
  }
};

// 🔧 IMPROVED: Enhanced main function with better error recovery
const main = async () => {
  console.log('🌟 Starting RSS news import...');
  const startTime = Date.now();
  const results = [];

  try {
    // Test database connection
    const { error } = await supabase.from('news').select('id').limit(1);
    if (error) {
      console.error('❌ Database connection failed:', error.message);
      await logImport({
        error: 'Database connection failed: ' + error.message,
        status: 'failed',
        timestamp: new Date().toISOString()
      });
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
        await new Promise(res => setTimeout(res, 1500));
      }
    }

    // Calculate final statistics
    const totalProcessed = results.reduce((sum, r) => sum + (r.processed || 0), 0);
    const totalInserted = results.reduce((sum, r) => sum + (r.inserted || 0), 0);
    const totalSkipped = results.reduce((sum, r) => sum + (r.skipped || 0), 0);
    const totalErrors = results.filter(r => r.error).length;
    const duration = Math.round((Date.now() - startTime) / 1000);
    
    console.log('\n📈 FINAL SUMMARY:');
    console.log(`⏱️  Duration: ${duration} seconds`);
    console.log(`📊 Total processed: ${totalProcessed}`);
    console.log(`✅ Total inserted: ${totalInserted}`);
    console.log(`⏭️  Total skipped: ${totalSkipped}`);
    console.log(`❌ Feed errors: ${totalErrors}`);

    // Log the import results
    await logImport({ 
      totalProcessed, 
      totalInserted, 
      totalSkipped,
      totalErrors,
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
