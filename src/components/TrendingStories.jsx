// Complete TrendingStories.jsx - Final Corrected Version
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { cleanTitle, cleanSummary } from '@/lib/utils';
import InlineAd from './InlineAd';
import SourcePositivityBar from './SourcePositivityBar';

const TrendingStories = ({ stories }) => {
  const { category } = useParams();
  const navigate = useNavigate();
  
  if (!stories || stories.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-500 dark:text-gray-400 mb-4">
          <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
          <p className="text-lg font-medium">No trending stories available</p>
          <p className="text-sm mt-1">Check back soon for the latest positive news!</p>
        </div>
      </div>
    );
  }

  // Filter stories by category if one is active
  const filteredStories = category
    ? stories.filter((story) => story.category?.toLowerCase() === category.toLowerCase())
    : stories;

  // Split into viral and regular stories with better detection
  const viralStories = filteredStories
    .filter((story) => 
      (story.virality_score && story.virality_score >= 7) || 
      (story.viral_score && story.viral_score >= 8) ||
      (story.positivity_score >= 9)
    )
    .slice(0, 3); // Max 3 viral stories for better layout

  const regularStories = filteredStories
    .filter((story) => !viralStories.includes(story))
    .slice(0, 12); // Increased to 12 for more content

  return (
    <div className="trending-stories-borderless">
      {/* Viral Stories Section - NO "VIRAL GOOD NEWS" TITLE */}
      {viralStories.length > 0 && (
        <div className="viral-stories-section-borderless mb-8">
          {/* REMOVED: "Viral Good News" title completely */}
          <div className="viral-stories-grid">
            {viralStories.map((story) => (
              <button
                key={story.id}
                onClick={() => navigate(`/article/${story.id}`)}
                className="viral-newscard-borderless group"
              >
                <img
                  src={story.image_url || story.thumbnail_url || 'https://source.unsplash.com/800x600/?news,positive'}
                  alt={cleanTitle(story.title)}
                  className="viral-newscard-image group-hover:scale-105 transition-transform duration-500"
                  onError={(e) => {
                    e.target.src = 'https://source.unsplash.com/800x600/?news,positive';
                  }}
                />
                <div className="viral-newscard-overlay">
                  <h3 className="viral-newscard-title">
                    {cleanTitle(story.title)}
                  </h3>
                </div>
                {(story.virality_score >= 8 || story.viral_score >= 8) && (
                  <div className="viral-newscard-badge">
                    🔥 Viral
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Regular Headlines Section - BORDERLESS */}
      {regularStories.length > 0 && (
        <div className="trending-headlines-section-borderless">
          {/* Title removed - handled by parent component */}
          <div className="trending-headlines">
            {regularStories.map((story, index) => (
              <React.Fragment key={story.id}>
                {/* Source & Positivity Bar - appears before headlines (not first 2) */}
                <SourcePositivityBar 
                  source={story.source_name || story.source}
                  positivityScore={story.positivity_score}
                  isViral={false}
                  isFirst={index < 2}
                />
                
                <div className="trending-headline">
                  <button
                    onClick={() => navigate(`/article/${story.id}`)}
                    className="w-full text-left hover:text-purple-600 dark:hover:text-purple-400 transition-colors duration-200"
                  >
                    <h3 className="font-semibold text-base md:text-lg leading-tight text-gray-800 dark:text-white">
                      {cleanTitle(story.title)}
                    </h3>
                    {story.summary && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 line-clamp-2">
                        {cleanSummary(story.summary).slice(0, 120)}...
                      </p>
                    )}
                    <div className="flex items-center justify-between mt-3">
                      <span className="text-xs text-gray-500 dark:text-gray-500">
                        {story.published_at && new Date(story.published_at).toLocaleDateString()}
                      </span>
                      {story.category && (
                        <span className="text-xs px-2 py-1 rounded-full text-white font-medium"
                              style={{ backgroundColor: 'hsl(var(--orange-accent))' }}>
                          {story.category}
                        </span>
                      )}
                    </div>
                  </button>
                </div>

                {/* Insert inline ad every 4th headline */}
                {(index + 1) % 4 === 0 && index < regularStories.length - 1 && (
                  <InlineAd key={`trending-ad-${index}`} />
                )}
                
                {index < regularStories.length - 1 && (
                  <hr className="border-gray-200 dark:border-gray-700 my-4" />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      )}

      {/* No stories fallback */}
      {viralStories.length === 0 && regularStories.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500 dark:text-gray-400">No trending stories available right now.</p>
        </div>
      )}
    </div>
  );
};

export default TrendingStories;
