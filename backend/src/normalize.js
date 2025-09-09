import crypto from 'crypto';
import * as cheerio from 'cheerio';

export interface NormArticle {
  title?: string;
  description?: string;
  url?: string;
  urlToImage?: string;
  source?: { name?: string };
  publishedAt?: string;
  _key?: string;      // dedupe key
  _domain?: string;   // normalized domain
}

export function stripUtm(u?: string): string | undefined {
  if (!u) return u;
  try {
    const url = new URL(u);
    ['utm_source','utm_medium','utm_campaign','utm_term','utm_content','utm_id','gclid','fbclid'].forEach(p => url.searchParams.delete(p));
    return url.toString();
  } catch { return u; }
}

export function domainOf(u?: string): string | undefined {
  if (!u) return;
  try { return new URL(u).hostname.replace(/^www\./,''); } catch { return; }
}

export function hashKey(domain?: string, path?: string, ts?: string): string {
  return crypto.createHash('sha1').update(`${domain || ''}|${path || ''}|${ts || ''}`).digest('hex');
}

export function normalizeArticles(articles: any[]): NormArticle[] {
  return (articles || []).map(a => {
    const url = stripUtm(a.url || a.link);
    const d = domainOf(url);
    const path = (() => { try { return new URL(url!).pathname; } catch { return ''; } })();
    const publishedAt = a.publishedAt || a.pubDate || undefined;
    return {
      title: a.title,
      description: a.description,
      url,
      urlToImage: a.urlToImage || a.image || undefined,
      source: { name: a.source?.name || d },
      publishedAt,
      _key: hashKey(d, path, publishedAt),
      _domain: d
    };
  });
}

export function dedupeArticles(list: NormArticle[]): NormArticle[] {
  const seen = new Set<string>();
  const out: NormArticle[] = [];
  for (const a of list) {
    if (!a.url) continue;
    const key = a._key || hashKey(a._domain, new URL(a.url).pathname, a.publishedAt);
    if (seen.has(key)) continue;
    seen.add(key);
    // prefer items with images
    const existingIdx = out.findIndex(x => x._key === key);
    if (existingIdx >= 0) {
      const ex = out[existingIdx];
      if (!ex.urlToImage && a.urlToImage) out[existingIdx] = a;
    } else {
      out.push(a);
    }
  }
  // sort by recency if available
  out.sort((a,b) => new Date(b.publishedAt || 0).getTime() - new Date(a.publishedAt || 0).getTime());
  return out;
}

// Best-effort OG image fetch for RSS items with no image - using built-in fetch and cheerio
export async function pickOgImage(u?: string): Promise<string | undefined> {
  if (!u) return;
  try {
    const res = await fetch(u, { 
      signal: AbortSignal.timeout(7000)
    });
    const html = await res.text();
    const $ = cheerio.load(html);
    
    const og = $('meta[property="og:image"]').attr('content') 
            || $('meta[name="twitter:image"]').attr('content');
    
    if (og && /^https?:\/\//.test(og)) return og;
  } catch {}
  return undefined;
}

