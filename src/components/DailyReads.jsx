import React from 'react';
import { useNavigate } from 'react-router-dom';
import { cleanTitle, cleanSummary } from '../lib/utils';

const DailyReads = ({ stories = [] }) => {
  const navigate = useNavigate();

  if (!stories?.length) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-600 dark:text-gray-400">No Stories Yet</h3>
        <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">Check back soon</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {stories.slice(0, 6).map((story, index) => (
        <div
          key={story.id || index}
          className="group cursor-pointer overflow-hidden rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-black transition-all duration-300 hover:shadow-lg"
          onClick={() => story.id && navigate(`/article/${story.id}`)}
        >
          <div className="relative overflow-hidden h-40">
            {story?.image_url ? (
              <img
                src={story.image_url}
                alt={cleanTitle(story.title)}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.nextElementSibling.style.display = 'flex';
                }}
              />
            ) : null}
            
            <div
              className="absolute inset-0 flex items-center justify-center"
              style={{
                display: story?.image_url ? 'none' : 'flex',
                background: 'linear-gradient(135deg, hsl(var(--purple-text)), hsl(var(--orange-accent)))'
              }}
            >
              <svg className="w-12 h-12 text-white opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>

            {story?.category && (
              <div className="absolute top-3 left-3">
                <span className="inline-block px-3 py-1 text-xs font-semibold rounded-full bg-purple-600 text-white shadow-sm">
                  {story.category}
                </span>
              </div>
            )}
          </div>

          <div className="p-4">
            <h3 className="font-bold text-base mb-2 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors line-clamp-2">
              {cleanTitle(story?.title)}
            </h3>

            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
              {cleanSummary(story?.summary || story?.excerpt)}
            </p>

            <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-500">
              {story?.source_name && (
                <span className="font-medium text-gray-700 dark:text-gray-300">{story.source_name}</span>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default DailyReads;