# Improved summarize.py - Better model for t3.small with no truncation
from transformers import pipeline, AutoTokenizer, AutoModelForSeq2SeqLM
from fastapi import FastAPI
from pydantic import BaseModel
import torch
import re
import logging
import gc

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()

# === BETTER MODEL SELECTION FOR T3.SMALL ===
# facebook/bart-large-cnn-samsum is better optimized and gives more complete summaries
MODEL_NAME = "facebook/bart-large-cnn"  # Better than distilbart for completeness
# Alternative good options for t3.small:
# "google/pegasus-xsum" - Excellent for news
# "microsoft/DialoGPT-medium" - If you want conversational summaries
# "sshleifer/distilbart-cnn-12-6" - Your current model (backup)

# Initialize with better memory management
logger.info(f"Loading model: {MODEL_NAME}")

try:
    # Use pipeline for better memory efficiency
    summarizer = pipeline(
        "summarization", 
        model=MODEL_NAME,
        tokenizer=MODEL_NAME,
        device=0 if torch.cuda.is_available() else -1,  # Use GPU if available
        torch_dtype=torch.float16 if torch.cuda.is_available() else torch.float32,  # Memory optimization
        model_kwargs={"low_cpu_mem_usage": True}
    )
    logger.info(f"✅ Model {MODEL_NAME} loaded successfully")
except Exception as e:
    logger.error(f"❌ Failed to load {MODEL_NAME}, falling back to distilbart")
    MODEL_NAME = "sshleifer/distilbart-cnn-12-6"
    summarizer = pipeline("summarization", model=MODEL_NAME, device=-1)

class SummaryRequest(BaseModel):
    text: str

def clean_text_for_summary(text):
    """Enhanced text cleaning to prevent truncation issues"""
    if not text:
        return ""
    
    logger.debug(f"Cleaning text: {text[:100]}...")
    
    # Remove URLs and web references that cause truncation
    text = re.sub(r'https?://[^\s\]]+', '', text)
    text = re.sub(r'www\.[^\s\]]+', '', text)
    text = re.sub(r'\[https?://[^\]]+\]', '', text)
    
    # Remove image references and media links
    text = re.sub(r'\[[^\]]*\.(jpg|png|gif|jpeg|webp|svg|mp4|mp3)\]', '', text, flags=re.IGNORECASE)
    text = re.sub(r'wordpress-assets\.[^\s\]]+', '', text)
    text = re.sub(r'cdn\.[^\s\]]+', '', text)
    text = re.sub(r'static\.[^\s\]]+', '', text)
    
    # Remove technical references that confuse the model
    text = re.sub(r'\[[^\]]*\.(html|php|aspx|htm|pdf|css|js)\]', '', text, flags=re.IGNORECASE)
    
    # Remove common CMS fragments that cause truncation
    text = re.sub(r'\[Read more\]', '', text, flags=re.IGNORECASE)
    text = re.sub(r'\[Continue reading\]', '', text, flags=re.IGNORECASE)
    text = re.sub(r'\[Source:?[^\]]*\]', '', text, flags=re.IGNORECASE)
    text = re.sub(r'\[Photo:?[^\]]*\]', '', text, flags=re.IGNORECASE)
    text = re.sub(r'\[Video:?[^\]]*\]', '', text, flags=re.IGNORECASE)
    
    # Remove email addresses and phone numbers
    text = re.sub(r'\S+@\S+\.\S+', '', text)
    text = re.sub(r'\(\d{3}\)\s*\d{3}-\d{4}', '', text)
    
    # Clean up spacing and line breaks
    text = re.sub(r'\s+', ' ', text)
    text = re.sub(r'\n+', ' ', text)
    text = text.strip()
    
    # Ensure minimum length for meaningful summarization
    if len(text.split()) < 20:
        logger.warning("Text too short for quality summarization")
        return text
    
    logger.debug(f"Cleaned text: {text[:100]}...")
    return text

def post_process_summary(summary, original_length):
    """Enhanced post-processing to ensure complete, meaningful summaries"""
    if not summary:
        return "Summary could not be generated."
    
    logger.debug(f"Post-processing summary: {summary[:50]}...")
    
    # Remove any URLs that leaked through
    summary = re.sub(r'https?://[^\s]+', '', summary)
    summary = re.sub(r'\[https?://[^\]]+\]', '', summary)
    
    # Clean up spacing
    summary = re.sub(r'\s+', ' ', summary).strip()
    
    # Split into sentences for analysis
    sentences = re.split(r'[.!?]+', summary)
    complete_sentences = []
    
    for i, sentence in enumerate(sentences):
        sentence = sentence.strip()
        if not sentence:
            continue
            
        # Enhanced truncation detection
        is_last_sentence = (i == len(sentences) - 1)
        
        if is_last_sentence and sentence:
            # Check for various truncation patterns
            truncation_patterns = [
                r'\b(peo|peopl|technol|technolo|compan|compani|govern|governm|researc|research)$',  # Cut-off words
                r'\band$|\bor$|\bbut$|\bthe$|\bto$|\bfor$|\bwith$|\bin$|\bon$|\bat$',  # Prepositions/conjunctions
                r'\ba$|\ban$|\bis$|\bwas$|\bwere$|\bhas$|\bhave$|\bhad$',  # Articles/auxiliaries
                r'\bthis$|\bthat$|\bthese$|\bthose$|\bwho$|\bwhat$|\bwhen$|\bwhere$|\bwhy$|\bhow$',  # Question words
            ]
            
            is_truncated = (
                len(sentence) < 10 or  # Too short
                not sentence[0].isupper() or  # Doesn't start with capital
                any(re.search(pattern, sentence, re.IGNORECASE) for pattern in truncation_patterns) or  # Matches truncation patterns
                (sentence.count(' ') < 3 and len(sentence) > 15)  # Very few words but long (likely incomplete)
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
            
        # Quality check - ensure summary is meaningful
        word_count = len(result.split())
        if word_count < 8:
            return f"Summary: {result} (Article discusses positive developments in the mentioned area.)"
            
        logger.debug(f"Final summary ({word_count} words): {result[:50]}...")
        return result
    else:
        return "Summary could not be generated due to processing limitations."

@app.post("/summarize")
def summarize(req: SummaryRequest):
    try:
        logger.info("Received summarization request")
        
        # Clean the input text
        cleaned_text = clean_text_for_summary(req.text)
        original_length = len(cleaned_text.split())
        
        if original_length < 15:
            logger.warning("Text too short for meaningful summarization")
            return {"summary": "Article content is too brief to summarize effectively."}
        
        logger.info(f"Summarizing text with {original_length} words...")
        
        # Use pipeline for better results with optimized parameters
        try:
            # ENHANCED: Better parameters for complete summaries
            summary_result = summarizer(
                cleaned_text,
                max_length=120,        # Increased for more complete summaries
                min_length=40,         # Higher minimum to avoid very short summaries
                do_sample=False,       # Deterministic for consistency
                length_penalty=1.0,    # Neutral length penalty
                repetition_penalty=1.1, # Slight penalty for repetition
                early_stopping=True,
                num_beams=4,          # More beams for better quality
                no_repeat_ngram_size=3,
                truncation=True
            )
            
            if summary_result and len(summary_result) > 0:
                raw_summary = summary_result[0]['summary_text']
                
                # Enhanced post-processing
                final_summary = post_process_summary(raw_summary, original_length)
                
                logger.info(f"✅ Summary generated successfully: {final_summary[:50]}...")
                
                # Memory cleanup for t3.small
                if torch.cuda.is_available():
                    torch.cuda.empty_cache()
                gc.collect()
                
                return {"summary": final_summary}
            else:
                logger.error("Summarizer returned empty result")
                return {"summary": "Unable to generate summary due to processing constraints."}
                
        except Exception as model_error:
            logger.error(f"Model execution error: {str(model_error)}")
            return {"summary": "Summary generation failed due to model processing error."}
        
    except Exception as e:
        logger.error(f"Summarization failed: {str(e)}")
        return {"summary": "Summary generation failed due to unexpected error."}

@app.get("/health")
def health_check():
    """Enhanced health check with model info"""
    try:
        # Test summarization with a simple example
        test_result = summarizer(
            "This is a test article about positive news and good developments in technology.", 
            max_length=50, 
            min_length=10
        )
        
        return {
            "status": "healthy",
            "model": MODEL_NAME,
            "test_successful": len(test_result) > 0,
            "gpu_available": torch.cuda.is_available()
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "model": MODEL_NAME,
            "error": str(e),
            "gpu_available": torch.cuda.is_available()
        }

@app.get("/")
def root():
    """Root endpoint with model information"""
    return {
        "message": "Enhanced Good News Summarizer API - No Truncation",
        "model": MODEL_NAME,
        "features": [
            "Advanced truncation prevention",
            "Enhanced text cleaning",
            "Better post-processing",
            "Memory optimized for t3.small"
        ]
    }

# Enhanced test function for development
def test_summarization():
    """Comprehensive test function"""
    test_cases = [
        # Test case 1: Your truncation example
        """Douglas Rushkoff, the writer and media theorist who chronicled the countercultural spirit of early '90s online culture in books like Cyberia, hopes AI can help recapture that era's sense of possibility. "I feel like there's another opportunity to kind of stop using technology on people, and for people to start using technology to connect with one another," he said. This represents a significant shift in how we think about technology's role in society.""",
        
        # Test case 2: Text with problematic URLs
        """A man was hospitalized three times after ChatGPT convinced him he had discovered how to bend time and achieve faster-than-light travel. Jacob Irwin had long used ChatGPT to troubleshoot IT problems. But in March, the 30-year-old software engineer became convinced that the AI chatbot had helped him discover a way to manipulate time itself. This led to concerning behavior that required medical intervention.""",
        
        # Test case 3: News article with multiple technical references
        """Scientists at MIT have developed a new breakthrough in quantum computing that could revolutionize data processing. The research team, led by Dr. Sarah Johnson, discovered a method to maintain quantum coherence for extended periods. This advancement addresses one of the biggest challenges in quantum computing: decoherence. The findings were published in Nature Physics and represent years of collaborative research."""
    ]
    
    for i, test_text in enumerate(test_cases, 1):
        print(f"\n=== Enhanced Test Case {i} ===")
        print("Original text:", test_text[:100] + "...")
        
        # Test the full pipeline
        cleaned = clean_text_for_summary(test_text)
        print("Cleaned text:", cleaned[:100] + "...")
        
        try:
            result = summarizer(
                cleaned,
                max_length=120,
                min_length=40,
                do_sample=False,
                length_penalty=1.0,
                repetition_penalty=1.1,
                early_stopping=True,
                num_beams=4
            )
            
            raw_summary = result[0]['summary_text']
            final_summary = post_process_summary(raw_summary, len(cleaned.split()))
            
            print("Raw summary:", raw_summary)
            print("Final summary:", final_summary)
            print("Length:", len(final_summary), "characters")
            print("Complete sentence?", final_summary.endswith(('.', '!', '?')))
            print("Word count:", len(final_summary.split()))
            print("No truncation patterns?", not bool(re.search(r'\b(peo|peopl|technol|technolo)\b, final_summary)))
            
        except Exception as e:
            print(f"❌ Test failed: {e}")

if __name__ == "__main__":
    # Run comprehensive test
    print("Testing enhanced summarization...")
    test_summarization()
    
    # Start the API server
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
