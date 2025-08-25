import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { cleanTitle, cleanSummary } from '../lib/utils';

const TrendingStories = ({ items = [] }) => {
  const navigate = useNavigate();
  const [selectedStory, setSelectedStory] = useState(0);

  // Auto-rotate featured stories every 8 seconds
  useEffect(() => {
    if (items.length > 1) {
      const interval = setInterval(() => {
        setSelectedStory(prev => (prev + 1) % items.length);
      }, 8000);
      return () => clearInterval(interval);
    }
  }, [items.length]);

  if (!items?.length) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[500px]">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-600">No Stories Available</h3>
          <p className="text-sm text-gray-500">Check back soon for the latest trending news</p>
        </div>
      </div>
    );
  }

  const featuredStory = items[selectedStory] || items[0];

  const getCategoryBadgeClass = () =>
    'inline-block px-3 py-1 text-xs font-semibold rounded-full bg-[var(--aa-navy)] text-white shadow-sm';

  const handleStoryClick = (story) => {
    if (story?.id) navigate(`/article/${story.id}`);
  };

  return (
    <div className="flex-1 px-4 py-6">
      {/* Main Featured Story */}
      <div className="mb-8">
        <div
          className="atlantic-newscard group cursor-pointer overflow-hidden rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-black"
          onClick={() => handleStoryClick(featuredStory)}
        >
          {/* Featured Image */}
          <div className="relative h-80 overflow-hidden">
            {featuredStory?.image_url ? (
              <img
                src={featuredStory.image_url}
                alt={cleanTitle(featuredStory.title)}
                className="atlantic-newscard-image w-full h-80 object-cover transition-transform duration-700 group-hover:scale-105"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  const fallback = e.currentTarget.nextElementSibling;
                  if (fallback) fallback.style.display = 'flex';
                }}
              />
            ) : null}

            {/* Fallback gradient background */}
            <div
              className="absolute inset-0 bg-gradient-to-br from-[var(--aa-navy)] to-[var(--aa-crimson)] flex items-center justify-center"
              style={{ display: featuredStory?.image_url ? 'none' : 'flex' }}
            >
              <div className="text-white text-center">
                <svg className="w-16 h-16 mx-auto mb-2 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                </svg>
                <p className="text-sm opacity-80">Featured Story</p>
              </div>
            </div>

            {/* Category Badge */}
            {featuredStory?.category && (
              <div className="absolute top-4 left-4">
                <span className={getCategoryBadgeClass()}>{featuredStory.category}</span>
              </div>
            )}

            {/* Story indicators */}
            {items.length > 1 && (
              <div className="absolute bottom-4 left-4 flex gap-2">
                {items.slice(0, 5).map((_, index) => (
                  <button
                    key={index}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedStory(index);
                    }}
                    className={`h-2 rounded-full transition-all duration-300 ${
                      index === selectedStory ? 'bg-white w-6' : 'bg-white/60 hover:bg-white/80 w-2'
                    }`}
                    aria-label={`Go to featured story ${index + 1}`}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Content */}
          <div className="atlantic-newscard-content p-6">
            <h1
              className="atlantic-newscard-title group-hover:text-blue-600 transition-colors"
              style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1rem' }}
            >
              {cleanTitle(featuredStory?.title)}
            </h1>

            <p className="atlantic-newscard-excerpt text-base mb-6">
              {cleanSummary(featuredStory?.summary || featuredStory?.excerpt)}
            </p>

            {/* Meta information */}
            <div className="atlantic-newscard-meta flex items-center justify-between text-sm text-[var(--text-muted)]">
              <div className="flex items-center gap-4">
                {featuredStory?.source_name && (
                  <span className="font-medium text-[var(--text-primary)]">{featuredStory.source_name}</span>
                )}
                {featuredStory?.reading_time && (
                  <span className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {featuredStory.reading_time} min read
                  </span>
                )}
              </div>
              {featuredStory?.published_at && (
                <time>{new Date(featuredStory.published_at).toLocaleDateString()}</time>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Secondary Stories Grid */}
      {items.length > 1 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.slice(1, 7).map((story, index) => (
            <div
              key={story.id || index}
              className="atlantic-newscard group cursor-pointer overflow-hidden rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-black"
              onClick={() => handleStoryClick(story)}
            >
              {/* Story Image */}
              <div className="relative overflow-hidden" style={{ height: '200px' }}>
                {story?.image_url ? (
                  <img
                    src={story.image_url}
                    alt={cleanTitle(story.title)}
                    className="atlantic-newscard-image w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      const fallback = e.currentTarget.nextElementSibling;
                      if (fallback) fallback.style.display = 'flex';
                    }}
                  />
                ) : null}

                {/* Fallback */}
                <div
                  className="absolute inset-0 flex items-center justify-center"
                  style={{
                    display: story?.image_url ? 'none' : 'flex',
                    background: 'linear-gradient(135deg, var(--aa-navy), var(--aa-gold))'
                  }}
                >
                  <svg className="w-12 h-12 text-white opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                  </svg>
                </div>

                {/* Category Badge */}
                {story?.category && (
                  <div className="absolute top-3 left-3">
                    <span className={getCategoryBadgeClass()}>{story.category}</span>
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="atlantic-newscard-content p-4">
                <h3 className="atlantic-newscard-title group-hover:text-blue-600 transition-colors font-bold">
                  {cleanTitle(story?.title)}
                </h3>

                <p className="atlantic-newscard-excerpt mt-2">
                  {cleanSummary(story?.summary || story?.excerpt)}
                </p>

                {/* Meta */}
                <div className="atlantic-newscard-meta mt-3 text-sm text-[var(--text-muted)] flex items-center gap-4">
                  {story?.source_name && (
                    <span className="font-medium text-[var(--text-primary)]">{story.source_name}</span>
                  )}
                  {story?.reading_time && <span>{story.reading_time} min</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TrendingStories;