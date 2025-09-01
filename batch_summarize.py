# batch_summarize.py (works with summarize.py @ :8001, unchanged interface)
import os
import requests
import time
import re
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
SUMMARY_API_URL = os.getenv("SUMMARY_API_URL", "http://127.0.0.1:8001/summarize")

if not SUPABASE_URL or not SUPABASE_KEY:
  raise Exception("Missing Supabase URL or service role key")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def clean_text_for_batch_summary(text):
  if not text:
    return ""
  t = re.sub(r'https?://[^\s\]]+|www\.[^\s\]]+|ftp://[^\s\]]+', '', text, flags=re.I)
  t = re.sub(r'\[https?://[^\]]+\]', '', t)
  t = re.sub(r'\[[^\]]*\.(jpg|png|gif|jpeg|webp|svg|mp4|mp3|pdf)\]', '', t, flags=re.I)
  t = re.sub(r'(wordpress-assets|cdn|static|assets|images)\.[^\s\]]+', '', t, flags=re.I)
  t = re.sub(r'\[[^\]]*\.(html|php|aspx|htm|pdf|css|js)\]', '', t, flags=re.I)
  for ph in [r'\[Read more\]', r'\[Continue reading\]', r'\[Source:?[^\]]*\]',
             r'\[Photo:?[^\]]*\]', r'\[Video:?[^\]]*\]', r'\[Image:?[^\]]*\]',
             r'\[Credit:?[^\]]*\]']:
    t = re.sub(ph, '', t, flags=re.I)
  t = re.sub(r'\S+@\S+\.\S+', '', t)
  t = re.sub(r'\(\d{3}\)\s*\d{3}-\d{4}', '', t)
  t = re.sub(r'\d{3}-\d{3}-\d{4}', '', t)
  t = re.sub(r'@\w+|#\w+', '', t)
  t = re.sub(r'\s+', ' ', t).strip()
  return t

def validate_summary_quality(summary):
  if not summary or len(summary.strip()) < 10:
    return False, "Summary too short"
  trunc_patterns = [
    r'\b(peo|peopl|technol|technolo|compan|govern|researc|developm?)$',
    r'\b(and|or|but|the|to|for|with|in|on|at|a|an|is|was|were|has|have|had)$',
    r'\b(this|that|these|those|who|what|when|where|why|how|which)$',
    r'\b(according|including|such|many|some|most|all|every|each|both)$',
    r'\b\d+$', r'\b[a-z]{1,2}$'
  ]
  s = summary.strip()
  if any(re.search(p, s, re.I) for p in trunc_patterns): return False, "Truncation pattern"
  if s.count('(') != s.count(')') or s.endswith((',', ';', ':')): return False, "Incomplete punctuation"
  if len(s.split()) < 8: return False, "Too few words"
  return True, "OK"

def fetch_articles_without_summary(limit=50):
  try:
    print(f"Fetching up to {limit} articles missing summaries...")
    resp = supabase.from_("news").select("*").or_(
      "summary.is.null,summary.eq.'',summary.eq.Summary generation failed after multiple attempts."
    ).eq("sentiment", "positive").order("created_at", desc=True).limit(limit).execute()
    rows = resp.data or []
    valid = []
    for a in rows:
      content = a.get("content") or ""
      if len(content.strip()) >= 100:
        valid.append(a)
    print(f"Found {len(valid)} valid items.")
    return valid
  except Exception as e:
    print("Fetch error:", e)
    return []

def summarize_text(text, max_retries=3):
  if not text or len(text.strip()) < 50:
    return "Article too short to summarize."
  cleaned = clean_text_for_batch_summary(text)
  if len(cleaned) < 50:
    return "Article content insufficient after cleaning."
  max_len = 3000
  if len(cleaned) > max_len:
    # truncate on sentence boundaries
    parts = re.split(r'([.!?])', cleaned)
    acc = ""
    for i in range(0, len(parts), 2):
      seg = parts[i] + (parts[i+1] if i+1 < len(parts) else '')
      if len(acc) + len(seg) <= max_len:
        acc += seg
      else:
        break
    cleaned = acc.strip()

  for attempt in range(max_retries):
    try:
      r = requests.post(SUMMARY_API_URL, json={"text": cleaned}, timeout=45,
                        headers={'Content-Type': 'application/json'})
      r.raise_for_status()
      summary = (r.json() or {}).get("summary","")
      ok, _ = validate_summary_quality(summary)
      if ok:
        return summary.strip()
      time.sleep(1 * (attempt + 1))
    except requests.exceptions.Timeout:
      time.sleep(3 * (attempt + 1))
    except requests.exceptions.RequestException as e:
      print("Request error:", e)
      time.sleep(2 * (attempt + 1))
    except Exception as e:
      print("Unexpected error:", e)
      time.sleep(2 * (attempt + 1))
  return "Summary generation failed after multiple attempts."

def update_article_summary(article_id, summary):
  try:
    if not summary or len(summary.strip()) < 10:
      print("Skip update: summary too short")
      return False
    resp = supabase.from_("news").update({
      "summary": summary.strip(),
      "updated_at": "now()"
    }).eq("id", article_id).execute()
    return bool(resp.data)
  except Exception as e:
    print("Update error:", e)
    return False

def check_api_health():
  try:
    health_url = SUMMARY_API_URL.replace('/summarize', '/health')
    r = requests.get(health_url, timeout=15)
    return r.status_code == 200
  except Exception:
    return False

def main():
  print("Batch summarization start")
  if not check_api_health():
    print("Summarizer API not healthy")
    return
  articles = fetch_articles_without_summary()
  if not articles:
    print("Nothing to do.")
    return
  ok = 0; fail = 0; skip = 0
  t0 = time.time()
  for i, a in enumerate(articles, 1):
    print(f"[{i}/{len(articles)}] {a.get('title','')[:80]}")
    content = a.get("content") or a.get("description") or a.get("summary") or ""
    if not content or len(content.strip()) < 100:
      skip += 1; continue
    s = summarize_text(content)
    if s and not s.startswith("Summary generation failed"):
      if update_article_summary(a["id"], s):
        ok += 1
      else:
        fail += 1
    else:
      fail += 1
    time.sleep(0.4)
  dt = time.time() - t0
  print(f"Done. OK:{ok} Fail:{fail} Skip:{skip} Time:{dt/60:.1f}m")

if __name__ == "__main__":
  main()

