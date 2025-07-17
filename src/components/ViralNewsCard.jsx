import React from 'react';

export default function ViralNewsCard({ article }) {
  if (!article) return null;

  return (
    <a
      href={`/article/${article.id}`}
      className="relative w-full h-72 md:h-96 rounded-lg overflow-hidden shadow-md group"
    >
      <img
        src={article.image_url}
        alt={article.title}
        className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-105"
      />

      <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-black/85 via-black/60 to-transparent px-4 py-3">
        <h2 className="text-white text-lg md:text-2xl font-semibold leading-snug line-clamp-3">
          {article.title}
        </h2>
      </div>
    </a>
  );
}

