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
    <div className="sidebar-section" style={{ padding: '0 0.5rem' }}>
      <h2 className="sidebar-title">
        <svg className="inline-block w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
        Daily Reads
      </h2>
      
      {/* Featured Stories in Card format */}
      {featured.length > 0 && (
        <div className="sidebar-featured-cards">
          {featured.map((story) => (
            <button
              key={story.id}
              onClick={() => navigate(`/article/${story.id}`)}
              className="sidebar-newscard group"
            >
              <img
                src={story.image_url || story.thumbnail_url || 'https://source.unsplash.com/400x600/?news,daily'}
                alt={story.title}
                className="sidebar-newscard-image group-hover:scale-105 transition-transform duration-300"
                onError={(e) => {
                  e.target.src = 'https://source.unsplash.com/400x600/?news,daily';
                }}
              />
              <div className="sidebar-newscard-overlay">
                <h3 className="sidebar-newscard-title">
                  {story.title}
                </h3>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Headlines Section */}
      {headlines.length > 0 && (
        <div className="sidebar-headlines">
          {headlines.map((story, index) => (
            <React.Fragment key={story.id}>
              {/* Source & Positivity Bar - appears before headlines (not first 2) */}
              <SourcePositivityBar 
                source={story.source_name || story.source}
                positivityScore={story.positivity_score}
                isViral={false}
                isFirst={index < 2}
              />
              
              <div className="sidebar-headline">
                <button
                  onClick={() => navigate(`/article/${story.id}`)}
                  className="w-full text-left hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
                >
                  <h3 className="font-medium text-sm leading-tight text-gray-800 dark:text-white">
                    {story.title}
                  </h3>
                </button>
              </div>

              {/* Insert inline ad every 4th headline */}
              {(index + 1) % 4 === 0 && index < headlines.length - 1 && (
                <InlineAd key={`daily-ad-${index}`} />
              )}
              
              {index < headlines.length - 1 && (
                <hr className="border-gray-200 dark:border-gray-700 my-3" />
              )}
            </React.Fragment>
          ))}
        </div>
      )}
    </div>
  );
};

export default DailyReads;
