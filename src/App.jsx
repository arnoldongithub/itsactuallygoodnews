// Complete Optimized App.jsx with Performance Enhancements and Viral Category Distribution
import React, { useState, useEffect, useMemo, lazy, Suspense } from 'react';
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
import SourcePositivityBar from "@/components/SourcePositivityBar";
import Button from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { motion, AnimatePresence } from 'framer-motion';
import { fetchTrendingNews, fetchDailyReads, fetchBlindspotStories, fetchNews, useHomepageData } from '@/lib/news-api';
import { cleanTitle, createBulletPoints, getSourceName, getSourceLogo } from '@/lib/utils';
import { supabase } from '@/lib/supa.js';

// Lazy load skeleton components for better initial load
const SkeletonHomepage = lazy(() => import('@/components/SkeletonComponents').then(module => ({ default: module.SkeletonHomepage })));
const SkeletonCategoryPage = lazy(() => import('@/components/SkeletonComponents').then(module => ({ default: module.SkeletonCategoryPage })));
const SkeletonStoryPage = lazy(() => import('@/components/SkeletonComponents').then(module => ({ default: module.SkeletonStoryPage })));
const SkeletonCard = lazy(() => import('@/components/SkeletonComponents').then(module => ({ default: module.SkeletonCard })));
const LoadingSpinner = lazy(() => import('@/components/SkeletonComponents').then(module => ({ default: module.LoadingSpinner })));

// Optimized Skeleton Fallback
const SkeletonFallback = () => (
  <div className="animate-pulse">
    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-4"></div>
    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-4"></div>
    <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
  </div>
);

// Error Boundary Component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-white dark:bg-black flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
            <div className="flex items-center mb-4">
              <span className="text-red-500 text-2xl mr-3">⚠️</span>
              <h3 className="text-lg font-medium text-red-800 dark:text-red-200">
                Something went wrong
              </h3>
            </div>
            <p className="text-sm text-red-700 dark:text-red-300 mb-4">
              An unexpected error occurred. Please refresh the page.
            </p>
            <div className="flex space-x-2">
              <button
                onClick={() => window.location.reload()}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded text-sm font-medium"
              >
                Refresh Page
              </button>
              <button
                onClick={() => this.setState({ hasError: false, error: null })}
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded text-sm font-medium"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// Optimized text sanitization helper
const sanitizeText = (text) => {
  if (!text || typeof text !== 'string') return '';
  return text.replace(/[^\w\s\-.,!?'"]/g, '').replace(/\s+/g, ' ').trim();
};

// Memoized story processing for performance
const useProcessedStories = (stories) => {
  return useMemo(() => {
    if (!stories || !Array.isArray(stories)) return [];
    
    return stories
      .filter(story => story && story.id && story.title)
      .map(story => ({
        ...story,
        title: sanitizeText(story.title),
        summary: sanitizeText(story.summary || ''),
        category: sanitizeText(story.category || ''),
        source_name: sanitizeText(story.source_name || '')
      }));
  }, [stories]);
};

// OPTIMIZED Story Page
const StoryPage = ({ setIsDonateModalOpen, isDarkMode, setIsDarkMode }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [story, setStory] = useState(null);
  const [relatedStories, setRelatedStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchStory = async () => {
      try {
        setLoading(true);
        
        const fetchPromises = Promise.allSettled([
          fetchTrendingNews(),
          fetchDailyReads(), 
          fetchBlindspotStories(),
          fetchNews()
        ]);
        
        const [results] = await Promise.all([
          fetchPromises,
          new Promise(resolve => setTimeout(resolve, 300))
        ]);
        
        const [trending, daily, blindspot, allNews] = results.map(result => 
          result.status === 'fulfilled' ? result.value : []
        );
        
        const allStories = [...trending, ...daily, ...blindspot, ...allNews];
        const uniqueStories = allStories.filter((story, index, self) => 
          index === self.findIndex(s => s.id === story.id)
        );
        
        const foundStory = uniqueStories.find(item => 
          item.id === parseInt(id) || item.id === id || item.id.toString() === id
        );
        
        if (foundStory) {
          setStory(foundStory);
          const related = uniqueStories
            .filter(item => 
              item.category === foundStory.category && 
              item.id !== foundStory.id
            )
            .slice(0, 3);
          setRelatedStories(related);
        } else {
          toast({
            title: 'Story Not Found',
            description: 'The story you\'re looking for could not be found.',
            variant: 'destructive'
          });
        }
        
      } catch (error) {
        console.error('Failed to load story:', error);
        toast({
          title: 'Error',
          description: 'Failed to load story. Please try again.',
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchStory();
    }
  }, [id, toast]);

  if (loading) {
    return (
      <ErrorBoundary>
        <div className="min-h-screen bg-white dark:bg-black">
          <Header 
            setIsDonateModalOpen={setIsDonateModalOpen} 
            isDarkMode={isDarkMode} 
            setIsDarkMode={setIsDarkMode}
          />
          <Suspense fallback={<SkeletonFallback />}>
            <SkeletonStoryPage />
          </Suspense>
          <Footer />
        </div>
      </ErrorBoundary>
    );
  }

  if (!story) {
    return (
      <ErrorBoundary>
        <div className="min-h-screen bg-white dark:bg-black">
          <Header 
            setIsDonateModalOpen={setIsDonateModalOpen} 
            isDarkMode={isDarkMode} 
            setIsDarkMode={setIsDarkMode}
          />
          <div className="text-center py-20">
            <h2 className="text-2xl font-bold mb-4">Story Not Found</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              The story you're looking for doesn't exist or may have been removed.
            </p>
            <div className="space-x-4">
              <Button 
                onClick={() => navigate('/')} 
                className="btn-primary"
                style={{ backgroundColor: 'hsl(var(--purple-text))' }}
              >
                Go Home
              </Button>
              <Button onClick={() => window.history.back()} variant="outline">
                Go Back
              </Button>
            </div>
          </div>
          <Footer />
        </div>
      </ErrorBoundary>
    );
  }

  const summaryText = sanitizeText(story.summary || story.content || '');
  const bulletPoints = useMemo(() => createBulletPoints(summaryText), [summaryText]);

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-white dark:bg-black">
        <Header 
          setIsDonateModalOpen={setIsDonateModalOpen} 
          isDarkMode={isDarkMode} 
          setIsDarkMode={setIsDarkMode}
        />
        
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
                
                <h1 className="mobile-story-title font-bold" style={{ fontWeight: '800', fontSize: 'clamp(1.5rem, 4vw, 2.5rem)', lineHeight: '1.2', marginBottom: '1.5rem' }}>
                  {cleanTitle(story.title)}
                </h1>
                
                {story.image_url && (
                  <div className="story-image-borderless mb-6 lg:mb-8">
                    <img 
                      src={story.image_url} 
                      alt={cleanTitle(story.title)}
                      className="w-full h-48 lg:h-80 object-cover rounded-xl shadow-md"
                      loading="lazy"
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  </div>
                )}
                
                {bulletPoints.length > 0 && (
                  <div className="story-summary-borderless">
                    <h3 className="font-bold">Story Summary</h3>
                    <ul className="summary-bullets">
                      {bulletPoints.map((point, index) => (
                        <li key={index}>{sanitizeText(point)}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </article>

              {relatedStories.length > 0 && (
                <div className="bg-gray-50 dark:bg-gray-800 rounded-xl shadow-lg p-4 lg:p-8 border border-gray-100 dark:border-gray-700">
                  <h2 
                    className="text-xl lg:text-2xl font-bold mb-4 lg:mb-6 text-gray-900 dark:text-white" 
                    style={{ color: 'hsl(var(--purple-text))' }}
                  >
                    Related Stories
                  </h2>
                  <div className="related-stories-list">
                    {relatedStories.map((relatedStory, index) => (
                      <React.Fragment key={relatedStory.id}>
                        <div className="related-story-item">
                          <button
                            onClick={() => navigate(`/article/${relatedStory.id}`)}
                            className="related-story-link w-full text-left"
                          >
                            <h3 className="related-story-title-mobile mb-3 font-bold" style={{ fontWeight: '700' }}>
                              {cleanTitle(relatedStory.title)}
                            </h3>
                          </button>
                          
                          <SourcePositivityBar 
                            source={sanitizeText(relatedStory.source_name || relatedStory.source)}
                            positivityScore={relatedStory.positivity_score}
                            isViral={false}
                            isFirst={false}
                          />
                        </div>
                        
                        {(index + 1) % 2 === 0 && index < relatedStories.length - 1 && (
                          <InlineAd key={`related-ad-${index}`} />
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="lg:w-1/3">
              <div className="story-metadata-sidebar">
                <h3 className="text-base lg:text-lg font-bold mb-3 lg:mb-4 text-gray-900 dark:text-white">
                  Story Details
                </h3>
                
                <div className="metadata-thin-separator"></div>
                
                <ul className="metadata-bullets">
                  <li>
                    <strong>Source:</strong> {getSourceName(story.source || story.source_name)}
                  </li>
                  <li>
                    <strong>Published:</strong> {new Date(story.published_at).toLocaleDateString()}
                  </li>
                  {story.author && (
                    <li>
                      <strong>Author:</strong> {sanitizeText(story.author)}
                    </li>
                  )}
                  {story.positivity_score && (
                    <li>
                      <strong>Positivity Score:</strong> 
                      <span 
                        className="ml-2 px-2 py-1 rounded text-xs font-semibold text-white"
                        style={{ backgroundColor: 'hsl(var(--orange-accent))' }}
                      >
                        {Math.round(story.positivity_score)}/10
                      </span>
                    </li>
                  )}
                  {story.category && (
                    <li>
                      <strong>Category:</strong> {sanitizeText(story.category)}
                    </li>
                  )}
                </ul>
                
                <div className="mt-4 lg:mt-6">
                  <a 
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
    </ErrorBoundary>
  );
};

// OPTIMIZED Category Page with viral story distribution
const CategoryPage = ({ setIsDonateModalOpen, isDarkMode, setIsDarkMode }) => {
  const { category } = useParams();
  const [filteredNews, setFilteredNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const processedStories = useProcessedStories(filteredNews);

  useEffect(() => {
    const fetchCategoryNews = async () => {
      try {
        setLoading(true);
        
        const minLoadingTime = new Promise(resolve => setTimeout(resolve, 300));
        
        const [regularData, viralData] = await Promise.all([
          fetchNews(category),
          fetchTrendingNews().then(viral => 
            viral.filter(story => {
              const content = `${story.title} ${story.summary || ''}`.toLowerCase();
              const storyCategory = story.original_category || story.category;
              
              switch(category) {
                case 'Health':
                  return storyCategory === 'Health' || 
                         /\b(health|medical|cure|doctor|hospital|medicine|wellness|fitness)\b/.test(content);
                case 'Innovation & Tech':
                  return storyCategory === 'Innovation & Tech' || 
                         /\b(tech|technology|innovation|AI|robot|app|software|digital)\b/.test(content);
                case 'Environment & Sustainability':
                  return storyCategory === 'Environment & Sustainability' || 
                         /\b(environment|climate|green|sustainable|renewable|nature|conservation)\b/.test(content);
                case 'Education':
                  return storyCategory === 'Education' || 
                         /\b(education|school|student|teacher|learning|graduation|university)\b/.test(content);
                case 'Science & Space':
                  return storyCategory === 'Science & Space' || 
                         /\b(science|space|research|discovery|NASA|physics|astronomy)\b/.test(content);
                case 'Humanitarian & Rescue':
                  return storyCategory === 'Humanitarian & Rescue' || 
                         /\b(rescue|humanitarian|hero|volunteer|charity|relief|disaster)\b/.test(content);
                default:
                  return false;
              }
            }).map(story => ({
              ...story,
              category: category,
              isViralContent: true
            }))
          ),
          minLoadingTime
        ]);
        
        const combinedData = [...regularData, ...viralData];
        
        const sortedData = combinedData
          .sort((a, b) => {
            const aScore = (a.virality_score || 0) + (a.positivity_score || 0);
            const bScore = (b.virality_score || 0) + (b.positivity_score || 0);
            return bScore - aScore;
          })
          .slice(0, 20);
        
        setFilteredNews(sortedData);
        
      } catch (error) {
        console.error('Failed to load category news:', error);
        toast({
          title: 'Error',
          description: 'Failed to load category news',
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchCategoryNews();
  }, [category, toast]);

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-white dark:bg-black">
        <Header 
          setIsDonateModalOpen={setIsDonateModalOpen} 
          isDarkMode={isDarkMode} 
          setIsDarkMode={setIsDarkMode}
        />
        
        <div className="px-4 lg:px-6 my-6">
          <h2 className="text-xl font-bold mb-6 capitalize text-gray-900 dark:text-white">
            {sanitizeText(decodeURIComponent(category))} News
          </h2>
          
          {loading ? (
            <div className="max-w-4xl mx-auto space-y-6">
              <Suspense fallback={<SkeletonFallback />}>
                {Array.from({ length: 4 }, (_, i) => (
                  <SkeletonCard 
                    key={i}
                    aspectRatio="16/9"
                    className="w-full"
                    hasOverlay={true}
                    hasCategory={true}
                  />
                ))}
              </Suspense>
            </div>
          ) : (
            <div className="max-w-4xl mx-auto space-y-6">
              {processedStories.length > 0 ? (
                processedStories.map((item) => (
                  <NewsCard 
                    key={`${item.id}-${item.isViralContent ? 'viral' : 'regular'}`} 
                    article={item} 
                  />
                ))
              ) : (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">📰</div>
                  <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
                    No stories found
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400 mb-4">
                    We couldn't find any stories for this category right now.
                  </p>
                  <Button 
                    onClick={() => window.location.reload()}
                    className="btn-primary"
                  >
                    Refresh Page
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
        <Footer />
      </div>
    </ErrorBoundary>
  );
};

// OPTIMIZED Homepage
const HomePage = ({ setIsDonateModalOpen, isDarkMode, setIsDarkMode }) => {
  const { data, loading, error, refetch } = useHomepageData();
  const [streak, setStreak] = useState(0);
  const { toast } = useToast();

  const processedData = useMemo(() => {
    if (!data) return { trending: [], dailyReads: [], blindspots: [] };
    
    return {
      trending: data.trending?.slice(0, 15) || [],
      dailyReads: data.dailyReads?.slice(0, 10) || [],
      blindspots: data.blindspot?.slice(0, 8) || []
    };
  }, [data]);

  useEffect(() => {
    let subscription;
    
    const setupSubscription = () => {
      subscription = supabase
        .channel('news_changes')
        .on('postgres_changes', 
          { event: 'INSERT', schema: 'public', table: 'news' },
          (payload) => {
            setTimeout(() => {
              toast({
                title: "📰 New Story Available!",
                description: "Fresh good news just arrived.",
                duration: 2000,
              });
              refetch();
            }, 1000);
          }
        )
        .subscribe();
    };

    setupSubscription();

    return () => {
      if (subscription) subscription.unsubscribe();
    };
  }, [refetch, toast]);

  useEffect(() => {
    const interval = setInterval(() => {
      refetch();
    }, 10 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [refetch]);

  useEffect(() => {
    const today = new Date().toDateString();
    const lastVisit = localStorage.getItem('lastVisitDate');
    const currentStreak = parseInt(localStorage.getItem('streak') || '0');

    if (lastVisit === today) {
      setStreak(currentStreak);
      return;
    }

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    if (lastVisit === yesterday.toDateString()) {
      const newStreak = Math.min(currentStreak + 1, 999);
      localStorage.setItem('streak', newStreak.toString());
      setStreak(newStreak);
      
      setTimeout(() => {
        toast({
          title: "🔥 Streak Updated!",
          description: `Day ${newStreak} of reading good news!`,
          duration: 2000,
        });
      }, 500);
    } else {
      localStorage.setItem('streak', '1');
      setStreak(1);
    }
    localStorage.setItem('lastVisitDate', today);
  }, [toast]);

  if (loading) {
    return (
      <ErrorBoundary>
        <div className="min-h-screen bg-white dark:bg-black">
          <Header 
            setIsDonateModalOpen={setIsDonateModalOpen} 
            isDarkMode={isDarkMode} 
            setIsDarkMode={setIsDarkMode}
            streak={streak}
          />
          <Suspense fallback={<SkeletonFallback />}>
            <SkeletonHomepage />
          </Suspense>
          <Footer />
        </div>
      </ErrorBoundary>
    );
  }

  if (error) {
    return (
      <ErrorBoundary>
        <div className="min-h-screen bg-white dark:bg-black">
          <Header 
            setIsDonateModalOpen={setIsDonateModalOpen} 
            isDarkMode={isDarkMode} 
            setIsDarkMode={setIsDarkMode}
            streak={streak}
          />
          <div className="container mx-auto px-4 py-8">
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 max-w-md mx-auto">
              <div className="flex">
                <span className="text-red-500 text-2xl mr-3">⚠️</span>
                <div>
                  <h3 className="text-lg font-medium text-red-800 dark:text-red-200">
                    Something went wrong
                  </h3>
                  <p className="mt-2 text-sm text-red-700 dark:text-red-300">
                    {error || 'Failed to load news. Please try again.'}
                  </p>
                  <div className="mt-4 flex space-x-2">
                    <Button 
                      onClick={refetch}
                      size="sm"
                      className="bg-red-100 dark:bg-red-800 text-red-800 dark:text-red-200 hover:bg-red-200 dark:hover:bg-red-700"
                    >
                      Try Again
                    </Button>
                    <Button 
                      onClick={() => window.location.reload()}
                      variant="outline"
                      size="sm"
                    >
                      Refresh Page
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <Footer />
        </div>
      </ErrorBoundary>
    );
  }

  const { trending: trendingNews, dailyReads, blindspots } = processedData;

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-white dark:bg-black">
        <Header 
          setIsDonateModalOpen={setIsDonateModalOpen} 
          isDarkMode={isDarkMode} 
          setIsDarkMode={setIsDarkMode}
          streak={streak}
        />
        
        <div className="main-layout">
          <aside className="daily-reads-sidebar">
            <div className="daily-reads-separator">
              <DailyReads stories={dailyReads} />
            </div>
          </aside>

          <main className="trending-main">
            <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white" style={{ color: 'hsl(var(--purple-text))' }}>
              <svg className="inline-block w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Trending Stories
            </h2>
            
            <TrendingStories stories={trendingNews} />
            
            {(!trendingNews || trendingNews.length === 0) && (
              <div className="text-center py-8">
                <Suspense fallback={<SkeletonFallback />}>
                  <LoadingSpinner text="No trending stories available right now" />
                </Suspense>
                <Button onClick={refetch} variant="outline" size="sm" className="mt-4">
                  Refresh Stories
                </Button>
              </div>
            )}
          </main>

          <aside className="blindspot-sidebar">
            <div className="blindspot-separator">
              <Blindspot stories={blindspots} />
            </div>
          </aside>
        </div>
        
        <Footer />
      </div>
    </ErrorBoundary>
  );
};

// Main App Component
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
    root.classList.toggle('dark', isDarkMode);
    localStorage.setItem('darkMode', JSON.stringify(isDarkMode));
  }, [isDarkMode]);

  useEffect(() => {
    const saved = localStorage.getItem('darkMode');
    if (saved === null) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = (e) => setIsDarkMode(e.matches);
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, []);

  useEffect(() => {
    const handleGlobalError = (e) => {
      if (e.message.includes('String contains an invalid character')) {
        console.error('🚨 GLOBAL CHARACTER ERROR:', e.message);
      }
    };

    window.addEventListener('error', handleGlobalError);
    return () => window.removeEventListener('error', handleGlobalError);
  }, []);

  const HomePageMemo = useMemo(() => 
    <HomePage 
      setIsDonateModalOpen={setIsDonateModalOpen} 
      isDarkMode={isDarkMode} 
      setIsDarkMode={setIsDarkMode} 
    />, [isDarkMode]
  );

  return (
    <ErrorBoundary>
      <Router>
        <div className="bg-white dark:bg-black text-black dark:text-white transition-colors duration-300 min-h-screen">
          <Routes>
            <Route 
              path="/" 
              element={HomePageMemo}
            />
            <Route 
              path="/category/:category" 
              element={
                <CategoryPage 
                  setIsDonateModalOpen={setIsDonateModalOpen} 
                  isDarkMode={isDarkMode} 
                  setIsDarkMode={setIsDarkMode} 
                />
              } 
            />
            <Route 
              path="/article/:id" 
              element={
                <StoryPage 
                  setIsDonateModalOpen={setIsDonateModalOpen} 
                  isDarkMode={isDarkMode} 
                  setIsDarkMode={setIsDarkMode} 
                />
              } 
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
