import React from 'react';
import { useNavigate } from 'react-router-dom';
import InlineAd from './InlineAd';
import SourceBadge from './SourceBadge';

const createBlindspotSVG = () =>
  `data:image/svg+xml;charset=utf-8,${encodeURIComponent(`
    <svg width="400" height="600" viewBox="0 0 400 600" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="blindspotGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#f59e0b;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#d97706;stop-opacity:0.85" />
        </linearGradient>
      </defs>
      <rect width="400" height="600" fill="url(#blindspotGrad)"/>
      <circle cx="200" cy="220" r="40" fill="white" opacity="0.25"/>
      <circle cx="200" cy="220" r="26" fill="white" opacity="0.35"/>
      <g transform="translate(200 220)">
        <circle r="18" fill="none" stroke="white" stroke-width="4" opacity="0.9"/>
        <line x1="12" y1="12" x2="28" y2="28" stroke="white" stroke-width="4" stroke-linecap="round" opacity="0.9"/>
      </g>
      <text x="200" y="380" text-anchor="middle" fill="white" font-family="system-ui,-apple-system,Segoe UI,Roboto,Ubuntu,Cantarell" font-size="22" font-weight="700">Blindspot</text>
      <text x="200" y="410" text-anchor="middle" fill="white" font-family="system-ui,-apple-system,Segoe UI,Roboto,Ubuntu,Cantarell" font-size="13" opacity="0.9">Underreported Stories</text>
    </svg>
  `)}`;

const BulletproofBlindspotImage = ({ story, className }) => {
  const [src, setSrc] = React.useState(null);
  const [idx, setIdx] = React.useState(0);
  const [loading, setLoading] = React.useState(true);

  const sources = React.useMemo(() => {
    const id = String(story?.id || '7');
    const seed = Math.abs(id.split('').reduce((a, b) => a + b.charCodeAt(0), 0)) + 7;
    return [
      (story?.image_url && story.image_url.startsWith('http')) ? story.image_url : null,
      (story?.thumbnail_url && story.thumbnail_url.startsWith('http')) ? story.thumbnail_url : null,
      'https://source.unsplash.com/400x600/?hidden,story,underreported',
      'https://source.unsplash.com/400x600/?community,voices,global',
      `https://picsum.photos/400/600?random=${seed}`,
      `https://via.placeholder.com/400x600/f59e0b/ffffff?text=${encodeURIComponent('Blindspot')}`,
      createBlindspotSVG()
    ].filter(Boolean);
  }, [story?.id, story?.image_url, story?.thumbnail_url]);

  React.useEffect(() => {
    setIdx(0);
    setSrc(sources[0] || null);
    setLoading(true);
  }, [sources]);

  return (
    <div className="relative overflow-hidden bg-orange-50 dark:bg-orange-900/20">
      {src && (
        <img
          src={src}
          alt={String(story?.title || 'Blindspot Story').replace(/[^\w\s\-.,!?]/g, '')}
          className={`${className || ''} transition-all duration-300 ${loading ? 'opacity-50' : 'opacity-100'}`}
          onLoad={() => setLoading(false)}
          onError={() => {
            const next = idx + 1;
            if (next < sources.length) {
              setIdx(next);
              setSrc(sources[next]);
              setLoading(true);
            } else {
              setLoading(false);
            }
          }}
          loading="lazy"
        />
      )}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-orange-50/40 dark:bg-orange-900/10">
          <div className="w-6 h-6 border-2 border-orange-300 border-t-orange-600 rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
};

const Blindspot = ({ stories }) => {
  const navigate = useNavigate();

  const fallbackStories = [
    {
      id: 'fallback-blindspot-1',
      title: 'Rural Teachers Bridge Digital Divide with Solar-Powered Internet Hubs',
      summary: 'Educators establish community learning centers using renewable energy to connect students to online resources.',
      image_url: null,
      url: '#',
      category: 'Blindspot',
      published_at: new Date().toISOString(),
      source_name: 'Local Community Network'
    },
    {
      id: 'fallback-blindspot-2',
      title: 'Indigenous Elders Teach Climate Solutions Through Traditional Knowledge',
      summary: 'Councils share ancestral wisdom about sustainable farming and ocean conservation.',
      image_url: null,
      url: '#',
      category: 'Blindspot',
      published_at: new Date().toISOString(),
      source_name: 'Indigenous Voices Today'
    },
    {
      id: 'fallback-blindspot-3',
      title: 'Former Refugees Launch Support Network for New Asylum Seekers',
      summary: 'Mentorship programs provide housing assistance, job training, and support.',
      image_url: null,
      url: '#',
      category: 'Blindspot',
      published_at: new Date().toISOString(),
      source_name: 'Refugee Success Stories'
    },
    {
      id: 'fallback-blindspot-4',
      title: 'Disabled Activists Create Accessible Community Gardens',
      summary: 'Raised beds and sensory gardens are transforming urban spaces.',
      image_url: null,
      url: '#',
      category: 'Blindspot',
      published_at: new Date().toISOString(),
      source_name: 'Inclusive Living Network'
    }
  ];

  const displayStories = (stories && stories.length > 0) ? stories : fallbackStories;
  const featured = displayStories.slice(0, 2);
  const headlines = displayStories.slice(2, 8);

  return (
    <div className="space-y-6">
      {featured.length > 0 && (
        <div className="space-y-4">
          {featured.map((story) => (
            <button
              key={story.id}
              onClick={() => story.url === '#' ? null : navigate(`/article/${story.id}`)}
              className="w-full overflow-hidden rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-black group"
              disabled={story.url === '#'}
              style={{ cursor: story.url === '#' ? 'default' : 'pointer' }}
            >
              <div className="relative h-40 overflow-hidden">
                <BulletproofBlindspotImage
                  story={story}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                {story?.category && (
                  <div className="absolute top-3 left-3">
                    <span className="inline-block px-3 py-1 text-xs font-semibold rounded-full bg-orange-500 text-white shadow-sm">
                      {story.category}
                    </span>
                  </div>
                )}
              </div>

              <div className="p-4">
                <h3 className="font-bold text-base text-left group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors line-clamp-2">
                  {String(story.title || '').replace(/[^\w\s\-.,!?]/g, '').trim()}
                </h3>
                {story.url === '#' && <p className="text-gray-500 text-xs mt-2">Coming soon...</p>}
              </div>
            </button>
          ))}
        </div>
      )}

      {headlines.length > 0 && (
        <div className="space-y-4">
          {headlines.map((story, index) => (
            <React.Fragment key={story.id}>
              <div className="mb-2">
                <SourceBadge name={(story.source_name || story.source || 'Source').replace(/[^\w\s.-]/g, '').trim() || 'Source'} />
              </div>

              <div>
                <button
                  onClick={() => story.url === '#' ? null : navigate(`/article/${story.id}`)}
                  className="w-full text-left hover:text-orange-600 dark:hover:text-orange-400 transition-colors"
                  disabled={story.url === '#'}
                  style={{ cursor: story.url === '#' ? 'default' : 'pointer', opacity: story.url === '#' ? 0.75 : 1 }}
                >
                  <h3 className="font-bold text-sm line-clamp-2">
                    {String(story.title || '').replace(/[^\w\s\-.,!?]/g, '').replace(/\s+/g, ' ').trim()}
                    {story.url === '#' && <span className="text-orange-500 text-xs ml-2 opacity-60">(Preview)</span>}
                  </h3>
                </button>
              </div>

              {(index + 1) % 3 === 0 && index < headlines.length - 1 && <InlineAd key={`blindspot-ad-${index}`} />}

              {index < headlines.length - 1 && <hr className="border-gray-200 dark:border-gray-700 my-3 opacity-30" />}
            </React.Fragment>
          ))}
        </div>
      )}

      {displayStories.length === 0 && (
        <div className="text-center py-8">
          <div className="w-16 h-16 mx-auto mb-4 bg-orange-100 dark:bg-orange-900/20 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="7" strokeWidth="2"></circle>
              <line x1="16.65" y1="16.65" x2="21" y2="21" strokeWidth="2" strokeLinecap="round"></line>
            </svg>
          </div>
          <p className="text-gray-500 dark:text-gray-400 text-sm">Blindspot stories are being curated</p>
        </div>
      )}
    </div>
  );
};

export default Blindspot;
