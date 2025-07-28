import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// Smart Image Component with guaranteed working fallbacks
const SmartImage = ({ 
  src, 
  alt, 
  className, 
  category = 'news'
}) => {
  const [currentSrc, setCurrentSrc] = useState(null);
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // GUARANTEED working fallback images
  const categoryFallbacks = {
    'Health': 'https://picsum.photos/800/600?random=1',
    'Innovation & Tech': 'https://picsum.photos/800/600?random=2',
    'Environment & Sustainability': 'https://picsum.photos/800/600?random=3',
    'Education': 'https://picsum.photos/800/600?random=4',
    'Science & Space': 'https://picsum.photos/800/600?random=5',
    'Humanitarian & Rescue': 'https://picsum.photos/800/600?random=6',
    'Blindspot': 'https://picsum.photos/800/600?random=7'
  };

  // Final fallback - solid color with category icon
  const getColorFallback = (category) => {
    const colors = {
      'Health': '#22c55e',
      'Innovation & Tech': '#3b82f6', 
      'Environment & Sustainability': '#10b981',
      'Education': '#8b5cf6',
      'Science & Space': '#6366f1',
      'Humanitarian & Rescue': '#ef4444',
      'Blindspot': '#f59e0b'
    };
    
    const color = colors[category] || '#6b7280';
    const icon = category === 'Health' ? '🏥' : 
                 category === 'Innovation & Tech' ? '💻' :
                 category === 'Environment & Sustainability' ? '🌱' :
                 category === 'Education' ? '📚' :
                 category === 'Science & Space' ? '🚀' :
                 category === 'Humanitarian & Rescue' ? '🤝' : '🌍';
    
    return `data:image/svg+xml;base64,${btoa(`
      <svg width="800" height="600" viewBox="0 0 800 600" xmlns="http://www.w3.org/2000/svg">
        <rect width="800" height="600" fill="${color}"/>
        <text x="400" y="280" text-anchor="middle" fill="white" font-family="Arial" font-size="120">${icon}</text>
        <text x="400" y="340" text-anchor="middle" fill="white" font-family="Arial" font-size="24" opacity="0.8">${category}</text>
      </svg>
    `)}`;
  };

  // Reset when src changes
  useEffect(() => {
    if (!src || src === 'null' || src === 'undefined' || src.includes('undefined') || !src.startsWith('http')) {
      const fallback = categoryFallbacks[category] || categoryFallbacks['Blindspot'];
      setCurrentSrc(fallback);
      setHasError(false);
      setIsLoading(true);
    } else {
      setCurrentSrc(src);
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
    
    if (!hasError) {
      setHasError(true);
      
      const fallback = categoryFallbacks[category] || categoryFallbacks['Blindspot'];
      
      if (currentSrc !== fallback) {
        console.log(`🔄 Image failed, using guaranteed fallback for ${category}`);
        setCurrentSrc(fallback);
        return;
      }
      
      console.log(`⚠️ Even fallback failed for category: ${category}, using SVG`);
      setCurrentSrc(getColorFallback(category));
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
        <div className={isCategoryPage ? "wide-rectangle-card" : "category-newscard"}>
          <SmartImage
            src={ad_image_url}
            alt="Sponsored"
            className={isCategoryPage ? "wide-rectangle-image" : "category-newscard-image"}
            category="Sponsored"
          />
          <div className={isCategoryPage ? "wide-rectangle-overlay" : "category-newscard-overlay"}>
            <div className={isCategoryPage ? "wide-rectangle-category" : "category-newscard-category"}>
              Sponsored
            </div>
            <h3 className={isCategoryPage ? "wide-rectangle-title" : "category-newscard-title"}>
              This ad supports the platform
            </h3>
          </div>
        </div>
      </a>
    );
  }
  
  // WIDE RECTANGLE LAYOUT for category pages (occupies 2/3 of webpage width)
  if (isCategoryPage) {
    return (
      <article className="wide-rectangle-card group">
        <div className="wide-rectangle-image-container">
          <SmartImage
            src={finalImageSrc}
            alt={title}
            className="wide-rectangle-image group-hover:scale-105 transition-transform duration-300"
            category={category}
          />
        </div>
        
        <div className="wide-rectangle-content">
          {/* Category badge */}
          {category && (
            <div className="wide-rectangle-category">
              {category}
            </div>
          )}
          
          {/* Title */}
          <h3 className="wide-rectangle-title">
            <a 
              href={`/article/${id}`} 
              className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              {title}
            </a>
          </h3>
          
          {/* Summary */}
          {summary && (
            <p className="wide-rectangle-summary">
              {summary.length > 150 ? `${summary.substring(0, 150)}...` : summary}
            </p>
          )}
          
          {/* Source & Positivity Bar */}
          <div className="wide-rectangle-meta">
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
        <div className="wide-rectangle-arrow">
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
  
  // Default newscard for other pages (homepage, etc.)
  return (
    <div className="category-newscard">
      <SmartImage
        src={finalImageSrc}
        alt={title}
        className="category-newscard-image"
        category={category}
      />
      <div className="category-newscard-overlay">
        {category && (
          <div className="category-newscard-category">
            {category}
          </div>
        )}
        <h3 className="category-newscard-title">
          <a href={`/article/${id}`} className="hover:text-blue-300 transition-colors">
            {title}
          </a>
        </h3>
      </div>
    </div>
  );
};

export default NewsCard;
