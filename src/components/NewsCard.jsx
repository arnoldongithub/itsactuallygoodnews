import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import SourceBadge from '@/components/SourceBadge';

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
    'Movement Tracker + Accountability': 'protest,democracy,policy',
    'Capitalism & Inequality Watch': 'economy,inequality,workers',
    'Justice Lens': 'justice,rights,courts',
    'Hope in Struggle': 'community,solidarity,grassroots',
    'AI Watch': 'technology,ai,robot',
    'Blindspot': 'hidden,discover,stories'
  };
  const keywords = categoryKeywords[category] || 'news,progress';
  return [
    `https://source.unsplash.com/800x600/?${keywords}&random=${safeId}`,
    `https://picsum.photos/800/600?random=${safeId + 100}`,
    `https://via.placeholder.com/800x600/6b7280/white?text=${encodeURIComponent(category || 'News')}`
  ];
});

const safeCategorySVG = createCategorySVG || ((category) => {
  const categoryInfo = {
    'Movement Tracker + Accountability': { emoji: '📣', color: '#0ea5e9', title: 'Movement Tracker' },
    'Capitalism & Inequality Watch': { emoji: '📉', color: '#ef4444', title: 'Inequality Watch' },
    'Justice Lens': { emoji: '⚖️', color: '#22c55e', title: 'Justice Lens' },
    'Hope in Struggle': { emoji: '🌟', color: '#a855f7', title: 'Hope in Struggle' },
    'AI Watch': { emoji: '🤖', color: '#f59e0b', title: 'AI Watch' },
    'Blindspot': { emoji: '🔍', color: '#f59e0b', title: 'Blindspot' }
  };
  const info = categoryInfo[category] || { emoji: '📰', color: '#6b7280', title: 'News' };
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
      <text x="400" y="420" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="18" opacity="0.9">Stories that matter</text>
    </svg>
  `)}`;
});

// ENHANCED BulletproofImage Component (yours, preserved)
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

  const getReliableFallbacks = (category, storyId) => {
    const categoryImages = safeCategoryImages(category, storyId);
    const svgFallback = safeCategorySVG(category);
    return [
      src && typeof src === 'string' && src.startsWith('http') ? src : null,
      ...categoryImages,
      svgFallback
    ].filter(Boolean);
  };

  useEffect(() => {
    setErrorCount(0);
    setIsLoading(true);
    const fallbacks = getReliableFallbacks(category, storyId);
    if (fallbacks.length > 0) setCurrentSrc(fallbacks[0]);
  }, [src, category, storyId]);

  const handleImageLoad = () => setIsLoading(false);

  const handleImageError = () => {
    const fallbacks = getReliableFallbacks(category, storyId);
    const nextIndex = errorCount + 1;
    if (nextIndex < fallbacks.length) {
      setCurrentSrc(fallbacks[nextIndex]);
      setErrorCount(nextIndex);
      setIsLoading(true);
    } else {
      setIsLoading(false);
    }
  };

  const safeClassName = typeof className === 'string' ? className.replace(/[^\w\s\-_]/g, '') : '';
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
  const navigate = useNavigate();

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
    positivity_score // kept but not rendered visibly anymore
  } = article;

  const handleStoryClick = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!id) return;
    try {
      navigate(`/article/${id}`);
    } catch {
      window.location.href = `/article/${id}`;
    }
  }, [id, navigate]);

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

  const isCategoryPage = location.pathname.includes('/category');

  const safeTitle = String(title || '').replace(/[^\w\s\-.,!?'"]/g, '').replace(/\s+/g, ' ').trim();
  const safeCategory = String(category || '').replace(/[^\w\s&+]/g, '');
  const safeSummary = String(summary || '').replace(/[^\w\s\-.,!?'"]/g, '').replace(/\s+/g, ' ').trim();
  const safeSourceName = String(source_name || '').replace(/[^\w\s.-]/g, '');

  // Ads (unchanged layout)
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
                <h3 className="wide-rectangle-title-borderless font-bold">This ad supports the platform</h3>
                <p className="wide-rectangle-summary-borderless">
                  Thank you for supporting quality journalism and important stories.
                </p>
              </>
            ) : (
              <>
                <div className="newscard-category-borderless">Sponsored</div>
                <h3 className="newscard-title-borderless font-bold">This ad supports the platform</h3>
              </>
            )}
          </div>
        </div>
      </a>
    );
  }

  // Category page layout
  if (isCategoryPage) {
    return (
      <article className="wide-rectangle-card-borderless group">
        <div 
          className="wide-rectangle-image-container-borderless cursor-pointer"
          onClick={handleStoryClick}
        >
          <BulletproofImage
            src={finalImageSrc}
            alt={safeTitle}
            className="wide-rectangle-image-borderless group-hover:scale-105 transition-transform duration-300"
            category={safeCategory}
            storyId={id}
          />
        </div>

        <div className="wide-rectangle-content-borderless">
          {safeCategory && (
            <div className="wide-rectangle-category-borderless">
              {safeCategory}
            </div>
          )}

          <h3 className="wide-rectangle-title-borderless font-bold">
            <button
              onClick={handleStoryClick}
              className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors font-bold text-left w-full"
              style={{ fontWeight: '700' }}
            >
              {safeTitle}
            </button>
          </h3>

          {safeSummary && (
            <p className="wide-rectangle-summary-borderless">
              {safeSummary.length > 150 ? `${safeSummary.substring(0, 150)}...` : safeSummary}
            </p>
          )}

          {/* NEW: neutral Source badge replaces positivity UI */}
          <div className="wide-rectangle-meta-borderless flex items-center justify-between mt-2">
            <div className="source-info flex items-center gap-2">
              <div className="source-logo">{safeSourceName ? safeSourceName.charAt(0).toUpperCase() : 'N'}</div>
              <span className="source-name">
                {safeSourceName ? safeSourceName.replace('www.', '').replace('.com', '') : 'Unknown'}
              </span>
              <SourceBadge name={safeSourceName} />
            </div>
          </div>
        </div>

        <div className="wide-rectangle-arrow-borderless">
          <button 
            onClick={handleStoryClick}
            className="inline-flex items-center text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors"
          >
            <span className="mr-2">Read More</span>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </button>
        </div>
      </article>
    );
  }

  // Default card layout
  return (
    <div className="newscard-borderless cursor-pointer" onClick={handleStoryClick}>
      <BulletproofImage
        src={finalImageSrc}
        alt={safeTitle}
        className="newscard-image-borderless"
        category={safeCategory}
        storyId={id}
      />
      <div className="newscard-overlay-borderless">
        {safeCategory && (
          <div className="newscard-category-borderless">{safeCategory}</div>
        )}
        <h3 className="newscard-title-borderless font-bold">
          <span className="hover:text-blue-300 transition-colors font-bold" style={{ fontWeight: '700' }}>
            {safeTitle}
          </span>
        </h3>

        {/* NEW: Source badge under title for default cards */}
        <div className="mt-2">
          <SourceBadge name={safeSourceName} />
        </div>
      </div>
    </div>
  );
};

export default NewsCard;

