// === Enhanced RSS News Scraper with Fixed .env Load and Improved Filters ===
import RSSParser from 'rss-parser';
import { createClient } from '@supabase/supabase-js';
import { convert } from 'html-to-text';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// === Correct .env Load (absolute path based on current file) ===
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

// === KEYWORDS ===
const POSITIVE_KEYWORDS = [
  'breakthrough', 'success', 'achievement', 'innovation', 'cure', 'recovery',
  'improvement', 'progress', 'celebration', 'award', 'victory', 'solution',
  'discovery', 'advancement', 'positive', 'benefit', 'help', 'support',
  'launch', 'create', 'build', 'develop', 'honor', 'celebrate', 'win',
  'expand', 'transform', 'uplift', 'resolve', 'educate', 'protect', 'heal'
];

const NEGATIVE_KEYWORDS = [
  'death', 'killed', 'murder', 'attack', 'war', 'disaster', 'crisis',
  'threat', 'danger', 'problem', 'failure', 'crash', 'collapse', 'decline',
  'recession', 'unemployment', 'violence', 'crime', 'scandal', 'die',
  'destroy', 'fail', 'emergency', 'warn', 'drought', 'famine', 'coup',
  'sanction', 'toxic', 'pollution', 'lawsuit', 'abuse', 'assault', 'rape',
  'fire', 'flood', 'earthquake', 'hunger', 'suicide', 'explosion',
  'eviction', 'shooting', 'gunfire', 'massacre', 'controversy'
];

// === FEED SOURCES ===
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

const isValidUrl = (url) => {
  try {
    const parsedUrl = new URL(url);
    return parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:';
  } catch {
    return false;
  }
};

const extractImageFromHTML = (html) => {
  if (!html) return null;
  const match = html.match(/<img[^>]+src="([^">]+)"/i);
  return match && match[1] && isValidUrl(match[1]) ? match[1] : null;
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

const computePositivityScore = (title, content) => {
  const text = `${title} ${content}`.toLowerCase();
  const positiveMatches = POSITIVE_KEYWORDS.filter(k => text.includes(k)).length;
  const negativeMatches = NEGATIVE_KEYWORDS.filter(k => text.includes(k)).length;
  const score = Math.max((positiveMatches * 2) - negativeMatches, 0);
  return score;
};

const isGoodNews = (title, content) => {
  const text = `${title} ${content}`.toLowerCase();
  const positiveMatches = POSITIVE_KEYWORDS.filter(k => text.includes(k)).length;
  const negativeMatches = NEGATIVE_KEYWORDS.filter(k => text.includes(k)).length;
  const positiveScore = positiveMatches * 2;
  const negativeScore = negativeMatches;

  const hasPositivePattern = /\b(celebrates?|honors?|wins?|succeeds?|helps?|saves?|improves?|launches?|creates?|builds?|develops?)\b/i.test(text);
  const hasNegativePattern = /\b(dies?|killed?|destroys?|fails?|crashes?|threatens?|warns?|crisis|emergency)\b/i.test(text);

  return (hasPositivePattern || (positiveScore > negativeScore && positiveMatches > 0));
};

const checkDuplicate = async (title, url) => {
  try {
    const { data, error } = await supabase.from('news')
      .select('id')
      .or(`title.eq.${title},url.eq.${url}`)
      .limit(1);
    if (error) return true;
    return data?.length > 0;
  } catch {
    return true;
  }
};

const insertArticle = async (article) => {
  try {
    const { error } = await supabase.from('news').insert([article]);
    if (error) {
      console.error('❌ Insert error:', error.message);
      return false;
    }
    console.log('✅ Inserted:', article.title.slice(0, 60));
    return true;
  } catch (err) {
    console.error('❌ Insert exception:', err.message);
    return false;
  }
};

const processFeed = async (feedUrl, category) => {
  const fallbackImages = {
    Health: 'https://source.unsplash.com/featured/?health',
    'Innovation & Tech': 'https://source.unsplash.com/featured/?technology',
    'Environment & Sustainability': 'https://source.unsplash.com/featured/?nature',
    Education: 'https://source.unsplash.com/featured/?education',
    'Science & Space': 'https://source.unsplash.com/featured/?space'
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
      const finalImage = item.enclosure?.url && isValidUrl(item.enclosure.url)
        ? item.enclosure.url
        : imageFromContent || fallbackImages[category] || null;

      const publishedAt = item.pubDate ? new Date(item.pubDate).toISOString() : null;
      const summary = content.slice(0, 300);

      const article = {
        title: item.title.trim().slice(0, 500),
        url: item.link.trim(),
        summary,
        content,
        published_at: publishedAt,
        category,
        author: item.author?.trim()?.slice(0, 200) || null,
        image_url: finalImage,
        thumbnail_url: finalImage,
        source_feed: feedUrl,
        source_url: item.link.trim(),
        source_name: new URL(item.link).hostname.replace('www.', ''),
        sentiment: 'positive',
        positivity_score,
        is_ad: false,
        ad_image_url: null,
        ad_link_url: null
      };

      await insertArticle(article);
      await new Promise(res => setTimeout(res, 300));
    }
  } catch (err) {
    console.error(`❌ Failed feed: ${feedUrl}`, err.message);
  }
};

const main = async () => {
  for (const [category, urls] of Object.entries(FEEDS)) {
    for (const url of urls) {
      await processFeed(url, category);
    }
  }
};

main();

