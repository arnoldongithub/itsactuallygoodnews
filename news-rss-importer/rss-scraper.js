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
  timeout: 20000,
  customFields: { 
    item: ['pubDate', 'description', 'content', 'author', 'media:content', 'media:thumbnail', 'enclosure', 'content:encoded'] 
  }
});

// === Enhanced Keywords for Catastrophe Heroes ===
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

// === NEW: Blindspot Keywords (underreported stories) ===
const BLINDSPOT_KEYWORDS = [
  'underreported', 'overlooked', 'ignored', 'unnoticed', 'hidden',
  'lesser known', 'unreported', 'overlooked crisis', 'forgotten',
  'developing world', 'rural', 'remote', 'isolated', 'marginalized',
  'indigenous', 'local community', 'small town', 'village',
  'grassroots', 'local hero', 'unsung hero', 'quiet revolution',
  'behind the scenes', 'off the radar', 'untold story',
  'rarely mentioned', 'seldom reported', 'little known fact'
];

// === NEW: Enhanced Viral Keywords for Better Detection ===
const VIRAL_KEYWORDS = [
  // Emotional triggers
  'amazing', 'incredible', 'unbelievable', 'stunning', 'remarkable', 'extraordinary',
  'heartwarming', 'inspiring', 'uplifting', 'touching', 'beautiful', 'wonderful',
  
  // Social proof
  'viral', 'trending', 'everyone is talking about', 'breaks the internet', 'goes viral',
  'thousands share', 'millions watch', 'people are loving', 'internet can\'t stop',
  
  // Achievement words
  'first ever', 'record-breaking', 'historic', 'milestone', 'breakthrough', 'game-changer',
  'revolutionary', 'never before seen', 'unprecedented success',
  
  // Human interest
  'little girl', 'young boy', 'grandmother', 'veteran', 'teacher', 'nurse', 'doctor',
  'student', 'community comes together', 'neighbors help', 'strangers unite',
  
  // Feel-good actions
  'pays it forward', 'random act of kindness', 'surprises', 'gives back', 'helps out',
  'makes a difference', 'changes lives', 'spreads joy', 'brings hope'
];

// === Enhanced Feeds with More Viral and Positive Sources ===
const FEEDS = {
  'Health': [
    // Current feeds (keep these)
    'https://medicalxpress.com/rss-feed/health-news/',
    'https://www.sciencedaily.com/rss/health_medicine.xml',
    // NEW: More viral health sources
    'https://www.goodnewsnetwork.org/category/health/feed/',
    'https://feeds.feedburner.com/healthline/health-news',
    'https://www.medicalnewstoday.com/rss',
    'https://www.webmd.com/rss/rss.aspx?RSSSource=RSS_PUBLIC',
    'https://www.prevention.com/feed/',
    'https://www.upworthy.com/health/rss',
    'https://brightvibes.com/feed/?category=health'
  ],

  'Innovation & Tech': [
    // Current feeds (keep the good ones)
    'https://feeds.feedburner.com/TechCrunch/',
    'https://www.theverge.com/rss/index.xml',
    // NEW: More viral tech sources
    'https://feeds.feedburner.com/oreilly/radar',
    'https://www.wired.com/feed/rss',
    'https://mashable.com/feeds/rss/all',
    'https://www.fastcompany.com/technology/rss',
    'https://spectrum.ieee.org/rss/fulltext',
    'https://www.goodnewsnetwork.org/category/technology/feed/',
    'https://futurism.com/feed',
    'https://singularityhub.com/feed/',
    'https://www.upworthy.com/tech/rss'
  ],

  'Environment & Sustainability': [
    // Current feeds
    'https://grist.org/feed/',
    'https://www.treehugger.com/feeds/rss',
    // NEW: More viral environmental sources
    'https://www.goodnewsnetwork.org/category/earth/feed/',
    'https://www.ecowatch.com/feeds/latest.rss',
    'https://www.greenbiz.com/feeds/all',
    'https://e360.yale.edu/feed',
    'https://www.worldwildlife.org/feeds/news.xml',
    'https://brightvibes.com/feed/?category=environment',
    'https://www.upworthy.com/environment/rss',
    'https://www.positive.news/environment/feed/',
    'https://cleantechnica.com/feed/'
  ],

  'Education': [
    // Current feed
    'https://hechingerreport.org/feed/',
    // NEW: More viral education sources
    'https://www.goodnewsnetwork.org/category/inspiring/feed/',
    'https://www.edweek.org/feeds/all.rss',
    'https://www.edsurge.com/news.rss',
    'https://brightvibes.com/feed/?category=education',
    'https://www.upworthy.com/education/rss',
    'https://www.positive.news/society/education/feed/',
    'https://www.teachforamerica.org/feed',
    'https://www.khanacademy.org/about/blog/rss.xml'
  ],

  'Science & Space': [
    // Current feeds (keep these)
    'https://feeds.feedburner.com/spaceflightnow',
    'https://www.sciencedaily.com/rss/space_time.xml',
    'https://phys.org/rss-feed/space-news/',
    // NEW: More viral science sources
    'https://www.space.com/feeds/all',
    'https://www.nasa.gov/rss/dyn/breaking_news.rss',
    'https://www.scientificamerican.com/feeds/rss/news/',
    'https://www.livescience.com/feeds/all',
    'https://www.goodnewsnetwork.org/category/science/feed/',
    'https://brightvibes.com/feed/?category=science',
    'https://www.upworthy.com/science/rss',
    'https://www.iflscience.com/rss.xml',
    'https://spaceflightnow.com/feed/'
  ],

  'Humanitarian & Rescue': [
    // Current feeds (keep these)
    'https://reliefweb.int/updates/rss.xml',
    'https://www.unicef.org/feeds/news-releases.xml',
    'https://www.unhcr.org/rss/news.xml',
    'https://www.redcross.org/news.rss',
    // NEW: More viral humanitarian sources
    'https://www.goodnewsnetwork.org/category/heroes/feed/',
    'https://www.upworthy.com/heroes/rss',
    'https://brightvibes.com/feed/?category=heroes',
    'https://www.positive.news/society/community/feed/',
    'https://www.dosomething.org/us/rss.xml',
    'https://www.volunteermatch.org/blog/feed/',
    'https://www.globalcitizen.org/en/rss/',
    'https://www.rescue.org/rss.xml',
    'https://www.oxfam.org/en/rss.xml'
  ],

  // Enhanced Blindspot sources for underreported positive stories
  'Blindspot': [
    // Current feeds (keep the good ones)
    'https://globalvoices.org/-/world/feed/',
    'https://www.devex.com/news.rss',
    'https://www.bbc.com/news/world/rss.xml',
    // NEW: Better sources for underreported positive stories
    'https://www.positive.news/feed/',
    'https://www.goodnewsnetwork.org/feed/',
    'https://brightvibes.com/feed/',
    'https://www.upworthy.com/rss',
    'https://www.happynews.com/feeds/index.rss',
    'https://www.sunnyskyz.com/feeds/good-news.xml',
    'https://www.boredpanda.com/feed/',
    'https://mymodernmet.com/feed/',
    'https://www.amusingplanet.com/feeds/posts/default',
    'https://www.mentalfloss.com/feeds/rss.xml',
    'https://restofworld.org/feed/',
    'https://apnews.com/apf-oddnews',
    'https://www.atlasobscura.com/feeds/latest'
  ]
};

// === IMPROVED IMAGE HANDLING ===

// Enhanced fallback images with higher quality and variety
const FALLBACK_IMAGES = {
  Health: [
    'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=800&h=600&fit=crop&crop=center',
    'https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?w=800&h=600&fit=crop&crop=center',
    'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?w=800&h=600&fit=crop&crop=center'
  ],
  'Innovation & Tech': [
    'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=800&h=600&fit=crop&crop=center',
    'https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?w=800&h=600&fit=crop&crop=center',
    'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800&h=600&fit=crop&crop=center'
  ],
  'Environment & Sustainability': [
    'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&h=600&fit=crop&crop=center',
    'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=800&h=600&fit=crop&crop=center',
    'https://images.unsplash.com/photo-1466611653911-95081537e5b7?w=800&h=600&fit=crop&crop=center'
  ],
  Education: [
    'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=800&h=600&fit=crop&crop=center',
    'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=800&h=600&fit=crop&crop=center',
    'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800&h=600&fit=crop&crop=center'
  ],
  'Science & Space': [
    'https://images.unsplash.com/photo-1446776877081-d282a0f896e2?w=800&h=600&fit=crop&crop=center',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=600&fit=crop&crop=center',
    'https://images.unsplash.com/photo-1581833971358-2c8b550f87b3?w=800&h=600&fit=crop&crop=center'
  ],
  'Humanitarian & Rescue': [
    'https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?w=800&h=600&fit=crop&crop=center',
    'https://images.unsplash.com/photo-1593113598332-cd288d649433?w=800&h=600&fit=crop&crop=center',
    'https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?w=800&h=600&fit=crop&crop=center'
  ],
  'Blindspot': [
    'https://images.unsplash.com/photo-1554774853-719586f82d77?w=800&h=600&fit=crop&crop=center',
    'https://images.unsplash.com/photo-1573164713714-d95e436ab8d6?w=800&h=600&fit=crop&crop=center',
    'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=800&h=600&fit=crop&crop=center'
  ]
};

// Image cache to avoid repeated validation
const imageValidationCache = new Map();

const isValidUrl = (url) => {
  try {
    const parsedUrl = new URL(url);
    return parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:';
  } catch {
    return false;
  }
};

const isValidImageUrl = async (url) => {
  if (!url || !isValidUrl(url)) return false;
  
  // Check cache first
  if (imageValidationCache.has(url)) {
    return imageValidationCache.get(url);
  }
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // Increased timeout
    
    const response = await fetch(url, { 
      method: 'HEAD', 
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; NewsBot/1.0)',
        'Accept': 'image/*'
      }
    });
    
    clearTimeout(timeoutId);
    
    const contentType = response.headers.get('content-type');
    const contentLength = response.headers.get('content-length');
    
    // More robust validation
    const isValid = response.ok && 
                   contentType?.startsWith('image/') && 
                   (!contentLength || parseInt(contentLength) > 1000); // Minimum 1KB
    
    // Cache the result
    imageValidationCache.set(url, isValid);
    return isValid;
    
  } catch (error) {
    imageValidationCache.set(url, false);
    return false;
  }
};

// Enhanced HTML image extraction with better patterns
const extractImageFromHTML = (html) => {
  if (!html) return null;
  
  const patterns = [
    // Open Graph image (highest priority)
    /<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["'][^>]*>/gi,
    // Twitter card image
    /<meta[^>]*name=["']twitter:image["'][^>]*content=["']([^"']+)["'][^>]*>/gi,
    // Article images with better selectors
    /<img[^>]*class=["'][^"']*(?:article|featured|hero|main|content)[^"']*["'][^>]*src=["']([^"']+)["'][^>]*>/gi,
    // WordPress featured images
    /<img[^>]*class=["'][^"']*(?:wp-post-image|attachment)[^"']*["'][^>]*src=["']([^"']+)["'][^>]*>/gi,
    // General img tags with size indicators (prefer larger images)
    /<img[^>]*(?:width=["']?(?:[5-9]\d{2,}|[1-9]\d{3,})["']?|height=["']?(?:[3-9]\d{2,}|[1-9]\d{3,})["']?)[^>]*src=["']([^"']+)["'][^>]*>/gi,
    // Any img tag (lowest priority)
    /<img[^>]+src=["']([^"']+)["'][^>]*>/gi
  ];
  
  const excludePatterns = [
    /icon/i, /logo/i, /avatar/i, /profile/i, /badge/i, /button/i, /ad/i, /advertisement/i,
    /\.gif$/i, /tracking/i, /1x1/i, /pixel/i
  ];
  
  for (const pattern of patterns) {
    const matches = Array.from(html.matchAll(pattern));
    for (const match of matches) {
      const url = match[1];
      if (url && isValidUrl(url) && !excludePatterns.some(p => p.test(url))) {
        return url;
      }
    }
  }
  
  return null;
};

// Enhanced RSS item image extraction with better priority and error handling
const extractBestImage = async (item, rawContent, category, feedUrl) => {
  console.log(`🖼️ Extracting image for: ${item.title?.substring(0, 50)}...`);

  const imageCandidates = [];

  // Method 1: RSS enclosure (highest priority for RSS)
  if (item.enclosure?.url) {
    imageCandidates.push({ url: item.enclosure.url, priority: 10, source: 'enclosure' });
  }

  // Method 2: Media namespace variations
  const mediaFields = ['media:content', 'media:thumbnail', 'media:group'];
  for (const field of mediaFields) {
    if (item[field]) {
      const mediaContent = Array.isArray(item[field]) ? item[field][0] : item[field];
      if (mediaContent?.$ && mediaContent.$.url) {
        imageCandidates.push({ url: mediaContent.$.url, priority: 9, source: field });
      } else if (typeof mediaContent === 'string' && isValidUrl(mediaContent)) {
        imageCandidates.push({ url: mediaContent, priority: 9, source: field });
      }
    }
  }

  // Method 3: Content-based extraction (works for encoded content)
  const contentSources = [
    { content: rawContent, priority: 8, source: 'raw-content' },
    { content: item['content:encoded'], priority: 8, source: 'content:encoded' },
    { content: item.content, priority: 7, source: 'content' },
    { content: item.description, priority: 6, source: 'description' }
  ];

  for (const { content, priority, source } of contentSources) {
    if (content) {
      const imageFromContent = extractImageFromHTML(content);
      if (imageFromContent) {
        imageCandidates.push({ url: imageFromContent, priority, source });
      }
    }
  }

  // Method 4: Feed-specific patterns
  if (feedUrl.includes('goodnewsnetwork.org')) {
    const gnPatterns = [
      rawContent?.match(/src="([^"]*goodnewsnetwork[^"]*)"/i),
      item.description?.match(/src="([^"]*goodnewsnetwork[^"]*)"/i)
    ];
    
    for (const pattern of gnPatterns) {
      if (pattern && pattern[1]) {
        imageCandidates.push({ url: pattern[1], priority: 8, source: 'gnn-specific' });
      }
    }
  }

  // Method 5: Try to fetch from article page (if enabled and no good candidates)
  if (process.env.FETCH_FULL_IMAGES === 'true' && item.link && imageCandidates.length < 3) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      const response = await fetch(item.link, {
        signal: controller.signal,
        headers: { 
          'User-Agent': 'Mozilla/5.0 (compatible; NewsBot/1.0)',
          'Accept': 'text/html,application/xhtml+xml'
        }
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        const html = await response.text();
        const pageImage = extractImageFromHTML(html);
        if (pageImage) {
          imageCandidates.push({ url: pageImage, priority: 7, source: 'full-page' });
        }
      }
    } catch (error) {
      console.log(`⚠️ Could not fetch page image from ${item.link}: ${error.message}`);
    }
  }

  // Sort candidates by priority and validate
  imageCandidates.sort((a, b) => b.priority - a.priority);
  
  for (const candidate of imageCandidates) {
    if (await isValidImageUrl(candidate.url)) {
      console.log(`✅ Found valid image (${candidate.source}): ${candidate.url}`);
      return candidate.url;
    } else {
      console.log(`❌ Invalid image (${candidate.source}): ${candidate.url}`);
    }
  }

  // Enhanced fallback: Use category-specific images with rotation
  const fallbackOptions = FALLBACK_IMAGES[category] || FALLBACK_IMAGES['Blindspot'];
  const randomFallback = fallbackOptions[Math.floor(Math.random() * fallbackOptions.length)];
  
  console.log(`🎲 Using enhanced fallback image for category: ${category}`);
  return randomFallback;
};

// Helper function to clean HTML content
const clean = (html) => {
  if (!html) return '';
  try {
    return convert(html, {
      wordwrap: false,
      selectors: [{ selector: 'a', options: { ignoreHref: true } }]
    }).trim().slice(0, 500);
  } catch {
    return '';
  }
};

const computePositivityScore = (title, content) => {
  const text = `${title} ${content}`.toLowerCase();
  const positiveMatches = POSITIVE_KEYWORDS.filter(k => text.includes(k)).length;
  const negativeMatches = NEGATIVE_KEYWORDS.filter(k => text.includes(k)).length;
  return Math.max((positiveMatches * 2) - negativeMatches, 0);
};

// === NEW: Enhanced Virality Scoring for Viral Content ===
const computeViralityScore = (title, content) => {
  const text = `${title} ${content}`.toLowerCase();
  const titleText = title.toLowerCase();
  
  // Count viral keywords
  const viralMatches = VIRAL_KEYWORDS.filter(k => text.includes(k)).length;
  
  // Count positive keywords
  const positiveMatches = POSITIVE_KEYWORDS.filter(k => text.includes(k)).length;
  
  // Check for emotional triggers in title (more weight)
  const titleViralMatches = VIRAL_KEYWORDS.filter(k => titleText.includes(k)).length;
  
  // Calculate viral score (0-10)
  const baseScore = positiveMatches * 1.5;
  const viralBonus = viralMatches * 2;
  const titleBonus = titleViralMatches * 3; // Title keywords worth more
  
  return Math.min(baseScore + viralBonus + titleBonus, 10);
};

// === NEW: Function to determine if story is "blindspot" type ===
const isBlindspotStory = (title, content, category) => {
  const text = `${title} ${content}`.toLowerCase();
  
  // If it's from Blindspot feeds, check for underreported indicators
  if (category === 'Blindspot') {
    const blindspotMatches = BLINDSPOT_KEYWORDS.filter(k => text.includes(k)).length;
    const positiveMatches = POSITIVE_KEYWORDS.filter(k => text.includes(k)).length;
    return blindspotMatches > 0 || positiveMatches > 2; // High positivity OR blindspot keywords
  }
  
  // For other categories, only if explicitly mentions underreported themes
  const blindspotMatches = BLINDSPOT_KEYWORDS.filter(k => text.includes(k)).length;
  return blindspotMatches >= 2; // Stricter for non-blindspot feeds
};

// === Enhanced Good News Detection for Viral Content ===
const isGoodNews = (title, content) => {
  const text = `${title} ${content}`.toLowerCase();
  const titleText = title.toLowerCase();
  
  // Original hero detection
  const hasHero = /\b(saved|rescued|hero|miracle|hope|lifesaver|brave|volunteer)\b/i.test(text);
  const hasDisasterContext = /\b(flood|disaster|storm|crisis|earthquake|wildfire)\b/i.test(text);

  if (hasHero && hasDisasterContext) return true;

  // Enhanced viral detection
  const hasViralTitle = VIRAL_KEYWORDS.some(keyword => titleText.includes(keyword));
  const hasHumanInterest = /\b(boy|girl|man|woman|child|family|community|neighbor|teacher|student|veteran|grandmother|grandfather)\b/i.test(text);
  const hasPositiveAction = /\b(helps|saves|rescues|donates|volunteers|creates|builds|inspires|surprises|gives)\b/i.test(text);
  
  // Original positive detection
  const positiveMatches = POSITIVE_KEYWORDS.filter(k => text.includes(k)).length;
  const negativeMatches = NEGATIVE_KEYWORDS.filter(k => text.includes(k)).length;
  const isOriginallyPositive = (positiveMatches > 0 && (positiveMatches * 2) > negativeMatches);
  
  // Virality score
  const viralityScore = computeViralityScore(title, content);
  
  return isOriginallyPositive || 
         (hasViralTitle && hasHumanInterest) || 
         (hasPositiveAction && viralityScore >= 4) ||
         (hasHumanInterest && hasPositiveAction && viralityScore >= 3);
};

const checkDuplicate = async (title, url) => {
  const { data } = await supabase.from('news')
    .select('id')
    .or(`title.eq.${title},url.eq.${url}`)
    .limit(1);
  return data?.length > 0;
};

const insertArticle = async (article) => {
  const { error } = await supabase.from('news').insert([article]);
  if (error) {
    console.error('❌ Insert error:', error.message);
    return false;
  }
  console.log(`✅ Inserted [${article.category}] (Viral: ${article.virality_score}, Image: ${article.image_url ? '✅' : '❌'}):`, article.title.slice(0, 60) + '...');
  return true;
};

// === NEW: Function to reassign category for blindspot stories ===
const determineFinalCategory = (originalCategory, title, content) => {
  if (isBlindspotStory(title, content, originalCategory)) {
    return 'Blindspot';
  }
  return originalCategory;
};

const processFeed = async (feedUrl, category) => {
  try {
    console.log(`🔗 Processing: ${feedUrl}`);
    const feed = await parser.parseURL(feedUrl);
    let processedCount = 0;
    let blindspotCount = 0;
    let viralCount = 0;
    let realImagesFound = 0;

    for (const item of feed.items.slice(0, 20)) { // Increased limit for more stories
      if (!item.title || !item.link || !isValidUrl(item.link)) continue;
      if (await checkDuplicate(item.title, item.link)) continue;

      const rawContent = item['content:encoded'] || item.content || item.description || '';
      const content = clean(rawContent);
      if (!isGoodNews(item.title, content)) continue;

      // === NEW: Determine final category (may reassign to Blindspot) ===
      const finalCategory = determineFinalCategory(category, item.title, content);
      if (finalCategory === 'Blindspot') blindspotCount++;

      const positivity_score = computePositivityScore(item.title, content);
      const virality_score = computeViralityScore(item.title, content);
      if (virality_score >= 6) viralCount++;

      // === ENHANCED: Better image extraction with feed URL context ===
      const finalImage = await extractBestImage(item, rawContent, finalCategory, feedUrl);
      if (finalImage && !finalImage.includes('unsplash.com') && !finalImage.includes('images.unsplash.com')) {
        realImagesFound++;
      }

      const article = {
        title: item.title.trim().slice(0, 500),
        url: item.link.trim(),
        summary: content.slice(0, 300),
        content,
        published_at: item.pubDate ? new Date(item.pubDate).toISOString() : null,
        category: finalCategory, // This may be "Blindspot" now
        author: item.author?.trim()?.slice(0, 200) || null,
        image_url: finalImage,
        thumbnail_url: finalImage, // Could be made smaller later
        source_feed: feedUrl,
        source_url: item.link.trim(),
        source_name: new URL(item.link).hostname.replace('www.', ''),
        sentiment: 'positive',
        positivity_score,
        virality_score, // NEW: Added virality scoring
        is_ad: false,
        // === NEW: Add metadata for tracking ===
        original_category: category,
        is_blindspot: finalCategory === 'Blindspot'
      };

      await insertArticle(article);
      processedCount++;
      await new Promise(res => setTimeout(res, 200)); // Slightly faster processing
    }

    console.log(`📊 ${new URL(feedUrl).hostname}: ${processedCount} stories (${blindspotCount} → Blindspot, ${viralCount} viral, ${realImagesFound} real images)`);
  } catch (err) {
    console.error(`❌ Failed feed: ${feedUrl}`, err.message);
  }
};

const main = async () => {
  console.log('🚀 Starting Enhanced RSS News Scraper with Improved Image Handling, Viral Detection & Blindspot Support...');
  
  let totalStories = 0;
  let totalFeeds = 0;
  
  for (const [category, urls] of Object.entries(FEEDS)) {
    console.log(`\n📰 Category: ${category} (${urls.length} feeds)`);
    totalFeeds += urls.length;
    
    for (const url of urls) {
      await processFeed(url, category);
      totalStories += 15; // Approximate
    }
  }
  
  // === Enhanced Summary Report ===
  console.log('\n📈 SCRAPING SUMMARY:');
  console.log(`📚 Total feeds processed: ${totalFeeds}`);
  console.log(`📚 Estimated stories processed: ~${totalStories}`);
  
  // Check actual counts from database (last 24 hours)
  const twentyFourHoursAgo = new Date(Date.now() - 24*60*60*1000).toISOString();
  
  const { data: recentStories } = await supabase
    .from('news')
    .select('id, category, virality_score, image_url')
    .gte('created_at', twentyFourHoursAgo);

  if (recentStories) {
    const blindspotStories = recentStories.filter(s => s.category === 'Blindspot');
    const viralStories = recentStories.filter(s => s.virality_score >= 6);
    const storiesWithRealImages = recentStories.filter(s => 
      s.image_url && 
      !s.image_url.includes('unsplash.com') && 
      !s.image_url.includes('images.unsplash.com')
    );
    const storiesWithFallbackImages = recentStories.filter(s => 
      s.image_url && 
      (s.image_url.includes('unsplash.com') || s.image_url.includes('images.unsplash.com'))
    );
    
    console.log(`🔍 Stories added in last 24h: ${recentStories.length}`);
    console.log(`🔍 Blindspot stories: ${blindspotStories.length}`);
    console.log(`🔥 Viral stories (score ≥6): ${viralStories.length}`);
    console.log(`🖼️ Stories with real images: ${storiesWithRealImages.length}`);
    console.log(`🎲 Stories with fallback images: ${storiesWithFallbackImages.length}`);
    console.log(`📊 Real image success rate: ${((storiesWithRealImages.length / recentStories.length) * 100).toFixed(1)}%`);
  }
  
  // Clear image validation cache to free memory
  imageValidationCache.clear();
  
  console.log('\n✨ Enhanced scraping with improved image handling completed!');
  console.log('💡 Tips for better image extraction:');
  console.log('   - Set FETCH_FULL_IMAGES=true in .env for deeper image extraction');
  console.log('   - Monitor feeds that consistently lack images');
  console.log('   - Consider adding more image-rich RSS sources');
};

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Gracefully shutting down...');
  imageValidationCache.clear();
  process.exit(0);
});

main().catch(console.error);
