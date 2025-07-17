import React from 'react';
import { useParams } from 'react-router-dom';
import ViralNewsCard from './ViralNewsCard';

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
          <h2 className="text-xl font-bold mb-4">🔥 Viral Good News</h2>
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
          <h2 className="text-xl font-bold mb-4">📈 Trending Headlines</h2>
          <div className="space-y-2">
            {regularStories.map((story, index) => (
              <div key={story.id}>
                <a
                  href={`/article/${story.id}`}
                  className="block py-2 hover:text-blue-600 transition-colors"
                >
                  <h3 className="font-bold text-sm md:text-base leading-tight">
                    {story.title}
                  </h3>
                </a>
                {index < regularStories.length - 1 && (
                  <hr className="border-gray-300 my-2" />
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default TrendingStories;
