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

// === Feeds
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
    'https://grist.org/feed/',
    'https://www.treehugger.com/feeds/rss'
  ],
  'Education': [
    'https://hechingerreport.org/feed/'
  ],
  'Science & Space': [
    'https://feeds.feedburner.com/spaceflightnow',
    'https://www.sciencedaily.com/rss/space_time.xml',
    'https://phys.org/rss-feed/space-news/'
  ],
  'Humanitarian & Rescue': [
    'https://reliefweb.int/updates/rss.xml',
    'https://www.unicef.org/feeds/news-releases.xml',
    'https://www.unhcr.org/rss/news.xml',
    'https://www.redcross.org/news.rss',
    'https://www.google.com/alerts/feeds/12610777509108054570/3869133423126878870'
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

const isGoodNews = (title, content) => {
  const text = `${title} ${content}`.toLowerCase();
  const hasHero = /\b(saved|rescued|hero|miracle|hope|lifesaver|brave|volunteer)\b/i.test(text);
  const hasDisasterContext = /\b(flood|disaster|storm|crisis|earthquake|wildfire)\b/i.test(text);

  if (hasHero && hasDisasterContext) return true;

  const positiveMatches = POSITIVE_KEYWORDS.filter(k => text.includes(k)).length;
  const negativeMatches = NEGATIVE_KEYWORDS.filter(k => text.includes(k)).length;

  return (positiveMatches > 0 && (positiveMatches * 2) > negativeMatches);
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
  console.log('✅ Inserted:', article.title);
  return true;
};

const processFeed = async (feedUrl, category) => {
  const fallbackImages = {
    Health: 'https://source.unsplash.com/featured/?health',
    'Innovation & Tech': 'https://source.unsplash.com/featured/?technology',
    'Environment & Sustainability': 'https://source.unsplash.com/featured/?nature',
    Education: 'https://source.unsplash.com/featured/?education',
    'Science & Space': 'https://source.unsplash.com/featured/?space',
    'Humanitarian & Rescue': 'https://source.unsplash.com/featured/?rescue,hero,aid'
  };

  try {
    const feed = await parser.parseURL(feedUrl);
    for (const item of feed.items.slice(0, 10)) {
      if (!item.title || !item.link || !isValidUrl(item.link)) continue;
      if (await checkDuplicate(item.title, item.link)) continue;

      const rawContent = item['content:encoded'] || item.content || item.description || '';
      const content = clean(rawContent);
      if (!isGoodNews(item.title, content)) continue;

      const positivity_score = computePositivityScore(item.title, content);
      const imageFromContent = extractImageFromHTML(rawContent);
      let finalImage = fallbackImages[category];

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
        category,
        author: item.author?.trim()?.slice(0, 200) || null,
        image_url: finalImage,
        thumbnail_url: finalImage,
        source_feed: feedUrl,
        source_url: item.link.trim(),
        source_name: new URL(item.link).hostname.replace('www.', ''),
        sentiment: 'positive',
        positivity_score,
        is_ad: false
      };

      await insertArticle(article);
      await new Promise(res => setTimeout(res, 300));
    }
  } catch (err) {
    console.error(`❌ Failed feed: ${feedUrl}`, err.message);
  }
};

const main = async () => {
  console.log('🚀 Starting RSS News Scraper...');
  for (const [category, urls] of Object.entries(FEEDS)) {
    console.log(`\n📰 Category: ${category}`);
    for (const url of urls) {
      console.log(`🔗 Fetching: ${url}`);
      await processFeed(url, category);
    }
  }
  console.log('\n✨ Scraping completed!');
};

main();
