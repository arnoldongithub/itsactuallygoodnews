// Enhanced utils.js with title cleaning and existing clsx functionality
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

/**
 * Clean HTML tags and artifacts from story titles
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
  
  // Additional cleanup for common issues
  cleaned = cleaned
    .replace(/^-+|-+$/g, '') // Remove leading/trailing dashes
    .replace(/^–+|–+$/g, '') // Remove en-dashes
    .replace(/^\|+|\|+$/g, '') // Remove pipes
    .replace(/^\.+|\.+$/g, '') // Remove leading/trailing dots
    .replace(/^"+|"+$/g, '') // Remove quotes
    .trim();
  
  // If title is now empty or too short, provide fallback
  if (cleaned.length < 5) {
    return 'News Story';
  }
  
  // Capitalize first letter if needed
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
};

/**
 * Clean content text for summaries and descriptions
 * @param {string} content - Raw content that may contain HTML
 * @returns {string} - Clean, readable content
 */
export const cleanContent = (content) => {
  if (!content) return '';
  
  return content
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/&[a-zA-Z0-9#]+;/g, '') // Remove HTML entities
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();
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
 * Create bullet points from text content
 * @param {string} text - Text to convert to bullet points
 * @param {number} maxPoints - Maximum number of bullet points
 * @returns {string[]} - Array of clean bullet points
 */
export const createBulletPoints = (text, maxPoints = 5) => {
  if (!text) return [];
  
  // Clean the text first
  const cleaned = cleanContent(text);
  
  // Split by sentences and clean up
  const sentences = cleaned
    .split(/[.!?]+/)
    .map(s => s.trim())
    .filter(s => s.length > 10)
    .slice(0, maxPoints);
  
  return sentences.map(sentence => {
    const clean = sentence.charAt(0).toUpperCase() + sentence.slice(1);
    // Ensure sentence ends with a period if it doesn't already
    return clean.match(/[.!?]$/) ? clean : clean + '.';
  });
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
    summary: cleanContent(article.summary),
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
