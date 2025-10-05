// src/App.jsx
import React, { useState, useEffect, lazy, Suspense, useCallback } from 'react';
import { Routes, Route, BrowserRouter as Router, useParams, useNavigate } from 'react-router-dom';
import { Toaster } from "@/components/ui/toaster";
import { useToast } from "@/components/ui/use-toast";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import NewsCard from "@/components/NewsCard";
import TrendingStories from "@/components/TrendingStories";
import DailyReads from "@/components/DailyReads";
import Blindspot from "@/components/Blindspot";
import InlineAd from "@/components/InlineAd";
import SourceBadge from "@/components/SourceBadge";
import Button from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { motion, AnimatePresence } from 'framer-motion';
import { fetchAllNewsData, useHomepageData, useCategoryNews } from '@/lib/news-api';
import { cleanTitle, createBulletPoints, getSourceName } from '@/lib/utils';
import { supabase } from '@/lib/supa.js';

const SkeletonHomepage = lazy(() =>
  import('@/components/SkeletonComponents').then(m => ({ default: m.SkeletonHomepage }))
);
const SkeletonCategoryPage = lazy(() =>
  import('@/components/SkeletonComponents').then(m => ({ default: m.SkeletonCategoryPage }))
);
const SkeletonStoryPage = lazy(() =>
  import('@/components/SkeletonComponents').then(m => ({ default: m.SkeletonStoryPage }))
);
const LoadingSpinner = lazy(() =>
  import('@/components/SkeletonComponents').then(m => ({ default: m.LoadingSpinner }))
);

const QuickLoader = () => (
  <div className="animate-pulse space-y-4 p-4">
    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
    <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
  </div>
);

class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { hasError: false }; }
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(error, errorInfo) { console.error('App Error:', error, errorInfo); }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-white dark:bg-black flex items-center justify-center p-4">
          <div className="text-center">
            <h2 className="text-xl font-bold mb-4">Something went wrong</h2>
            <button
              onClick={() => window.location.reload()}
              className="bg-blue-600 text-white px-4 py-2 rounded"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const useNavigationHandler = () => {
  const navigate = useNavigate();
  return useCallback((path) => {
    try { navigate(path); } catch { window.location.href = path; }
  }, [navigate]);
};

const sanitizeText = (text) => {
  if (!text || typeof text !== 'string') return '';
  return text.replace(/[^\w\s\-.,!?'"]/g, '').trim();
};

// -------- Story Page --------
const StoryPage = ({ setIsDonateModalOpen, isDarkMode, setIsDarkMode }) => {
  const { id } = useParams();
  const safeNavigate = useNavigationHandler();
  const [story, setStory] = useState(null);
  const [relatedStories, setRelatedStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchStory = async () => {
      try {
        setLoading(true);
        const allData = await fetchAllNewsData();
        const foundStory = allData.all.find(item =>
          item.id === id || String(item.id) === String(id) || item.id === parseInt(id)
        );

        if (foundStory) {
          setStory(foundStory);
          const related = allData.all
            .filter(item => item.category === foundStory.category && item.id !== foundStory.id)
            .slice(0, 3);
          setRelatedStories(related);
        } else {
          toast({ title: 'Story Not Found', description: 'The story could not be found.', variant: 'destructive' });
        }
      } catch (error) {
        console.error('Failed to load story:', error);
        toast({ title: 'Error', description: 'Failed to load story.', variant: 'destructive' });
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchStory();
  }, [id, toast]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-black">
        <Header setIsDonateModalOpen={setIsDonateModalOpen} isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} />
        <Suspense fallback={<QuickLoader />}><SkeletonStoryPage /></Suspense>
        <Footer />
      </div>
    );
  }

  if (!story) {
    return (
      <div className="min-h-screen bg-white dark:bg-black">
        <Header setIsDonateModalOpen={setIsDonateModalOpen} isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} />
        <div className="text-center py-20">
          <h2 className="text-2xl font-bold mb-4">Story Not Found</h2>
          <Button onClick={() => safeNavigate('/')}>Go Home</Button>
        </div>
        <Footer />
      </div>
    );
  }

  const summaryText = sanitizeText(story.summary || story.content || '');
  const bulletPoints = createBulletPoints(summaryText);

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      <Header setIsDonateModalOpen={setIsDonateModalOpen} isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} />
      <div className="max-w-7xl mx-auto my-4 px-4 lg:my-8">
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
          <div className="lg:w-2/3">
            <article className="story-card-borderless mb-6 lg:mb-8">
              <div className="mb-4 lg:mb-6">
                <span
                  className="text-xs lg:text-sm font-semibold uppercase tracking-wide px-2 py-1 lg:px-3 lg:py-1 rounded-full text-white"
                  style={{ backgroundColor: 'hsl(var(--orange-accent))' }}
                >
                  {sanitizeText(story.category)}
                </span>
              </div>

              <h1
                className="mobile-story-title font-bold"
                style={{ fontWeight: '800', fontSize: 'clamp(1.5rem, 4vw, 2.5rem)', lineHeight: '1.2', marginBottom: '1.5rem' }}
              >
                {cleanTitle(story.title)}
              </h1>

              {story.image_url && (
                <div className="story-image-borderless mb-6 lg:mb-8">
                  <img
                    src={story.image_url}
                    alt={cleanTitle(story.title)}
                    className="w-full h-48 lg:h-80 object-cover rounded-xl shadow-md"
                    loading="lazy"
                    onError={(e) => (e.currentTarget.style.display = 'none')}
                  />
                </div>
              )}

              {bulletPoints.length > 0 && (
                <div className="story-summary-borderless">
                  <h3 className="font-bold">Story Summary</h3>
                  <ul className="summary-bullets">
                    {bulletPoints.map((point, index) => (<li key={index}>{sanitizeText(point)}</li>))}
                  </ul>
                </div>
              )}
            </article>

            {relatedStories.length > 0 && (
              <div className="bg-gray-50 dark:bg-gray-800 rounded-xl shadow-lg p-4 lg:p-8 border border-gray-100 dark:border-gray-700">
                <h2 className="text-xl lg:text-2xl font-bold mb-4 lg:mb-6">Related Stories</h2>
                <div className="related-stories-list">
                  {relatedStories.map((rel) => (
                    <div key={rel.id} className="related-story-item">
                      <button
                        onClick={() => safeNavigate(`/article/${rel.id}`)}
                        className="related-story-link w-full text-left"
                      >
                        <h3 className="related-story-title-mobile mb-3 font-bold">
                          {cleanTitle(rel.title)}
                        </h3>
                      </button>
                      <SourceBadge name={(rel.source_name || rel.source || 'Source')} />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="lg:w-1/3">
            <div className="story-metadata-sidebar">
              <h3 className="text-base lg:text-lg font-bold mb-3 lg:mb-4">Story Details</h3>
              <ul className="metadata-bullets">
                <li><strong>Source:</strong> {getSourceName(story.source || story.source_name)}</li>
                <li><strong>Published:</strong> {story.published_at ? new Date(story.published_at).toLocaleDateString() : '—'}</li>
                {story.author && <li><strong>Author:</strong> {sanitizeText(story.author)}</li>}
                {typeof story.positivity_score === 'number' && (
                  <li><strong>Positivity Score:</strong> {Math.round(story.positivity_score)}/10</li>
                )}
              </ul>
              <div className="mt-4 lg:mt-6">
                
                  href={story.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full text-center px-4 py-2 lg:px-6 lg:py-3 rounded-lg font-medium transition-all duration-300 hover:shadow-lg text-white text-sm lg:text-base"
                  style={{ backgroundColor: 'hsl(var(--purple-text))' }}
                >
                  Read Full Article →
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

// -------- Category Page --------
const CategoryPage = ({ setIsDonateModalOpen, isDarkMode, setIsDarkMode }) => {
  const { category } = useParams();
  const { data: categoryNews, loading, error } = useCategoryNews(category);

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      <Header setIsDonateModalOpen={setIsDonateModalOpen} isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} />

      <div className="px-4 lg:px-6 my-6">
        <h2 className="text-xl font-bold mb-6 capitalize">
          {sanitizeText(decodeURIComponent(category))} News
        </h2>

        {loading ? (
          <div className="max-w-4xl mx-auto space-y-6">
            <Suspense fallback={<QuickLoader />}>
              {Array.from({ length: 4 }, (_, i) => (<QuickLoader key={i} />))}
            </Suspense>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-500 mb-4">Error loading category news</p>
            <Button onClick={() => window.location.reload()}>Try Again</Button>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto space-y-6">
            {categoryNews.length > 0 ? (
              categoryNews.map((item) => (<NewsCard key={item.id} article={item} />))
            ) : (
              <div className="text-center py-12">
                <h3 className="text-xl font-semibold mb-2">No stories found</h3>
                <p className="text-gray-500 mb-4">No stories available for this category.</p>
                <Button onClick={() => window.location.reload()}>Refresh</Button>
              </div>
            )}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
};

// -------- Home Page --------
const HomePage = ({ setIsDonateModalOpen, isDarkMode, setIsDarkMode }) => {
  const { data, loading, error, refetch } = useHomepageData();
  const { toast } = useToast();

  useEffect(() => {
    let subscription;
    const setup = () => {
      subscription = supabase
        .channel('news_changes')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'news' }, () => {
          setTimeout(() => {
            toast({ title: "Fresh News Available!", description: "New good news just arrived.", duration: 2000 });
            refetch();
          }, 2000);
        })
        .subscribe();
    };
    setup();
    return () => { if (subscription) subscription.unsubscribe(); };
  }, [refetch, toast]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-black">
        <Header setIsDonateModalOpen={setIsDonateModalOpen} isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} />
        <Suspense fallback={<QuickLoader />}><SkeletonHomepage /></Suspense>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white dark:bg-black">
        <Header setIsDonateModalOpen={setIsDonateModalOpen} isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} />
        <div className="container mx-auto px-4 py-8">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 max-w-md mx-auto">
            <h3 className="text-lg font-medium text-red-800 dark:text-red-200 mb-2">Something went wrong</h3>
            <p className="text-sm text-red-700 dark:text-red-300 mb-4">{error || 'Failed to load news. Please try again.'}</p>
            <div className="flex space-x-2">
              <Button onClick={refetch} size="sm" className="bg-red-100 text-red-800">Try Again</Button>
              <Button onClick={() => window.location.reload()} variant="outline" size="sm">Refresh</Button>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const { trending = [], dailyReads = [], blindspot = [] } = data;

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      <Header setIsDonateModalOpen={setIsDonateModalOpen} isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} />

      <div className="pt-8"></div>

      <div className="container mx-auto px-4 lg:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          <div>
            <h2 className="text-xl font-bold mb-6 text-gray-900 dark:text-white flex items-center" style={{ color: 'hsl(var(--purple-text))' }}>
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              Daily Reads
            </h2>
            <DailyReads stories={dailyReads} />
          </div>

          <div>
            <h2 className="text-xl font-bold mb-6 text-gray-900 dark:text-white flex items-center" style={{ color: 'hsl(var(--purple-text))' }}>
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Trending Stories
            </h2>
            <TrendingStories items={trending} />
          </div>

          <div>
            <h2 className="text-xl font-bold mb-6 text-gray-900 dark:text-white flex items-center" style={{ color: 'hsl(var(--orange-accent))' }}>
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="7" strokeWidth="2"></circle>
                <line x1="16.65" y1="16.65" x2="21" y2="21" strokeWidth="2" strokeLinecap="round"></line>
              </svg>
              Blindspot
            </h2>
            <Blindspot stories={blindspot} />
          </div>

        </div>
      </div>

      <Footer />
    </div>
  );
};

// -------- App Shell --------
const App = () => {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('darkMode');
      if (saved !== null) return JSON.parse(saved);
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  const [isDonateModalOpen, setIsDonateModalOpen] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    if (isDarkMode) root.classList.add('dark');
    else root.classList.remove('dark');
    localStorage.setItem('darkMode', JSON.stringify(isDarkMode));
  }, [isDarkMode]);

  useEffect(() => {
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => { fetchAllNewsData().catch(() => {}); });
    }
  }, []);

  return (
    <ErrorBoundary>
      <Router>
        <div className="bg-white dark:bg-black text-black dark:text-white transition-colors duration-200 min-h-screen">
          <Routes>
            <Route
              path="/"
              element={<HomePage setIsDonateModalOpen={setIsDonateModalOpen} isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} />}
            />
            <Route
              path="/category/:category"
              element={<CategoryPage setIsDonateModalOpen={setIsDonateModalOpen} isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} />}
            />
            <Route
              path="/article/:id"
              element={<StoryPage setIsDonateModalOpen={setIsDonateModalOpen} isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} />}
            />
          </Routes>

          <AnimatePresence>
            {isDonateModalOpen && (
              <Dialog open={isDonateModalOpen} onOpenChange={setIsDonateModalOpen}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Support Us</DialogTitle>
                    <DialogDescription>Your contribution helps us grow.</DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <DialogClose asChild>
                      <Button variant="outline">Close</Button>
                    </DialogClose>
                    <Button>Donate Now</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </AnimatePresence>

          <Toaster />
        </div>
      </Router>
    </ErrorBoundary>
  );
};

export default App;