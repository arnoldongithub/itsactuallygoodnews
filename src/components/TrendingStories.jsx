// src/components/TrendingStories.jsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../ui/card';
import { Spinner } from '../ui/spinner';
import {
  cleanTitle,
  cleanSummary,
  getBestImageSource,
  createCategorySVG,
} from '../lib/utils';

const TrendingStories = ({ items = [] }) => {
  const navigate = useNavigate();
  const [selectedStory, setSelectedStory] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // Auto-rotate featured stories every 8 seconds
  useEffect(() => {
    if (items.length > 1) {
      const id = setInterval(() => {
        setSelectedStory((prev) => (prev + 1) % items.length);
      }, 8000);
      return () => clearInterval(id);
    }
  }, [items.length]);

  const handleStoryClick = useCallback(
    (story) => {
      if (story?.id) navigate(`/article/${story.id}`);
    },
    [navigate]
  );

  const getBadgeClass = useCallback(() => 'atlantic-category-indicator', []);

  const featuredStory = useMemo(
    () => (items?.length ? items[selectedStory] || items[0] : null),
    [items, selectedStory]
  );

  const getImage = useCallback((story) => {
    const best = getBestImageSource(story);
    if (best) return { type: 'img', src: best };
    const cat = story?.category || 'Trending';
    return { type: 'svg', src: createCategorySVG(cat) };
  }, []);

  if (!items?.length) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[500px]">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-600">No Stories Available</h3>
          <p className="text-sm text-gray-500">Check back soon for the latest trending news</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 px-4 py-6">
      {/* Featured */}
      <div className="mb-8">
        <Card
          className="atlantic-newscard group cursor-pointer"
          onClick={() => handleStoryClick(featuredStory)}
        >
          <div className="relative h-80 overflow-hidden">
            {(() => {
              const img = getImage(featuredStory);
              if (img.type === 'img') {
                return (
                  <>
                    <img
                      src={img.src}
                      alt={cleanTitle(featuredStory?.title)}
                      className="atlantic-newscard-image transition-transform duration-700 group-hover:scale-105"
                      style={{ height: '320px' }}
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        const fallback = e.currentTarget.nextElementSibling;
                        if (fallback) fallback.style.display = 'flex';
                      }}
                      loading="lazy"
                    />
                    {/* Hidden SVG fallback container */}
                    <div
                      className="absolute inset-0 flex items-center justify-center"
                      style={{ display: 'none', background: 'linear-gradient(135deg, var(--aa-navy), var(--aa-crimson))' }}
                    >
                      <img
                        src={createCategorySVG(featuredStory?.category || 'Trending')}
                        alt="Category fallback"
                        className="w-full h-full object-cover opacity-90"
                        loading="lazy"
                      />
                    </div>
                  </>
                );
              }
              // Direct SVG fallback
              return (
                <img
                  src={img.src}
                  alt="Category fallback"
                  className="w-full h-full object-cover opacity-90"
                  loading="lazy"
                />
              );
            })()}

            {/* Category Badge */}
            {featuredStory?.category && (
              <div className="absolute top-4 left-4">
                <span className={getBadgeClass()}>{featuredStory.category}</span>
              </div>
            )}

            {/* Dots */}
            {items.length > 1 && (
              <div className="absolute bottom-4 left-4 flex gap-2">
                {items.slice(0, 5).map((_, index) => (
                  <button
                    key={index}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedStory(index);
                    }}
                    className={`w-2 h-2 rounded-full transition-all duration-300 ${
                      index === selectedStory ? 'bg-white w-6' : 'bg-white/60 hover:bg-white/80'
                    }`}
                    aria-label={`Go to story ${index + 1}`}
                  />
                ))}
              </div>
            )}
          </div>

          <div className="atlantic-newscard-content">
            <h1
              className="atlantic-newscard-title group-hover:text-blue-600 transition-colors"
              style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1rem' }}
            >
              {cleanTitle(featuredStory?.title)}
            </h1>

            <p className="atlantic-newscard-excerpt" style={{ fontSize: '1rem', marginBottom: '1.5rem' }}>
              {cleanSummary(featuredStory?.summary || featuredStory?.excerpt)}
            </p>

            <div className="atlantic-newscard-meta">
              <div className="flex items-center gap-4">
                {featuredStory?.source_name && (
                  <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>
                    {featuredStory.source_name}
                  </span>
                )}
                {featuredStory?.reading_time && (
                  <span className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {featuredStory.reading_time} min read
                  </span>
                )}
              </div>

              {featuredStory?.published_at && (
                <time style={{ color: 'var(--text-muted)' }}>
                  {new Date(featuredStory.published_at).toLocaleDateString()}
                </time>
              )}
            </div>
          </div>
        </Card>
      </div>

      {/* Grid */}
      {items.length > 1 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.slice(1, 7).map((story, index) => {
            const img = getImage(story);
            return (
              <Card
                key={story.id || index}
                className="atlantic-newscard group cursor-pointer"
                onClick={() => handleStoryClick(story)}
              >
                <div className="relative overflow-hidden" style={{ minHeight: 200 }}>
                  {img.type === 'img' ? (
                    <>
                      <img
                        src={img.src}
                        alt={cleanTitle(story?.title)}
                        className="atlantic-newscard-image transition-transform duration-500 group-hover:scale-105"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          const fallback = e.currentTarget.nextElementSibling;
                          if (fallback) fallback.style.display = 'flex';
                        }}
                        loading="lazy"
                      />
                      <div
                        className="absolute inset-0 flex items-center justify-center"
                        style={{ display: 'none', background: 'linear-gradient(135deg, var(--aa-navy), var(--aa-gold))' }}
                      >
                        <img
                          src={createCategorySVG(story?.category || 'Trending')}
                          alt="Category fallback"
                          className="w-full h-full object-cover opacity-90"
                          loading="lazy"
                        />
                      </div>
                    </>
                  ) : (
                    <img
                      src={img.src}
                      alt="Category fallback"
                      className="w-full h-full object-cover opacity-90"
                      loading="lazy"
                    />
                  )}

                  {story?.category && (
                    <div className="absolute top-3 left-3">
                      <span className={getBadgeClass()}>{story.category}</span>
                    </div>
                  )}
                </div>

                <div className="atlantic-newscard-content">
                  <h3 className="atlantic-newscard-title group-hover:text-blue-600 transition-colors">
                    {cleanTitle(story?.title)}
                  </h3>
                  <p className="atlantic-newscard-excerpt">
                    {cleanSummary(story?.summary || story?.excerpt)}
                  </p>

                  <div className="atlantic-newscard-meta">
                    {story?.source_name && (
                      <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>
                        {story.source_name}
                      </span>
                    )}
                    {story?.reading_time && <span>{story.reading_time} min</span>}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {isLoading && (
        <div className="flex justify-center items-center py-8">
          <Spinner className="w-8 h-8 text-blue-600" />
        </div>
      )}
    </div>
  );
};

export default TrendingStories;

