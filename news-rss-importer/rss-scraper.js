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

// === TIME-BASED CLEANUP CONFIGURATION ===
const CLEANUP_CONFIG = {
  viral: {
    maxAge: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
    category: 'Viral'
  },
  regular: {
    maxAge: 36 * 60 * 60 * 1000, // 36 hours in milliseconds
    categories: ['Health', 'Innovation & Tech', 'Environment & Sustainability', 'Education', 'Science & Space', 'Humanitarian & Rescue', 'Blindspot']
  }
};

// === AUTOMATED TIME-BASED CLEANUP FUNCTION ===
const performTimeBasedCleanup = async () => {
  try {
    console.log('\n🧹 PERFORMING TIME-BASED CLEANUP...');
    
    const now = new Date();
    let totalDeleted = 0;
    
    // 1. Clean up Viral articles older than 24 hours
    const viralCutoff = new Date(now.getTime() - CLEANUP_CONFIG.viral.maxAge).toISOString();
    console.log(`🔥 Cleaning Viral articles older than: ${viralCutoff}`);
    
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
      console.log(`✅ Deleted ${viralCount} old viral articles`);
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
  // Improved category-specific fallback images with better sources
  const fallbackImages = {
    'Viral': [
      'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=800&h=600&fit=crop',
      'https://source.unsplash.com/800x600/?viral,social,trending'
    ],
    'Health': [
      'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=800&h=600&fit=crop',
      'https://source.unsplash.com/800x600/?health,medical,wellness'
    ],
    'Innovation & Tech': [
      'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=800&h=600&fit=crop',
      'https://source.unsplash.com/800x600/?technology,innovation'
    ],
    'Environment & Sustainability': [
      'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&h=600&fit=crop',
      'https://source.unsplash.com/800x600/?environment,nature,sustainability'
    ],
    'Education': [
      'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800&h=600&fit=crop',
      'https://source.unsplash.com/800x600/?education,learning,school'
    ],
    'Science & Space': [
      'https://images.unsplash.com/photo-1446776653964-20c1d3a81b06?w=800&h=600&fit=crop',
      'https://source.unsplash.com/800x600/?science,space,astronomy'
    ],
    'Humanitarian & Rescue': [
      'https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?w=800&h=600&fit=crop',
      'https://source.unsplash.com/800x600/?humanitarian,help,community'
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
  const categoryFallbacks = fallbackImages[category] || fallbackImages['Viral'];
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

// === REST OF THE EXISTING CODE WITH CLEANUP INTEGRATION ===
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
  'without hope', 'dire situation', 'worst case', 'no survivors',
  'layoffs', 'fired', 'firing', 'cuts jobs', 'cutting jobs', 'eliminate jobs',
  'downsizing', 'restructuring', 'budget cuts', 'austerity', 'redundancy',
  'job losses', 'unemployment', 'workforce reduction', 'cost cutting',
  'efficiency measures', 'streamlining', 'automation replacing',
  'AI replaces', 'robots replace', 'automated away', 'human jobs lost',
  'replace workers', 'eliminate positions', 'reduce headcount',
  'tough decisions', 'necessary cuts', 'right-sizing', 'optimization',
  'synergies', 'realignment', 'consolidation', 'cost optimization'
];

// [Include all the existing keyword arrays and functions...]

// === MAIN EXECUTION WITH TIME-BASED CLEANUP ===
const main = async () => {
  const startTime = Date.now();
  console.log(`🤖 RSS Scraper with Time-Based Cleanup - ${new Date().toLocaleString()}`);
  
  // STEP 1: Perform time-based cleanup BEFORE adding new content
  const cleanupResult = await performTimeBasedCleanup();
  
  if (!cleanupResult.success) {
    console.error('⚠️ Cleanup failed, but continuing with scraping...');
  }
  
  let totalViral = 0;
  let totalRegular = 0;
  let newStories = [];
  
  // STEP 2: Process viral content (will be cleaned up after 24 hours)
  console.log('\n🔥 PROCESSING VIRAL CONTENT...');
  // [Include existing viral processing code...]
  
  // STEP 3: Process regular categories (will be cleaned up after 36 hours)
  console.log('\n📰 PROCESSING REGULAR CATEGORIES...');
  // [Include existing regular processing code...]
  
  // STEP 4: Final report
  const totalTime = ((Date.now() - startTime) / 1000 / 60).toFixed(1);
  console.log('\n🤖 EXECUTION COMPLETE WITH CLEANUP');
  console.log('═══════════════════════════════════════');
  console.log(`📈 New stories: ${totalViral + totalRegular} (${totalViral} viral, ${totalRegular} regular)`);
  console.log(`🧹 Cleaned: ${cleanupResult.deletedCount || 0} old articles`);
  console.log(`⏱️ Total time: ${totalTime} minutes`);
  console.log(`🔄 Next cleanup: Viral in 24hrs, Regular in 36hrs`);
  
  process.exit(0);
};

// [Include all other existing functions like viral processing, etc...]

main().catch(error => {
  console.error('💥 CRITICAL ERROR:', error);
  process.exit(1);
});
