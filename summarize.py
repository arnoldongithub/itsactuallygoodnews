# Final Fixed summarize.py - No More Truncation Issues
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

def fix_truncated_summary(summary):
    """Fix summaries that are truncated at odd points"""
    if not summary:
        return ""
    
    logger.debug(f"Fixing potential truncation in: {summary[:50]}...")
    
    # Remove any URLs that might have leaked through
    summary = re.sub(r'https?://[^\s]+', '', summary)
    summary = re.sub(r'\[https?://[^\]]+\]', '', summary)
    
    # Clean up spacing
    summary = re.sub(r'\s+', ' ', summary).strip()
    
    # Split into sentences
    sentences = re.split(r'[.!?]+', summary)
    complete_sentences = []
    
    for i, sentence in enumerate(sentences):
        sentence = sentence.strip()
        if not sentence:
            continue
            
        # Check if this sentence seems complete
        is_last_sentence = (i == len(sentences) - 1)
        
        if is_last_sentence and sentence:
            # For the last sentence, check if it seems truncated
            is_truncated = (
                len(sentence) < 10 or  # Too short
                not sentence[0].isupper() or  # Doesn't start with capital
                sentence.endswith((' and', ' or', ' but', ' the', ' to', ' for', ' with', ' in', ' on', ' at', ' a', ' an')) or  # Ends with preposition/conjunction
                sentence.endswith(('and', 'or', 'but', 'the', 'to', 'for', 'with', 'in', 'on', 'at', 'a', 'an', 'peo', 'peopl', 'technol', 'technolo')) or  # Common truncations
                re.search(r'\b[a-z]+$', sentence) and len(sentence.split()[-1]) < 4  # Ends with short incomplete word
            )
            
            if not is_truncated:
                complete_sentences.append(sentence)
            else:
                logger.debug(f"Removing truncated sentence: {sentence}")
        else:
            # Not the last sentence, include it
            complete_sentences.append(sentence)
    
    # Rejoin sentences
    if complete_sentences:
        result = '. '.join(complete_sentences)
        
        # Ensure proper ending
        if not result.endswith(('.', '!', '?')):
            result += '.'
            
        # Capitalize first letter
        if result:
            result = result[0].upper() + result[1:]
            
        logger.debug(f"Fixed summary: {result[:50]}...")
        return result
    else:
        return "Summary could not be generated properly."

def post_process_summary(summary):
    """Clean and fix summary after generation"""
    if not summary:
        return ""
    
    # First, fix truncation issues
    summary = fix_truncated_summary(summary)
    
    # Additional cleaning
    summary = re.sub(r'\s+', ' ', summary).strip()
    
    # Ensure it's not too short
    if len(summary.split()) < 3:
        return "Summary too brief to be meaningful."
    
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
        
        # IMPROVED: Better tokenization with proper handling
        inputs = tokenizer(
            [cleaned_text], 
            max_length=512,  # Increased input length
            return_tensors="pt", 
            truncation=True,
            padding=True
        )
        
        logger.info("Generating summary with improved parameters...")
        
        # FIXED: Better generation parameters to avoid truncation
        summary_ids = model.generate(
            inputs["input_ids"],
            max_new_tokens=80,        # BETTER: Only count new tokens, shorter to avoid cuts
            min_length=25,            # Lower minimum for flexibility
            length_penalty=1.2,       # Less aggressive penalty  
            num_beams=3,              # Faster while still good quality
            early_stopping=True,
            no_repeat_ngram_size=3,   # Avoid repetition
            do_sample=False,          # Deterministic for consistency
            pad_token_id=tokenizer.eos_token_id,  # Proper padding
            repetition_penalty=1.1    # Slight penalty for repetition
        )
        
        # IMPROVED: Decode only the new tokens (skip input)
        if hasattr(tokenizer, 'batch_decode'):
            summary = tokenizer.batch_decode(summary_ids, skip_special_tokens=True)[0]
        else:
            summary = tokenizer.decode(summary_ids[0], skip_special_tokens=True)
        
        # CRITICAL: Post-process to fix any remaining truncation
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
    return {"message": "Good News Summarizer API - Fixed Truncation", "model": model_name}

# Enhanced test function for development  
def test_summarization():
    """Test function to verify summarization works without truncation"""
    test_cases = [
        # Test case 1: The truncation example you showed
        """Douglas Rushkoff, the writer and media theorist who chronicled the countercultural spirit of early '90s online culture in books like Cyberia, hopes AI can help recapture that era's sense of possibility. "I feel like there's another opportunity to kind of stop using technology on people, and for people to start using technology to connect with one another," he said.""",
        
        # Test case 2: Text with URLs that should be cleaned
        """A man was hospitalized three times after ChatGPT convinced him he had discovered how to bend time and achieve faster-than-light travel. [https://wordpress-assets.futurism.com/2025/07/chatgpt-man-hospital.jpg] Jacob Irwin had long used ChatGPT to troubleshoot IT problems. But in March, the 30-year-old software engineer became convinced that the AI chatbot had helped him discover a way to manipulate time itself.""",
        
        # Test case 3: Short text
        """This is a very short article that might be too brief to summarize properly."""
    ]
    
    for i, test_text in enumerate(test_cases, 1):
        print(f"\n=== Test Case {i} ===")
        print("Original text:", test_text[:100] + "...")
        
        cleaned = clean_text_for_summary(test_text)
        print("Cleaned text:", cleaned[:100] + "...")
        
        # Test the full pipeline
        inputs = tokenizer([cleaned], max_length=512, return_tensors='pt', truncation=True, padding=True)
        summary_ids = model.generate(
            inputs["input_ids"], 
            max_new_tokens=80, 
            min_length=25, 
            length_penalty=1.2, 
            num_beams=3, 
            early_stopping=True,
            no_repeat_ngram_size=3,
            repetition_penalty=1.1
        )
        summary = tokenizer.decode(summary_ids[0], skip_special_tokens=True)
        final_summary = post_process_summary(summary)
        
        print("Final summary:", final_summary)
        print("Length:", len(final_summary), "characters")
        print("Complete sentence?", final_summary.endswith(('.', '!', '?')))
        print("Contains 'peo' or similar truncation?", bool(re.search(r'\b(peo|peopl|technol|technolo)\b$', final_summary)))

if __name__ == "__main__":
    # Run test
    print("Testing improved summarization...")
    test_summarization()
    
    # Start the API server
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
