import React from 'react';
import { useNavigate } from 'react-router-dom';
import NewsCard from './NewsCard';
import InlineAd from './InlineAd';
import SourcePositivityBar from './SourcePositivityBar';

const Blindspot = ({ stories }) => {
  const navigate = useNavigate();

  // Debug logging
  console.log('🔍 Blindspot component rendered with:', stories?.length || 0, 'stories');
  
  const featured = stories?.slice(0, 2) || []; // Max 2 newscards for most unreported
  const headlines = stories?.slice(2, 12) || []; // Max 10 additional headlines
  
  // Fallback content if no stories
  const fallbackStories = [
    {
      id: 'fallback-1',
      title: 'Blindspot Stories Coming Soon',
      summary: 'We are working to bring you underreported positive news from around the world.',
      image_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=600&fit=crop',
      url: '#',
      category: 'Blindspot',
      published_at: new Date().toISOString(),
      source_name: 'ItsActuallyGoodNews',
      positivity_score: 8
    },
    {
      id: 'fallback-2', 
      title: 'Hidden Heroes Around the World',
      summary: 'Discover amazing stories that mainstream media often overlooks.',
      image_url: 'https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?w=400&h=600&fit=crop',
      url: '#',
      category: 'Blindspot',
      published_at: new Date().toISOString(),
      source_name: 'Global Voices',
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
        {stories?.length === 0 && <span className="text-xs text-gray-500 ml-2">(Preview)</span>}
      </h2>
      
      {/* Featured Stories in Card format - FIXED: Enhanced Image Fallbacks */}
      {displayFeatured.length > 0 && (
        <div className="sidebar-featured-cards">
          {displayFeatured.map((story) => (
            <button
              key={story.id}
              onClick={() => story.url === '#' ? null : navigate(`/article/${story.id}`)}
              className="sidebar-newscard group"
              disabled={story.url === '#'}
            >
              {/* ENHANCED: Multiple fallback layers for guaranteed image loading */}
              <img
                src={story.image_url || story.thumbnail_url || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=600&fit=crop'}
                alt={story.title}
                className="sidebar-newscard-image group-hover:scale-105 transition-transform duration-300"
                onError={(e) => {
                  // First fallback - different Unsplash image
                  if (e.target.src.includes('photo-1507003211169')) {
                    e.target.src = 'https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?w=400&h=600&fit=crop';
                  }
                  // Second fallback - placeholder
                  else if (e.target.src.includes('photo-1469571486292')) {
                    e.target.src = 'https://via.placeholder.com/400x600/f59e0b/white?text=Blindspot+News';
                  }
                  // Third fallback - guaranteed SVG
                  else if (e.target.src.includes('placeholder.com')) {
                    e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjYwMCIgdmlld0JveD0iMCAwIDQwMCA2MDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjQwMCIgaGVpZ2h0PSI2MDAiIGZpbGw9IiNmNTllMGIiLz48dGV4dCB4PSIyMDAiIHk9IjI4MCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0id2hpdGUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSI2MCI+8J+MjTwvdGV4dD48dGV4dCB4PSIyMDAiIHk9IjM0MCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0id2hpdGUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxOCIgb3BhY2l0eT0iMC44Ij5CbGluZHNwb3Q8L3RleHQ+PC9zdmc+';
                  }
                }}
              />
              <div className="sidebar-newscard-overlay">
                {/* FIXED: Full title display with no truncation */}
                <h3 className="sidebar-newscard-title blindspot-title-full">
                  {story.title}
                </h3>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Headlines Section - FIXED: No truncation, full text display */}
      {displayHeadlines.length > 0 && (
        <div className="sidebar-headlines">
          {displayHeadlines.map((story, index) => (
            <React.Fragment key={story.id}>
              {/* Source & Positivity Bar with thin white separator */}
              <SourcePositivityBar 
                source={story.source_name || story.source}
                positivityScore={story.positivity_score}
                isViral={false}
                isFirst={index < 2}
              />
              
              {/* FIXED: Headlines with full text, no truncation */}
              <div className="sidebar-headline">
                <button
                  onClick={() => story.url === '#' ? null : navigate(`/article/${story.id}`)}
                  className="w-full text-left hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
                  disabled={story.url === '#'}
                >
                  <h3 className="blindspot-headline-full">
                    {story.title}
                  </h3>
                </button>
              </div>

              {/* Insert inline ad every 4th headline */}
              {(index + 1) % 4 === 0 && index < displayHeadlines.length - 1 && (
                <InlineAd key={`blindspot-ad-${index}`} />
              )}
              
              {/* Thin white separator between headlines */}
              {index < displayHeadlines.length - 1 && (
                <hr className="border-gray-200 dark:border-gray-700 my-3 opacity-20" />
              )}
            </React.Fragment>
          ))}
        </div>
      )}

      {/* Debug info in development */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-4 p-2 bg-gray-100 dark:bg-gray-800 rounded text-xs">
          <p>Debug: {stories?.length || 0} stories passed to Blindspot</p>
          <p>Featured: {displayFeatured.length}, Headlines: {displayHeadlines.length}</p>
        </div>
      )}
    </div>
  );
};

export default Blindspot;
