import React from 'react';
import { useNavigate } from 'react-router-dom';
import NewsCard from './NewsCard';
import InlineAd from './InlineAd';
import SourcePositivityBar from './SourcePositivityBar';

const DailyReads = ({ stories }) => {
  const navigate = useNavigate();

  if (!stories || stories.length === 0) {
    return (
      <div className="sidebar-section" style={{ padding: '0 0.5rem' }}>
        <h2 className="sidebar-title">
          <svg className="inline-block w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
          Daily Reads
        </h2>
        <div className="text-center py-8">
          <p className="text-gray-500 dark:text-gray-400 text-sm">No daily reads available.</p>
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
      
      {/* Featured Stories in Card format - FIXED: Enhanced SmartImage Implementation */}
      {featured.length > 0 && (
        <div className="sidebar-featured-cards">
          {featured.map((story) => (
            <button
              key={story.id}
              onClick={() => navigate(`/article/${story.id}`)}
              className="sidebar-newscard group"
            >
              {/* ENHANCED: Use multiple fallback layers */}
              <img
                src={story.image_url || story.thumbnail_url || 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=400&h=600&fit=crop'}
                alt={story.title}
                className="sidebar-newscard-image group-hover:scale-105 transition-transform duration-300"
                onError={(e) => {
                  // First fallback
                  if (e.target.src.includes('unsplash.com')) {
                    e.target.src = 'https://via.placeholder.com/400x600/6366f1/white?text=Daily+News';
                  } 
                  // Second fallback - guaranteed SVG
                  else if (e.target.src.includes('placeholder.com')) {
                    e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjYwMCIgdmlld0JveD0iMCAwIDQwMCA2MDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjQwMCIgaGVpZ2h0PSI2MDAiIGZpbGw9IiM2MzY2ZjEiLz48dGV4dCB4PSIyMDAiIHk9IjI4MCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0id2hpdGUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSI2MCIg8J+TsPC/dGV4dD48dGV4dCB4PSIyMDAiIHk9IjM0MCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0id2hpdGUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxOCIgb3BhY2l0eT0iMC44Ij5EYWlseSBOZXdzPC90ZXh0Pjwvc3ZnPg==';
                  }
                }}
              />
              <div className="sidebar-newscard-overlay">
                {/* FIXED: Full title display with no truncation */}
                <h3 className="sidebar-newscard-title daily-reads-title-full">
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
              
              {/* Thin white separator between headlines */}
              {index < headlines.length - 1 && (
                <hr className="border-gray-200 dark:border-gray-700 my-3 opacity-20" />
              )}
            </React.Fragment>
          ))}
        </div>
      )}
    </div>
  );
};

export default DailyReads;
