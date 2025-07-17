import React from 'react';
import NewsCard from './NewsCard';

const DailyReads = ({ stories }) => {
  if (!stories || stories.length === 0) return null;

  const featured = stories.slice(0, 2);
  const remaining = stories.slice(2);

  return (
    <div className="bg-muted p-4 rounded">
      <h2 className="text-lg font-semibold mb-3">📚 Daily Reads</h2>

      <div className="space-y-4 mb-4">
        {featured.map((story) => (
          <NewsCard key={story.id} article={story} />
        ))}
      </div>

      <ul className="space-y-2">
        {remaining.map((story) => (
          <li key={story.id}>
            <a
              href={story.url}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline text-sm text-foreground/90"
            >
              {story.title}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default DailyReads;
