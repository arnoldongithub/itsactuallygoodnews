import React from 'react';
import { useNavigate } from 'react-router-dom';
import NewsCard from './NewsCard';
import InlineAd from './InlineAd';
import SourcePositivityBar from './SourcePositivityBar';

// FIXED: Safe SVG generation without btoa()
const createBlindspotSVG = () => {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(`
    <svg width="400" height="600" viewBox="0 0 400 600" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="blindspotGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#f59e0b;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#d97706;stop-opacity:0.8" />
        </linearGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
          <feMerge> 
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      <rect width="400" height="600" fill="url(#blindspotGrad)"/>
      <circle cx="200" cy="220" r="40" fill="white" opacity="0.3"/>
      <circle cx="200" cy="220" r="25" fill="white" opacity="0.5"/>
      <circle cx="200" cy="220" r="12" fill="white" opacity="0.7"/>
      <path d="M180 240 L200 260 L240 220" stroke="white" stroke-width="3" fill="none" opacity="0.8"/>
      <text x="200" y="320" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="28" font-weight="700">🔍</text>
      <text x="200" y="380" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="22" font-weight="600">Blindspot</text>
      <text x="200" y="410" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="14" opacity="0.9">Hidden Stories</text>
      <text x="200" y="430" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="12" opacity="0.7">Underreported News</text>
    </svg>
  `)}`;
};

// BULLETPROOF Image Component for Blindspot Sidebar - FIXED
const BulletproofBlindspotImage = ({ story, className }) => {
  const [currentSrc, setCurrentSrc] = React.useState(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [errorCount, setErrorCount] = React.useState(0);

  // SAFE: Multiple guaranteed fallback sources for Blindspot
  const getFallbackSources = () => {
    // Sanitize story data to prevent invalid characters
    const safeTitle = String(story.title || 'Blindspot').replace(/[^\w\s]/g, '');
    const safeId = String(story.id || 7).replace(/[^\w]/g, '');
    
    return [
      // Try original sources first (sanitized)
      story.image_url && typeof story.image_url === 'string' && story.image_url.startsWith('http') 
        ? story.image_url 
        : null,
      story.thumbnail_url && typeof story.thumbnail_url === 'string' && story.thumbnail_url.startsWith('http') 
        ? story.thumbnail_url 
        : null,
      
      // Blindspot-specific fallbacks
      `https://source.unsplash.com/400x600/?hidden,story,underreported`,
      `https://source.unsplash.com/400x600/?community,global,voices`,
      `https://picsum.photos/400/600?random=${Math.abs(safeId.split('').reduce((a, b) => a + b.charCodeAt(0), 0)) + 7}`, // Blindspot seed
      `https://via.placeholder.com/400x600/f59e0b/white?text=${encodeURIComponent('Blindspot')}`,
      
      // SAFE: SVG fallback using encodeURIComponent instead of btoa
      createBlindspotSVG()
    ].filter(src => src && src.trim() && src !== '#');
  };

  React.useEffect(() => {
    const sources = getFallbackSources();
    if (sources.length > 0) {
      setCurrentSrc(sources[0]);
      setErrorCount(0);
      setIsLoading(true);
    }
  }, [story.id]);

  const handleLoad = () => setIsLoading(false);
  
  const handleError = () => {
    const sources = getFallbackSources();
    const nextIndex = errorCount + 1;
    
    if (nextIndex < sources.length) {
      console.log(`🔍 Blindspot image error, trying fallback ${nextIndex + 1}/${sources.length}`);
      setCurrentSrc(sources[nextIndex]);
      setErrorCount(nextIndex);
      setIsLoading(true);
    } else {
      console.log('✅ All Blindspot fallbacks exhausted, using final SVG');
      setIsLoading(false);
    }
  };

  // Sanitize className to prevent invalid CSS class names
  const safeClassName = typeof className === 'string' 
    ? className.replace(/[^\w\s\-_]/g, '') 
    : '';

  // Sanitize alt text
  const safeAlt = String(story.title || 'Blindspot Story').replace(/[^\w\s\-.,!?]/g, '');

  return (
    <div className="relative overflow-hidden bg-orange-50 dark:bg-orange-900/20">
      {currentSrc && (
        <img
          src={currentSrc}
          alt={safeAlt}
          className={`${safeClassName} transition-all duration-300 ${isLoading ? 'opacity-50' : 'opacity-100'}`}
          onLoad={handleLoad}
          onError={handleError}
          loading="lazy"
        />
      )}
      
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-orange-50 dark:bg-orange-900/20">
          <div className="w-6 h-6 border-2 border-orange-300 border-t-orange-600 rounded-full animate-spin"></div>
        </div>
      )}
      
      {/* Preview badge for fallback stories */}
      {story.url === '#' && !isLoading && (
        <div className="absolute top-2 left-2 bg-orange-500 text-white text-xs px-2 py-1 rounded opacity-90">
          Preview
        </div>
      )}
    </div>
  );
};

const Blindspot = ({ stories }) => {
  const navigate = useNavigate();

  // Debug logging
  console.log('🔍 Blindspot component rendered with:', stories?.length || 0, 'stories');
  
  const featured = stories?.slice(0, 2) || []; // Max 2 newscards for most unreported
  const headlines = stories?.slice(2, 12) || []; // Max 10 additional headlines
  
  // Enhanced fallback content if no stories
  const fallbackStories = [
    {
      id: 'fallback-blindspot-1',
      title: 'Blindspot Stories Coming Soon - Underreported Global Voices',
      summary: 'We are working to bring you underreported positive news from around the world that mainstream media often overlooks.',
      image_url: null, // Will trigger our bulletproof fallback system
      url: '#',
      category: 'Blindspot',
      published_at: new Date().toISOString(),
      source_name: 'ItsActuallyGoodNews',
      positivity_score: 8
    },
    {
      id: 'fallback-blindspot-2', 
      title: 'Hidden Heroes and Community Champions - Stories That Matter',
      summary: 'Discover amazing stories of resilience, innovation, and positive change that deserve more attention.',
      image_url: null, // Will trigger our bulletproof fallback system
      url: '#',
      category: 'Blindspot',
      published_at: new Date().toISOString(),
      source_name: 'Global Voices Network',
      positivity_score: 9
    }
  ];

  const displayStories = stories?.length > 0 ? stories : fallbackStories;
  const displayFeatured = displayStories.slice(0, 2);
  const displayHeadlines = displayStories.slice(2, 12);

  return (
    <div className="sidebar-section blindspot-sidebar force-visible" style={{ padding: '0 0.5rem' }}>
      <h2 className="sidebar-title">
        <svg className="inline-block w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        Blindspot
        {stories?.length === 0 && <span className="text-xs text-orange-500 ml-2 opacity-75">(Preview)</span>}
      </h2>
      
      {/* Featured Stories in Card format - BULLETPROOF IMAGES */}
      {displayFeatured.length > 0 && (
        <div className="sidebar-featured-cards">
          {displayFeatured.map((story) => (
            <button
              key={story.id}
              onClick={() => story.url === '#' ? null : navigate(`/article/${story.id}`)}
              className="sidebar-newscard group"
              disabled={story.url === '#'}
              style={{
                cursor: story.url === '#' ? 'default' : 'pointer',
                opacity: story.url === '#' ? 0.8 : 1
              }}
            >
              {/* FIXED: BULLETPROOF IMAGE COMPONENT */}
              <BulletproofBlindspotImage
                story={story}
                className="sidebar-newscard-image group-hover:scale-105 transition-transform duration-300"
              />
              
              <div className="sidebar-newscard-overlay">
                {/* SAFE: Full title display with sanitized text */}
                <h3 className="blindspot-title-full">
                  {String(story.title || '').replace(/[^\w\s\-.,!?'"]/g, '')}
                </h3>
                {story.url === '#' && (
                  <p className="text-white text-xs mt-2 opacity-75">
                    Coming soon...
                  </p>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Headlines Section - SAFE: No truncation, full text display */}
      {displayHeadlines.length > 0 && (
        <div className="sidebar-headlines">
          {displayHeadlines.map((story, index) => (
            <React.Fragment key={story.id}>
              {/* Source & Positivity Bar with safe data */}
              <SourcePositivityBar 
                source={String(story.source_name || story.source || '').replace(/[^\w\s.-]/g, '')}
                positivityScore={Math.max(0, Math.min(10, Number(story.positivity_score) || 0))}
                isViral={false}
                isFirst={index < 2}
              />
              
              {/* SAFE: Headlines with full text, no truncation */}
              <div className="sidebar-headline">
                <button
                  onClick={() => story.url === '#' ? null : navigate(`/article/${story.id}`)}
                  className="w-full text-left hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
                  disabled={story.url === '#'}
                  style={{
                    cursor: story.url === '#' ? 'default' : 'pointer',
                    opacity: story.url === '#' ? 0.7 : 1
                  }}
                >
                  <h3 className="blindspot-headline-full">
                    {String(story.title || '').replace(/[^\w\s\-.,!?'"]/g, '')}
                    {story.url === '#' && (
                      <span className="text-orange-500 text-xs ml-2 opacity-60">
                        (Preview)
                      </span>
                    )}
                  </h3>
                </button>
              </div>

              {/* Insert inline ad every 4th headline */}
              {(index + 1) % 4 === 0 && index < displayHeadlines.length - 1 && (
                <InlineAd key={`blindspot-ad-${index}`} />
              )}
              
              {/* Enhanced separator between headlines */}
              {index < displayHeadlines.length - 1 && (
                <hr className="border-gray-200 dark:border-gray-700 my-3 opacity-30 border-t-2" />
              )}
            </React.Fragment>
          ))}
        </div>
      )}

      {/* Enhanced empty state */}
      {displayStories.length === 0 && (
        <div className="text-center py-8">
          <div className="w-16 h-16 mx-auto mb-4 bg-orange-100 dark:bg-orange-900/20 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <p className="text-gray-500 dark:text-gray-400 text-sm mb-2">
            Blindspot stories are being curated
          </p>
          <p className="text-gray-400 dark:text-gray-500 text-xs">
            Check back soon for underreported positive news
          </p>
        </div>
      )}

      {/* Debug info in development */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-4 p-2 bg-orange-100 dark:bg-orange-900/20 rounded text-xs border border-orange-200 dark:border-orange-800">
          <div className="flex items-center mb-1">
            <span className="text-orange-600 dark:text-orange-400 font-medium">Debug Info:</span>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            Stories: {stories?.length || 0} | Featured: {displayFeatured.length} | Headlines: {displayHeadlines.length}
          </p>
          <p className="text-gray-500 dark:text-gray-500 text-xs mt-1">
            Using {stories?.length > 0 ? 'real' : 'fallback'} content
          </p>
        </div>
      )}
    </div>
  );
};

export default Blindspot;
