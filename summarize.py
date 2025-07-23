# Complete Corrected summarize.py - URL Cleaning Fixed
from transformers import BartForConditionalGeneration, BartTokenizer
from fastapi import FastAPI
from pydantic import BaseModel
import torch
import re
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()

# Use smaller, memory-efficient summarization model
model_name = "sshleifer/distilbart-cnn-12-6"
tokenizer = BartTokenizer.from_pretrained(model_name)
model = BartForConditionalGeneration.from_pretrained(model_name)

logger.info(f"Model {model_name} loaded successfully")

class SummaryRequest(BaseModel):
    text: str

def clean_text_for_summary(text):
    """Clean text before summarization to remove URLs and unwanted content"""
    if not text:
        return ""
    
    logger.debug(f"Cleaning text: {text[:100]}...")
    
    # Remove URLs and web references
    text = re.sub(r'https?://[^\s\]]+', '', text)
    text = re.sub(r'www\.[^\s\]]+', '', text)
    
    # Remove image references and brackets with URLs
    text = re.sub(r'\[https?://[^\]]+\]', '', text)
    text = re.sub(r'\[[^\]]*\.(jpg|png|gif|jpeg|webp|svg)\]', '', text, flags=re.IGNORECASE)
    
    # Remove WordPress and CMS specific references
    text = re.sub(r'wordpress-assets\.[^\s\]]+', '', text)
    text = re.sub(r'cdn\.[^\s\]]+', '', text)
    text = re.sub(r'static\.[^\s\]]+', '', text)
    
    # Remove file extensions and technical references
    text = re.sub(r'\[[^\]]*\.(html|php|aspx|htm|pdf)\]', '', text, flags=re.IGNORECASE)
    
    # Remove common CMS and technical fragments
    text = re.sub(r'\[Read more\]', '', text, flags=re.IGNORECASE)
    text = re.sub(r'\[Continue reading\]', '', text, flags=re.IGNORECASE)
    text = re.sub(r'\[Source:?[^\]]*\]', '', text, flags=re.IGNORECASE)
    
    # Clean up multiple spaces and newlines
    text = re.sub(r'\s+', ' ', text)
    text = re.sub(r'\n+', ' ', text)
    
    # Remove leading/trailing whitespace
    text = text.strip()
    
    logger.debug(f"Cleaned text: {text[:100]}...")
    return text

def post_process_summary(summary):
    """Clean summary after generation"""
    if not summary:
        return ""
    
    # Remove any URLs that might have leaked through
    summary = re.sub(r'https?://[^\s]+', '', summary)
    summary = re.sub(r'www\.[^\s]+', '', summary)
    summary = re.sub(r'\[https?://[^\]]+\]', '', summary)
    
    # Remove image references
    summary = re.sub(r'\[[^\]]*\.(jpg|png|gif|jpeg)\]', '', summary, flags=re.IGNORECASE)
    
    # Clean up spacing
    summary = re.sub(r'\s+', ' ', summary).strip()
    
    # Ensure proper sentence ending
    if summary and not summary.endswith(('.', '!', '?')):
        summary += '.'
    
    # Capitalize first letter
    if summary:
        summary = summary[0].upper() + summary[1:]
    
    return summary

@app.post("/summarize")
def summarize(req: SummaryRequest):
    try:
        logger.info("Received summarization request")
        
        # Clean the input text first
        cleaned_text = clean_text_for_summary(req.text)
        
        if len(cleaned_text.split()) < 10:
            logger.warning("Text too short for summarization")
            return {"summary": "Article too short to summarize effectively."}
        
        # Tokenize and generate summary
        inputs = tokenizer(
            [cleaned_text], 
            max_length=1024, 
            return_tensors="pt", 
            truncation=True,
            padding=True
        )
        
        logger.info("Generating summary...")
        
        summary_ids = model.generate(
            inputs["input_ids"],
            max_length=150,
            min_length=40,
            length_penalty=2.0,
            num_beams=4,
            early_stopping=True,
            no_repeat_ngram_size=3,
            do_sample=False
        )
        
        # Decode summary
        summary = tokenizer.decode(summary_ids[0], skip_special_tokens=True)
        
        # Post-process the summary
        final_summary = post_process_summary(summary)
        
        logger.info(f"Summary generated successfully: {final_summary[:50]}...")
        
        return {"summary": final_summary}
        
    except Exception as e:
        logger.error(f"Summarization failed: {str(e)}")
        return {"summary": "Summary generation failed due to processing error."}

@app.get("/health")
def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "model": model_name}

@app.get("/")
def root():
    """Root endpoint"""
    return {"message": "Good News Summarizer API", "model": model_name}

# Test function for development
def test_summarization():
    """Test function to verify summarization works"""
    test_text = """
    A man was hospitalized three times after ChatGPT convinced him he had discovered how to bend time and achieve faster-than-light travel. [https://wordpress-assets.futurism.com/2025/07/chatgpt-man-hospital.jpg]
    Jacob Irwin had long used ChatGPT to troubleshoot IT problems. But in March, the 30-year-old software engineer became convinced that the AI chatbot had helped him discover a way to manipulate time itself.
    """
    
    print("Original text:", test_text)
    print("\nCleaned text:", clean_text_for_summary(test_text))
    
    # Test the full pipeline
    inputs = tokenizer([clean_text_for_summary(test_text)], max_length=1024, return_tensors="pt", truncation=True)
    summary_ids = model.generate(inputs["input_ids"], max_length=150, min_length=40, length_penalty=2.0, num_beams=4, early_stopping=True)
    summary = tokenizer.decode(summary_ids[0], skip_special_tokens=True)
    final_summary = post_process_summary(summary)
    
    print("\nFinal summary:", final_summary)

if __name__ == "__main__":
    # Run test
    print("Testing summarization...")
    test_summarization()
    
    # Start the API server
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
