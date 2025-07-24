import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// Smart Image Component with category-specific fallbacks
const SmartImage = ({ 
  src, 
  alt, 
  className, 
  category = 'news',
  fallbackType = 'category' // 'category' | 'generic' | 'placeholder'
}) => {
  const [currentSrc, setCurrentSrc] = useState(src);
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [retryCount, setRetryCount] = useState(0);

  // Category-specific fallback images
  const categoryFallbacks = {
    'Health': [
      'https://source.unsplash.com/800x600/?health,medical,wellness',
      'https://source.unsplash.com/800x600/?medicine,doctor,care',
      'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=800&h=600&fit=crop'
    ],
    'Innovation & Tech': [
      'https://source.unsplash.com/800x600/?technology,innovation,computer',
      'https://source.unsplash.com/800x600/?tech,digital,future',
      'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=800&h=600&fit=crop'
    ],
    'Environment & Sustainability': [
      'https://source.unsplash.com/800x600/?environment,nature,green',
      'https://source.unsplash.com/800x600/?forest,earth,sustainability',
      'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&h=600&fit=crop'
    ],
    'Education': [
      'https://source.unsplash.com/800x600/?education,learning,school',
      'https://source.unsplash.com/800x600/?books,student,classroom',
      'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=800&h=600&fit=crop'
    ],
    'Science & Space': [
      'https://source.unsplash.com/800x600/?science,space,research',
      'https://source.unsplash.com/800x600/?astronomy,laboratory,discovery',
      'https://images.unsplash.com/photo-1446776653964-20c1d3a81b06?w=800&h=600&fit=crop'
    ],
    'Humanitarian & Rescue': [
      'https://source.unsplash.com/800x600/?humanitarian,help,rescue',
      'https://source.unsplash.com/800x600/?community,volunteer,aid',
      'https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?w=800&h=600&fit=crop'
    ],
    'Blindspot': [
      'https://source.unsplash.com/800x600/?world,global,people',
      'https://source.unsplash.com/800x600/?international,culture,story',
      'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop'
    ]
  };

  // Generic fallbacks for when category-specific fails
  const genericFallbacks = [
    'https://source.unsplash.com/800x600/?news,positive,story',
    'https://source.unsplash.com/800x600/?newspaper,media,information',
    'https://images.unsplash.com/photo-1495020689067-958852a7765e?w=800&h=600&fit=crop',
    'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=800&h=600&fit=crop'
  ];

  // Reset when src changes
  useEffect(() => {
    setCurrentSrc(src);
    setHasError(false);
    setRetryCount(0);
    setIsLoading(true);
  }, [src]);

  const handleImageLoad = () => {
    setIsLoading(false);
    setHasError(false);
  };

  const handleImageError = () => {
    setIsLoading(false);
    
    if (!hasError) {
      setHasError(true);
      
      // Try category-specific fallbacks first
      const categoryImages = categoryFallbacks[category] || categoryFallbacks['Blindspot'];
      
      if (retryCount < categoryImages.length) {
        console.log(`🔄 Image failed, trying category fallback ${retryCount + 1} for ${category}`);
        setCurrentSrc(categoryImages[retryCount]);
        setRetryCount(prev => prev + 1);
        return;
      }
      
      // Then try generic fallbacks
      const genericIndex = retryCount - categoryImages.length;
      if (genericIndex < genericFallbacks.length) {
        console.log(`🔄 Category fallbacks failed, trying generic fallback ${genericIndex + 1}`);
        setCurrentSrc(genericFallbacks[genericIndex]);
        setRetryCount(prev => prev + 1);
        return;
      }
      
      // Final fallback: solid color placeholder
      console.log(`⚠️ All fallbacks failed for category: ${category}`);
      setCurrentSrc('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjYwMCIgdmlld0JveD0iMCAwIDgwMCA2MDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI4MDAiIGhlaWdodD0iNjAwIiBmaWxsPSIjRjNGNEY2Ii8+Cjx0ZXh0IHg9IjQwMCIgeT0iMzAwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjOUM5Q0EzIiBmb250LWZhbWlseT0ic2Fucy1zZXJpZiIgZm9udC1zaXplPSIyNCI+Tm8gSW1hZ2U8L3RleHQ+Cjwvc3ZnPgo=');
    }
  };

  return (
    <div className="relative">
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
      
      {/* Error indicator (only for final fallback) */}
      {hasError && retryCount >= 6 && (
        <div className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded">
          📷
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

  // Enhanced fallback logic
  const getImageSrc = () => {
    // Priority: image_url > thumbnail_url > category fallback
    if (image_url && image_url !== 'null' && !image_url.includes('undefined')) {
      return image_url;
    }
    if (thumbnail_url && thumbnail_url !== 'null' && !thumbnail_url.includes('undefined')) {
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
            fallbackType="generic"
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
          fallbackType="category"
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
        fallbackType="category"
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
