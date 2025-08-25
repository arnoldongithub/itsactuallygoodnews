// src/components/DailyReads.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import NewsCard from './NewsCard';
import InlineAd from './InlineAd';
import SourceBadge from './SourceBadge';

const createDailySVG = () =>
  `data:image/svg+xml;charset=utf-8,${encodeURIComponent(`
    <svg width="400" height="600" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="dailyGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#6366f1" stop-opacity="1"/>
          <stop offset="100%" stop-color="#3b82f6" stop-opacity="0.85"/>
        </linearGradient>
      </defs>
      <rect width="400" height="600" fill="url(#dailyGrad)"/>
      <circle cx="200" cy="240" r="54" fill="white" opacity="0.28"/>
      <rect x="145" y="320" width="110" height="8" rx="4" fill="white" opacity="0.5"/>
      <rect x="160" y="340" width="80" height="5" rx="3" fill="white" opacity="0.35"/>
      <text x="200" y="405" text-anchor="middle" fill="white" font-family="system-ui" font-size="24" font-weight="700">Daily Reads</text>
      <text x="200" y="435" text-anchor="middle" fill="white" font-family="system-ui" font-size="13" opacity="0.9">Good News</text>
    </svg>
  `)}`;

const BulletproofSidebarImage = ({ story, className }) => {
  const [currentSrc, setCurrentSrc] = React.useState(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [errorIndex, setErrorIndex] = React.useState(0);

  const sources = React.useMemo(() => {
    const id = String(story?.id || '1');
    const hash = Math.abs(id.split('').reduce((a,b)=>a+b.charCodeAt(0),0));
    const list = [
      (story?.image_url && story.image_url.startsWith('http')) ? story.image_url : null,
      (story?.thumbnail_url && story.thumbnail_url.startsWith('http')) ? story.thumbnail_url : null,
      `https://source.unsplash.com/400x600/?news,daily,positive`,
      `https://picsum.photos/400/600?random=${hash}`,
      `https://via.placeholder.com/400x600/6366f1/ffffff?text=${encodeURIComponent('Daily News')}`,
      createDailySVG()
    ].filter(Boolean);
    return list;
  }, [story?.id, story?.image_url, story?.thumbnail_url]);

  React.useEffect(() => {
    setErrorIndex(0);
    setCurrentSrc(sources[0] || null);
    setIsLoading(true);
  }, [sources]);

  return (
    <div className="relative overflow-hidden bg-gray-100 dark:bg-gray-800">
      {currentSrc && (
        <img
          src={currentSrc}
          alt={String(story?.title || 'Daily News').replace(/[^\w\s\-.,!?]/g,'')}
          className={`${className||''} transition-all duration-300 ${isLoading?'opacity-50':'opacity-100'}`}
          onLoad={()=>setIsLoading(false)}
          onError={()=>{
            const next = errorIndex+1;
            if (next < sources.length) {
              setErrorIndex(next);
              setCurrentSrc(sources[next]);
              setIsLoading(true);
            } else {
              setIsLoading(false);
            }
          }}
          loading="lazy"
        />
      )}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-blue-50/40 dark:bg-blue-900/10">
          <div className="w-6 h-6 border-2 border-blue-300 border-t-blue-600 rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
};

const DailyReads = ({ stories }) => {
  const navigate = useNavigate();

  if (!stories || stories.length === 0) {
    return (
      <div className="sidebar-section daily-reads-sidebar px-2">
        <h2 className="sidebar-title flex items-center">
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
          Daily Reads
        </h2>
        <div className="text-center py-8">
          <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253" />
            </svg>
          </div>
          <p className="text-gray-500 dark:text-gray-400 text-sm">No daily reads available right now.</p>
          <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">Check back soon for fresh content!</p>
        </div>
      </div>
    );
  }

  const featured = stories.slice(0, 2);
  const headlines = stories.slice(2, 12);

  return (
    <div className="sidebar-section daily-reads-sidebar px-2">
      <h2 className="sidebar-title flex items-center">
        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
        Daily Reads
      </h2>

      {featured.length > 0 && (
        <div className="sidebar-featured-cards">
          {featured.map((story) => (
            <button
              key={story.id}
              onClick={() => navigate(`/article/${story.id}`)}
              className="sidebar-newscard group"
            >
              <BulletproofSidebarImage
                story={story}
                className="sidebar-newscard-image group-hover:scale-105 transition-transform duration-300"
              />
              <div className="sidebar-newscard-overlay">
                <h3 className="daily-reads-title-full">
                  {String(story.title || '').replace(/[^\w\s\-.,!?'"]/g, '')}
                </h3>
              </div>
            </button>
          ))}
        </div>
      )}

      {headlines.length > 0 && (
        <div className="sidebar-headlines">
          {headlines.map((story, index) => (
            <React.Fragment key={story.id}>
              <div className="mb-2">
                <SourceBadge name={(story.source_name || story.source || 'Source')} />
              </div>

              <div className="sidebar-headline">
                <button
                  onClick={() => navigate(`/article/${story.id}`)}
                  className="w-full text-left hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
                >
                  <h3 className="daily-reads-headline-full">
                    {String(story.title || '').replace(/[^\w\s\-.,!?'"]/g, '')}
                  </h3>
                </button>
              </div>

              {(index + 1) % 4 === 0 && index < headlines.length - 1 && (
                <InlineAd key={`daily-ad-${index}`} />
              )}

              {index < headlines.length - 1 && (
                <hr className="border-gray-200 dark:border-gray-700 my-3 opacity-30 border-t-2" />
              )}
            </React.Fragment>
          ))}
        </div>
      )}
    </div>
  );
};

export default DailyReads;

