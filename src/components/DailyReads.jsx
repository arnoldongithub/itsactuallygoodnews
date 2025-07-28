import React from 'react';
import { useNavigate } from 'react-router-dom';
import NewsCard from './NewsCard';
import InlineAd from './InlineAd';
import SourcePositivityBar from './SourcePositivityBar';

// BULLETPROOF Image Component for Sidebar
const BulletproofSidebarImage = ({ story, className }) => {
  const [currentSrc, setCurrentSrc] = React.useState(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [errorCount, setErrorCount] = React.useState(0);

  // Multiple guaranteed fallback sources
  const getFallbackSources = () => [
    // Try original sources first
    story.image_url,
    story.thumbnail_url,
    
    // Reliable fallback services
    'https://source.unsplash.com/400x600/?news,daily,positive',
    'https://picsum.photos/400/600?random=1',
    'https://via.placeholder.com/400x600/6366f1/white?text=Daily+News',
    
    // Base64 SVG fallback (100% guaranteed)
    `data:image/svg+xml;base64,${btoa(`
      <svg width="400" height="600" viewBox="0 0 400 600" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="dailyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#6366f1;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#3b82f6;stop-opacity:0.8" />
          </linearGradient>
        </defs>
        <rect width="400" height="600" fill="url(#dailyGrad)"/>
        <circle cx="200" cy="250" r="50" fill="white" opacity="0.3"/>
        <rect x="150" y="320" width="100" height="6" rx="3" fill="white" opacity="0.4"/>
        <rect x="160" y="340" width="80" height="4" rx="2" fill="white" opacity="0.3"/>
        <text x="200" y="400" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="24" font-weight="600">Daily</text>
        <text x="200" y="430" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="24" font-weight="600">Reads</text>
        <text x="200" y="460" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="14" opacity="0.8">Good News</text>
      </svg>
    `)}`
  ];

  React.useEffect(() => {
    const sources = getFallbackSources().filter(src => 
      src && 
      src !== 'null' && 
      src !== 'undefined' && 
      !src.includes('undefined') &&
      src.trim()
    );
    
    if (sources.length > 0) {
      setCurrentSrc(sources[0]);
      setErrorCount(0);
      setIsLoading(true);
    }
  }, [story.id]);

  const handleLoad = () => setIsLoading(false);
  
  const handleError = () => {
    const sources = getFallbackSources().filter(src => 
      src && src !== 'null' && src !== 'undefined' && !src.includes('undefined') && src.trim()
    );
    
    const nextIndex = errorCount + 1;
    if (nextIndex < sources.length) {
      console.log(`🔄 Daily Reads image error, trying fallback ${nextIndex + 1}/${sources.length}`);
      setCurrentSrc(sources[nextIndex]);
      setErrorCount(nextIndex);
      setIsLoading(true);
    } else {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative overflow-hidden bg-gray-100 dark:bg-gray-800">
      {currentSrc && (
        <img
          src={currentSrc}
          alt={story.title}
          className={`${className} transition-all duration-300 ${isLoading ? 'opacity-50' : 'opacity-100'}`}
          onLoad={handleLoad}
          onError={handleError}
          loading="lazy"
        />
      )}
      
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-blue-50 dark:bg-blue-900/20">
          <div className="w-6 h-6 border-2 border-blue-300 border-t-blue-600 rounded-full animate-spin"></div>
        </div>
      )}
    </div>
  );
};

const DailyReads = ({ stories }) => {
  const navigate = useNavigate();

  if (!stories || stories.length === 0) {
    return (
      <div className="sidebar-section daily-reads-sidebar" style={{ padding: '0 0.5rem' }}>
        <h2 className="sidebar-title">
          <svg className="inline-block w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
          Daily Reads
        </h2>
        <div className="text-center py-8">
          <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <p className="text-gray-500 dark:text-gray-400 text-sm">No daily reads available right now.</p>
          <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">Check back soon for fresh content!</p>
        </div>
      </div>
    );
  }

  const featured = stories.slice(0, 2); // Max 2 newscards
  const headlines = stories.slice(2, 12); // Max 10 additional headlines

  return (
    <div className="sidebar-section daily-reads-sidebar" style={{ padding: '0 0.5rem' }}>
      <h2 className="sidebar-title">
        <svg className="inline-block w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
        Daily Reads
      </h2>
      
      {/* Featured Stories in Card format - BULLETPROOF IMAGES */}
      {featured.length > 0 && (
        <div className="sidebar-featured-cards">
          {featured.map((story) => (
            <button
              key={story.id}
              onClick={() => navigate(`/article/${story.id}`)}
              className="sidebar-newscard group"
            >
              {/* BULLETPROOF IMAGE COMPONENT */}
              <BulletproofSidebarImage
                story={story}
                className="sidebar-newscard-image group-hover:scale-105 transition-transform duration-300"
              />
              
              <div className="sidebar-newscard-overlay">
                {/* FIXED: Full title display with no truncation */}
                <h3 className="daily-reads-title-full">
                  {story.title}
                </h3>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Headlines Section - FIXED: No truncation, full text display */}
      {headlines.length > 0 && (
        <div className="sidebar-headlines">
          {headlines.map((story, index) => (
            <React.Fragment key={story.id}>
              {/* Source & Positivity Bar with enhanced separator */}
              <SourcePositivityBar 
                source={story.source_name || story.source}
                positivityScore={story.positivity_score}
                isViral={false}
                isFirst={index < 2}
              />
              
              {/* FIXED: Headlines with full text, no truncation */}
              <div className="sidebar-headline">
                <button
                  onClick={() => navigate(`/article/${story.id}`)}
                  className="w-full text-left hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
                >
                  <h3 className="daily-reads-headline-full">
                    {story.title}
                  </h3>
                </button>
              </div>

              {/* Insert inline ad every 4th headline */}
              {(index + 1) % 4 === 0 && index < headlines.length - 1 && (
                <InlineAd key={`daily-ad-${index}`} />
              )}
              
              {/* Enhanced separator between headlines */}
              {index < headlines.length - 1 && (
                <hr className="border-gray-200 dark:border-gray-700 my-3 opacity-30 border-t-2" />
              )}
            </React.Fragment>
          ))}
        </div>
      )}
    </div>
  );
};

export default DailyReads;
