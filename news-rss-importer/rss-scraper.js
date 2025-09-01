import RSSParser from 'rss-parser';
import { createClient } from '@supabase/supabase-js';
import { convert } from 'html-to-text';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// === Correct .env Load ===
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_KEY) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_KEY in .env');
  process.exit(1);
}

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
const parser = new RSSParser({
  timeout: 15000,
  customFields: { 
    item: ['pubDate', 'description', 'content', 'author', 'media:content', 'media:thumbnail', 'enclosure'] 
  }
});

// === FARGATE INTEGRATION ===
const FARGATE_SUMMARIZER_URL = process.env.FARGATE_SUMMARIZER_URL;
const FARGATE_API_KEY = process.env.FARGATE_API_KEY;

// Fargate BART-CNN summarization
const summarizeWithFargate = async (title, content) => {
  if (!FARGATE_SUMMARIZER_URL || !FARGATE_API_KEY) {
    console.warn('⚠️ Fargate not configured, using fallback cleaning');
    return clean(content);
  }

  try {
    const response = await fetch(FARGATE_SUMMARIZER_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${FARGATE_API_KEY}`
      },
      body: JSON.stringify({
        title: title?.substring(0, 200) || '',
        content: content?.substring(0, 2000) || '',
        model: 'facebook/bart-large-cnn',
        max_length: 150,
        min_length: 50,
        do_sample: false
      }),
      timeout: 30000 // 30 second timeout
    });

    if (!response.ok) {
      throw new Error(`Fargate API error: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    if (result.summary && result.summary.length > 20) {
      console.log(`✅ Fargate summarized: "${title?.substring(0, 50)}..."`);
      return result.summary;
    } else {
      throw new Error('Empty or invalid summary from Fargate');
    }
  } catch (error) {
    console.warn(`⚠️ Fargate summarization failed for "${title?.substring(0, 30)}...": ${error.message}`);
    return clean(content);
  }
};

// === UPDATED CATEGORIES FOR NEW STRUCTURE ===
const CATEGORY_MAPPING = {
  // Old categories -> New categories
  'Health': 'Hope in Struggle',
  'Innovation & Tech': 'AI Watch',
  'Environment & Sustainability': 'Hope in Struggle',
  'Education': 'Hope in Struggle',
  'Science & Space': 'AI Watch',
  'Humanitarian & Rescue': 'Hope in Struggle',
  'Blindspot': 'Justice Lens',
  'Viral': 'Hope in Struggle',
  // New categories stay as-is
  'Movement Tracker + Accountability': 'Movement Tracker + Accountability',
  'Capitalism & Inequality Watch': 'Capitalism & Inequality Watch',
  'Justice Lens': 'Justice Lens',
  'Hope in Struggle': 'Hope in Struggle',
  'AI Watch': 'AI Watch'
};

// Smart categorization based on content
const smartCategorize = (title, content, defaultCategory) => {
  const text = (title + ' ' + content).toLowerCase();
  
  if (/(policy|government|democracy|voting|election|legislation|budget|accountability|movement|organizing|petition|protest|advocacy|campaign)/i.test(text)) {
    return 'Movement Tracker + Accountability';
  }
  if (/(wage|inequality|ceo|tax|rent|housing|wealth|capitalism|worker|income|poverty|class|economic|cost of living)/i.test(text)) {
    return 'Capitalism & Inequality Watch';
  }
  if (/(justice|civil rights|police|court|legal|discrimination|equality|criminal justice|reform|bias|systemic)/i.test(text)) {
    return 'Justice Lens';
  }
  if (/(ai|artificial intelligence|machine learning|tech|robot|automation|algorithm|neural|data|digital|cyber)/i.test(text)) {
    return 'AI Watch';
  }
  
  return CATEGORY_MAPPING[defaultCategory] || 'Hope in Struggle';
};

// === TIME-BASED CLEANUP CONFIGURATION ===
const CLEANUP_CONFIG = {
  viral: {
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    category: 'Hope in Struggle' // Updated from 'Viral'
  },
  regular: {
    maxAge: 36 * 60 * 60 * 1000, // 36 hours
    categories: ['Movement Tracker + Accountability', 'Capitalism & Inequality Watch', 'Justice Lens', 'AI Watch']
  }
};

// === AUTOMATED TIME-BASED CLEANUP FUNCTION ===
const performTimeBasedCleanup = async () => {
  try {
    console.log('\n🧹 PERFORMING TIME-BASED CLEANUP...');
    
    const now = new Date();
    let totalDeleted = 0;
    
    // 1. Clean up articles from Hope in Struggle (formerly Viral) older than 24 hours
    const viralCutoff = new Date(now.getTime() - CLEANUP_CONFIG.viral.maxAge).toISOString();
    console.log(`🔥 Cleaning Hope in Struggle articles older than: ${viralCutoff}`);
    
    const { data: deletedViral, error: viralError } = await supabase
      .from('news')
      .delete()
      .eq('category', CLEANUP_CONFIG.viral.category)
      .lt('created_at', viralCutoff);
    
    if (viralError) {
      console.error('❌ Error cleaning viral articles:', viralError.message);
    } else {
      const viralCount = deletedViral?.length || 0;
      totalDeleted += viralCount;
      console.log(`✅ Deleted ${viralCount} old Hope in Struggle articles`);
    }
    
    // 2. Clean up Regular category articles older than 36 hours
    const regularCutoff = new Date(now.getTime() - CLEANUP_CONFIG.regular.maxAge).toISOString();
    console.log(`📰 Cleaning regular articles older than: ${regularCutoff}`);
    
    for (const category of CLEANUP_CONFIG.regular.categories) {
      const { data: deletedRegular, error: regularError } = await supabase
        .from('news')
        .delete()
        .eq('category', category)
        .lt('created_at', regularCutoff);
      
      if (regularError) {
        console.error(`❌ Error cleaning ${category} articles:`, regularError.message);
      } else {
        const regularCount = deletedRegular?.length || 0;
        totalDeleted += regularCount;
        console.log(`✅ Deleted ${regularCount} old ${category} articles`);
      }
    }
    
    // 3. Clean up duplicate articles based on URL (keep newest)
    console.log('🔄 Removing duplicate articles...');
    const { data: duplicates } = await supabase
      .from('news')
      .select('url, id, created_at')
      .order('created_at', { ascending: false });
    
    if (duplicates) {
      const seen = new Set();
      const toDelete = [];
      
      duplicates.forEach(item => {
        if (seen.has(item.url)) {
          toDelete.push(item.id);
        } else {
          seen.add(item.url);
        }
      });
      
      if (toDelete.length > 0) {
        const { error: dupError } = await supabase
          .from('news')
          .delete()
          .in('id', toDelete);
        
        if (!dupError) {
          totalDeleted += toDelete.length;
          console.log(`🧹 Removed ${toDelete.length} duplicate articles`);
        }
      }
    }
    
    // 4. Clean up very old articles (older than 7 days) regardless of category
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const { data: veryOld, error: oldError } = await supabase
      .from('news')
      .delete()
      .lt('created_at', sevenDaysAgo);
    
    if (!oldError && veryOld) {
      const oldCount = veryOld.length || 0;
      totalDeleted += oldCount;
      console.log(`🗑️ Removed ${oldCount} very old articles (7+ days)`);
    }
    
    console.log(`\n✅ CLEANUP COMPLETE: Removed ${totalDeleted} total articles`);
    
    // Log cleanup statistics
    const { data: remainingStats } = await supabase
      .from('news')
      .select('category, created_at')
      .order('created_at', { ascending: false });
    
    if (remainingStats) {
      const categoryStats = {};
      remainingStats.forEach(article => {
        const category = article.category || 'Unknown';
        if (!categoryStats[category]) categoryStats[category] = 0;
        categoryStats[category]++;
      });
      
      console.log('\n📊 REMAINING ARTICLES BY CATEGORY:');
      Object.entries(categoryStats).forEach(([category, count]) => {
        console.log(`   ${category}: ${count} articles`);
      });
    }
    
    return { success: true, deletedCount: totalDeleted };
    
  } catch (error) {
    console.error('❌ Cleanup error:', error.message);
    return { success: false, error: error.message };
  }
};

// === ENHANCED IMAGE EXTRACTION WITH BETTER FALLBACKS ===
const extractBestImage = async (item, rawContent, category) => {
  // Updated category-specific fallback images
  const fallbackImages = {
    'Hope in Struggle': [
      'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=800&h=600&fit=crop',
      'https://source.unsplash.com/800x600/?community,hope,together'
    ],
    'AI Watch': [
      'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=800&h=600&fit=crop',
      'https://source.unsplash.com/800x600/?technology,ai,innovation'
    ],
    'Movement Tracker + Accountability': [
      'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=800&h=600&fit=crop',
      'https://source.unsplash.com/800x600/?democracy,voting,protest'
    ],
    'Capitalism & Inequality Watch': [
      'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&h=600&fit=crop',
      'https://source.unsplash.com/800x600/?economy,workers,inequality'
    ],
    'Justice Lens': [
      'https://images.unsplash.com/photo-1589578527966-fdac0f44566c?w=800&h=600&fit=crop',
      'https://source.unsplash.com/800x600/?justice,legal,rights'
    ]
  };

  // Try original sources first
  const imageSources = [
    item.enclosure?.url,
    item['media:content']?.$.url,
    item['media:thumbnail']?.$.url,
    // Extract from content
    rawContent?.match(/<img[^>]+src="([^"]+)"/)?.[1],
    rawContent?.match(/https?:\/\/[^\s]+\.(jpg|jpeg|png|gif|webp)/i)?.[0]
  ].filter(url => url && isValidImageUrl(url));

  // Return first valid image or category fallback
  for (const url of imageSources) {
    if (await testImageUrl(url)) {
      return url;
    }
  }

  // Return category-specific fallbacks
  const categoryFallbacks = fallbackImages[category] || fallbackImages['Hope in Struggle'];
  return categoryFallbacks[0];
};

const isValidImageUrl = (url) => {
  try {
    const parsedUrl = new URL(url);
    return parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:';
  } catch {
    return false;
  }
};

const testImageUrl = async (url) => {
  try {
    // Simple head request to check if image exists
    const response = await fetch(url, { method: 'HEAD', timeout: 5000 });
    return response.ok && response.headers.get('content-type')?.startsWith('image/');
  } catch {
    return false;
  }
};

// === ENHANCED CONTENT CLEANING FOR BETTER SUMMARIES ===
const clean = (html) => {
  if (!html) return '';
  try {
    // First, remove problematic elements that cause truncation
    let cleanHtml = html
      .replace(/<script[^>]*>.*?<\/script>/gi, '')
      .replace(/<style[^>]*>.*?<\/style>/gi, '')
      .replace(/\[https?:\/\/[^\]]+\]/g, '') // Remove URL references
      .replace(/https?:\/\/[^\s\]]+/g, '') // Remove standalone URLs
      .replace(/\[[^\]]*\.(jpg|png|gif|jpeg|webp|svg)\]/gi, '') // Remove image references
      .replace(/wordpress-assets\.[^\s\]]+/g, '') // Remove WordPress assets
      .replace(/cdn\.[^\s\]]+/g, '') // Remove CDN references
      .replace(/static\.[^\s\]]+/g, ''); // Remove static file references

    const converted = convert(cleanHtml, {
      wordwrap: false,
      selectors: [{ selector: 'a', options: { ignoreHref: true } }]
    }).trim();

    // Clean up the converted text further
    return converted
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .replace(/\n+/g, ' ') // Replace newlines with spaces
      .slice(0, 800); // Longer content for better summaries
  } catch {
    return '';
  }
};

// === POSITIVE/NEGATIVE KEYWORDS ===
const POSITIVE_KEYWORDS = [
  'breakthrough', 'success', 'achievement', 'innovation', 'cure', 'recovery',
  'improvement', 'progress', 'celebration', 'award', 'victory', 'solution',
  'discovery', 'advancement', 'positive', 'benefit', 'help', 'support',
  'launch', 'create', 'build', 'develop', 'honor', 'celebrate', 'win',
  'expand', 'transform', 'uplift', 'resolve', 'educate', 'protect', 'heal',
  'rescued', 'saved', 'hero', 'heroic', 'brave', 'courage', 'volunteer',
  'evacuate', 'evacuation', 'relief', 'aid', 'donate', 'donation',
  'rebuild', 'restore', 'recover', 'resilience', 'survivor', 'survive',
  'first responder', 'emergency response', 'search and rescue',
  'good samaritan', 'community support', 'helping hand', 'lifesaver',
  'selfless', 'compassion', 'kindness', 'generous', 'solidarity',
  'miracle', 'hope', 'inspiring', 'remarkable', 'extraordinary',
  'overcome', 'triumph', 'persevere', 'strength', 'unity',
  'neighbor helping neighbor', 'came together', 'rallied',
  'shelter', 'refuge', 'sanctuary', 'safety', 'protection'
];

const NEGATIVE_KEYWORDS = [
  'death', 'killed', 'murder', 'attack', 'war', 'disaster', 'crisis',
  'threat', 'danger', 'problem', 'failure', 'crash', 'collapse', 'decline',
  'devastating', 'destruction', 'catastrophic', 'tragic', 'horror',
  'nightmare', 'chaos', 'panic', 'terror', 'helpless', 'trapped',
  'missing', 'feared dead', 'body count', 'casualty', 'victim',
  'unprecedented damage', 'total loss', 'wiped out', 'flattened',
  'without hope', 'dire situation', 'worst case', 'no survivors'
];

// === KEYWORD SCORING ===
const calculateKeywordScore = (text) => {
  const lowerText = text.toLowerCase();
  let positiveCount = 0;
  let negativeCount = 0;

  POSITIVE_KEYWORDS.forEach(keyword => {
    if (lowerText.includes(keyword)) positiveCount++;
  });

  NEGATIVE_KEYWORDS.forEach(keyword => {
    if (lowerText.includes(keyword)) negativeCount++;
  });

  // Base score of 5, +1 for each positive keyword, -2 for each negative keyword
  const score = Math.max(1, Math.min(10, 5 + positiveCount - (negativeCount * 2)));
  return score;
};

// === RSS FEED SOURCES WITH UPDATED CATEGORIES ===
const RSS_SOURCES = [
  { 
    url: 'https://www.goodnewsnetwork.org/feed/', 
    name: 'Good News Network', 
    category: 'Hope in Struggle',
    viral: false
  },
  { 
    url: 'https://www.positive.news/feed/', 
    name: 'Positive News', 
    category: 'Hope in Struggle',
    viral: false
  },
  { 
    url: 'https://www.upworthy.com/rss', 
    name: 'Upworthy', 
    category: 'Hope in Struggle',
    viral: true
  },
  { 
    url: 'https://techcrunch.com/feed/', 
    name: 'TechCrunch', 
    category: 'AI Watch',
    viral: true
  },
  { 
    url: 'https://www.theverge.com/rss/index.xml', 
    name: 'The Verge', 
    category: 'AI Watch',
    viral: false
  },
  {
    url: 'https://www.npr.org/rss/rss.php?id=1001',
    name: 'NPR News',
    category: 'Movement Tracker + Accountability',
    viral: false
  },
  {
    url: 'https://feeds.propublica.org/propublica/main',
    name: 'ProPublica',
    category: 'Movement Tracker + Accountability', 
    viral: false
  },
  {
    url: 'https://www.democracynow.org/democracynow.rss',
    name: 'Democracy Now',
    category: 'Movement Tracker + Accountability',
    viral: false
  },
  {
    url: 'https://www.theguardian.com/world/rss',
    name: 'The Guardian World',
    category: 'Justice Lens',
    viral: false
  },
  {
    url: 'https://jacobinmag.com/feed/',
    name: 'Jacobin Magazine',
    category: 'Capitalism & Inequality Watch',
    viral: false
  }
];

// === PROCESS SINGLE ARTICLE ===
const processArticle = async (item, feedSource) => {
  try {
    const title = item.title || 'Untitled';
    const rawContent = item.content || item.description || item.summary || '';
    const cleanedContent = clean(rawContent);
    
    if (!cleanedContent || cleanedContent.length < 50) {
      return null; // Skip articles with insufficient content
    }

    // Smart categorization
    const category = smartCategorize(title, cleanedContent, feedSource.category);
    
    // Use Fargate for summarization
    const summary = await summarizeWithFargate(title, cleanedContent);
    
    // Calculate scores
    const positivityScore = calculateKeywordScore(title + ' ' + summary);
    const viralityScore = feedSource.viral ? Math.min(8, positivityScore) : 0;
    
    // Extract best image
    const imageUrl = await extractBestImage(item, rawContent, category);

    return {
      title: title.substring(0, 200),
      url: item.link || item.guid || '',
      summary: summary,
      content: cleanedContent.substring(0, 1000),
      published_at: item.pubDate || item.isoDate || new Date().toISOString(),
      created_at: new Date().toISOString(),
      category: category,
      author: item.author || item.creator || feedSource.name,
      image_url: imageUrl,
      source_name: feedSource.name,
      positivity_score: positivityScore,
      virality_score: viralityScore,
      is_ad: false,
      sentiment: 'positive'
    };
    
  } catch (error) {
    console.error(`Error processing article "${item.title}":`, error.message);
    return null;
  }
};

// === PROCESS RSS FEED ===
const processRSSFeed = async (source) => {
  try {
    console.log(`📡 Processing ${source.name}...`);
    const feed = await parser.parseURL(source.url);
    
    if (!feed.items || feed.items.length === 0) {
      console.log(`⚠️ No items found in ${source.name}`);
      return [];
    }

    const articles = [];
    const limit = source.viral ? 5 : 10; // Fewer viral articles

    for (let i = 0; i < Math.min(feed.items.length, limit); i++) {
      const article = await processArticle(feed.items[i], source);
      if (article) {
        articles.push(article);
      }
      
      // Small delay to avoid overwhelming Fargate
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log(`✅ ${source.name}: processed ${articles.length} articles`);
    return articles;
    
  } catch (error) {
    console.error(`❌ Failed to process ${source.name}:`, error.message);
    return [];
  }
};

// === SAVE TO SUPABASE ===
const saveArticlesToSupabase = async (articles) => {
  if (!articles.length) return 0;

  try {
    // Check for existing URLs to avoid duplicates
    const urls = articles.map(a => a.url);
    const { data: existing } = await supabase
      .from('news')
      .select('url')
      .in('url', urls);

    const existingUrls = new Set(existing?.map(item => item.url) || []);
    const newArticles = articles.filter(article => !existingUrls.has(article.url));

    if (newArticles.length === 0) {
      console.log('ℹ️ No new articles to save (all duplicates)');
      return 0;
    }

    const { data, error } = await supabase
      .from('news')
      .insert(newArticles)
      .select('id');

    if (error) {
      throw error;
    }

    console.log(`💾 Saved ${newArticles.length} new articles to Supabase`);
    return newArticles.length;

  } catch (error) {
    console.error('❌ Error saving to Supabase:', error.message);
    return 0;
  }
};

// === MAIN EXECUTION ===
const main = async () => {
  const startTime = Date.now();
  console.log(`🤖 RSS Scraper with Fargate BART-CNN - ${new Date().toLocaleString()}`);
  console.log(`⏰ Scheduled for 2am UTC to avoid conflicts`);
  
  // STEP 1: Perform cleanup
  const cleanupResult = await performTimeBasedCleanup();
  
  if (!cleanupResult.success) {
    console.error('⚠️ Cleanup failed, but continuing with scraping...');
  }
  
  let totalArticles = 0;
  const allArticles = [];
  
  // STEP 2: Process all RSS sources
  console.log('\n📰 PROCESSING RSS SOURCES...');
  
  for (const source of RSS_SOURCES) {
    const articles = await processRSSFeed(source);
    allArticles.push(...articles);
    totalArticles += articles.length;
    
    // Delay between feeds to be respectful
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  // STEP 3: Save to Supabase
  console.log('\n💾 SAVING TO SUPABASE...');
  const savedCount = await saveArticlesToSupabase(allArticles);
  
  // STEP 4: Final report
  const totalTime = ((Date.now() - startTime) / 1000 / 60).toFixed(1);
  const categoryBreakdown = allArticles.reduce((acc, article) => {
    acc[article.category] = (acc[article.category] || 0) + 1;
    return acc;
  }, {});
  
  console.log('\n🤖 EXECUTION COMPLETE');
  console.log('═══════════════════════════════════════');
  console.log(`📈 Total processed: ${totalArticles} articles`);
  console.log(`💾 Saved to DB: ${savedCount} new articles`);
  console.log(`🧹 Cleaned: ${cleanupResult.deletedCount || 0} old articles`);
  console.log(`⏱️ Total time: ${totalTime} minutes`);
  console.log('\n📊 CATEGORY BREAKDOWN:');
  Object.entries(categoryBreakdown).forEach(([category, count]) => {
    console.log(`   ${category}: ${count} articles`);
  });
  console.log(`🔄 Next run: 2am UTC tomorrow`);
  
  process.exit(0);
};

// Handle errors and run
main().catch(error => {
  console.error('💥 CRITICAL ERROR:', error);
  process.exit(1);
});
