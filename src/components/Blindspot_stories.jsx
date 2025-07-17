import React from 'react';
import { useParams } from 'react-router-dom';
import NewsCard from './NewsCard';

const BlindspotStories = ({ stories }) => {
  const { category } = useParams();

  // Filter stories by active category, if any
  const filteredStories = category
    ? stories.filter(
        (story) =>
          story.category?.toLowerCase() === category.toLowerCase()
      )
    : stories;

  // Don't render anything if there are no stories
  if (!filteredStories || filteredStories.length === 0) return null;

  // Split top 2 as featured, rest as simple list
  const featured = filteredStories.slice(0, 2);
  const remaining = filteredStories.slice(2);

  return (
    <div className="bg-muted p-4 rounded space-y-4">
      <h2 className="text-lg font-semibold mb-3">🕳️ Blindspots</h2>

      {/* Show top 2 as NewsCards */}
      <div className="space-y-4">
        {featured.map((story) => (
          <NewsCard key={story.id} article={story} />
        ))}
      </div>

      {/* Show remaining as headlines */}
      {remaining.length > 0 && (
        <ul className="space-y-2 mt-4">
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
      )}
    </div>
  );
};

export default BlindspotStories;
