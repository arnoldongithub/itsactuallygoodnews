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
  customFields: { item: ['pubDate', 'description', 'content', 'author'] }
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
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    const response = await fetch(url, { method: 'HEAD', signal: controller.signal });
    clearTimeout(timeoutId);
    const contentType = response.headers.get('content-type');
    return response.ok && contentType?.startsWith('image/');
  } catch {
    return false;
  }
};

const extractImageFromHTML = (html) => {
  if (!html) return null;
  const match = html.match(/<img[^>]+src="([^">]+)"/i);
  return match && isValidUrl(match[1]) ? match[1] : null;
};

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
  console.log(`✅ Inserted [${article.category}] (Viral: ${article.virality_score}):`, article.title.slice(0, 60) + '...');
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
  const fallbackImages = {
    Health: 'https://source.unsplash.com/featured/?health',
    'Innovation & Tech': 'https://source.unsplash.com/featured/?technology',
    'Environment & Sustainability': 'https://source.unsplash.com/featured/?nature',
    Education: 'https://source.unsplash.com/featured/?education',
    'Science & Space': 'https://source.unsplash.com/featured/?space',
    'Humanitarian & Rescue': 'https://source.unsplash.com/featured/?rescue,hero,aid',
    'Blindspot': 'https://source.unsplash.com/featured/?hidden,story,news'
  };

  try {
    console.log(`🔗 Processing: ${feedUrl}`);
    const feed = await parser.parseURL(feedUrl);
    let processedCount = 0;
    let blindspotCount = 0;
    let viralCount = 0;

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

      const imageFromContent = extractImageFromHTML(rawContent);
      let finalImage = fallbackImages[finalCategory];

      if (item.enclosure?.url && await isValidImageUrl(item.enclosure.url)) {
        finalImage = item.enclosure.url;
      } else if (imageFromContent && await isValidImageUrl(imageFromContent)) {
        finalImage = imageFromContent;
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
        thumbnail_url: finalImage,
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

    console.log(`📊 ${new URL(feedUrl).hostname}: ${processedCount} stories (${blindspotCount} → Blindspot, ${viralCount} viral)`);
  } catch (err) {
    console.error(`❌ Failed feed: ${feedUrl}`, err.message);
  }
};

const main = async () => {
  console.log('🚀 Starting Enhanced RSS News Scraper with Viral Detection & Blindspot Support...');
  
  let totalStories = 0;
  let totalBlindspot = 0;
  let totalViral = 0;
  
  for (const [category, urls] of Object.entries(FEEDS)) {
    console.log(`\n📰 Category: ${category} (${urls.length} feeds)`);
    for (const url of urls) {
      await processFeed(url, category);
      totalStories += 15; // Approximate
    }
  }
  
  // === Summary report ===
  console.log('\n📈 SCRAPING SUMMARY:');
  console.log(`📚 Total stories processed: ~${totalStories}`);
  
  // Check actual counts from database
  const { data: blindspotStories } = await supabase
    .from('news')
    .select('id')
    .eq('category', 'Blindspot')
    .gte('created_at', new Date(Date.now() - 24*60*60*1000).toISOString());
    
  const { data: viralStories } = await supabase
    .from('news')
    .select('id')
    .gte('virality_score', 6)
    .gte('created_at', new Date(Date.now() - 24*60*60*1000).toISOString());
    
  console.log(`🔍 Blindspot stories in DB (24h): ${blindspotStories?.length || 0}`);
  console.log(`🔥 Viral stories in DB (24h): ${viralStories?.length || 0}`);
  console.log('\n✨ Enhanced scraping with viral detection completed!');
};

main().catch(console.error);
