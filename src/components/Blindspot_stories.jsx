import React from 'react';

const BlindspotStories = ({ stories }) => {
  return (
    <div className="bg-muted p-4 rounded">
      <h2 className="text-lg font-semibold mb-3">🕳️ Blindspots</h2>
      <ul className="space-y-2">
        {stories.map((story) => (
          <li key={story.id}>
            <a href={story.url} target="_blank" rel="noopener noreferrer" className="hover:underline text-sm text-foreground/90">
              {story.title}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default BlindspotStories;

