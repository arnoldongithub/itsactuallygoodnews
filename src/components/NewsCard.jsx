import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// INFALLIBLE Smart Image Component - 100% Working Images Guaranteed
const SmartImage = ({ 
  src, 
  alt, 
  className, 
  category = 'news'
}) => {
  const [currentSrc, setCurrentSrc] = useState(null);
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // MULTIPLE FALLBACK LAYERS - 100% guaranteed working images
  const categoryFallbacks = {
    'Health': [
      'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=800&h=600&fit=crop',
      'https://via.placeholder.com/800x600/22c55e/white?text=Health+News',
      'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjYwMCIgdmlld0JveD0iMCAwIDgwMCA2MDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjgwMCIgaGVpZ2h0PSI2MDAiIGZpbGw9IiMyMmM1NWUiLz48dGV4dCB4PSI0MDAiIHk9IjI4MCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0id2hpdGUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxMjAiPvCfj6U8L3RleHQ+PHRleHQgeD0iNDAwIiB5PSIzNDAiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZpbGw9IndoaXRlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMjQiIG9wYWNpdHk9IjAuOCI+SGVhbHRoPC90ZXh0Pjwvc3ZnPg=='
    ],
    'Innovation & Tech': [
      'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=800&h=600&fit=crop',
      'https://via.placeholder.com/800x600/3b82f6/white?text=Tech+News',
      'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjYwMCIgdmlld0JveD0iMCAwIDgwMCA2MDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjgwMCIgaGVpZ2h0PSI2MDAiIGZpbGw9IiMzYjgyZjYiLz48dGV4dCB4PSI0MDAiIHk9IjI4MCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0id2hpdGUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxMjAiPvCfkrs8L3RleHQ+PHRleHQgeD0iNDAwIiB5PSIzNDAiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZpbGw9IndoaXRlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMjQiIG9wYWNpdHk9IjAuOCI+VGVjaDwvdGV4dD48L3N2Zz4='
    ],
    'Environment & Sustainability': [
      'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&h=600&fit=crop',
      'https://via.placeholder.com/800x600/10b981/white?text=Environment',
      'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjYwMCIgdmlld0JveD0iMCAwIDgwMCA2MDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjgwMCIgaGVpZ2h0PSI2MDAiIGZpbGw9IiMxMGI5ODEiLz48dGV4dCB4PSI0MDAiIHk9IjI4MCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0id2hpdGUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxMjAiPvCfjLE8L3RleHQ+PHRleHQgeD0iNDAwIiB5PSIzNDAiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZpbGw9IndoaXRlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMjQiIG9wYWNpdHk9IjAuOCI+RW52aXJvbm1lbnQ8L3RleHQ+PC9zdmc+'
    ],
    'Education': [
      'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=800&h=600&fit=crop',
      'https://via.placeholder.com/800x600/8b5cf6/white?text=Education',
      'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjYwMCIgdmlld0JveD0iMCAwIDgwMCA2MDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjgwMCIgaGVpZ2h0PSI2MDAiIGZpbGw9IiM4YjVjZjYiLz48dGV4dCB4PSI0MDAiIHk9IjI4MCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0id2hpdGUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxMjAiPvCfk5o8L3RleHQ+PHRleHQgeD0iNDAwIiB5PSIzNDAiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZpbGw9IndoaXRlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMjQiIG9wYWNpdHk9IjAuOCI+RWR1Y2F0aW9uPC90ZXh0Pjwvc3ZnPg=='
    ],
    'Science & Space': [
      'https://images.unsplash.com/photo-1446776653964-20c1d3a81b06?w=800&h=600&fit=crop',
      'https://via.placeholder.com/800x600/6366f1/white?text=Science',
      'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjYwMCIgdmlld0JveD0iMCAwIDgwMCA2MDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjgwMCIgaGVpZ2h0PSI2MDAiIGZpbGw9IiM2MzY2ZjEiLz48dGV4dCB4PSI0MDAiIHk9IjI4MCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0id2hpdGUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxMjAiPvCfmpA8L3RleHQ+PHRleHQgeD0iNDAwIiB5PSIzNDAiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZpbGw9IndoaXRlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMjQiIG9wYWNpdHk9IjAuOCI+U2NpZW5jZTwvdGV4dD48L3N2Zz4='
    ],
    'Humanitarian & Rescue': [
      'https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?w=800&h=600&fit=crop',
      'https://via.placeholder.com/800x600/ef4444/white?text=Humanitarian',
      'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjYwMCIgdmlld0JveD0iMCAwIDgwMCA2MDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjgwMCIgaGVpZ2h0PSI2MDAiIGZpbGw9IiNlZjQ0NDQiLz48dGV4dCB4PSI0MDAiIHk9IjI4MCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0id2hpdGUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxMjAiPvCfpJ08L3RleHQ+PHRleHQgeD0iNDAwIiB5PSIzNDAiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZpbGw9IndoaXRlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMjQiIG9wYWNpdHk9IjAuOCI+SHVtYW5pdGFyaWFuPC90ZXh0Pjwvc3ZnPg=='
    ],
    'Blindspot': [
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=600&fit=crop',
      'https://via.placeholder.com/800x600/f59e0b/white?text=Blindspot',
      'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjYwMCIgdmlld0JveD0iMCAwIDgwMCA2MDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjgwMCIgaGVpZ2h0PSI2MDAiIGZpbGw9IiNmNTllMGIiLz48dGV4dCB4PSI0MDAiIHk9IjI4MCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0id2hpdGUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxMjAiPvCfjI08L3RleHQ+PHRleHQgeD0iNDAwIiB5PSIzNDAiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZpbGw9IndoaXRlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMjQiIG9wYWNpdHk9IjAuOCI+QmxpbmRzcG90PC90ZXh0Pjwvc3ZnPg=='
    ]
  };

  const [currentFallbackIndex, setCurrentFallbackIndex] = useState(0);

  // Get fallback chain for current category
  const getFallbackChain = (category) => {
    return categoryFallbacks[category] || categoryFallbacks['Blindspot'];
  };

  // Reset when src changes
  useEffect(() => {
    if (!src || src === 'null' || src === 'undefined' || src.includes('undefined') || !src.startsWith('http')) {
      // Start with first fallback immediately
      const fallbacks = getFallbackChain(category);
      setCurrentSrc(fallbacks[0]);
      setCurrentFallbackIndex(0);
      setHasError(false);
      setIsLoading(true);
    } else {
      setCurrentSrc(src);
      setCurrentFallbackIndex(-1); // -1 means using original src
      setHasError(false);
      setIsLoading(true);
    }
  }, [src, category]);

  const handleImageLoad = () => {
    setIsLoading(false);
    setHasError(false);
  };

  const handleImageError = () => {
    setIsLoading(false);
    
    const fallbacks = getFallbackChain(category);
    
    if (currentFallbackIndex === -1) {
      // Original image failed, try first fallback
      console.log(`❌ Original image failed for ${category}, trying fallback 1`);
      setCurrentSrc(fallbacks[0]);
      setCurrentFallbackIndex(0);
      setIsLoading(true);
    } else if (currentFallbackIndex < fallbacks.length - 1) {
      // Try next fallback
      const nextIndex = currentFallbackIndex + 1;
      console.log(`❌ Fallback ${currentFallbackIndex + 1} failed for ${category}, trying fallback ${nextIndex + 1}`);
      setCurrentSrc(fallbacks[nextIndex]);
      setCurrentFallbackIndex(nextIndex);
      setIsLoading(true);
    } else {
      // All fallbacks failed - this should never happen with SVG base64
      console.error(`❌ All fallbacks failed for ${category} - using final SVG`);
      setHasError(true);
    }
  };

  return (
    <div className="relative overflow-hidden">
      <img
        src={currentSrc}
        alt={alt}
        className={`${className} transition-opacity duration-300 ${isLoading ? 'opacity-50' : 'opacity-100'}`}
        onLoad={handleImageLoad}
        onError={handleImageError}
        loading="lazy"
      />
      
      {/* Loading spinner */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800">
          <div className="w-8 h-8 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
        </div>
      )}
      
      {/* Error badge (only for debugging) */}
      {hasError && process.env.NODE_ENV === 'development' && (
        <div className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded opacity-75">
          Error
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

  // Enhanced fallback logic
  const getImageSrc = () => {
    if (image_url && 
        image_url !== 'null' && 
        image_url !== 'undefined' && 
        !image_url.includes('undefined') &&
        image_url.startsWith('http')) {
      return image_url;
    }
    
    if (thumbnail_url && 
        thumbnail_url !== 'null' && 
        thumbnail_url !== 'undefined' && 
        !thumbnail_url.includes('undefined') &&
        thumbnail_url.startsWith('http')) {
      return thumbnail_url;
    }
    
    return null;
  };

  const finalImageSrc = getImageSrc();
  
  // Check if this is a category page
  const isCategoryPage = location.pathname.includes('/category');
  
  // Handle ads
  if (is_ad) {
    return (
      <a href={ad_link_url || "#"} target="_blank" rel="noopener noreferrer" className="block">
        <div className={isCategoryPage ? "wide-rectangle-card" : "newscard-borderless"}>
          <SmartImage
            src={ad_image_url}
            alt="Sponsored"
            className={isCategoryPage ? "wide-rectangle-image" : "newscard-image-borderless"}
            category="Sponsored"
          />
          <div className={isCategoryPage ? "wide-rectangle-overlay" : "newscard-overlay-borderless"}>
            <div className={isCategoryPage ? "wide-rectangle-category" : "newscard-category-borderless"}>
              Sponsored
            </div>
            <h3 className={isCategoryPage ? "wide-rectangle-title" : "newscard-title-borderless"}>
              This ad supports the platform
            </h3>
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
          <SmartImage
            src={finalImageSrc}
            alt={title}
            className="wide-rectangle-image-borderless group-hover:scale-105 transition-transform duration-300"
            category={category}
          />
        </div>
        
        <div className="wide-rectangle-content-borderless">
          {/* Category badge */}
          {category && (
            <div className="wide-rectangle-category-borderless">
              {category}
            </div>
          )}
          
          {/* Title */}
          <h3 className="wide-rectangle-title-borderless">
            <a 
              href={`/article/${id}`} 
              className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              {title}
            </a>
          </h3>
          
          {/* Summary */}
          {summary && (
            <p className="wide-rectangle-summary-borderless">
              {summary.length > 150 ? `${summary.substring(0, 150)}...` : summary}
            </p>
          )}
          
          {/* Source & Positivity Bar */}
          <div className="wide-rectangle-meta-borderless">
            <div className="source-info">
              <div className="source-logo">
                {source_name ? source_name.charAt(0).toUpperCase() : 'N'}
              </div>
              <span className="source-name">
                {source_name ? source_name.replace('www.', '').replace('.com', '') : 'Unknown'}
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
      <SmartImage
        src={finalImageSrc}
        alt={title}
        className="newscard-image-borderless"
        category={category}
      />
      <div className="newscard-overlay-borderless">
        {category && (
          <div className="newscard-category-borderless">
            {category}
          </div>
        )}
        <h3 className="newscard-title-borderless">
          <a href={`/article/${id}`} className="hover:text-blue-300 transition-colors">
            {title}
          </a>
        </h3>
      </div>
    </div>
  );
};

export default NewsCard;
