import React from 'react';
import { useParams } from 'react-router-dom';
import ViralNewsCard from './ViralNewsCard';
import InlineAd from './InlineAd';

const TrendingStories = ({ stories }) => {
  const { category } = useParams();
  
  if (!stories || stories.length === 0) return null;

  // Filter stories by category if one is active
  const filteredStories = category
    ? stories.filter((story) => story.category?.toLowerCase() === category.toLowerCase())
    : stories;

  // Split into viral and regular stories
  const viralStories = filteredStories
    .filter((story) => story.viral_score && story.viral_score >= 8)
    .slice(0, 6); // Logical max of 6 viral stories

  const regularStories = filteredStories
    .filter((story) => !viralStories.includes(story))
    .slice(0, 10); // Logical max of 10 regular headlines

  return (
    <div className="space-y-6">
      {/* Viral Stories Section */}
      {viralStories.length > 0 && (
        <div>
          <h2 className="text-xl font-bold mb-4">
            <svg className="inline-block w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Viral Good News
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {viralStories.map((story) => (
              <ViralNewsCard key={story.id} article={story} />
            ))}
          </div>
        </div>
      )}

      {/* Regular Headlines Section */}
      {regularStories.length > 0 && (
        <div>
          <h2 className="text-xl font-bold mb-4">
            <svg className="inline-block w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
            Trending Headlines
          </h2>
          <div className="trending-headlines">
            {regularStories.map((story, index) => (
              <React.Fragment key={story.id}>
                <div className="trending-headline">
                  <a
                    href={`/article/${story.id}`}
                    className="block hover:text-blue-600 transition-colors"
                  >
                    <h3 className="font-bold text-sm md:text-base leading-tight">
                      {story.title}
                    </h3>
                  </a>
                </div>
                {/* Insert inline ad every 3rd headline */}
                {(index + 1) % 3 === 0 && index < regularStories.length - 1 && (
                  <InlineAd key={`ad-${index}`} />
                )}
                {index < regularStories.length - 1 && (
                  <hr className="border-gray-300 my-2" />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default TrendingStories;
