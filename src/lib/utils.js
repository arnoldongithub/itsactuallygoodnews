// Complete utils.js - Final Corrected Version
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

/**
 * Enhanced title cleaning that handles all HTML artifacts
 * @param {string} title - The raw title that may contain HTML
 * @returns {string} - Clean, readable title
 */
export const cleanTitle = (title) => {
  if (!title) return 'Untitled Story';
  
  // Remove HTML tags and entities
  let cleaned = title
    .replace(/<[^>]*>/g, '') // Remove all HTML tags like <b>, </b>, <em>, etc.
    .replace(/&[a-zA-Z0-9#]+;/g, '') // Remove HTML entities like &amp;, &quot;
    .replace(/&[a-zA-Z0-9#]+/g, '') // Remove incomplete entities
    .replace(/\s+/g, ' ') // Normalize whitespace
    .replace(/^\s+|\s+$/g, '') // Trim whitespace
    .replace(/^[^\w\s]+|[^\w\s]+$/g, '') // Remove leading/trailing non-word chars
    .trim();
  
  // If title is now empty or too short, provide fallback
  if (cleaned.length < 5) {
    return 'News Story';
  }
  
  // Capitalize first letter if needed
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
};

/**
 * Enhanced content cleaning for better readability
 * @param {string} content - Raw content that may contain HTML and URLs
 * @returns {string} - Clean, readable content
 */
export const cleanContent = (content) => {
  if (!content) return '';
  
  return content
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/&[a-zA-Z0-9#]+;/g, '') // Remove HTML entities
    .replace(/https?:\/\/[^\s]+/g, '') // Remove URLs
    .replace(/www\.[^\s]+/g, '') // Remove www links
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();
};

/**
 * Enhanced summary cleaning that removes URLs and provides better context
 * @param {string} summary - Raw summary that may contain URLs and HTML
 * @returns {string} - Clean, contextual summary
 */
export const cleanSummary = (summary) => {
  if (!summary) return '';
  
  let cleaned = summary
    // Remove HTML tags first
    .replace(/<[^>]*>/g, '')
    // Remove URLs (comprehensive patterns)
    .replace(/https?:\/\/[^\s]+/g, '')
    .replace(/www\.[^\s]+/g, '')
    .replace(/[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}/g, '')
    // Remove specific URL patterns
    .replace(/\/[^\s]*\.(html|php|aspx|htm|pdf|jpg|png|gif)/gi, '')
    .replace(/\[https?[^\]]*\]/g, '') // Remove [https://...] patterns
    .replace(/\[[^\]]*\]/g, '') // Remove other bracketed content
    // Remove common file paths and technical references
    .replace(/\/sites\/[^\s]*/g, '')
    .replace(/\/files\/[^\s]*/g, '')
    .replace(/\.png\]/gi, '')
    .replace(/\.jpg\]/gi, '')
    .replace(/\.pdf\]/gi, '')
    // Remove HTML entities
    .replace(/&[a-zA-Z0-9#]+;/g, '')
    // Clean up punctuation and whitespace
    .replace(/\s+/g, ' ')
    .replace(/^\s+|\s+$/g, '')
    .replace(/^[^\w\s]+|[^\w\s]+$/g, '')
    .trim();
  
  // If summary is now too short, empty, or just technical fragments, provide context
  if (cleaned.length < 30 || 
      cleaned.match(/^(please refer|country:|source:|png|jpg|pdf)/i) ||
      cleaned.match(/^\w{1,3}$/) // Single short words
  ) {
    return 'This story provides important updates on recent positive developments and progress in this area.';
  }
  
  // Clean up remaining fragments
  cleaned = cleaned
    .replace(/^(please refer to|country:|source:)/i, '')
    .replace(/attached map\.?/i, '')
    .trim();
  
  // Ensure summary ends properly
  if (cleaned && !cleaned.match(/[.!?]$/)) {
    cleaned += '.';
  }
  
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
  const cleaned = cleanSummary(text);
  
  // If cleaned text is too short or generic, create contextual points
  if (cleaned.length < 50 || 
      cleaned.includes('important updates') ||
      cleaned.includes('positive developments')) {
    return [
      'This story highlights recent positive developments in the field',
      'New progress has been made that benefits communities',
      'The developments show promising signs for the future',
      'Key stakeholders are working together for positive change'
    ].slice(0, maxPoints);
  }
  
  // Split by sentences and clean up
  const sentences = cleaned
    .split(/[.!?]+/)
    .map(s => s.trim())
    .filter(s => s.length > 15) // Longer minimum for better context
    .slice(0, maxPoints);
  
  if (sentences.length === 0) {
    return ['This story contains important positive news and updates'];
  }
  
  return sentences.map(sentence => {
    let clean = sentence.charAt(0).toUpperCase() + sentence.slice(1);
    // Ensure sentence ends with a period if it doesn't already
    return clean.match(/[.!?]$/) ? clean : clean + '.';
  });
};

/**
 * Truncate text to specified length with ellipsis
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string} - Truncated text with ellipsis if needed
 */
export const truncateText = (text, maxLength = 100) => {
  if (!text || text.length <= maxLength) return text;
  
  return text.slice(0, maxLength).trim() + '...';
};

/**
 * Format date for display
 * @param {string|Date} date - Date to format
 * @returns {string} - Formatted date string
 */
export const formatDate = (date) => {
  if (!date) return 'Unknown date';
  
  try {
    return new Date(date).toLocaleDateString('en-US', {
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
      'redcross.org': 'Red Cross'
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
    'Red Cross': 'RC'
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
  
  // Additional cleanup for common issues
  cleaned = cleaned
    .replace(/^-+|-+$/g, '') // Remove leading/trailing dashes
    .replace(/^–+|–+$/g, '') // Remove en-dashes
    .replace(/^\|+|\|+$/g, '') // Remove pipes
    .replace(/^\.+|\.+$/g, '') // Remove leading/trailing dots
    .replace(/^"+|"+$/g, '') // Remove quotes
    .replace(/^\(+|\)+$/g, '') // Remove parentheses
