// Fixed utils.js - Syntax Error Corrected
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
 * Enhanced bullet points that extract specific facts from summaries
 * @param {string} text - Summary text to convert to bullet points
 * @param {number} maxPoints - Maximum number of bullet points
 * @returns {string[]} - Array of contextual bullet points
 */
export const createBulletPoints = (text, maxPoints = 5) => {
  if (!text || typeof text !== 'string') return [];
  
  // Clean the text first using your existing cleanSummary function
  const cleanedText = cleanSummary(text);
  
  if (cleanedText.length < 50) {
    return [
      'This story highlights recent positive developments in the field',
      'New progress has been made that benefits communities', 
      'The developments show promising signs for the future',
      'Key stakeholders are working together for positive change'
    ].slice(0, maxPoints);
  }
  
  // ENHANCED: Extract specific facts and key information
  const extractedPoints = [];
  
  // Strategy 1: Look for sentences with key impact words
  const impactSentences = extractImpactfulSentences(cleanedText);
  extractedPoints.push(...impactSentences);
  
  // Strategy 2: Extract numerical facts and statistics
  const numericalFacts = extractNumericalFacts(cleanedText);
  extractedPoints.push(...numericalFacts);
  
  // Strategy 3: Extract location and organization information
  const contextualInfo = extractContextualInfo(cleanedText);
  extractedPoints.push(...contextualInfo);
  
  // Strategy 4: Extract achievement and breakthrough information
  const achievements = extractAchievements(cleanedText);
  extractedPoints.push(...achievements);
  
  // Remove duplicates and generic content
  const uniquePoints = deduplicatePoints(extractedPoints);
  
  // If we have good extracted points, use them
  if (uniquePoints.length >= 3) {
    return uniquePoints.slice(0, maxPoints);
  }
  
  // Fallback: Split by sentences and enhance them
  const sentences = cleanedText
    .split(/[.!?]+/)
    .map(s => s.trim())
    .filter(s => s.length > 20) // Longer minimum for better context
    .slice(0, maxPoints);
  
  if (sentences.length === 0) {
    return ['This story contains important positive news and updates'];
  }
  
  return sentences.map(sentence => {
    let enhancedSentence = enhanceSentence(sentence);
    // Ensure proper capitalization
    enhancedSentence = enhancedSentence.charAt(0).toUpperCase() + enhancedSentence.slice(1);
    // Ensure sentence ends properly
    return enhancedSentence.match(/[.!?]$/) ? enhancedSentence : enhancedSentence + '.';
  });
};

// Helper function to extract impactful sentences
const extractImpactfulSentences = (text) => {
  const points = [];
  const impactWords = [
    'improved', 'increased', 'reduced', 'enhanced', 'better', 'successful',
    'breakthrough', 'innovative', 'revolutionary', 'significant', 'major',
    'helps', 'benefits', 'supports', 'enables', 'allows', 'provides'
  ];
  
  const sentences = text.split(/[.!?]+/);
  
  sentences.forEach(sentence => {
    const lowerSentence = sentence.toLowerCase();
    const hasImpact = impactWords.some(word => lowerSentence.includes(word));
    
    if (hasImpact && sentence.length > 25 && sentence.length < 120) {
      points.push(sentence.trim());
    }
  });
  
  return points.slice(0, 2); // Max 2 impact sentences
};

// Helper function to extract numerical facts
const extractNumericalFacts = (text) => {
  const points = [];
  const numberPatterns = [
    /(\d+(?:,\d+)*(?:\.\d+)?)\s*(?:percent|%)/gi,
    /(\d+(?:,\d+)*)\s+(?:people|patients|students|families|individuals)/gi,
    /(?:over|more than|up to|nearly|approximately)\s+(\d+(?:,\d+)*)/gi,
    /(\d+(?:,\d+)*)\s+(?:million|billion|thousand)/gi
  ];
  
  numberPatterns.forEach(pattern => {
    const matches = [...text.matchAll(pattern)];
    matches.slice(0, 2).forEach(match => {
      const context = getContextAroundMatch(text, match.index, 60);
      if (context && context.length > 20) {
        points.push(`Key statistic: ${context.trim()}`);
      }
    });
  });
  
  return points.slice(0, 2);
};

// Helper function to extract location and organization info
const extractContextualInfo = (text) => {
  const points = [];
  
  // Location patterns
  const locationPattern = /(?:in|at|from|across)\s+([A-Z][a-zA-Z\s]+(?:University|College|Hospital|Center|Institute|City|County|State))/g;
  const locationMatches = [...text.matchAll(locationPattern)];
  
  if (locationMatches.length > 0) {
    const location = locationMatches[0][1];
    points.push(`Initiative based at ${location}`);
  }
  
  // Organization patterns
  const orgPattern = /(?:by|with|through)\s+([A-Z][a-zA-Z\s&]+(?:Foundation|Organization|Company|Association|Institute))/g;
  const orgMatches = [...text.matchAll(orgPattern)];
  
  if (orgMatches.length > 0) {
    const org = orgMatches[0][1];
    points.push(`Partnership involves ${org}`);
  }
  
  return points.slice(0, 1);
};

// Helper function to extract achievements
const extractAchievements = (text) => {
  const points = [];
  const achievementWords = [
    'achieved', 'completed', 'launched', 'introduced', 'developed', 'created',
    'established', 'built', 'implemented', 'discovered', 'invented'
  ];
  
  const sentences = text.split(/[.!?]+/);
  
  sentences.forEach(sentence => {
    const lowerSentence = sentence.toLowerCase();
    const hasAchievement = achievementWords.some(word => lowerSentence.includes(word));
    
    if (hasAchievement && sentence.length > 30 && sentence.length < 100) {
      const enhanced = sentence.trim().replace(/^[a-z]/, letter => letter.toUpperCase());
      points.push(`Achievement: ${enhanced}`);
    }
  });
  
  return points.slice(0, 2);
};

// Helper function to get context around a regex match
const getContextAroundMatch = (text, matchIndex, contextLength) => {
  const start = Math.max(0, matchIndex - contextLength);
  const end = Math.min(text.length, matchIndex + contextLength);
  return text.substring(start, end);
};

// Helper function to enhance sentences
const enhanceSentence = (sentence) => {
  // Remove generic beginnings
  sentence = sentence.replace(/^(?:this|the|it|that)\s+/i, '');
  
  // Add context if sentence is too vague
  const genericPhrases = ['story', 'article', 'development', 'news'];
  const isGeneric = genericPhrases.some(phrase => sentence.toLowerCase().includes(phrase));
  
  if (isGeneric && sentence.length < 50) {
    return `Key development: ${sentence}`;
  }
  
  return sentence;
};

// Helper function to remove duplicate points
const deduplicatePoints = (points) => {
  const unique = [];
  const seen = new Set();
  
  points.forEach(point => {
    // Create a normalized version for comparison
    const normalized = point.toLowerCase().replace(/[^\w\s]/g, '').replace(/\s+/g, ' ');
    
    if (!seen.has(normalized) && point.length >= 20 && point.length <= 150) {
      seen.add(normalized);
      unique.push(point);
    }
  });
  
  return unique;
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
 * Strip all HTML and return plain text (for database cleanup)
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
 * Clean database text directly (for bulk operations)
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
 * Check if text contains HTML tags
 * @param {string} text - Text to check
 * @returns {boolean} - True if contains HTML
 */
export const containsHtml = (text) => {
  if (!text) return false;
  return /<[^>]*>/.test(text) || /&[a-zA-Z0-9#]+;/.test(text);
};

/**
 * Generate category-specific image sources for fallbacks
 * @param {string} category - News category
 * @param {string|number} storyId - Story ID for uniqueness
 * @returns {string[]} - Array of fallback image URLs
 */
export const getCategoryImageSources = (category, storyId) => {
  const safeId = Math.abs(String(storyId).split('').reduce((a, b) => a + b.charCodeAt(0), 0));
  
  const categoryKeywords = {
    'Health': 'health,medical,wellness,doctor,hospital',
    'Innovation & Tech': 'technology,innovation,computer,digital,future',
    'Environment & Sustainability': 'environment,nature,sustainability,green,renewable',
    'Education': 'education,learning,school,student,knowledge',
    'Science & Space': 'science,space,astronomy,research,laboratory', 
    'Humanitarian & Rescue': 'humanitarian,help,community,volunteers,aid',
    'Blindspot': 'hidden,discover,stories,investigation,truth',
    'Viral': 'trending,popular,social,community,celebration'
  };
  
  const keywords = categoryKeywords[category] || 'news,positive,good';
  
  return [
    `https://source.unsplash.com/800x600/?${keywords}&random=${safeId}`,
    `https://source.unsplash.com/800x600/?${keywords}&sig=${safeId + 50}`,
    `https://picsum.photos/800/600?random=${safeId + 100}`,
    `https://picsum.photos/800/600?random=${safeId + 200}`,
    `https://via.placeholder.com/800x600/6366f1/white?text=${encodeURIComponent(category || 'News')}`
  ];
};

/**
 * Create category-specific SVG fallback images
 * @param {string} category - News category
 * @returns {string} - Data URL for SVG image
 */
export const createCategorySVG = (category) => {
  const categoryInfo = {
    'Health': { emoji: '🏥', color: '#22c55e', bgColor: '#dcfce7', title: 'Health News' },
    'Innovation & Tech': { emoji: '💻', color: '#3b82f6', bgColor: '#dbeafe', title: 'Tech News' },
    'Environment & Sustainability': { emoji: '🌱', color: '#10b981', bgColor: '#d1fae5', title: 'Environment' },
    'Education': { emoji: '📚', color: '#8b5cf6', bgColor: '#ede9fe', title: 'Education' },
    'Science & Space': { emoji: '🔬', color: '#6366f1', bgColor: '#e0e7ff', title: 'Science' },
    'Humanitarian & Rescue': { emoji: '🤝', color: '#ef4444', bgColor: '#fee2e2', title: 'Humanitarian' },
    'Blindspot': { emoji: '🔍', color: '#f59e0b', bgColor: '#fef3c7', title: 'Blindspot' },
    'Viral': { emoji: '🔥', color: '#f97316', bgColor: '#fed7aa', title: 'Viral News' }
  };
  
  const info = categoryInfo[category] || { 
    emoji: '📰', 
    color: '#6b7280', 
    bgColor: '#f3f4f6', 
    title: 'Good News' 
  };
  
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(`
    <svg width="800" height="600" viewBox="0 0 800 600" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="categoryGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:${info.color};stop-opacity:0.8" />
          <stop offset="100%" style="stop-color:${info.color};stop-opacity:0.4" />
        </linearGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      
      <!-- Background -->
      <rect width="800" height="600" fill="${info.bgColor}"/>
      
      <!-- Gradient overlay -->
      <rect width="800" height="600" fill="url(#categoryGrad)"/>
      
      <!-- Decorative elements -->
      <circle cx="150" cy="150" r="30" fill="white" opacity="0.1"/>
      <circle cx="650" cy="100" r="40" fill="white" opacity="0.15"/>
      <circle cx="700" cy="450" r="25" fill="white" opacity="0.1"/>
      <circle cx="100" cy="500" r="35" fill="white" opacity="0.12"/>
      
      <!-- Main circle for emoji -->
      <circle cx="400" cy="250" r="120" fill="white" opacity="0.25"/>
      <circle cx="400" cy="250" r="90" fill="white" opacity="0.35"/>
      <circle cx="400" cy="250" r="70" fill="white" opacity="0.45"/>
      
      <!-- Emoji -->
      <text x="400" y="280" text-anchor="middle" font-size="80" filter="url(#glow)">${info.emoji}</text>
      
      <!-- Title -->
      <text x="400" y="420" text-anchor="middle" fill="white" font-family="system-ui, -apple-system, sans-serif" font-size="36" font-weight="700" filter="url(#glow)">${info.title}</text>
      
      <!-- Subtitle -->
      <text x="400" y="460" text-anchor="middle" fill="white" font-family="system-ui, -apple-system, sans-serif" font-size="18" opacity="0.9">Positive Stories</text>
      
      <!-- Bottom accent line -->
      <rect x="250" y="520" width="300" height="4" fill="white" opacity="0.6" rx="2"/>
    </svg>
  `)}`;
};

/**
 * Enhanced image source validation
 * @param {string} src - Image source URL
 * @returns {boolean} - Whether the source is valid
 */
export const isValidImageSource = (src) => {
  if (!src || typeof src !== 'string') return false;
  
  const cleanSrc = src.trim();
  return cleanSrc &&
         cleanSrc !== 'null' && 
         cleanSrc !== 'undefined' && 
         !cleanSrc.includes('undefined') &&
         (cleanSrc.startsWith('http') || cleanSrc.startsWith('data:')) &&
         !cleanSrc.includes('placeholder.com/0x0'); // Avoid broken placeholder URLs
};

/**
 * Get the best available image source with smart fallbacks
 * @param {Object} article - Article object with image URLs
 * @returns {string|null} - Best available image source
 */
export const getBestImageSource = (article) => {
  if (!article) return null;
  
  const sources = [
    article.image_url,
    article.thumbnail_url,
    article.featured_image,
    article.image
  ];
  
  // Find the first valid source
  for (const src of sources) {
    if (isValidImageSource(src)) {
      return src;
    }
  }
  
  return null;
};
