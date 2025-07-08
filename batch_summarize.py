import os
import requests
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")  # Must be service role for write access
SUMMARY_API_URL = os.getenv("SUMMARY_API_URL", "http://127.0.0.1:8000/summarize")

if not SUPABASE_URL or not SUPABASE_KEY:
    raise Exception("Missing Supabase URL or service role key")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def fetch_articles_without_summary(limit=50):
    response = supabase.from_("news").select("*").is_("summary", "null").limit(limit).execute()
    return response.data

def summarize_text(text):
    try:
        res = requests.post(SUMMARY_API_URL, json={"text": text})
        res.raise_for_status()
        return res.json().get("summary", "")
    except Exception as e:
        print(f"Failed to summarize: {e}")
        return None

def update_article_summary(article_id, summary):
    supabase.from_("news").update({"summary": summary}).eq("id", article_id).execute()

def main():
    articles = fetch_articles_without_summary()
    print(f"Found {len(articles)} articles without summary")

    for article in articles:
        print(f"Summarizing article ID: {article['id']}")
        summary = summarize_text(article.get("content") or "")
        if summary:
            update_article_summary(article["id"], summary)
            print("✅ Updated summary")
        else:
            print("⚠️ Skipped due to summarization failure")

if __name__ == "__main__":
    main()
