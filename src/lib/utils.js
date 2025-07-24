// Enhanced utils.js - Complete Text Cleaning
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

/**
 * Enhanced title cleaning that handles all HTML artifacts and the <b>Boy</b> issue
 * @param {string} title - The raw title that may contain HTML
 * @returns {string} - Clean, readable title
 */
export const cleanTitle = (title) => {
  if (!title) return 'Untitled Story';
  
  let cleaned = title
    // Remove all HTML tags (including <b>, <i>, <strong>, etc.)
    .replace(/<[^>]*>/g, '')
    // Remove HTML entities with comprehensive mapping
    .replace(/&[a-zA-Z0-9#]+;/g, (match) => {
      const entities = {
        '&amp;': '&',
        '&lt;': '<',
        '&gt;': '>',
        '&quot;': '"',
        '&#39;': "'",
        '&apos;': "'",
        '&nbsp;': ' ',
        '&ndash;': '–',
        '&mdash;': '—',
        '&hellip;': '…',
        '&copy;': '©',
        '&reg;': '®',
        '&trade;': '™',
        '&euro;': '€',
        '&pound;': '£',
        '&yen;': '¥'
      };
      return entities[match] || '';
    })
    // Remove incomplete HTML entities
    .replace(/&[a-zA-Z0-9#]+/g, '')
    // Remove URLs and image references
    .replace(/https?:\/\/[^\s\]]+/g, '')
    .replace(/www\.[^\s\]]+/g, '')
    .replace(/\[https?:\/\/[^\]]+\]/g, '')
    .replace(/\[[^\]]*\.(jpg|png|gif|jpeg|webp|svg)\]/gi, '')
    // Clean up whitespace
    .replace(/\s+/g, ' ')
    .replace(/^\s+|\s+$/g, '')
    // Remove leading/trailing special characters
    .replace(/^[^\w\s]+|[^\w\s]+$/g, '')
    .trim();
  
  // Additional cleanup for common issues
  cleaned = cleaned
    .replace(/^-+|-+$/g, '') // Remove leading/trailing dashes
    .replace(/^–+|–+$/g, '') // Remove en-dashes
    .replace(/^\|+|\|+$/g, '') // Remove pipes
    .replace(/^\.+|\.+$/g, '') // Remove leading/trailing dots
    .replace(/^"+|"+$/g, '') // Remove quotes
    .replace(/^\(+|\)+$/g, '') // Remove parentheses
    .replace(/^\[+|\]+$/g, '') // Remove brackets
    .trim();
  
  // If title is now empty or too short, provide fallback
  if (cleaned.length < 3) {
    return 'News Story';
  }
  
  // Ensure proper capitalization
  if (cleaned) {
    cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
  }
  
  return cleaned;
};

/**
 * Enhanced summary cleaning that removes URLs and provides complete context
 * @param {string} summary - Raw summary that may contain URLs and HTML
 * @returns {string} - Clean, complete summary
 */
export const cleanSummary = (summary) => {
  if (!summary) return 'No summary available';
  
  let cleaned = summary
    // Remove HTML tags first
    .replace(/<[^>]*>/g, '')
    
    // Remove URLs and image references (comprehensive)
    .replace(/https?:\/\/[^\s\]]+/g, '')
    .replace(/www\.[^\s\]]+/g, '')
    .replace(/\[https?:\/\/[^\]]+\]/g, '')
    .replace(/\[[^\]]*\.(jpg|png|gif|jpeg|webp|svg)\]/gi, '')
    
    // Remove WordPress and CMS specific content
    .replace(/wordpress-assets\.[^\s\]]+/gi, '')
    .replace(/cdn\.[^\s\]]+/gi, '')
    .replace(/static\.[^\s\]]+/gi, '')
    
    // Remove common CMS fragments
    .replace(/\[Read more\]/gi, '')
    .replace(/\[Continue reading\]/gi, '')
    .replace(/\[Source:?[^\]]*\]/gi, '')
    .replace(/\[Image:?[^\]]*\]/gi, '')
    .replace(/\[Photo:?[^\]]*\]/gi, '')
    
    // Remove HTML entities
    .replace(/&[a-zA-Z0-9#]+;/g, (match) => {
      const entities = {
        '&amp;': '&',
        '&lt;': '<',
        '&gt;': '>',
        '&quot;': '"',
        '&#39;': "'",
        '&apos;': "'",
        '&nbsp;': ' ',
        '&ndash;': '–',
        '&mdash;': '—',
        '&hellip;': '…'
      };
      return entities[match] || '';
    })
    
    // Clean up whitespace and newlines
    .replace(/\s+/g, ' ')
    .replace(/\n+/g, ' ')
    .trim();
  
  // Fix truncated sentences (like "and for peo.")
  if (cleaned.length > 0) {
    const sentences = cleaned.split(/[.!?]+/);
    const completeSentences = [];
    
    for (let i = 0; i < sentences.length; i++) {
      const sentence = sentences[i].trim();
      if (!sentence) continue;
      
      const isLastSentence = (i === sentences.length - 1);
      
      if (isLastSentence && sentence) {
        // Check if last sentence seems truncated
        const seemsTruncated = (
          sentence.length < 10 ||
          sentence.endsWith(' and') ||
          sentence.endsWith(' or') ||
          sentence.endsWith(' for') ||
          sentence.endsWith(' to') ||
          sentence.endsWith(' the') ||
          sentence.endsWith(' peo') ||
          sentence.endsWith(' peopl') ||
          sentence.endsWith(' technol') ||
          sentence.endsWith(' technolo') ||
          /\b[a-z]{1,3}$/.test(sentence) // Ends with very short word
        );
        
        if (!seemsTruncated) {
          completeSentences.push(sentence);
        }
      } else {
        completeSentences.push(sentence);
      }
    }
    
    if (completeSentences.length > 0) {
      cleaned = completeSentences.join('. ');
    }
  }
  
  // Ensure proper sentence ending
  if (cleaned && !cleaned.endsWith('.') && !cleaned.endsWith('!') && !cleaned.endsWith('?')) {
    cleaned += '.';
  }
  
  // Ensure proper capitalization
  if (cleaned) {
    cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
  }
  
  // If summary is too short or contains generic content, enhance it
  if (cleaned.length < 30 || 
      cleaned.match(/^(please refer|country:|source:|png|jpg|pdf)/i) ||
      cleaned === 'No summary available.' ||
      cleaned.match(/^\w{1,5}\.?$/)) {
    return 'This story provides important updates on recent positive developments and meaningful progress in this area.';
  }
  
  // Limit length but keep complete sentences
  if (cleaned.length > 300) {
    const sentences = cleaned.split(/[.!?]+/);
    let result = '';
    for (const sentence of sentences) {
      const potentialResult = result + sentence.trim() + '. ';
      if (potentialResult.length <= 300) {
        result = potentialResult;
      } else {
        break;
      }
    }
    cleaned = result.trim();
  }
  
  return cleaned;
};

/**
 * Enhanced content cleaning for better readability
 * @param {string} content - Raw content that may contain HTML and URLs
 * @returns {string} - Clean, readable content
 */
export const cleanContent = (content) => {
  if (!content) return '';
  
  let cleaned = content
    // Remove script and style tags completely
    .replace(/<script[^>]*>.*?<\/script>/gi, '')
    .replace(/<style[^>]*>.*?<\/style>/gi, '')
    
    // Remove HTML tags but preserve structure
    .replace(/<[^>]*>/g, ' ')
    
    // Remove URLs and image references
    .replace(/https?:\/\/[^\s\]]+/g, '')
    .replace(/www\.[^\s\]]+/g, '')
    .replace(/\[https?:\/\/[^\]]+\]/g, '')
    .replace(/\[[^\]]*\.(jpg|png|gif|jpeg|webp|svg)\]/gi, '')
    
    // Remove HTML entities
    .replace(/&[a-zA-Z0-9#]+;/g, (match) => {
      const entities = {
        '&amp;': '&',
        '&lt;': '<',
        '&gt;': '>',
        '&quot;': '"',
        '&#39;': "'",
        '&nbsp;': ' ',
        '&ndash;': '–',
        '&mdash;': '—',
        '&hellip;': '…'
      };
      return entities[match] || '';
    })
    
    // Clean up whitespace
    .replace(/\s+/g, ' ')
    .replace(/\n+/g, ' ')
    .trim();
    
  return cleaned;
};

/**
 * Create enhanced bullet points with better context
 * @param {string} text - Text to convert to bullet points
 * @param {number} maxPoints - Maximum number of bullet points
 * @returns {string[]} - Array of contextual bullet points
 */
export const createBulletPoints = (text, maxPoints = 5) => {
  if (!text) return [];
  
  // Clean the text first
  const cleanedText = cleanSummary(text);
  
  // If cleaned text is too short or generic, create contextual points
  if (cleanedText.length < 50 || 
      cleanedText.includes('important updates') ||
      cleanedText.includes('positive developments')) {
    return [
      'This story highlights recent positive developments in the field',
      'New progress has been made that benefits communities',
      'The developments show promising signs for the future',
      'Key stakeholders are working together for positive change'
    ].slice(0, maxPoints);
  }
  
  // Split by sentences and clean up
  const sentences = cleanedText
    .split(/[.!?]+/)
    .map(s => s.trim())
    .filter(s => s.length > 15) // Longer minimum for better context
    .slice(0, maxPoints);
  
  if (sentences.length === 0) {
    return ['This story contains important positive news and updates'];
  }
  
  return sentences.map(sentence => {
    let cleanSentence = sentence.charAt(0).toUpperCase() + sentence.slice(1);
    // Ensure sentence ends with a period if it doesn't already
    return cleanSentence.match(/[.!?]$/) ? cleanSentence : cleanSentence + '.';
  });
};

/**
 * Truncate text to specified length with ellipsis (improved to avoid mid-word cuts)
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string} - Truncated text with ellipsis if needed
 */
export const truncateText = (text, maxLength = 100) => {
  if (!text || text.length <= maxLength) return text;
  
  // Find the last space before maxLength to avoid cutting words
  const truncated = text.substring(0, maxLength);
  const lastSpace = truncated.lastIndexOf(' ');
  
  if (lastSpace > 0) {
    return truncated.substring(0, lastSpace) + '...';
  }
  
  return truncated + '...';
};

/**
 * Format date for display
 * @param {string|Date} date - Date to format
 * @returns {string} - Formatted date string
 */
export const formatDate = (date) => {
  if (!date) return 'Unknown date';
  
  try {
    const dateObj = new Date(date);
    return dateObj.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch (error) {
    return 'Invalid date';
  }
};

/**
 * Extract source name from URL or source field
 * @param {string} source - Source URL or name
 * @returns {string} - Clean source name
 */
export const getSourceName = (source) => {
  if (!source) return 'Unknown';
  
  // If it's already a clean name, return it
  if (!source.includes('.') && !source.includes('/')) {
    return source;
  }
  
  // Extract from URL
  try {
    const url = new URL(source.startsWith('http') ? source : `https://${source}`);
    const hostname = url.hostname.replace('www.', '');
    
    // Map common sources
    const sourceMap = {
      'cnn.com': 'CNN',
      'bbc.com': 'BBC',
      'reuters.com': 'Reuters',
      'ap.org': 'AP News',
      'npr.org': 'NPR',
      'nytimes.com': 'NY Times',
      'washingtonpost.com': 'Washington Post',
      'theguardian.com': 'The Guardian',
      'techcrunch.com': 'TechCrunch',
      'theverge.com': 'The Verge',
      'wired.com': 'Wired',
      'sciencedaily.com': 'Science Daily',
      'medicalxpress.com': 'Medical Xpress',
      'grist.org': 'Grist',
      'treehugger.com': 'TreeHugger',
      'reliefweb.int': 'ReliefWeb',
      'unicef.org': 'UNICEF',
      'redcross.org': 'Red Cross',
      'goodnewsnetwork.org': 'Good News Network',
      'positive.news': 'Positive News',
      'brightvibes.com': 'Bright Vibes',
      'upworthy.com': 'Upworthy'
    };
    
    return sourceMap[hostname] || hostname.split('.')[0].toUpperCase();
  } catch (error) {
    return source.split('.')[0] || 'Unknown';
  }
};

/**
 * Generate source logo/initials from source name
 * @param {string} source - Source name
 * @returns {string} - Source initials or logo text
 */
export const getSourceLogo = (source) => {
  if (!source) return '?';
  
  const cleanSource = getSourceName(source);
  
  // Special cases for well-known sources
  const logoMap = {
    'CNN': 'CNN',
    'BBC': 'BBC',
    'Reuters': 'R',
    'AP News': 'AP',
    'NPR': 'NPR',
    'NY Times': 'NYT',
    'Washington Post': 'WP',
    'The Guardian': 'G',
    'TechCrunch': 'TC',
    'The Verge': 'V',
    'Wired': 'W',
    'Science Daily': 'SD',
    'Medical Xpress': 'MX',
    'Grist': 'G',
    'TreeHugger': 'TH',
    'ReliefWeb': 'RW',
    'UNICEF': 'U',
    'Red Cross': 'RC',
    'Good News Network': 'GNN',
    'Positive News': 'PN',
    'Bright Vibes': 'BV',
    'Upworthy': 'UW'
  };
  
  if (logoMap[cleanSource]) {
    return logoMap[cleanSource];
  }
  
  // Generate initials from source name
  const words = cleanSource.split(/\s+/);
  if (words.length >= 2) {
    return words.slice(0, 2).map(w => w.charAt(0)).join('').toUpperCase();
  }
  
  return cleanSource.charAt(0).toUpperCase();
};

/**
 * Validate and clean article data
 * @param {Object} article - Raw article object
 * @returns {Object} - Cleaned article object
 */
export const cleanArticle = (article) => {
  if (!article) return null;
  
  return {
    ...article,
    title: cleanTitle(article.title),
    summary: cleanSummary(article.summary),
    content: cleanContent(article.content),
    source_name: getSourceName(article.source_name || article.source),
    published_at: article.published_at,
    positivity_score: Math.max(0, Math.min(10, article.positivity_score || 0)),
    virality_score: Math.max(0, Math.min(10, article.virality_score || 0))
  };
};

/**
 * Check if content is safe to display (no harmful content)
 * @param {string} content - Content to check
 * @returns {boolean} - True if content is safe
 */
export const isSafeContent = (content) => {
  if (!content) return true;
  
  const harmfulPatterns = [
    /javascript:/i,
    /<script/i,
    /onclick=/i,
    /onerror=/i,
    /data:text\/html/i
  ];
  
  return !harmfulPatterns.some(pattern => pattern.test(content));
};

/**
 * Format number with appropriate suffix (K, M, B)
 * @param {number} num - Number to format
 * @returns {string} - Formatted number string
 */
export const formatNumber = (num) => {
  if (!num || num < 1000) return num?.toString() || '0';
  
  if (num >= 1000000000) {
    return (num / 1000000000).toFixed(1) + 'B';
  }
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  
  return num.toString();
};

/**
 * Debounce function to limit API calls
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} - Debounced function
 */
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

/**
 * NEW: Strip all HTML and return plain text (for database cleanup)
 * @param {string} text - Text with potential HTML
 * @returns {string} - Plain text only
 */
export const stripAllHtml = (text) => {
  if (!text) return '';
  
  return text
    .replace(/<[^>]*>/g, '')
    .replace(/&[a-zA-Z0-9#]+;/g, '')
    .replace(/\s+/g, ' ')
    .trim();
};

/**
 * NEW: Clean database text directly (for bulk operations)
 * @param {string} text - Raw database text
 * @returns {string} - Cleaned text
 */
export const cleanDatabaseText = (text) => {
  if (!text) return '';
  
  return text
    // Remove all HTML tags
    .replace(/<[^>]*>/g, '')
    // Remove HTML entities
    .replace(/&[a-zA-Z0-9#]+;/g, '')
    // Remove URLs
    .replace(/https?:\/\/[^\s]+/g, '')
    .replace(/www\.[^\s]+/g, '')
    // Clean whitespace
    .replace(/\s+/g, ' ')
    .trim();
};

/**
 * NEW: Check if text contains HTML tags
 * @param {string} text - Text to check
 * @returns {boolean} - True if contains HTML
 */
export const containsHtml = (text) => {
  if (!text) return false;
  return /<[^>]*>/.test(text) || /&[a-zA-Z0-9#]+;/.test(text);
};
