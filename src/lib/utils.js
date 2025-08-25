// src/lib/utils.js  — IAGN category upgrade
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

/* ===================== CLEANERS ===================== */
export const cleanTitle = (title) => {
  if (!title) return 'Untitled Story';
  let cleaned = String(title)
    .replace(/<[^>]*>/g, '')
    .replace(/&[a-zA-Z0-9#]+;/g, (m) => {
      const map = {
        '&amp;': '&','&lt;':'<','&gt;':'>','&quot;':'"','&#39;':"'",'&apos;':"'",'&nbsp;':' ',
        '&ndash;':'–','&mdash;':'—','&hellip;':'…','&copy;':'©','&reg;':'®','&trade;':'™',
        '&euro;':'€','&pound;':'£','&yen;':'¥'
      };
      return map[m] || '';
    })
    .replace(/&[a-zA-Z0-9#]+/g, '')
    .replace(/https?:\/\/[^\s\]]+/g, '')
    .replace(/www\.[^\s\]]+/g, '')
    .replace(/\[[^\]]*\.(jpg|png|gif|jpeg|webp|svg)\]/gi, '')
    .replace(/\s+/g, ' ')
    .replace(/^[^\w\s]+|[^\w\s]+$/g, '')
    .trim();

  cleaned = cleaned
    .replace(/^-+|-+$/g, '')
    .replace(/^–+|–+$/g, '')
    .replace(/^\|+|\|+$/g, '')
    .replace(/^\.+|\.+$/g, '')
    .replace(/^"+|"+$/g, '')
    .replace(/^\(+|\)+$/g, '')
    .replace(/^\[+|\]+$/g, '')
    .trim();

  if (cleaned.length < 3) return 'News Story';
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
};

export const cleanSummary = (summary) => {
  if (!summary) return 'No summary available.';
  let cleaned = String(summary)
    .replace(/<[^>]*>/g, '')
    .replace(/https?:\/\/[^\s\]]+/g, '')
    .replace(/www\.[^\s\]]+/g, '')
    .replace(/\[[^\]]*\.(jpg|png|gif|jpeg|webp|svg)\]/gi, '')
    .replace(/\[Read more\]|\[Continue reading\]|\[Source:[^\]]*\]|\[Image:[^\]]*\]|\[Photo:[^\]]*\]/gi, '')
    .replace(/&[a-zA-Z0-9#]+;/g, (m) => {
      const map = {'&amp;':'&','&lt;':'<','&gt;':'>','&quot;':'"','&#39;':"'",'&nbsp;':' ',
        '&ndash;':'–','&mdash;':'—','&hellip;':'…'};
      return map[m] || '';
    })
    .replace(/\s+/g, ' ')
    .trim();

  const parts = cleaned.split(/[.!?]+/).map(s=>s.trim()).filter(Boolean);
  if (parts.length > 0) {
    const last = parts[parts.length-1];
    const truncated = (last.length < 10) || /\b(?:and|or|for|to|the|peo|technol?)$/i.test(last);
    cleaned = (truncated ? parts.slice(0,-1) : parts).join('. ').trim();
  }
  if (cleaned && !/[.!?]$/.test(cleaned)) cleaned += '.';
  cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);

  if (cleaned.length < 30 ||
      /^(\w{1,5}\.?)$/.test(cleaned) ||
      /^(please refer|country:|source:|png|jpg|pdf)/i.test(cleaned) ||
      cleaned === 'No summary available.') {
    return 'This story provides important updates on recent positive developments and meaningful progress in this area.';
  }

  if (cleaned.length > 300) {
    const sentences = cleaned.split(/[.!?]+/).map(s=>s.trim()).filter(Boolean);
    let out = '';
    for (const s of sentences) {
      const next = (out ? out + '. ' : '') + s;
      if (next.length <= 300) out = next; else break;
    }
    cleaned = out || cleaned.slice(0, 300);
    if (!/[.!?]$/.test(cleaned)) cleaned += '.';
  }
  return cleaned;
};

export const cleanContent = (content) => {
  if (!content) return '';
  return String(content)
    .replace(/<script[^>]*>.*?<\/script>/gi, '')
    .replace(/<style[^>]*>.*?<\/style>/gi, '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/https?:\/\/[^\s\]]+/g, '')
    .replace(/www\.[^\s\]]+/g, '')
    .replace(/\[[^\]]*\.(jpg|png|gif|jpeg|webp|svg)\]/gi, '')
    .replace(/&[a-zA-Z0-9#]+;/g, (m) => {
      const map = {'&amp;':'&','&lt;':'<','&gt;':'>','&quot;':'"','&#39;':"'",'&nbsp;':' ',
        '&ndash;':'–','&mdash;':'—','&hellip;':'…'};
      return map[m] || '';
    })
    .replace(/\s+/g, ' ')
    .trim();
};

/* ===================== BULLETS ===================== */
export const createBulletPoints = (text, maxPoints = 5) => {
  if (!text || typeof text !== 'string') return [];
  const cleanedText = cleanSummary(text);

  if (cleanedText.length < 50) {
    return [
      'Highlights recent positive developments in the field.',
      'Shows progress that benefits communities.',
      'Indicates promising signs for the future.',
      'Involves collaboration among key stakeholders.'
    ].slice(0, maxPoints);
  }

  const points = [];
  const impactWords = /(improved|increased|reduced|enhanced|successful|breakthrough|innovative|significant|major|benefits|supports|enables|provides)/i;
  cleanedText.split(/[.!?]+/).forEach(s=>{
    const t = s.trim();
    if (t.length > 25 && t.length < 120 && impactWords.test(t)) points.push(t + '.');
  });

  const pushNum = (idx) => {
    const start = Math.max(0, cleanedText.lastIndexOf(' ', idx - 60));
    const end = Math.min(cleanedText.length, cleanedText.indexOf(' ', idx + 60) === -1 ? cleanedText.length : cleanedText.indexOf(' ', idx + 60));
    const ctx = cleanedText.substring(start, end).trim();
    if (ctx.length > 20) points.push(`Key statistic: ${ctx}${/[.!?]$/.test(ctx)?'':'.'}`);
  };
  for (const re of [
    /(\d+(?:,\d+)*(?:\.\d+)?)\s*(?:percent|%)/gi,
    /(?:over|more than|up to|nearly|approximately)\s+(\d+(?:,\d+)*)/gi,
    /(\d+(?:,\d+)*)\s+(?:million|billion|thousand)/gi
  ]) {
    let m, count = 0;
    while ((m = re.exec(cleanedText)) && count < 2) { pushNum(m.index); count++; }
  }

  const loc = /(in|at|from|across)\s+([A-Z][a-zA-Z\s]+(?:University|College|Hospital|Center|Institute|City|County|State))/;
  const org = /(by|with|through)\s+([A-Z][a-zA-Z\s&]+(?:Foundation|Organization|Company|Association|Institute))/;
  const lm = cleanedText.match(loc); if (lm) points.push(`Initiative based at ${lm[2]}.`);
  const om = cleanedText.match(org); if (om) points.push(`Partnership involves ${om[2]}.`);

  const achWords = /(achieved|completed|launched|introduced|developed|created|established|implemented|discovered|invented)/i;
  cleanedText.split(/[.!?]+/).forEach(s=>{
    const t = s.trim();
    if (t.length > 30 && t.length < 120 && achWords.test(t)) points.push(`Achievement: ${t}.`);
  });

  const seen = new Set();
  const uniq = [];
  for (const p of points) {
    const norm = p.toLowerCase().replace(/[^\w\s]/g, '').replace(/\s+/g, ' ');
    if (!seen.has(norm) && p.length >= 20 && p.length <= 180) {
      seen.add(norm); uniq.push(p);
    }
    if (uniq.length >= maxPoints) break;
  }
  if (uniq.length) return uniq.slice(0, maxPoints);

  const sentences = cleanedText.split(/[.!?]+/).map(s=>s.trim()).filter(s=>s.length>20).slice(0, maxPoints);
  return sentences.map(s => /[.!?]$/.test(s) ? s : s + '.');
};

/* ===================== DISPLAY HELPERS ===================== */
export const truncateText = (text, maxLength = 100) => {
  if (!text || text.length <= maxLength) return text || '';
  const cut = text.substring(0, maxLength);
  const i = cut.lastIndexOf(' ');
  return (i > 0 ? cut.substring(0, i) : cut) + '...';
};

export const formatDate = (date) => {
  if (!date) return 'Unknown date';
  try {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', { year:'numeric', month:'short', day:'numeric' });
  } catch { return 'Invalid date'; }
};

export const getSourceName = (source) => {
  if (!source) return 'Unknown';
  if (!source.includes('.') && !source.includes('/')) return source;
  try {
    const url = new URL(source.startsWith('http') ? source : `https://${source}`);
    const host = url.hostname.replace(/^www\./, '');
    const map = {
      'cnn.com':'CNN','bbc.com':'BBC','reuters.com':'Reuters','ap.org':'AP News','npr.org':'NPR',
      'nytimes.com':'NY Times','washingtonpost.com':'Washington Post','theguardian.com':'The Guardian',
      'techcrunch.com':'TechCrunch','theverge.com':'The Verge','wired.com':'Wired',
      'sciencedaily.com':'Science Daily','medicalxpress.com':'Medical Xpress','grist.org':'Grist',
      'treehugger.com':'TreeHugger','reliefweb.int':'ReliefWeb','unicef.org':'UNICEF','redcross.org':'Red Cross',
      'goodnewsnetwork.org':'Good News Network','positive.news':'Positive News','brightvibes.com':'Bright Vibes','upworthy.com':'Upworthy'
    };
    return map[host] || host.split('.')[0].toUpperCase();
  } catch {
    return source.split('.')[0] || 'Unknown';
  }
};

export const getSourceLogo = (source) => {
  const name = getSourceName(source);
  const words = name.split(/\s+/);
  if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase();
  return name[0]?.toUpperCase() || '?';
};

export const cleanArticle = (article) => {
  if (!article) return null;
  return {
    ...article,
    title: cleanTitle(article.title),
    summary: cleanSummary(article.summary),
    content: cleanContent(article.content),
    source_name: getSourceName(article.source_name || article.source),
    published_at: article.published_at,
    positivity_score: Math.max(0, Math.min(10, article.positivity_score ?? 0)),
    virality_score: Math.max(0, Math.min(10, article.virality_score ?? 0))
  };
};

export const isSafeContent = (content) => {
  if (!content) return true;
  return ![/javascript:/i, /<script/i, /onclick=/i, /onerror=/i, /data:text\/html/i].some(r=>r.test(content));
};

export const formatNumber = (num) => {
  const n = Number(num);
  if (!n || n < 1000) return (n || 0).toString();
  if (n >= 1_000_000_000) return (n/1_000_000_000).toFixed(1)+'B';
  if (n >= 1_000_000) return (n/1_000_000).toFixed(1)+'M';
  return (n/1_000).toFixed(1)+'K';
};

export const debounce = (fn, wait) => {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), wait);
  };
};

export const stripAllHtml = (text) =>
  (text || '').replace(/<[^>]*>/g, '').replace(/&[a-zA-Z0-9#]+;/g, '').replace(/\s+/g, ' ').trim();

export const cleanDatabaseText = (text) =>
  (text || '')
    .replace(/<[^>]*>/g, '')
    .replace(/&[a-zA-Z0-9#]+;/g, '')
    .replace(/https?:\/\/[^\s]+/g, '')
    .replace(/www\.[^\s]+/g, '')
    .replace(/\s+/g, ' ')
    .trim();

export const containsHtml = (text) => !!(text && (/<[^>]*>/.test(text) || /&[a-zA-Z0-9#]+;/.test(text)));

/* ===================== IAGN CATEGORIES ===================== */
// Canonical category names for IAGN
export const IAGN_CATEGORIES = [
  'Capitalism & Inequality',
  'Movement Tracker & Accountability',
  'Justice Lens',
  'Green Future',
  'Hope in Struggle',
  'Blindspot',
  'Viral'
];

// Loose aliasing so old labels or RSS tags map cleanly
export const normalizeCategory = (raw) => {
  const s = String(raw || '').toLowerCase();
  if (!s) return 'Blindspot';
  if (/(capital|inequal|wage|ceo|tax|rent|cost of living)/i.test(raw)) return 'Capitalism & Inequality';
  if (/(movement|accountability|policy|democracy|budget|gerrymander|corruption|capture)/i.test(raw)) return 'Movement Tracker & Accountability';
  if (/(justice|civil rights|police|court|voting rights|disparit)/i.test(raw)) return 'Justice Lens';
  if (/(green|climate|renewable|energy|transit|biodivers|emission)/i.test(raw)) return 'Green Future';
  if (/(hope|organizing|union|strike|community victory|mutual aid|solidarity)/i.test(raw)) return 'Hope in Struggle';
  if (/blindspot/i.test(raw)) return 'Blindspot';
  if (/viral|trending/i.test(raw)) return 'Viral';
  return 'Blindspot';
};

// Keywords used for image fallbacks by category (no emojis)
const CATEGORY_KEYWORDS = {
  'Capitalism & Inequality': 'wages,workers,protest,economy,tax,rent,food,warehouse,pay,budget',
  'Movement Tracker & Accountability': 'protest,policy,capitol,city hall,civic,petition,ballot,hearing,oversight',
  'Justice Lens': 'court,scales of justice,community,rights,legal,police reform,voting,advocacy',
  'Green Future': 'renewable,solar,wind,transit,trees,river,clean energy,urban garden,climate',
  'Hope in Struggle': 'solidarity,community,volunteers,mutual aid,union,neighborhood,teachers,care',
  'Blindspot': 'underreported,local community,grassroots,small town,organizers,profile',
  'Viral': 'trending,community,people,celebration,city street,crowd'
};

// Titles for SVG fallback cards (no emojis)
const CATEGORY_TITLES = {
  'Capitalism & Inequality': 'Capitalism & Inequality',
  'Movement Tracker & Accountability': 'Movement Tracker & Accountability',
  'Justice Lens': 'Justice Lens',
  'Green Future': 'Green Future',
  'Hope in Struggle': 'Hope in Struggle',
  'Blindspot': 'Blindspot',
  'Viral': 'Viral'
};

// Brand-ish colors (subtle, readable)
const CATEGORY_COLORS = {
  'Capitalism & Inequality': { color: '#7c3aed', bg: '#ede9fe' },          // purple
  'Movement Tracker & Accountability': { color: '#2563eb', bg: '#dbeafe' }, // blue
  'Justice Lens': { color: '#0ea5e9', bg: '#e0f2fe' },                      // sky
  'Green Future': { color: '#10b981', bg: '#d1fae5' },                      // green
  'Hope in Struggle': { color: '#f59e0b', bg: '#fef3c7' },                  // amber
  'Blindspot': { color: '#6b7280', bg: '#f3f4f6' },                         // gray
  'Viral': { color: '#f97316', bg: '#fed7aa' }                              // orange
};

/* ===================== IMAGE FALLBACKS ===================== */
export const getCategoryImageSources = (category, storyId) => {
  const cat = normalizeCategory(category);
  const keywords = CATEGORY_KEYWORDS[cat] || 'community,people,news,city';
  const safeId = Math.abs(String(storyId ?? '1').split('').reduce((a, b) => a + b.charCodeAt(0), 0));

  return [
    `https://source.unsplash.com/800x600/?${encodeURIComponent(keywords)}&random=${safeId}`,
    `https://source.unsplash.com/800x600/?${encodeURIComponent(keywords)}&sig=${safeId + 50}`,
    `https://picsum.photos/800/600?random=${safeId + 100}`,
    `https://picsum.photos/800/600?random=${safeId + 200}`,
    `https://via.placeholder.com/800x600/111827/ffffff?text=${encodeURIComponent(CATEGORY_TITLES[cat] || 'News')}`
  ];
};

export const createCategorySVG = (category) => {
  const cat = normalizeCategory(category);
  const { color, bg } = CATEGORY_COLORS[cat] || { color: '#374151', bg: '#f3f4f6' };
  const title = CATEGORY_TITLES[cat] || 'News';

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(`
    <svg width="800" height="600" viewBox="0 0 800 600" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="${color}" stop-opacity="0.85"/>
          <stop offset="100%" stop-color="${color}" stop-opacity="0.45"/>
        </linearGradient>
      </defs>
      <rect width="800" height="600" fill="${bg}"/>
      <rect width="800" height="600" fill="url(#g)"/>
      <circle cx="140" cy="140" r="28" fill="white" opacity="0.10"/>
      <circle cx="660" cy="120" r="36" fill="white" opacity="0.12"/>
      <circle cx="700" cy="460" r="22" fill="white" opacity="0.10"/>
      <circle cx="110" cy="510" r="32" fill="white" opacity="0.12"/>
      <circle cx="400" cy="250" r="120" fill="white" opacity="0.22"/>
      <circle cx="400" cy="250" r="90" fill="white" opacity="0.32"/>
      <rect x="220" y="415" width="360" height="18" rx="9" fill="white" opacity="0.35"/>
      <text x="400" y="380" text-anchor="middle" fill="white" font-family="system-ui, -apple-system, sans-serif" font-size="36" font-weight="700">${title}</text>
      <rect x="250" y="520" width="300" height="4" fill="white" opacity="0.6" rx="2"/>
    </svg>
  `)}`;
};

export const isValidImageSource = (src) => {
  if (!src || typeof src !== 'string') return false;
  const s = src.trim();
  return s && s !== 'null' && s !== 'undefined' && !s.includes('undefined') &&
         (s.startsWith('http') || s.startsWith('data:')) &&
         !s.includes('placeholder.com/0x0');
};

export const getBestImageSource = (article) => {
  if (!article) return null;
  for (const src of [article.image_url, article.thumbnail_url, article.featured_image, article.image]) {
    if (isValidImageSource(src)) return src;
  }
  return null;
};
