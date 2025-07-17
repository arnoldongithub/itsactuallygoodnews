import React from 'react';
import NewsCard from './NewsCard';

const DailyReads = ({ stories }) => {
  if (!stories || stories.length === 0) return null;

  const featured = stories.slice(0, 2); // Max 2 newscards
  const headlines = stories.slice(2, 12); // Max 10 additional headlines

  return (
    <div className="bg-gray-50 p-4 rounded-lg">
      <h2 className="text-lg font-semibold mb-4 text-gray-800">📚 Daily Reads</h2>
      
      {/* Featured Stories in NewsCard format */}
      {featured.length > 0 && (
        <div className="space-y-4 mb-4">
          {featured.map((story) => (
            <NewsCard key={story.id} article={story} />
          ))}
        </div>
      )}

      {/* Headlines Section */}
      {headlines.length > 0 && (
        <div className="space-y-0">
          {headlines.map((story, index) => (
            <div key={story.id}>
              <a
                href={`/article/${story.id}`}
                className="block py-2 hover:text-blue-600 transition-colors"
              >
                <h3 className="font-bold text-sm leading-tight text-gray-800">
                  {story.title}
                </h3>
              </a>
              {index < headlines.length - 1 && (
                <hr className="border-gray-300" />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DailyReads;
