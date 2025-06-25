// === Final Updated index.js Fixes ===
// - Fix duplicate check using .match()
// - Minor log tweaks
// - New working RSS feed URLs for broken ones (see bottom)

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
const parser = new RSSParser();

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
    'https://www.npr.org/rss/rss.php?id=1128',
    'https://www.cdc.gov/media/rss.htm',
    'https://medicalxpress.com/rss-feed/health-news/',
    'https://www.futurity.org/health/feed/'
  ],
  'Innovation & Tech': [
    'https://www.theverge.com/rss/index.xml',
    'https://spectrum.ieee.org/rss/fulltext',
    'https://www.wired.com/feed/rss',
    'https://feeds.arstechnica.com/arstechnica/index'
  ],
  'Environment & Sustainability': [
    'https://www.ecowatch.com/rss.xml',
    'https://www.nature.com/subjects/environmental-sciences.rss',
    'https://grist.org/feed/'
  ],
  'Education': [
    'https://www.timeshighereducation.com/rss/news',
    'https://hechingerreport.org/feed/'
  ],
  'Science & Space': [
    'https://www.sciencenews.org/feed',
    'https://www.nasa.gov/rss/dyn/breaking_news.rss',
    'https://phys.org/rss-feed/space-news/'
  ],
  'Policy & Governance': [
    'https://feeds.bbci.co.uk/news/politics/rss.xml',
    'https://www.brookings.edu/feed/',
    'https://www.foreignaffairs.com/rss.xml'
  ],
  'Community & Culture': [
    'https://feeds.npr.org/1008/rss.xml',
    'https://www.culture24.org.uk/rss' // lighter cultural tone
  ],
  'Philanthropy / Nonprofits': [
    'https://philanthropynewsdigest.org/RSS.xml',
    'https://nonprofitquarterly.org/feed/'
  ]
};

const clean = (html) =>
  convert(html || '', {
    wordwrap: false,
    selectors: [{ selector: 'a', options: { ignoreHref: true } }]
  }).slice(0, 500);

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
      .match({ title, url })
      .limit(1);

    if (error) {
      console.error('❌ Error checking duplicate:', error.message);
      return true;
    }
    return data?.length > 0;
  } catch (err) {
    console.error('❌ Database error in checkDuplicate:', err.message);
    return true;
  }
};

// insertArticle, processFeed, logImport, main() stay unchanged
// but will now benefit from .match() fix and improved feeds
