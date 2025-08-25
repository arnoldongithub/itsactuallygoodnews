// src/lib/utils.js
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

/* ---------- CLEANERS ---------- */
export const cleanTitle = (title) => {
  if (!title) return 'Untitled Story';
  let cleaned = String(title)
    .replace(/<[^>]*>/g, '')
    .replace(/&[a-zA-Z0-9#]+;/g, (m) => ({
      '&amp;':'&','&lt;':'<','&gt;':'>','&quot;':'"','&#39;':"'",'&apos;':"'",'&nbsp;':' ',
      '&ndash;':'–','&mdash;':'—','&hellip;':'…','&copy;':'©','&reg;':'®','&trade;':'™',
      '&euro;':'€','&pound;':'£','&yen;':'¥'
    }[m] || ''))
    .replace(/&[a-zA-Z0-9#]+/g,'')
    .replace(/https?:\/\/\S+/g,'')
    .replace(/\[https?:\/\/[^\]]+\]/g,'')
    .replace(/\[[^\]]*\.(jpg|png|gif|jpeg|webp|svg)\]/gi,'')
    .replace(/\s+/g,' ').trim()
    .replace(/^[^\w\s]+|[^\w\s]+$/g,'')
    .replace(/^-+|-+$/g,'').replace(/^–+|–+$/g,'')
    .replace(/^\|+|\|+$/g,'').replace(/^\.+|\.+$/g,'')
    .replace(/^"+|"+$/g,'').replace(/^\(+|\)+$/g,'')
    .replace(/^\[+|\]+$/g,'');
  if (cleaned.length < 3) return 'News Story';
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
};

export const cleanSummary = (summary) => {
  if (!summary) return 'No summary available';
  let cleaned = String(summary)
    .replace(/<[^>]*>/g,'')
    .replace(/https?:\/\/\S+/g,'').replace(/www\.\S+/g,'')
    .replace(/\[https?:\/\/[^\]]+\]/g,'')
    .replace(/\[[^\]]*\.(jpg|png|gif|jpeg|webp|svg)\]/gi,'')
    .replace(/wordpress-assets\.\S+/gi,'')
    .replace(/cdn\.\S+/gi,'').replace(/static\.\S+/gi,'')
    .replace(/\[(Read more|Continue reading|Source:[^\]]*|Image:[^\]]*|Photo:[^\]]*)\]/gi,'')
    .replace(/&[a-zA-Z0-9#]+;/g,(m)=>({'&amp;':'&','&lt;':'<','&gt;':'>','&quot;':'"','&#39;':"'",'&nbsp;':' ','&ndash;':'–','&mdash;':'—','&hellip;':'…'}[m]||''))
    .replace(/\s+/g,' ').trim();

  // drop obviously truncated last fragment
  const parts = cleaned.split(/[.!?]+/).map(s=>s.trim()).filter(Boolean);
  if (parts.length) {
    const last = parts[parts.length-1];
    const truncated = last.length<10 || /\b(?:and|or|for|to|the)$/.test(last) || /\b[a-z]{1,3}$/.test(last);
    if (truncated) parts.pop();
    cleaned = parts.join('. ');
  }
  if (cleaned && !/[.!?]$/.test(cleaned)) cleaned += '.';
  cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);

  if (cleaned.length < 30 || /^No summary available\.?$/i.test(cleaned)) {
    return 'This story provides important updates on recent positive developments and meaningful progress in this area.';
  }
  if (cleaned.length > 300) {
    const sentences = cleaned.split(/[.!?]+/).map(s=>s.trim()).filter(Boolean);
    let out = '';
    for (const s of sentences) {
      const candidate = (out ? out + '. ' : '') + s;
      if (candidate.length <= 300) out = candidate;
      else break;
    }
    cleaned = out || cleaned.slice(0, 300);
    if (!/[.!?]$/.test(cleaned)) cleaned += '.';
  }
  return cleaned;
};

export const cleanContent = (content) => {
  if (!content) return '';
  return String(content)
    .replace(/<script[^>]*>.*?<\/script>/gis,'')
    .replace(/<style[^>]*>.*?<\/style>/gis,'')
    .replace(/<[^>]*>/g,' ')
    .replace(/https?:\/\/\S+/g,'').replace(/www\.\S+/g,'')
    .replace(/\s+/g,' ').trim();
};

/* ---------- TEXT HELPERS ---------- */
export const truncateText = (text, maxLength=100) => {
  if (!text || text.length<=maxLength) return text;
  const cut = text.substring(0, maxLength);
  const i = cut.lastIndexOf(' ');
  return (i>0?cut.substring(0,i):cut) + '...';
};
export const formatDate = (date) => {
  if (!date) return 'Unknown date';
  try {
    const d = new Date(date);
    return d.toLocaleDateString('en-US',{year:'numeric',month:'short',day:'numeric'});
  } catch { return 'Invalid date'; }
};
export const stripAllHtml = (t) => (!t?'':String(t).replace(/<[^>]*>/g,'').replace(/&[a-zA-Z0-9#]+;/g,'').replace(/\s+/g,' ').trim());
export const cleanDatabaseText = stripAllHtml;
export const containsHtml = (t) => !!(t && (/<[^>]*>/.test(t) || /&[a-zA-Z0-9#]+;/.test(t)));

/* ---------- SOURCE HELPERS ---------- */
export const getSourceName = (source) => {
  if (!source) return 'Unknown';
  if (!/[./]/.test(source)) return source;
  try {
    const url = new URL(source.startsWith('http')?source:`https://${source}`);
    const host = url.hostname.replace(/^www\./,'');
    const map = {
      'cnn.com':'CNN','bbc.com':'BBC','reuters.com':'Reuters','ap.org':'AP News','npr.org':'NPR',
      'nytimes.com':'NY Times','washingtonpost.com':'Washington Post','theguardian.com':'The Guardian',
      'techcrunch.com':'TechCrunch','theverge.com':'The Verge','wired.com':'Wired',
      'sciencedaily.com':'Science Daily','medicalxpress.com':'Medical Xpress',
      'grist.org':'Grist','treehugger.com':'TreeHugger','reliefweb.int':'ReliefWeb',
      'unicef.org':'UNICEF','redcross.org':'Red Cross'
    };
    return map[host] || host.split('.')[0].toUpperCase();
  } catch { return source.split('.')[0] || 'Unknown'; }
};
export const getSourceLogo = (source) => {
  const n = getSourceName(source);
  const logos = {'CNN':'CNN','BBC':'BBC','Reuters':'R','AP News':'AP','NPR':'NPR','NY Times':'NYT','Washington Post':'WP','The Guardian':'G'};
  if (logos[n]) return logos[n];
  const words = n.split(/\s+/);
  return (words.length>=2?words[0][0]+words[1][0]:n[0]||'?').toUpperCase();
};

/* ---------- ARTICLE SHAPER ---------- */
export const cleanArticle = (a) => !a ? null : ({
  ...a,
  title: cleanTitle(a.title),
  summary: cleanSummary(a.summary),
  content: cleanContent(a.content),
  source_name: getSourceName(a.source_name || a.source),
  published_at: a.published_at,
  positivity_score: Math.max(0, Math.min(10, a.positivity_score || 0)),
  virality_score: Math.max(0, Math.min(10, a.virality_score || 0))
});
export const isSafeContent = (c) => !c ? true : !(/javascript:|<script|onerror=|onclick=|data:text\/html/i.test(c));

/* ---------- NUMBERS & RATE-LIMIT ---------- */
export const formatNumber = (num) => {
  if (!num || num<1000) return num?.toString() || '0';
  if (num>=1_000_000_000) return (num/1_000_000_000).toFixed(1)+'B';
  if (num>=1_000_000) return (num/1_000_000).toFixed(1)+'M';
  return (num/1000).toFixed(1)+'K';
};
export const debounce = (fn, wait=300) => {
  let t; return (...args)=>{ clearTimeout(t); t=setTimeout(()=>fn(...args), wait); };
};

/* ---------- CATEGORY IMAGES / FALLBACKS ---------- */
export const getCategoryImageSources = (category, storyId) => {
  const safeId = Math.abs(String(storyId||'1').split('').reduce((a,b)=>a+b.charCodeAt(0),0));
  const keywords = ({
    'Health':'health,medical,wellness,doctor,hospital',
    'Innovation & Tech':'technology,innovation,computer,digital,future',
    'Environment & Sustainability':'environment,nature,sustainability,green,renewable',
    'Education':'education,learning,school,student,knowledge',
    'Science & Space':'science,space,astronomy,research,laboratory',
    'Humanitarian & Rescue':'humanitarian,help,community,volunteers,aid',
    'Blindspot':'hidden,discover,stories,investigation,truth',
    'Viral':'trending,popular,social,community,celebration'
  }[category]) || 'news,positive,good';
  return [
    `https://source.unsplash.com/800x600/?${keywords}&random=${safeId}`,
    `https://source.unsplash.com/800x600/?${keywords}&sig=${safeId+50}`,
    `https://picsum.photos/800/600?random=${safeId+100}`,
    `https://picsum.photos/800/600?random=${safeId+200}`,
    `https://via.placeholder.com/800x600/6366f1/ffffff?text=${encodeURIComponent(category||'News')}`
  ];
};
export const createCategorySVG = (category) => {
  const info = ({
    'Health':{emoji:'🏥',color:'#22c55e',bg:'#dcfce7',title:'Health News'},
    'Innovation & Tech':{emoji:'💻',color:'#3b82f6',bg:'#dbeafe',title:'Tech News'},
    'Environment & Sustainability':{emoji:'🌱',color:'#10b981',bg:'#d1fae5',title:'Environment'},
    'Education':{emoji:'📚',color:'#8b5cf6',bg:'#ede9fe',title:'Education'},
    'Science & Space':{emoji:'🔬',color:'#6366f1',bg:'#e0e7ff',title:'Science'},
    'Humanitarian & Rescue':{emoji:'🤝',color:'#ef4444',bg:'#fee2e2',title:'Humanitarian'},
    'Blindspot':{emoji:'🔍',color:'#f59e0b',bg:'#fef3c7',title:'Blindspot'},
    'Viral':{emoji:'🔥',color:'#f97316',bg:'#fed7aa',title:'Viral News'}
  }[category]) || {emoji:'📰',color:'#6b7280',bg:'#f3f4f6',title:'Good News'};
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(`
    <svg width="800" height="600" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="${info.color}" stop-opacity="0.8"/>
          <stop offset="100%" stop-color="${info.color}" stop-opacity="0.4"/>
        </linearGradient>
      </defs>
      <rect width="800" height="600" fill="${info.bg}"/>
      <rect width="800" height="600" fill="url(#g)"/>
      <circle cx="400" cy="250" r="120" fill="white" opacity="0.25"/>
      <circle cx="400" cy="250" r="90" fill="white" opacity="0.35"/>
      <text x="400" y="280" text-anchor="middle" font-size="80">${info.emoji}</text>
      <text x="400" y="420" text-anchor="middle" fill="white" font-family="system-ui" font-size="36" font-weight="700">${info.title}</text>
      <text x="400" y="460" text-anchor="middle" fill="white" font-family="system-ui" font-size="18" opacity="0.85">Positive Stories</text>
    </svg>
  `)}`;
};
export const isValidImageSource = (src) => !!(src && typeof src==='string' && src.trim() && src!=='null' && src!=='undefined' && !src.includes('undefined') && (src.startsWith('http')||src.startsWith('data:')) && !src.includes('placeholder.com/0x0'));
export const getBestImageSource = (article) => {
  if (!article) return null;
  for (const src of [article.image_url, article.thumbnail_url, article.featured_image, article.image]) {
    if (isValidImageSource(src)) return src;
  }
  return null;
};

