import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// Safe import with fallbacks for build compatibility
let getCategoryImageSources, createCategorySVG;
try {
  const utils = require('@/lib/utils');
  getCategoryImageSources = utils.getCategoryImageSources;
  createCategorySVG = utils.createCategorySVG;
} catch (e) {
  console.log('Using fallback image functions');
}

// Fallback functions for build safety
const safeCategoryImages = getCategoryImageSources || ((category, storyId) => {
  const safeId = Math.abs(String(storyId).split('').reduce((a, b) => a + b.charCodeAt(0), 0));
  
  const categoryKeywords = {
    'Health': 'health,medical,wellness',
    'Innovation & Tech': 'technology,innovation,computer',
    'Environment & Sustainability': 'environment,nature,sustainability',
    'Education': 'education,learning,school',
    'Science & Space': 'science,space,astronomy',
    'Humanitarian & Rescue': 'humanitarian,help,community',
    'Blindspot': 'hidden,discover,stories'
  };
  
  const keywords = categoryKeywords[category] || 'news,positive,good';
  
  return [
    `https://source.unsplash.com/800x600/?${keywords}&random=${safeId}`,
    `https://picsum.photos/800/600?random=${safeId + 100}`,
    `https://via.placeholder.com/800x600/6b7280/white?text=${encodeURIComponent(category || 'News')}`
  ];
});

const safeCategorySVG = createCategorySVG || ((category) => {
  const categoryInfo = {
    'Health': { emoji: '🏥', color: '#22c55e', title: 'Health News' },
    'Innovation & Tech': { emoji: '💻', color: '#3b82f6', title: 'Tech News' },
    'Environment & Sustainability': { emoji: '🌱', color: '#10b981', title: 'Environment' },
    'Education': { emoji: '📚', color: '#8b5cf6', title: 'Education' },
    'Science & Space': { emoji: '🔬', color: '#6366f1', title: 'Science' },
    'Humanitarian & Rescue': { emoji: '🤝', color: '#ef4444', title: 'Humanitarian' },
    'Blindspot': { emoji: '🔍', color: '#f59e0b', title: 'Blindspot' }
  };
  
  const info = categoryInfo[category] || { emoji: '📰', color: '#6b7280', title: 'Good News' };
  
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(`
    <svg width="800" height="600" viewBox="0 0 800 600" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="categoryGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:${info.color};stop-opacity:1" />
          <stop offset="100%" style="stop-color:${info.color};stop-opacity:0.7" />
        </linearGradient>
      </defs>
      <rect width="800" height="600" fill="url(#categoryGrad)"/>
      <circle cx="400" cy="200" r="80" fill="white" opacity="0.2"/>
      <circle cx="400" cy="200" r="60" fill="white" opacity="0.3"/>
      <text x="400" y="220" text-anchor="middle" font-size="60">${info.emoji}</text>
      <text x="400" y="380" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="32" font-weight="700">${info.title}</text>
      <text x="400" y="420" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="18" opacity="0.9">Positive Stories</text>
    </svg>
  `)}`;
});

// ENHANCED BulletproofImage Component with Category-Specific Images
const BulletproofImage = ({ 
  src, 
  alt, 
  className, 
  category = 'news',
  storyId = 1
}) => {
  const [currentSrc, setCurrentSrc] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorCount, setErrorCount] = useState(0);

  // Get category-specific fallback images using safe functions
  const getReliableFallbacks = (category, storyId) => {
    const categoryImages = safeCategoryImages(category, storyId);
    const svgFallback = safeCategorySVG(category);
    
    return [
      // Try original source first (if valid)
      src && typeof src === 'string' && src.startsWith('http') ? src : null,
      
      // Category-specific images
      ...categoryImages,
      
      // Final SVG fallback (guaranteed to work)
      svgFallback
    ].filter(source => source);
  };

  // Initialize image source
  useEffect(() => {
    setErrorCount(0);
    setIsLoading(true);
    
    const fallbacks = getReliableFallbacks(category, storyId);
    if (fallbacks.length > 0) {
      setCurrentSrc(fallbacks[0]);
    }
  }, [src, category, storyId]);

  const handleImageLoad = () => {
    setIsLoading(false);
  };

  const handleImageError = () => {
    const fallbacks = getReliableFallbacks(category, storyId);
    const nextIndex = errorCount + 1;
    
    if (nextIndex < fallbacks.length) {
      console.log(`🔄 Image error, trying category fallback ${nextIndex + 1}/${fallbacks.length} for ${category}`);
      setCurrentSrc(fallbacks[nextIndex]);
      setErrorCount(nextIndex);
      setIsLoading(true);
    } else {
      console.log(`✅ Using final SVG fallback for ${category}`);
      setIsLoading(false);
    }
  };

  // Sanitize className to prevent invalid CSS class names
  const safeClassName = typeof className === 'string' 
    ? className.replace(/[^\w\s\-_]/g, '') 
    : '';

  // Sanitize alt text
  const safeAlt = String(alt || `${category} news story`).replace(/[^\w\s\-.,!?]/g, '');

  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700">
      {currentSrc && (
        <img
          src={currentSrc}
          alt={safeAlt}
          className={`${safeClassName} transition-all duration-500 ${isLoading ? 'opacity-60 scale-105' : 'opacity-100 scale-100'}`}
          onLoad={handleImageLoad}
          onError={handleImageError}
          loading="lazy"
        />
      )}
      
      {/* Enhanced loading spinner with category color */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative">
            <div className="w-12 h-12 border-4 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-4 h-4 bg-blue-500 rounded-full animate-pulse"></div>
            </div>
          </div>
        </div>
      )}
      
      {/* Category indicator for debugging */}
      {process.env.NODE_ENV === 'development' && errorCount > 0 && (
        <div className="absolute top-2 right-2 bg-blue-500 text-white text-xs px-2 py-1 rounded opacity-75">
          {category} #{errorCount + 1}
        </div>
      )}
    </div>
  );
};

const NewsCard = ({ article, isBookmarked, onBookmarkToggle }) => {
  const location = useLocation();
  
  if (!article) return null;
  
  const {
    id,
    category,
    title,
    image_url,
    thumbnail_url,
    is_ad,
    ad_image_url,
    ad_link_url,
    summary,
    source_name,
    positivity_score
  } = article;

  // Enhanced fallback logic with sanitization
  const getImageSrc = () => {
    const sources = [image_url, thumbnail_url].filter(src => {
      if (!src || typeof src !== 'string') return false;
      const cleanSrc = src.trim();
      return cleanSrc &&
             cleanSrc !== 'null' && 
             cleanSrc !== 'undefined' && 
             !cleanSrc.includes('undefined') &&
             (cleanSrc.startsWith('http') || cleanSrc.startsWith('data:'));
    });
    
    return sources[0] || null;
  };

  const finalImageSrc = getImageSrc();
  
  // Check if this is a category page
  const isCategoryPage = location.pathname.includes('/category');
  
  // Sanitize text content to prevent invalid characters and fix spacing
  const safeTitle = String(title || '').replace(/[^\w\s\-.,!?'"]/g, '').replace(/\s+/g, ' ').trim();
  const safeCategory = String(category || '').replace(/[^\w\s&]/g, '');
  const safeSummary = String(summary || '').replace(/[^\w\s\-.,!?'"]/g, '').replace(/\s+/g, ' ').trim();
  const safeSourceName = String(source_name || '').replace(/[^\w\s.-]/g, '');
  
  // Handle ads
  if (is_ad) {
    return (
      <a href={ad_link_url || "#"} target="_blank" rel="noopener noreferrer" className="block">
        <div className={isCategoryPage ? "wide-rectangle-card-borderless" : "newscard-borderless"}>
          <BulletproofImage
            src={ad_image_url}
            alt="Sponsored Content"
            className={isCategoryPage ? "wide-rectangle-image-borderless" : "newscard-image-borderless"}
            category="Sponsored"
            storyId="ad"
          />
          <div className={isCategoryPage ? "wide-rectangle-content-borderless" : "newscard-overlay-borderless"}>
            {isCategoryPage ? (
              <>
                <div className="wide-rectangle-category-borderless">Sponsored</div>
                <h3 className="wide-rectangle-title-borderless font-bold">
                  This ad supports the platform
                </h3>
                <p className="wide-rectangle-summary-borderless">
                  Thank you for supporting quality journalism and positive news.
                </p>
              </>
            ) : (
              <>
                <div className="newscard-category-borderless">Sponsored</div>
                <h3 className="newscard-title-borderless font-bold">
                  This ad supports the platform
                </h3>
              </>
            )}
          </div>
        </div>
      </a>
    );
  }
  
  // WIDE RECTANGLE LAYOUT for category pages (100% width, borderless)
  if (isCategoryPage) {
    return (
      <article className="wide-rectangle-card-borderless group">
        <div className="wide-rectangle-image-container-borderless">
          <BulletproofImage
            src={finalImageSrc}
            alt={safeTitle}
            className="wide-rectangle-image-borderless group-hover:scale-105 transition-transform duration-300"
            category={safeCategory}
            storyId={id}
          />
        </div>
        
        <div className="wide-rectangle-content-borderless">
          {/* Category badge */}
          {safeCategory && (
            <div className="wide-rectangle-category-borderless">
              {safeCategory}
            </div>
          )}
          
          {/* Title - FIXED: Ensure bold styling */}
          <h3 className="wide-rectangle-title-borderless font-bold">
            <a 
              href={`/article/${id}`} 
              className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors font-bold"
              style={{ fontWeight: '700' }}
            >
              {safeTitle}
            </a>
          </h3>
          
          {/* Summary */}
          {safeSummary && (
            <p className="wide-rectangle-summary-borderless">
              {safeSummary.length > 150 ? `${safeSummary.substring(0, 150)}...` : safeSummary}
            </p>
          )}
          
          {/* Source & Positivity Bar */}
          <div className="wide-rectangle-meta-borderless">
            <div className="source-info">
              <div className="source-logo">
                {safeSourceName ? safeSourceName.charAt(0).toUpperCase() : 'N'}
              </div>
              <span className="source-name">
                {safeSourceName ? safeSourceName.replace('www.', '').replace('.com', '') : 'Unknown'}
              </span>
            </div>
            <div className="positivity-score">
              Positivity: {Math.round(positivity_score || 0)}
            </div>
          </div>
        </div>
        
        {/* Read more arrow */}
        <div className="wide-rectangle-arrow-borderless">
          <a 
            href={`/article/${id}`}
            className="inline-flex items-center text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors"
          >
            <span className="mr-2">Read More</span>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </a>
        </div>
      </article>
    );
  }
  
  // Default newscard for other pages (homepage, etc.) - borderless
  return (
    <div className="newscard-borderless">
      <BulletproofImage
        src={finalImageSrc}
        alt={safeTitle}
        className="newscard-image-borderless"
        category={safeCategory}
        storyId={id}
      />
      <div className="newscard-overlay-borderless">
        {safeCategory && (
          <div className="newscard-category-borderless">
            {safeCategory}
          </div>
        )}
        <h3 className="newscard-title-borderless font-bold">
          <a 
            href={`/article/${id}`} 
            className="hover:text-blue-300 transition-colors font-bold"
            style={{ fontWeight: '700' }}
          >
            {safeTitle}
          </a>
        </h3>
      </div>
    </div>
  );
};

export default NewsCard;
