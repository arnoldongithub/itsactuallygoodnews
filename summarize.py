# summarize.py (BART-CNN, safer cleaning, truncation handling)
from transformers import BartForConditionalGeneration, BartTokenizer
from fastapi import FastAPI
from pydantic import BaseModel
import torch
import re
import logging
import gc

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()

MODEL_NAME = "sshleifer/distilbart-cnn-12-6"  # BART CNN distilled (fast + good)

# Load model with memory-conscious settings
try:
    logger.info(f"Loading model {MODEL_NAME} with memory optimizations...")
    torch_dtype = torch.float16 if torch.cuda.is_available() else torch.float32
    tokenizer = BartTokenizer.from_pretrained(MODEL_NAME)
    model = BartForConditionalGeneration.from_pretrained(
        MODEL_NAME,
        torch_dtype=torch_dtype,
        low_cpu_mem_usage=True,
        device_map="auto" if torch.cuda.is_available() else None
    )
    if not torch.cuda.is_available():
        model = model.to('cpu')
    logger.info("Model loaded.")
except Exception as e:
    logger.error(f"Optimized load failed: {e}")
    tokenizer = BartTokenizer.from_pretrained(MODEL_NAME)
    model = BartForConditionalGeneration.from_pretrained(MODEL_NAME)

class SummaryRequest(BaseModel):
    text: str

URL_PAT = re.compile(r'https?://[^\s\]]+|www\.[^\s\]]+|ftp://[^\s\]]+', re.I)

def clean_text_for_summary(text: str) -> str:
    if not text:
        return ""
    # strip urls, media refs, cms junk
    t = URL_PAT.sub("", text)
    t = re.sub(r'\[https?://[^\]]+\]', '', t)
    t = re.sub(r'\[[^\]]*\.(jpg|png|gif|jpeg|webp|svg|mp4|mp3|pdf)\]', '', t, flags=re.I)
    t = re.sub(r'(wordpress-assets|cdn|static|assets|images)\.[^\s\]]+', '', t, flags=re.I)
    t = re.sub(r'\[[^\]]*\.(html|php|aspx|htm|pdf|css|js)\]', '', t, flags=re.I)
    for ph in [r'\[Read more\]', r'\[Continue reading\]', r'\[Source:?[^\]]*\]',
               r'\[Photo:?[^\]]*\]', r'\[Video:?[^\]]*\]', r'\[Image:?[^\]]*\]',
               r'\[Credit:?[^\]]*\]']:
        t = re.sub(ph, '', t, flags=re.I)
    # emails/phones/handles/hashtags
    t = re.sub(r'\S+@\S+\.\S+', '', t)
    t = re.sub(r'\(\d{3}\)\s*\d{3}-\d{4}', '', t)
    t = re.sub(r'\d{3}-\d{3}-\d{4}', '', t)
    t = re.sub(r'@\w+|#\w+', '', t)
    # collapse whitespace
    t = re.sub(r'\s+', ' ', t).strip()
    return t

def fix_truncated_summary(summary: str) -> str:
    if not summary:
        return ""
    s = URL_PAT.sub("", summary)
    s = re.sub(r'\s+', ' ', s).strip()
    parts = re.split(r'[.!?]+', s)
    out = []
    for i, sent in enumerate(parts):
        sent = sent.strip()
        if not sent:
            continue
        is_last = (i == len(parts) - 1)
        if is_last:
            trunc_patterns = [
                r'\b(peo|peopl|technol|technolo|compan|govern|researc|developm?)$',
                r'\b(and|or|but|the|to|for|with|in|on|at|a|an|is|was|were|has|have|had)$',
                r'\b(this|that|these|those|who|what|when|where|why|how|which)$',
                r'\b(according|including|such|many|some|most|all|every|each|both)$',
                r'\b\d+$', r'\b[a-z]{1,2}$'
            ]
            is_trunc = (
                len(sent) < 8 or
                any(re.search(p, sent, re.I) for p in trunc_patterns) or
                sent.endswith((',', ';', ':')) or
                sent.count('(') != sent.count(')') or
                sent.count('"') % 2 != 0 or
                sent.count("'") % 2 != 0
            )
            if not is_trunc:
                out.append(sent)
        else:
            out.append(sent)
    if out:
        res = '. '.join(out)
        if not res.endswith(('.', '!', '?')):
            res += '.'
        res = res[0].upper() + res[1:] if res else res
        return res
    return "Summary could not be generated due to content processing limitations."

def post_process_summary(summary: str) -> str:
    if not summary:
        return ""
    s = fix_truncated_summary(summary)
    s = re.sub(r'\s+', ' ', s).strip()
    if len(s.split()) < 5:
        return "Summary too brief to be meaningful."
    if not s.endswith(('.', '!', '?')):
        s += '.'
    if len(s.strip()) < 20:
        return "Generated summary was insufficient for meaningful content."
    return s

@app.post("/summarize")
def summarize(req: SummaryRequest):
    try:
        cleaned = clean_text_for_summary(req.text)
        if len(cleaned.split()) < 10:
            return {"summary": "Article too short to summarize effectively."}

        inputs = tokenizer(
            [cleaned],
            max_length=1024,  # BART CNN input cap
            return_tensors="pt",
            truncation=True,
            padding=True
        )

        with torch.no_grad():
            summary_ids = model.generate(
                inputs["input_ids"],
                max_new_tokens=100,
                min_length=30,
                length_penalty=1.0,
                num_beams=4,
                early_stopping=True,
                no_repeat_ngram_size=3,
                do_sample=False,
                pad_token_id=tokenizer.eos_token_id,
                repetition_penalty=1.05,
                forced_eos_token_id=tokenizer.eos_token_id
            )

        # Decode summary (entire sequence is summary for BART-CNN generation)
        decoded = tokenizer.decode(summary_ids[0], skip_special_tokens=True)
        final = post_process_summary(decoded)

        if torch.cuda.is_available():
            torch.cuda.empty_cache()
        gc.collect()

        return {"summary": final}
    except Exception as e:
        logger.error(f"Summarization failed: {e}")
        if torch.cuda.is_available():
            torch.cuda.empty_cache()
        gc.collect()
        return {"summary": "Summary generation failed due to processing error."}

@app.get("/health")
def health_check():
    try:
        sample = "This article describes positive policy changes and community progress with meaningful outcomes."
        cleaned = clean_text_for_summary(sample)
        inputs = tokenizer([cleaned], max_length=256, return_tensors='pt', truncation=True)
        with torch.no_grad():
            _ = model.generate(inputs["input_ids"], max_new_tokens=40, min_length=10, num_beams=2, early_stopping=True)
        info = {}
        if torch.cuda.is_available():
            info["gpu_memory_allocated"] = f"{torch.cuda.memory_allocated()/1024**2:.1f} MB"
        return {"status": "healthy", "model": MODEL_NAME, "enhancements_active": True, **info}
    except Exception as e:
        return {"status": "unhealthy", "model": MODEL_NAME, "error": str(e)}

@app.get("/")
def root():
    return {
        "message": "IAGN Summarizer API (BART-CNN)",
        "model": MODEL_NAME,
        "features": ["memory-optimized load","cleaning","truncation handling","deterministic beams"]
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)

