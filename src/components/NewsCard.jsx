import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// Smart Image Component with working fallbacks
const SmartImage = ({ 
  src, 
  alt, 
  className, 
  category = 'news'
}) => {
  const [currentSrc, setCurrentSrc] = useState(src);
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Reliable fallback images (using Unsplash with specific IDs that won't break)
  const categoryFallbacks = {
    'Health': 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=800&h=600&fit=crop&crop=center',
    'Innovation & Tech': 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=800&h=600&fit=crop&crop=center',
    'Environment & Sustainability': 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&h=600&fit=crop&crop=center',
    'Education': 'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=800&h=600&fit=crop&crop=center',
    'Science & Space': 'https://images.unsplash.com/photo-1446776653964-20c1d3a81b06?w=800&h=600&fit=crop&crop=center',
    'Humanitarian & Rescue': 'https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?w=800&h=600&fit=crop&crop=center',
    'Blindspot': 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop&crop=center'
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
    if (src && src !== 'null' && src !== 'undefined' && !src.includes('undefined')) {
      setCurrentSrc(src);
      setHasError(false);
      setIsLoading(true);
    } else {
      // Use category fallback immediately if src is invalid
      const fallback = categoryFallbacks[category] || categoryFallbacks['Blindspot'];
      setCurrentSrc(fallback);
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
      
      // Try category-specific fallback first
      const categoryFallback = categoryFallbacks[category] || categoryFallbacks['Blindspot'];
      
      if (currentSrc !== categoryFallback) {
        console.log(`🔄 Image failed, using category fallback for ${category}`);
        setCurrentSrc(categoryFallback);
        return;
      }
      
      // If category fallback also failed, use color fallback
      console.log(`⚠️ All images failed for category: ${category}, using color fallback`);
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
    ad_link_url
  } = article;

  // Enhanced fallback logic - try image_url first, then thumbnail_url
  const getImageSrc = () => {
    // Check image_url first
    if (image_url && 
        image_url !== 'null' && 
        image_url !== 'undefined' && 
        !image_url.includes('undefined') &&
        image_url.startsWith('http')) {
      return image_url;
    }
    
    // Check thumbnail_url second
    if (thumbnail_url && 
        thumbnail_url !== 'null' && 
        thumbnail_url !== 'undefined' && 
        !thumbnail_url.includes('undefined') &&
        thumbnail_url.startsWith('http')) {
      return thumbnail_url;
    }
    
    return null; // Let SmartImage handle fallbacks
  };

  const finalImageSrc = getImageSrc();
  
  // Check if this is a category page to use the appropriate styling
  const isCategoryPage = location.pathname.includes('/category');
  
  // Handle ads
  if (is_ad) {
    return (
      <a href={ad_link_url || "#"} target="_blank" rel="noopener noreferrer" className="block">
        <div className="category-newscard">
          <SmartImage
            src={ad_image_url}
            alt="Sponsored"
            className="category-newscard-image"
            category="Sponsored"
          />
          <div className="category-newscard-overlay">
            <div className="category-newscard-category">Sponsored</div>
            <h3 className="category-newscard-title">This ad supports the platform</h3>
          </div>
        </div>
      </a>
    );
  }
  
  // Category page layout
  if (isCategoryPage) {
    return (
      <a
        href={`/article/${id}`}
        className="category-newscard group"
      >
        <SmartImage
          src={finalImageSrc}
          alt={title}
          className="category-newscard-image group-hover:scale-105 transition-transform duration-300"
          category={category}
        />
        <div className="category-newscard-overlay">
          {category && (
            <div className="category-newscard-category">
              {category}
            </div>
          )}
          <h3 className="category-newscard-title">
            {title}
          </h3>
        </div>
      </a>
    );
  }
  
  // Default newscard for other pages
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
