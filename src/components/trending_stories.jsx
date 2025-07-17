import React from 'react';
import { useParams } from 'react-router-dom';
import NewsCard from './NewsCard';
import ViralNewsCard from './ViralNewsCard';

const TrendingStories = ({ stories }) => {
  const { category } = useParams(); // get active category from URL

  if (!stories || stories.length === 0) return null;

  // Filter stories by category if one is active
  const filteredStories = category
    ? stories.filter((story) => story.category?.toLowerCase() === category.toLowerCase())
    : stories;

  // Split filtered stories into viral and regular
  const viralStories = filteredStories
    .filter((story) => story.viral_score && story.viral_score >= 8)
    .slice(0, 3); // Cap at 3 viral

  const regularStories = filteredStories.filter(
    (story) => !viralStories.includes(story)
  );

  return (
    <div className="space-y-6">
      {viralStories.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {viralStories.map((story) => (
            <ViralNewsCard key={story.id} article={story} />
          ))}
        </div>
      )}

      {regularStories.length > 0 && (
        <>
          <h2 className="text-xl font-bold">🔥 Trending Good News</h2>
          <div className="space-y-4">
            {regularStories.map((story) => (
              <NewsCard key={story.id} article={story} />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default TrendingStories;
