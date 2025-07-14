import React from 'react';
import NewsCard from './NewsCard';

const TrendingStories = ({ stories }) => {
  return (
    <div>
      <h2 className="text-xl font-bold mb-4">🔥 Trending Good News</h2>
      <div className="space-y-4">
        {stories.map((story) => (
          <NewsCard key={story.id} article={story} />
        ))}
      </div>
    </div>
  );
};

export default TrendingStories;

