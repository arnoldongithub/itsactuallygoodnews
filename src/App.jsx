// Updated App.jsx with Error Boundary and Safe Character Handling
import React, { useState, useEffect } from 'react';
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

// Import skeleton components
import {
  SkeletonHomepage,
  SkeletonCategoryPage, 
  SkeletonStoryPage,
  SkeletonCategoryGrid,
  LoadingSpinner,
  SkeletonCard
} from '@/components/SkeletonComponents';

// Error Boundary Component for catching invalid character errors
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log the specific error for debugging
    if (error.message && error.message.includes('String contains an invalid character')) {
      console.error('🚨 INVALID CHARACTER ERROR CAUGHT:');
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      console.error('Component stack:', errorInfo.componentStack);
      
      // Try to identify which component caused the issue
      const componentMatch = errorInfo.componentStack.match(/at (\w+)/);
      if (componentMatch) {
        console.error('Likely problematic component:', componentMatch[1]);
      }
    }
    
    console.error('Error caught by boundary:', error);
    console.error('Error info:', errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-white dark:bg-black flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0">
                <span className="text-red-500 text-2xl">⚠️</span>
              </div>
              <div className="ml-3">
                <h3 className="text-lg font-medium text-red-800 dark:text-red-200">
                  Something went wrong
                </h3>
              </div>
            </div>
            
            <p className="text-sm text-red-700 dark:text-red-300 mb-4">
              {this.state.error?.message?.includes('String contains an invalid character') 
                ? 'There was an issue with character encoding. Please refresh the page.'
                : 'An unexpected error occurred. Please try refreshing the page.'
              }
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
            
            {process.env.NODE_ENV === 'development' && (
              <details className="mt-4">
                <summary className="text-xs text-red-600 cursor-pointer">Show Error Details</summary>
                <pre className="text-xs mt-2 p-2 bg-red-100 dark:bg-red-900/40 rounded overflow-auto">
                  {this.state.error?.stack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Safe text sanitization helper
const sanitizeText = (text) => {
  if (!text || typeof text !== 'string') return '';
  return text.replace(/[^\w\s\-.,!?'"]/g, '').trim();
};

// ENHANCED Story Page with Skeleton Loading
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
        console.log(`🔍 Looking for story with ID: ${id}`);
        
        // Add a minimum loading time for smooth skeleton display
        const minLoadingTime = new Promise(resolve => setTimeout(resolve, 800));
        
        const [trending, daily, blindspot, allNews] = await Promise.all([
          fetchTrendingNews().catch(() => []),
          fetchDailyReads().catch(() => []), 
          fetchBlindspotStories().catch(() => []),
          fetchNews().catch(() => []),
          minLoadingTime // Ensure skeleton shows for at least 800ms
        ]);
        
        const allStories = [...trending, ...daily, ...blindspot, ...allNews];
        const uniqueStories = allStories.filter((story, index, self) => 
          index === self.findIndex(s => s.id === story.id)
        );
        
        console.log(`📊 Total unique stories available: ${uniqueStories.length}`);
        
        const foundStory = uniqueStories.find(item => 
          item.id === parseInt(id) || 
          item.id === id || 
          item.id.toString() === id
        );
        
        if (foundStory) {
          console.log(`✅ Found story: ${sanitizeText(foundStory.title)}`);
          setStory(foundStory);
          
          const related = uniqueStories
            .filter(item => 
              item.category === foundStory.category && 
              item.id !== foundStory.id
            )
            .slice(0, 5);
          setRelatedStories(related);
        } else {
          console.error(`❌ Story not found with ID: ${id}`);
          toast({
            title: 'Story Not Found',
            description: 'The story you\'re looking for could not be found.',
            variant: 'destructive'
          });
        }
        
      } catch (error) {
        console.error('❌ Failed to load story:', error);
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

  // Show skeleton while loading
  if (loading) {
    return (
      <ErrorBoundary>
        <div className="min-h-screen bg-white dark:bg-black">
          <Header 
            setIsDonateModalOpen={setIsDonateModalOpen} 
            isDarkMode={isDarkMode} 
            setIsDarkMode={setIsDarkMode}
          />
          <SkeletonStoryPage />
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
  const bulletPoints = createBulletPoints(summaryText);

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
            
            {/* Main Story Content - Left Side */}
            <div className="lg:w-2/3">
              {/* Story Card - NO BORDERS */}
              <article className="story-card-borderless mb-6 lg:mb-8">
                <div className="mb-4 lg:mb-6">
                  <span 
                    className="text-xs lg:text-sm font-semibold uppercase tracking-wide px-2 py-1 lg:px-3 lg:py-1 rounded-full text-white" 
                    style={{ backgroundColor: 'hsl(var(--orange-accent))' }}
                  >
                    {sanitizeText(story.category)}
                  </span>
                </div>
                
                {/* MOBILE-RESPONSIVE CLEAN TITLE */}
                <h1 className="mobile-story-title">
                  {cleanTitle(story.title)}
                </h1>
                
                {story.image_url && (
                  <div className="story-image-borderless mb-6 lg:mb-8">
                    <img 
                      src={story.image_url} 
                      alt={cleanTitle(story.title)}
                      className="w-full h-48 lg:h-80 object-cover rounded-xl shadow-md"
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  </div>
                )}
                
                {/* CLEAN BULLET POINT SUMMARY - NO BORDERS */}
                {bulletPoints.length > 0 && (
                  <div className="story-summary-borderless">
                    <h3>Story Summary</h3>
                    <ul className="summary-bullets">
                      {bulletPoints.map((point, index) => (
                        <li key={index}>{sanitizeText(point)}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </article>

              {/* Related Stories with Source Bars */}
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
                            <h3 className="related-story-title-mobile mb-3">
                              {cleanTitle(relatedStory.title)}
                            </h3>
                          </button>
                          
                          {/* Source & Positivity Bar for Related Stories */}
                          <SourcePositivityBar 
                            source={sanitizeText(relatedStory.source_name || relatedStory.source)}
                            positivityScore={relatedStory.positivity_score}
                            isViral={false}
                            isFirst={false}
                          />
                        </div>
                        
                        {/* Insert inline ad every 3rd related story */}
                        {(index + 1) % 3 === 0 && index < relatedStories.length - 1 && (
                          <InlineAd key={`related-ad-${index}`} />
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Metadata Sidebar - Right Side */}
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
                  {story.virality_score && (
                    <li>
                      <strong>Viral Score:</strong> {Math.round(story.virality_score)}/10
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

// ENHANCED Category Page with Skeleton Loading & Wide Rectangle Layout
const CategoryPage = ({ setIsDonateModalOpen, isDarkMode, setIsDarkMode }) => {
  const { category } = useParams();
  const [filteredNews, setFilteredNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchCategoryNews = async () => {
      try {
        setLoading(true);
        console.log(`🔍 Fetching news for category: ${category}`);
        
        // Add minimum loading time for smooth skeleton display
        const minLoadingTime = new Promise(resolve => setTimeout(resolve, 600));
        
        const [data] = await Promise.all([
          fetchNews(category),
          minLoadingTime
        ]);
        
        console.log(`✅ Got ${data.length} articles for category: ${category}`);
        setFilteredNews(data);
        
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
            // SKELETON LOADING STATE
            <div className="max-w-4xl mx-auto space-y-6">
              {Array.from({ length: 6 }, (_, i) => (
                <SkeletonCard 
                  key={i}
                  aspectRatio="16/9"
                  className="w-full"
                  hasOverlay={true}
                  hasCategory={true}
                />
              ))}
            </div>
          ) : (
            // WIDE RECTANGLE LAYOUT (2/3 width of page)
            <div className="max-w-4xl mx-auto space-y-6">
              {filteredNews.length > 0 ? (
                filteredNews.map((item) => (
                  <NewsCard key={item.id} article={item} />
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

// ENHANCED Homepage with Skeleton Loading
const HomePage = ({ setIsDonateModalOpen, isDarkMode, setIsDarkMode }) => {
  const { data, loading, error, refetch } = useHomepageData();
  const [streak, setStreak] = useState(0);
  const { toast } = useToast();

  // Real-time database subscription
  useEffect(() => {
    console.log('🔄 Setting up real-time subscription...');
    
    const subscription = supabase
      .channel('news_changes')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'news' },
        (payload) => {
          console.log('🆕 New article added:', sanitizeText(payload.new.title));
          toast({
            title: "📰 New Story Available!",
            description: "Fresh good news just arrived. Refreshing your feed...",
            duration: 3000,
          });
          setTimeout(() => refetch(), 1000);
        }
      )
      .subscribe();

    return () => {
      console.log('🔌 Unsubscribing from real-time updates');
      subscription.unsubscribe();
    };
  }, [refetch, toast]);

  // Auto-refresh every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      console.log('🔄 Auto-refreshing articles...');
      refetch();
    }, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [refetch]);

  // Streak logic
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
          description: `Day ${newStreak} of reading good news! Keep it up!`,
          duration: 3000,
        });
      }, 1000);
    } else {
      localStorage.setItem('streak', '1');
      setStreak(1);
      
      setTimeout(() => {
        toast({
          title: "Welcome back!",
          description: "Starting a new reading streak. Keep coming back for more good news!",
          duration: 3000,
        });
      }, 1000);
    }
    localStorage.setItem('lastVisitDate', today);
  }, [toast]);

  // ENHANCED SKELETON LOADING STATE
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
          <SkeletonHomepage />
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
                <div className="flex-shrink-0">
                  <span className="text-red-500 text-2xl">⚠️</span>
                </div>
                <div className="ml-3">
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

  const { trending: trendingNews, dailyReads, blindspot: blindspots } = data;

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
          {/* Daily Reads - Left Sidebar */}
          <aside className="daily-reads-sidebar">
            <div className="daily-reads-separator">
              <DailyReads stories={dailyReads} />
            </div>
          </aside>

          {/* Main Trending Stories */}
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
                <LoadingSpinner text="No trending stories available right now" />
                <Button onClick={refetch} variant="outline" size="sm" className="mt-4">
                  Refresh Stories
                </Button>
              </div>
            )}
          </main>

          {/* Blindspot - Right Sidebar */}
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
    document.documentElement.classList.toggle('dark', isDarkMode);
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

  // Add global error handler for invalid characters
  useEffect(() => {
    const handleGlobalError = (e) => {
      if (e.message.includes('String contains an invalid character')) {
        console.error('🚨 GLOBAL INVALID CHARACTER ERROR:');
        console.error('Message:', e.message);
        console.error('Filename:', e.filename);
        console.error('Line:', e.lineno);
        console.error('Column:', e.colno);
        console.error('Stack:', e.error?.stack);
      }
    };

    window.addEventListener('error', handleGlobalError);
    return () => window.removeEventListener('error', handleGlobalError);
  }, []);

  return (
    <ErrorBoundary>
      <Router>
        <div className="bg-white dark:bg-black text-black dark:text-white transition-colors duration-300 min-h-screen">
          <Routes>
            <Route path="/" element={<HomePage setIsDonateModalOpen={setIsDonateModalOpen} isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} />} />
            <Route path="/category/:category" element={<CategoryPage setIsDonateModalOpen={setIsDonateModalOpen} isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} />} />
            <Route path="/article/:id" element={<StoryPage setIsDonateModalOpen={setIsDonateModalOpen} isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} />} />
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
