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
    item: ['pubDate', 'description', 'content', 'author', 'media:content', 'media:thumbnail', 'enclosure'] 
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

// === ENHANCED: Better negative keywords to filter out false positives ===
const NEGATIVE_KEYWORDS = [
  // Original catastrophe keywords
  'death', 'killed', 'murder', 'attack', 'war', 'disaster', 'crisis',
  'threat', 'danger', 'problem', 'failure', 'crash', 'collapse', 'decline',
  'devastating', 'destruction', 'catastrophic', 'tragic', 'horror',
  'nightmare', 'chaos', 'panic', 'terror', 'helpless', 'trapped',
  'missing', 'feared dead', 'body count', 'casualty', 'victim',
  'unprecedented damage', 'total loss', 'wiped out', 'flattened',
  'without hope', 'dire situation', 'worst case', 'no survivors',
  
  // NEW: Corporate/political negatives that aren't actually good news
  'layoffs', 'fired', 'firing', 'cuts jobs', 'cutting jobs', 'eliminate jobs',
  'downsizing', 'restructuring', 'budget cuts', 'austerity', 'redundancy',
  'job losses', 'unemployment', 'workforce reduction', 'cost cutting',
  'efficiency measures', 'streamlining', 'automation replacing',
  'layoff', 'pink slip', 'terminated', 'let go', 'workforce cuts',
  
  // NEW: AI/tech negatives disguised as positives
  'AI replaces', 'robots replace', 'automated away', 'human jobs lost',
  'replace workers', 'eliminate positions', 'reduce headcount',
  'AI to eliminate', 'automation will replace', 'jobs obsolete',
  
  // NEW: Government/corporate speak that sounds positive but isn't
  'tough decisions', 'necessary cuts', 'right-sizing', 'optimization',
  'synergies', 'realignment', 'consolidation', 'cost optimization',
  'operational efficiency', 'resource optimization', 'headcount reduction'
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

// === ENHANCED: Better viral keywords for more engaging content ===
const VIRAL_KEYWORDS = [
  // Emotional triggers
  'amazing', 'incredible', 'unbelievable', 'stunning', 'remarkable', 'extraordinary',
  'heartwarming', 'inspiring', 'uplifting', 'touching', 'beautiful', 'wonderful',
  'mind-blowing', 'jaw-dropping', 'breathtaking', 'awe-inspiring',
  
  // Social proof
  'viral', 'trending', 'everyone is talking about', 'breaks the internet', 'goes viral',
  'thousands share', 'millions watch', 'people are loving', 'internet can\'t stop',
  'social media buzz', 'taking the world by storm', 'captivating audiences',
  
  // Achievement words
  'first ever', 'record-breaking', 'historic', 'milestone', 'breakthrough', 'game-changer',
  'revolutionary', 'never before seen', 'unprecedented success', 'world record',
  'groundbreaking', 'pioneering', 'trailblazing',
  
  // Human interest
  'little girl', 'young boy', 'grandmother', 'veteran', 'teacher', 'nurse', 'doctor',
  'student', 'community comes together', 'neighbors help', 'strangers unite',
  'acts of kindness', 'human spirit', 'restores faith in humanity',
  
  // Feel-good actions
  'pays it forward', 'random act of kindness', 'surprises', 'gives back', 'helps out',
  'makes a difference', 'changes lives', 'spreads joy', 'brings hope', 'touches hearts'
];

// === SIGNIFICANTLY EXPANDED: More high-quality sources + Google News ===
const FEEDS = {
  'Health': [
    // Trusted medical/health sources
    'https://medicalxpress.com/rss-feed/health-news/',
    'https://www.sciencedaily.com/rss/health_medicine.xml',
    'https://www.goodnewsnetwork.org/category/health/feed/',
    'https://feeds.feedburner.com/healthline/health-news',
    'https://www.medicalnewstoday.com/rss',
    'https://www.webmd.com/rss/rss.aspx?RSSSource=RSS_PUBLIC',
    'https://www.prevention.com/feed/',
    'https://www.upworthy.com/health/rss',
    'https://brightvibes.com/feed/?category=health',
    'https://www.positive.news/society/health/feed/',
    'https://www.healthline.com/rss',
    'https://www.everydayhealth.com/rss/all-articles.xml',
    
    // NEW: Google News health feeds
    'https://news.google.com/rss/topics/CAAqJggKIiBDQkFTRWdvSUwyMHZNRGs0ZDNZV0FtVnVLQUFQAQ?hl=en-US&gl=US&ceid=US:en',
    'https://news.google.com/rss/search?q=health+breakthrough+OR+medical+cure+OR+health+recovery&hl=en-US&gl=US&ceid=US:en',
    'https://news.google.com/rss/search?q="good+news"+health+OR+"positive+health"+OR+"health+success"&hl=en-US&gl=US&ceid=US:en'
  ],

  'Innovation & Tech': [
    // Tech innovation sources
    'https://feeds.feedburner.com/TechCrunch/',
    'https://www.theverge.com/rss/index.xml',
    'https://feeds.feedburner.com/oreilly/radar',
    'https://www.wired.com/feed/rss',
    'https://mashable.com/feeds/rss/all',
    'https://www.fastcompany.com/technology/rss',
    'https://spectrum.ieee.org/rss/fulltext',
    'https://www.goodnewsnetwork.org/category/technology/feed/',
    'https://futurism.com/feed',
    'https://singularityhub.com/feed/',
    'https://www.upworthy.com/tech/rss',
    'https://brightvibes.com/feed/?category=technology',
    'https://www.positive.news/environment/technology/feed/',
    'https://venturebeat.com/feed/',
    'https://www.technologyreview.com/feed/',
    
    // NEW: Google News tech feeds
    'https://news.google.com/rss/topics/CAAqJggKIiBDQkFTRWdvSUwyMHZNRGx1YlY4U0FtVnVLQUFQAQ?hl=en-US&gl=US&ceid=US:en',
    'https://news.google.com/rss/search?q=tech+breakthrough+OR+innovation+success+OR+technology+helps&hl=en-US&gl=US&ceid=US:en',
    'https://news.google.com/rss/search?q="breakthrough+technology"+OR+"tech+saves"+OR+"innovation+helps"&hl=en-US&gl=US&ceid=US:en',
    'https://news.google.com/rss/search?q=AI+helps+OR+"artificial+intelligence"+breakthrough+OR+robot+saves&hl=en-US&gl=US&ceid=US:en'
  ],

  'Environment & Sustainability': [
    // Environmental & climate solutions
    'https://grist.org/feed/',
    'https://www.treehugger.com/feeds/rss',
    'https://www.goodnewsnetwork.org/category/earth/feed/',
    'https://www.ecowatch.com/feeds/latest.rss',
    'https://www.greenbiz.com/feeds/all',
    'https://e360.yale.edu/feed',
    'https://www.worldwildlife.org/feeds/news.xml',
    'https://brightvibes.com/feed/?category=environment',
    'https://www.upworthy.com/environment/rss',
    'https://www.positive.news/environment/feed/',
    'https://cleantechnica.com/feed/',
    'https://www.renewableenergyworld.com/news/rss.html',
    'https://www.climatecentral.org/feeds/all.rss',
    'https://insideclimatenews.org/feed/',
    
    // NEW: Google News environment feeds
    'https://news.google.com/rss/search?q=environment+success+OR+climate+solution+OR+green+breakthrough&hl=en-US&gl=US&ceid=US:en',
    'https://news.google.com/rss/search?q="renewable+energy"+breakthrough+OR+"solar+power"+success+OR+"wind+energy"+milestone&hl=en-US&gl=US&ceid=US:en',
    'https://news.google.com/rss/search?q="conservation+success"+OR+"species+recovery"+OR+"environmental+restoration"&hl=en-US&gl=US&ceid=US:en'
  ],

  'Education': [
    // Education & learning
    'https://hechingerreport.org/feed/',
    'https://www.goodnewsnetwork.org/category/inspiring/feed/',
    'https://www.edweek.org/feeds/all.rss',
    'https://www.edsurge.com/news.rss',
    'https://brightvibes.com/feed/?category=education',
    'https://www.upworthy.com/education/rss',
    'https://www.positive.news/society/education/feed/',
    'https://www.teachforamerica.org/feed',
    'https://www.khanacademy.org/about/blog/rss.xml',
    'https://www.edutopia.org/rss.xml',
    'https://hechingerreport.org/feed/',
    'https://www.chronicle.com/section/news/rss',
    
    // NEW: Google News education feeds
    'https://news.google.com/rss/search?q=education+success+OR+student+achievement+OR+school+breakthrough&hl=en-US&gl=US&ceid=US:en',
    'https://news.google.com/rss/search?q="teacher+inspires"+OR+"student+helps"+OR+"education+innovation"&hl=en-US&gl=US&ceid=US:en',
    'https://news.google.com/rss/search?q="literacy+improvement"+OR+"graduation+rate"+OR+"scholarship+program"&hl=en-US&gl=US&ceid=US:en'
  ],

  'Science & Space': [
    // Science & space exploration
    'https://feeds.feedburner.com/spaceflightnow',
    'https://www.sciencedaily.com/rss/space_time.xml',
    'https://phys.org/rss-feed/space-news/',
    'https://www.space.com/feeds/all',
    'https://www.nasa.gov/rss/dyn/breaking_news.rss',
    'https://www.scientificamerican.com/feeds/rss/news/',
    'https://www.livescience.com/feeds/all',
    'https://www.goodnewsnetwork.org/category/science/feed/',
    'https://brightvibes.com/feed/?category=science',
    'https://www.upworthy.com/science/rss',
    'https://www.iflscience.com/rss.xml',
    'https://spaceflightnow.com/feed/',
    'https://www.nature.com/nature.rss',
    'https://feeds.aps.org/rss/recent/physics.xml',
    
    // NEW: Google News science feeds
    'https://news.google.com/rss/topics/CAAqJggKIiBDQkFTRWdvSUwyMHZNRFp0Y1RjU0FtVnVLQUFQAQ?hl=en-US&gl=US&ceid=US:en',
    'https://news.google.com/rss/search?q=space+breakthrough+OR+NASA+success+OR+astronomy+discovery&hl=en-US&gl=US&ceid=US:en',
    'https://news.google.com/rss/search?q="scientific+breakthrough"+OR+"research+success"+OR+"cure+found"&hl=en-US&gl=US&ceid=US:en',
    'https://news.google.com/rss/search?q="Mars+rover"+OR+"space+mission"+OR+"satellite+success"&hl=en-US&gl=US&ceid=US:en'
  ],

  'Humanitarian & Rescue': [
    // Humanitarian & rescue stories
    'https://reliefweb.int/updates/rss.xml',
    'https://www.unicef.org/feeds/news-releases.xml',
    'https://www.unhcr.org/rss/news.xml',
    'https://www.redcross.org/news.rss',
    'https://www.goodnewsnetwork.org/category/heroes/feed/',
    'https://www.upworthy.com/heroes/rss',
    'https://brightvibes.com/feed/?category=heroes',
    'https://www.positive.news/society/community/feed/',
    'https://www.dosomething.org/us/rss.xml',
    'https://www.volunteermatch.org/blog/feed/',
    'https://www.globalcitizen.org/en/rss/',
    'https://www.rescue.org/rss.xml',
    'https://www.oxfam.org/en/rss.xml',
    'https://www.doctorswithoutborders.org/rss.xml',
    'https://www.care.org/rss.xml',
    
    // NEW: Google News humanitarian feeds
    'https://news.google.com/rss/search?q=rescue+success+OR+hero+saves+OR+community+helps&hl=en-US&gl=US&ceid=US:en',
    'https://news.google.com/rss/search?q="disaster+relief"+OR+"humanitarian+aid"+OR+"volunteers+help"&hl=en-US&gl=US&ceid=US:en',
    'https://news.google.com/rss/search?q="good+samaritan"+OR+"acts+of+kindness"+OR+"community+support"&hl=en-US&gl=US&ceid=US:en',
    'https://news.google.com/rss/search?q="firefighter+saves"+OR+"police+rescue"+OR+"paramedic+hero"&hl=en-US&gl=US&ceid=US:en'
  ],

  // Enhanced Blindspot sources for underreported positive stories
  'Blindspot': [
    // Underreported positive stories
    'https://globalvoices.org/-/world/feed/',
    'https://www.devex.com/news.rss',
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
    'https://www.atlasobscura.com/feeds/latest',
    'https://www.oddee.com/feed/',
    'https://www.rd.com/feed/',
    
    // NEW: Google News viral blindspot feeds
    'https://news.google.com/rss/search?q="viral+story"+OR+"heartwarming"+OR+"inspiring+story"&hl=en-US&gl=US&ceid=US:en',
    'https://news.google.com/rss/search?q="small+town"+hero+OR+"local+community"+OR+"underreported+story"&hl=en-US&gl=US&ceid=US:en',
    'https://news.google.com/rss/search?q="amazing+story"+OR+"incredible+story"+OR+"unbelievable+kindness"&hl=en-US&gl=US&ceid=US:en',
    'https://news.google.com/rss/search?q="viral+video"+kindness+OR+"social+media"+inspiring+OR+"goes+viral"+positive&hl=en-US&gl=US&ceid=US:en',
    'https://news.google.com/rss/search?q="developing+country"+success+OR+"rural+community"+OR+"remote+village"+positive&hl=en-US&gl=US&ceid=US:en'
  ],

  // NEW: Dedicated Viral News Category
  'Viral': [
    'https://news.google.com/rss/search?q="goes+viral"+positive+OR+"viral+video"+heartwarming&hl=en-US&gl=US&ceid=US:en',
    'https://news.google.com/rss/search?q="trending+story"+inspiring+OR+"internet+loves"+OR+"social+media"+positive&hl=en-US&gl=US&ceid=US:en',
    'https://news.google.com/rss/search?q="millions+of+views"+OR+"thousands+share"+OR+"breaks+internet"+positive&hl=en-US&gl=US&ceid=US:en',
    'https://news.google.com/rss/search?q="viral+moment"+OR+"touching+video"+OR+"amazing+footage"&hl=en-US&gl=US&ceid=US:en',
    'https://www.upworthy.com/rss',
    'https://www.boredpanda.com/feed/',
    'https://www.sunnyskyz.com/feeds/good-news.xml',
    'https://brightvibes.com/feed/',
    'https://www.goodnewsnetwork.org/feed/',
    'https://mymodernmet.com/feed/',
    'https://www.reddit.com/r/UpliftingNews/.rss',
    'https://www.reddit.com/r/MadeMeSmile/.rss',
    'https://www.reddit.com/r/wholesomememes/.rss'
  ]
};

// === ENHANCED IMAGE EXTRACTION ===
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
    const response = await fetch(url, { 
      method: 'HEAD', 
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; NewsBot/1.0)'
      }
    });
    clearTimeout(timeoutId);
    const contentType = response.headers.get('content-type');
    return response.ok && contentType?.startsWith('image/');
  } catch {
    return false;
  }
};

const extractImageFromHTML = (html) => {
  if (!html) return null;
  
  const patterns = [
    /<img[^>]+src=["']([^"']+)["'][^>]*>/gi,
    /<img[^>]+src=([^\s>]+)[^>]*>/gi,
    /<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["'][^>]*>/gi,
    /<meta[^>]*name=["']twitter:image["'][^>]*content=["']([^"']+)["'][^>]*>/gi
  ];
  
  for (const pattern of patterns) {
    const matches = Array.from(html.matchAll(pattern));
    for (const match of matches) {
      const url = match[1];
      if (url && isValidUrl(url) && !url.includes('icon') && !url.includes('logo')) {
        return url;
      }
    }
  }
  
  return null;
};

const extractBestImage = async (item, rawContent, category) => {
  const fallbackImages = {
    Health: 'https://source.unsplash.com/800x600/?health,medical,wellness',
    'Innovation & Tech': 'https://source.unsplash.com/800x600/?technology,innovation,computer',
    'Environment & Sustainability': 'https://source.unsplash.com/800x600/?environment,nature,green',
    Education: 'https://source.unsplash.com/800x600/?education,learning,school',
    'Science & Space': 'https://source.unsplash.com/800x600/?science,space,research',
    'Humanitarian & Rescue': 'https://source.unsplash.com/800x600/?humanitarian,help,rescue',
    'Blindspot': 'https://source.unsplash.com/800x600/?world,global,people',
    'Viral': 'https://source.unsplash.com/800x600/?social,media,viral'
  };

  console.log(`🖼️ Extracting image for: ${item.title?.substring(0, 50)}...`);

  // Method 1: RSS enclosure
  if (item.enclosure?.url) {
    if (await isValidImageUrl(item.enclosure.url)) {
      console.log(`📎 Found enclosure image: ${item.enclosure.url}`);
      return item.enclosure.url;
    }
  }

  // Method 2: Media namespace
  if (item['media:content']) {
    const mediaContent = Array.isArray(item['media:content']) ? item['media:content'][0] : item['media:content'];
    if (mediaContent?.$ && mediaContent.$.url) {
      if (await isValidImageUrl(mediaContent.$.url)) {
        console.log(`📺 Found media namespace image: ${mediaContent.$.url}`);
        return mediaContent.$.url;
      }
    }
  }

  // Method 3: Media thumbnail
  if (item['media:thumbnail']) {
    const thumbnail = Array.isArray(item['media:thumbnail']) ? item['media:thumbnail'][0] : item['media:thumbnail'];
    if (thumbnail?.$ && thumbnail.$.url) {
      if (await isValidImageUrl(thumbnail.$.url)) {
        console.log(`🖼️ Found media thumbnail: ${thumbnail.$.url}`);
        return thumbnail.$.url;
      }
    }
  }

  // Method 4: Extract from HTML content
  const imageFromContent = extractImageFromHTML(rawContent);
  if (imageFromContent && await isValidImageUrl(imageFromContent)) {
    console.log(`📄 Found content image: ${imageFromContent}`);
    return imageFromContent;
  }

  // Fallback: Category-specific placeholder
  console.log(`🎲 Using fallback image for category: ${category}`);
  return fallbackImages[category] || fallbackImages['Blindspot'];
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

const computeViralityScore = (title, content) => {
  const text = `${title} ${content}`.toLowerCase();
  const titleText = title.toLowerCase();
  
  const viralMatches = VIRAL_KEYWORDS.filter(k => text.includes(k)).length;
  const positiveMatches = POSITIVE_KEYWORDS.filter(k => text.includes(k)).length;
  const titleViralMatches = VIRAL_KEYWORDS.filter(k => titleText.includes(k)).length;
  
  const baseScore = positiveMatches * 1.5;
  const viralBonus = viralMatches * 2;
  const titleBonus = titleViralMatches * 3;
  
  return Math.min(baseScore + viralBonus + titleBonus, 10);
};

// === NEW: Quality score to rank stories better ===
const computeQualityScore = (title, content, source) => {
  const text = `${title} ${content}`.toLowerCase();
  
  // Boost for trusted positive news sources
  let sourceBonus = 0;
  if (source.includes('goodnewsnetwork') || source.includes('positive.news') || 
      source.includes('brightvibes') || source.includes('upworthy')) {
    sourceBonus = 3;
  } else if (source.includes('nasa') || source.includes('nature') || 
             source.includes('sciencedaily') || source.includes('unicef')) {
    sourceBonus = 2;
  } else if (source.includes('google.com')) {
    sourceBonus = 1; // Google News gets moderate boost
  }
  
  // Boost for human interest stories
  const hasHumanInterest = /\b(child|family|community|neighbor|teacher|student|doctor|nurse|volunteer)\b/i.test(text);
  const humanBonus = hasHumanInterest ? 2 : 0;
  
  // Boost for concrete positive outcomes
  const hasConcreteOutcome = /\b(built|created|saved|cured|helped|fixed|solved|improved|increased|restored)\b/i.test(text);
  const outcomeBonus = hasConcreteOutcome ? 2 : 0;
  
  // Penalty for vague corporate speak
  const hasCorporateSpeak = /\b(efficiency|optimization|synergy|streamline|leverage|paradigm)\b/i.test(text);
  const corporatePenalty = hasCorporateSpeak ? -2 : 0;
  
  return sourceBonus + humanBonus + outcomeBonus + corporatePenalty;
};

const isBlindspotStory = (title, content, category) => {
  const text = `${title} ${content}`.toLowerCase();
  
  if (category === 'Blindspot' || category === 'Viral') {
    const blindspotMatches = BLINDSPOT_KEYWORDS.filter(k => text.includes(k)).length;
    const positiveMatches = POSITIVE_KEYWORDS.filter(k => text.includes(k)).length;
    return blindspotMatches > 0 || positiveMatches > 2;
  }
  
  const blindspotMatches = BLINDSPOT_KEYWORDS.filter(k => text.includes(k)).length;
  return blindspotMatches >= 2;
};

// === ENHANCED: Much stricter good news detection ===
const isGoodNews = (title, content) => {
  const text = `${title} ${content}`.toLowerCase();
  const titleText = title.toLowerCase();
  
  // STRICT CHECK: If it mentions job cuts/firing, it's NOT good news
  const hasJobCuts = /\b(fir(e|ed|ing)|layoff|cut.*job|eliminate.*job|downsize|redundanc|workforce.*reduc)/i.test(text);
  if (hasJobCuts) {
    console.log(`❌ Rejected job cuts story: ${title.substring(0, 50)}...`);
    return false;
  }
  
  // STRICT CHECK: If it's about AI/automation replacing humans, not good news
  const hasAutomationReplacement = /\b(AI.*replac|robot.*replac|automat.*away|replac.*worker)/i.test(text);
  if (hasAutomationReplacement) {
    console.log(`❌ Rejected automation replacement story: ${title.substring(0, 50)}...`);
    return false;
  }
  
  // STRICT CHECK: Corporate efficiency that hurts people
  const hasCorporateEfficiency = /\b(efficien.*measur|cost.*cut|budget.*cut|streamlin|right.*siz)/i.test(text);
  if (hasCorporateEfficiency) {
    console.log(`❌ Rejected corporate efficiency story: ${title.substring(0, 50)}...`);
    return false;
  }
  
  // STRICT CHECK: Government/military operations disguised as positive
  const hasGovernmentAction = /\b(government.*decid|federal.*regulat|delete.*regulat|DOGE|department.*efficienc)/i.test(text);
  if (hasGovernmentAction && !text.includes('help') && !text.includes('benefit')) {
    console.log(`❌ Rejected government efficiency story: ${title.substring(0, 50)}...`);
    return false;
  }
  
  // Original hero detection (keep this)
  const hasHero = /\b(saved|rescued|hero|miracle|hope|lifesaver|brave|volunteer)\b/i.test(text);
  const hasDisasterContext = /\b(flood|disaster|storm|crisis|earthquake|wildfire)\b/i.test(text);
  if (hasHero && hasDisasterContext) return true;

  // Enhanced positive detection with stricter rules
  const hasGenuinePositive = /\b(cure|breakthrough|discover|invent|achiev|succeed|celebrat|honor|award|help|heal|save|protect|educat|learn|grow|improv|build|creat|innovat)\b/i.test(text);
  const hasHumanBenefit = /\b(lives.*better|quality.*life|wellbeing|happiness|health.*improv|education.*access|clean.*water|food.*security|shelter|home)\b/i.test(text);
  
  // Only allow if it has genuine positive indicators AND human benefits
  const positiveMatches = POSITIVE_KEYWORDS.filter(k => text.includes(k)).length;
  const negativeMatches = NEGATIVE_KEYWORDS.filter(k => text.includes(k)).length;
  
  const isGenuinelyPositive = (hasGenuinePositive || hasHumanBenefit) && 
                              positiveMatches > 0 && 
                              negativeMatches === 0;
  
  if (!isGenuinelyPositive) {
    console.log(`❌ Rejected non-positive story: ${title.substring(0, 50)}...`);
  }
  
  return isGenuinelyPositive;
};

const checkDuplicate = async (title, url) => {
  const { data } = await supabase.from('news')
    .select('id')
    .or(`title.eq.${title},url.eq.${url}`)
    .limit(1);
  return data?.length > 0;
};

// === ENHANCED: Better article processing with quality control ===
const insertArticle = async (article) => {
  // Add quality score
  article.quality_score = computeQualityScore(article.title, article.content, article.source_name);
  
  // Only insert high-quality positive stories
  if (article.quality_score < 0) {
    console.log(`❌ Rejected low-quality story: ${article.title.substring(0, 50)}...`);
    return false;
  }
  
  const { error } = await supabase.from('news').insert([article]);
  if (error) {
    console.error('❌ Insert error:', error.message);
    return false;
  }
  console.log(`✅ Inserted [${article.category}] (Quality: ${article.quality_score}, Viral: ${article.virality_score}, Image: ${article.image_url ? '✅' : '❌'}):`, article.title.slice(0, 60) + '...');
  return true;
};

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
    let rejectedCount = 0;
    let blindspotCount = 0;
    let viralCount = 0;
    let imagesFound = 0;

    for (const item of feed.items.slice(0, 30)) { // Increased for Google News feeds
      if (!item.title || !item.link || !isValidUrl(item.link)) continue;
      if (await checkDuplicate(item.title, item.link)) continue;

      const rawContent = item['content:encoded'] || item.content || item.description || '';
      const content = clean(rawContent);
      
      // ENHANCED: Stricter filtering
      if (!isGoodNews(item.title, content)) {
        rejectedCount++;
        continue;
      }

      const finalCategory = determineFinalCategory(category, item.title, content);
      if (finalCategory === 'Blindspot') blindspotCount++;

      const positivity_score = computePositivityScore(item.title, content);
      const virality_score = computeViralityScore(item.title, content);
      const quality_score = computeQualityScore(item.title, content, new URL(item.link).hostname);
      
      if (virality_score >= 6) viralCount++;

      const finalImage = await extractBestImage(item, rawContent, finalCategory);
      if (finalImage && !finalImage.includes('unsplash.com')) {
        imagesFound++;
      }

      const article = {
        title: item.title.trim().slice(0, 500),
        url: item.link.trim(),
        summary: content.slice(0, 300),
        content,
        published_at: item.pubDate ? new Date(item.pubDate).toISOString() : null,
        category: finalCategory,
        author: item.author?.trim()?.slice(0, 200) || null,
        image_url: finalImage,
        thumbnail_url: finalImage,
        source_feed: feedUrl,
        source_url: item.link.trim(),
        source_name: new URL(item.link).hostname.replace('www.', ''),
        sentiment: 'positive',
        positivity_score,
        virality_score,
        quality_score, // NEW: Added quality scoring
        is_ad: false,
        original_category: category,
        is_blindspot: finalCategory === 'Blindspot'
      };

      await insertArticle(article);
      processedCount++;
      await new Promise(res => setTimeout(res, 150)); // Faster for Google News
    }

    console.log(`📊 ${new URL(feedUrl).hostname}: ${processedCount} accepted, ${rejectedCount} rejected (${blindspotCount} → Blindspot, ${viralCount} viral, ${imagesFound} real images)`);
  } catch (err) {
    console.error(`❌ Failed feed: ${feedUrl}`, err.message);
  }
};

const main = async () => {
  console.log('🚀 Starting Enhanced RSS News Scraper with Google News & Viral Detection...');
  
  let totalProcessed = 0;
  let totalRejected = 0;
  let totalBlindspot = 0;
  let totalViral = 0;
  let totalQualityStories = 0;
  
  for (const [category, urls] of Object.entries(FEEDS)) {
    console.log(`\n📰 Category: ${category} (${urls.length} feeds)`);
    const categoryStart = Date.now();
    
    for (const url of urls) {
      await processFeed(url, category);
      // Small delay between feeds to be respectful
      await new Promise(res => setTimeout(res, 300));
    }
    
    const categoryTime = ((Date.now() - categoryStart) / 1000).toFixed(1);
    console.log(`⏱️ ${category} completed in ${categoryTime}s`);
  }
  
  // === Enhanced Summary Report with Google News Stats ===
  console.log('\n📈 ENHANCED SCRAPING SUMMARY WITH GOOGLE NEWS:');
  console.log('=' * 60);
  
  // Get actual counts from database (last 2 hours to capture this run)
  const twoHoursAgo = new Date(Date.now() - 2*60*60*1000).toISOString();
  
  try {
    const [
      { data: allStories },
      { data: googleNewsStories },
      { data: viralStories },
      { data: blindspotStories },
      { data: qualityStories },
      { data: storiesWithImages },
      { data: categoryCounts }
    ] = await Promise.all([
      // Total stories added
      supabase
        .from('news')
        .select('id')
        .gte('created_at', twoHoursAgo),
        
      // Google News stories
      supabase
        .from('news')
        .select('id, title')
        .like('source_name', '%google%')
        .gte('created_at', twoHoursAgo),
        
      // High virality stories
      supabase
        .from('news')
        .select('id, title, virality_score')
        .gte('virality_score', 6)
        .gte('created_at', twoHoursAgo)
        .order('virality_score', { ascending: false })
        .limit(5),
        
      // Blindspot stories
      supabase
        .from('news')
        .select('id')
        .eq('category', 'Blindspot')
        .gte('created_at', twoHoursAgo),
        
      // High quality stories
      supabase
        .from('news')
        .select('id, title, quality_score')
        .gte('quality_score', 3)
        .gte('created_at', twoHoursAgo)
        .order('quality_score', { ascending: false })
        .limit(5),
        
      // Stories with real images (not Unsplash fallbacks)
      supabase
        .from('news')
        .select('id')
        .not('image_url', 'like', '%unsplash%')
        .gte('created_at', twoHoursAgo),
        
      // Category breakdown
      supabase
        .from('news')
        .select('category')
        .gte('created_at', twoHoursAgo)
    ]);
    
    // Process category counts
    const categoryBreakdown = {};
    categoryCounts?.forEach(item => {
      categoryBreakdown[item.category] = (categoryBreakdown[item.category] || 0) + 1;
    });
    
    console.log(`📚 Total stories added: ${allStories?.length || 0}`);
    console.log(`🌐 Google News stories: ${googleNewsStories?.length || 0}`);
    console.log(`🔥 High virality stories (6+): ${viralStories?.length || 0}`);
    console.log(`🔍 Blindspot stories: ${blindspotStories?.length || 0}`);
    console.log(`⭐ High quality stories (3+): ${qualityStories?.length || 0}`);
    console.log(`🖼️ Stories with real images: ${storiesWithImages?.length || 0}`);
    
    console.log('\n📊 CATEGORY BREAKDOWN:');
    Object.entries(categoryBreakdown).forEach(([cat, count]) => {
      console.log(`   ${cat}: ${count} stories`);
    });
    
    console.log('\n🔥 TOP VIRAL STORIES:');
    viralStories?.slice(0, 3).forEach((story, i) => {
      console.log(`   ${i+1}. [${story.virality_score}] ${story.title.substring(0, 80)}...`);
    });
    
    console.log('\n⭐ TOP QUALITY STORIES:');
    qualityStories?.slice(0, 3).forEach((story, i) => {
      console.log(`   ${i+1}. [${story.quality_score}] ${story.title.substring(0, 80)}...`);
    });
    
    // Calculate success metrics
    const imageSuccessRate = storiesWithImages?.length && allStories?.length ? 
      (storiesWithImages.length / allStories.length * 100).toFixed(1) : '0';
    const viralRate = viralStories?.length && allStories?.length ? 
      (viralStories.length / allStories.length * 100).toFixed(1) : '0';
    const googleNewsRate = googleNewsStories?.length && allStories?.length ? 
      (googleNewsStories.length / allStories.length * 100).toFixed(1) : '0';
    
    console.log('\n📈 SUCCESS METRICS:');
    console.log(`   🌐 Google News content: ${googleNewsRate}%`);
    console.log(`   🖼️ Real image rate: ${imageSuccessRate}%`);
    console.log(`   🔥 Viral content rate: ${viralRate}%`);
    console.log(`   🔍 Blindspot discovery rate: ${blindspotStories?.length || 0} stories`);
    
  } catch (error) {
    console.error('❌ Error generating summary report:', error);
  }
  
  console.log('\n✨ Enhanced scraping with Google News feeds completed!');
  console.log('🎯 Key improvements:');
  console.log('   • Google News integration for viral content discovery');
  console.log('   • Stricter filtering (no more fake "good news" like DOGE layoffs)');
  console.log('   • Quality scoring for better story ranking');
  console.log('   • Enhanced image extraction');
  console.log('   • Better viral content detection');
  console.log('   • Expanded high-quality news sources');
  console.log('   • NEW: Dedicated Viral category for trending positive stories');
};

main().catch(console.error);
