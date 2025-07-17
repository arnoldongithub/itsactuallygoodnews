import React from 'react';
import NewsCard from './NewsCard';
import InlineAd from './InlineAd';

const DailyReads = ({ stories }) => {
  if (!stories || stories.length === 0) return null;

  const featured = stories.slice(0, 2); // Max 2 newscards
  const headlines = stories.slice(2, 12); // Max 10 additional headlines

  return (
    <div className="sidebar-section">
      <h2 className="sidebar-title">
        <svg className="inline-block w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
        Daily Reads
      </h2>
      
      {/* Featured Stories in 2:1 NewsCard format */}
      {featured.length > 0 && (
        <div className="sidebar-featured-cards">
          {featured.map((story) => (
            <a
              key={story.id}
              href={`/article/${story.id}`}
              className="sidebar-newscard group"
            >
              <img
                src={story.image_url || story.thumbnail_url || '/placeholder-image.jpg'}
                alt={story.title}
                className="sidebar-newscard-image group-hover:scale-105 transition-transform duration-300"
              />
              <div className="sidebar-newscard-overlay">
                <h3 className="sidebar-newscard-title">
                  {story.title}
                </h3>
              </div>
            </a>
          ))}
        </div>
      )}

      {/* Headlines Section */}
      {headlines.length > 0 && (
        <div className="sidebar-headlines">
          {headlines.map((story, index) => (
            <React.Fragment key={story.id}>
              <div className="sidebar-headline">
                <a
                  href={`/article/${story.id}`}
                  className="block hover:text-blue-600 transition-colors"
                >
                  <h3 className="font-bold text-sm leading-tight text-gray-800">
                    {story.title}
                  </h3>
                </a>
              </div>
              {/* Insert inline ad every 4th headline */}
              {(index + 1) % 4 === 0 && index < headlines.length - 1 && (
                <InlineAd key={`ad-${index}`} />
              )}
              {index < headlines.length - 1 && (
                <hr className="border-gray-300" />
              )}
            </React.Fragment>
          ))}
        </div>
      )}
    </div>
  );
};

export default DailyReads;
