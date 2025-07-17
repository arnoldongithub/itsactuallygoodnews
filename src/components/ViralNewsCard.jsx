import React from 'react';

export default function ViralNewsCard({ article }) {
  if (!article) return null;

  return (
    <a
      href={`/article/${article.id}`}
      className="relative block w-full h-48 md:h-56 rounded-lg overflow-hidden shadow-md group transition-transform duration-300 hover:scale-105"
    >
      {/* Image Background */}
      <div className="absolute inset-0">
        <img
          src={article.image_url || '/placeholder-image.jpg'}
          alt={article.title}
          className="object-cover w-full h-full"
        />
      </div>

      {/* Title Overlay */}
      <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-black/90 via-black/60 to-transparent p-4">
        <h3 className="text-white text-base md:text-lg font-semibold leading-tight line-clamp-2">
          {article.title}
        </h3>
      </div>

      {/* Viral Badge */}
      <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded-full text-xs font-bold">
        VIRAL
      </div>
    </a>
  );
}
