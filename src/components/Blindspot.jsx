import React from 'react';
import NewsCard from './NewsCard';
import InlineAd from './InlineAd';

const Blindspot = ({ stories }) => {
  if (!stories || stories.length === 0) return null;

  const featured = stories.slice(0, 2); // Max 2 newscards for most unreported
  const headlines = stories.slice(2, 12); // Max 10 additional headlines

  return (
    <div className="sidebar-section">
      <h2 className="sidebar-title">🔍 Blindspot</h2>
      
      {/* Featured Unreported Stories in 2:1 NewsCard format */}
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

export default Blindspot;
