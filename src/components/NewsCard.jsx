import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// FIXED: Safe SVG generation without btoa() issues
const createSafeSVG = (category, color) => {
  const categoryText = String(category || 'News').replace(/[^\w\s]/g, ''); // Remove special chars
  const cleanColor = String(color || '#6b7280').replace(/[^\w#]/g, ''); // Sanitize color
  
  // Create SVG as data URL without btoa() to avoid character encoding issues
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(`
    <svg width="800" height="600" viewBox="0 0 800 600" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:${cleanColor};stop-opacity:1" />
          <stop offset="100%" style="stop-color:${cleanColor};stop-opacity:0.8" />
        </linearGradient>
      </defs>
      <rect width="800" height="600" fill="url(#grad)"/>
      <circle cx="400" cy="250" r="60" fill="white" opacity="0.3"/>
      <rect x="340" y="290" width="120" height="8" rx="4" fill="white" opacity="0.3"/>
      <rect x="360" y="310" width="80" height="6" rx="3" fill="white" opacity="0.2"/>
      <text x="400" y="380" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="28" font-weight="600">${categoryText}</text>
      <text x="400" y="410" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="16" opacity="0.8">Good News Story</text>
    </svg>
  `)}`;
};

// BULLETPROOF Image Component - Fixed to prevent character encoding errors
const BulletproofImage = ({ 
  src, 
  alt, 
  className, 
  category = 'news'
}) => {
  const [currentSrc, setCurrentSrc] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorCount, setErrorCount] = useState(0);

  // SAFE fallback images - no btoa() encoding issues
  const getReliableFallbacks = (category) => {
    const categoryColors = {
      'Health': '#22c55e',
      'Innovation & Tech': '#3b82f6', 
      'Environment & Sustainability': '#10b981',
      'Education': '#8b5cf6',
      'Science & Space': '#6366f1',
      'Humanitarian & Rescue': '#ef4444',
      'Blindspot': '#f59e0b'
    };
    
    const color = categoryColors[category] || '#6b7280';
    const safeCategory = String(category || 'news').replace(/[^\w\s]/g, '').toLowerCase();
    
    return [
      // Fallback 1: Unsplash with safe category
      `https://source.unsplash.com/800x600/?${safeCategory.replace(/\s+/g, ',')}`,
      
      // Fallback 2: Picsum with safe seed
      `https://picsum.photos/800/600?random=${Math.abs(safeCategory.split('').reduce((a, b) => a + b.charCodeAt(0), 0))}`,
      
      // Fallback 3: Placeholder service with safe encoding
      `https://via.placeholder.com/800x600/${color.slice(1)}/white?text=${encodeURIComponent(category || 'News')}`,
      
      // Fallback 4: SAFE SVG using encodeURIComponent instead of btoa
      createSafeSVG(category, color)
    ];
  };

  // Initialize image source
  useEffect(() => {
    setErrorCount(0);
    setIsLoading(true);
    
    // Sanitize src to prevent invalid characters
    const sanitizedSrc = src && typeof src === 'string' ? src.trim() : null;
    
    if (!sanitizedSrc || 
        sanitizedSrc === 'null' || 
        sanitizedSrc === 'undefined' || 
        sanitizedSrc.includes('undefined') || 
        !sanitizedSrc.match(/^(https?:\/\/|data:)/)) {
      // Go straight to fallbacks if no valid source
      const fallbacks = getReliableFallbacks(category);
      setCurrentSrc(fallbacks[0]);
    } else {
      setCurrentSrc(sanitizedSrc);
    }
  }, [src, category]);

  const handleImageLoad = () => {
    setIsLoading(false);
  };

  const handleImageError = () => {
    const fallbacks = getReliableFallbacks(category);
    const nextIndex = errorCount + (currentSrc === src ? 0 : 1);
    
    if (nextIndex < fallbacks.length) {
      console.log(`🔄 Image error, trying fallback ${nextIndex + 1}/${fallbacks.length} for ${category}`);
      setCurrentSrc(fallbacks[nextIndex]);
      setErrorCount(nextIndex);
      setIsLoading(true);
    } else {
      console.error(`❌ All fallbacks failed for ${category}`);
      setIsLoading(false);
    }
  };

  // Sanitize className to prevent invalid CSS class names
  const safeClassName = typeof className === 'string' 
    ? className.replace(/[^\w\s\-_]/g, '') 
    : '';

  return (
    <div className="relative overflow-hidden bg-gray-100 dark:bg-gray-800">
      {currentSrc && (
        <img
          src={currentSrc}
          alt={String(alt || '').replace(/[^\w\s]/g, '')} // Sanitize alt text
          className={`${safeClassName} transition-opacity duration-300 ${isLoading ? 'opacity-50' : 'opacity-100'}`}
          onLoad={handleImageLoad}
          onError={handleImageError}
          loading="lazy"
        />
      )}
      
      {/* Loading spinner */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800">
          <div className="w-8 h-8 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
        </div>
      )}
      
      {/* Debug info (development only) */}
      {process.env.NODE_ENV === 'development' && errorCount > 0 && (
        <div className="absolute top-2 right-2 bg-orange-500 text-white text-xs px-2 py-1 rounded opacity-75">
          Fallback {errorCount + 1}
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
  
  // Sanitize text content to prevent invalid characters
  const safeTitle = String(title || '').replace(/[^\w\s\-.,!?]/g, '');
  const safeCategory = String(category || '').replace(/[^\w\s&]/g, '');
  const safeSummary = String(summary || '').replace(/[^\w\s\-.,!?]/g, '');
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
          />
          <div className={isCategoryPage ? "wide-rectangle-content-borderless" : "newscard-overlay-borderless"}>
            {isCategoryPage ? (
              <>
                <div className="wide-rectangle-category-borderless">Sponsored</div>
                <h3 className="wide-rectangle-title-borderless">
                  This ad supports the platform
                </h3>
                <p className="wide-rectangle-summary-borderless">
                  Thank you for supporting quality journalism and positive news.
                </p>
              </>
            ) : (
              <>
                <div className="newscard-category-borderless">Sponsored</div>
                <h3 className="newscard-title-borderless">
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
          />
        </div>
        
        <div className="wide-rectangle-content-borderless">
          {/* Category badge */}
          {safeCategory && (
            <div className="wide-rectangle-category-borderless">
              {safeCategory}
            </div>
          )}
          
          {/* Title */}
          <h3 className="wide-rectangle-title-borderless">
            <a 
              href={`/article/${id}`} 
              className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
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
      />
      <div className="newscard-overlay-borderless">
        {safeCategory && (
          <div className="newscard-category-borderless">
            {safeCategory}
          </div>
        )}
        <h3 className="newscard-title-borderless">
          <a href={`/article/${id}`} className="hover:text-blue-300 transition-colors">
            {safeTitle}
          </a>
        </h3>
      </div>
    </div>
  );
};

export default NewsCard;
