// Complete App.jsx - Final Corrected Version (FULL FILE)
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
import Button from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { motion, AnimatePresence } from 'framer-motion';
import { fetchTrendingNews, fetchDailyReads, fetchBlindspotStories, fetchNews, useHomepageData } from '@/lib/news-api';
import { cleanTitle, createBulletPoints, getSourceName, getSourceLogo } from '@/lib/utils';

// ENHANCED Story Page with Mobile Title Fixes and Clean Display
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
        
        // Try to fetch from all news sources with better error handling
        const [trending, daily, blindspot, allNews] = await Promise.all([
          fetchTrendingNews().catch(() => []),
          fetchDailyReads().catch(() => []), 
          fetchBlindspotStories().catch(() => []),
          fetchNews().catch(() => [])
        ]);
        
        // Combine all stories to search through
        const allStories = [...trending, ...daily, ...blindspot, ...allNews];
        
        // Remove duplicates by ID
        const uniqueStories = allStories.filter((story, index, self) => 
          index === self.findIndex(s => s.id === story.id)
        );
        
        console.log(`📊 Total unique stories available: ${uniqueStories.length}`);
        
        // Try different ID formats (string and number)
        const foundStory = uniqueStories.find(item => 
          item.id === parseInt(id) || 
          item.id === id || 
          item.id.toString() === id
        );
        
        if (foundStory) {
          console.log(`✅ Found story: ${foundStory.title}`);
          setStory(foundStory);
          
          // Fetch related stories from same category
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

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-black">
        <Header 
          setIsDonateModalOpen={setIsDonateModalOpen} 
          isDarkMode={isDarkMode} 
          setIsDarkMode={setIsDarkMode}
        />
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading story...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!story) {
    return (
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
    );
  }

  const summaryText = story.summary || story.content || '';
  const bulletPoints = createBulletPoints(summaryText);

  return (
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
                  {story.category}
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
                      <li key={index}>{point}</li>
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
                        <div className="source-positivity-bar mt-2">
                          <div className="source-info">
                            <div className="source-logo">
                              {getSourceLogo(relatedStory.source_name || relatedStory.source)}
                            </div>
                            <span>{getSourceName(relatedStory.source_name || relatedStory.source)}</span>
                          </div>
                          <div className="positivity-score">
                            Positivity: {Math.round(relatedStory.positivity_score || 0)}
                          </div>
                        </div>
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
                    <strong>Author:</strong> {story.author}
                  </li>
                )}
                {story.positivity_score && (
                  <li>
                    <strong>Positivity Score:</strong> 
                    <span 
                      className="ml-2 px-2 py-1 rounded text-xs font-semibold text-white"
                      style={{ backgroundColor: 'hsl(var(--orange-accent))' }}
                    >
                      {story.positivity_score}/10
                    </span>
                  </li>
                )}
                {story.category && (
                  <li>
                    <strong>Category:</strong> {story.category}
                  </li>
                )}
                {story.virality_score && (
                  <li>
                    <strong>Viral Score:</strong> {story.virality_score}/10
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
  );
};

// Category Page Component
const CategoryPage = ({ setIsDonateModalOpen, isDarkMode, setIsDarkMode }) => {
  const { category } = useParams();
  const [filteredNews, setFilteredNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    setLoading(true);
    console.log(`🔍 Fetching news for category: ${category}`);
    
    fetchNews(category)
      .then((data) => {
        console.log(`✅ Got ${data.length} articles for category: ${category}`);
        setFilteredNews(data);
        setLoading(false);
      })
      .catch((error) => {
        console.error('Failed to load category news:', error);
        toast({
          title: 'Error',
          description: 'Failed to load category news',
          variant: 'destructive'
        });
        setLoading(false);
      });
  }, [category, toast]);

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      <Header 
        setIsDonateModalOpen={setIsDonateModalOpen} 
        isDarkMode={isDarkMode} 
        setIsDarkMode={setIsDarkMode}
      />
      <div className="px-4 lg:px-6 my-6">
        <h2 className="text-xl font-bold mb-4 capitalize text-gray-900 dark:text-white">
          {decodeURIComponent(category)} News
        </h2>
        {loading ? (
          <div className="flex justify-center items-center h-60">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredNews.length > 0 ? (
              filteredNews.map((item) => (
                <NewsCard key={item.id} article={item} />
              ))
            ) : (
              <div className="col-span-full text-center py-8">
                <p className="text-gray-500 dark:text-gray-400">
                  No stories found for this category.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
};

// === OPTIMIZED HOMEPAGE - PERFECT ALIGNMENT & BORDERLESS ===
const HomePage = ({ setIsDonateModalOpen, isDarkMode, setIsDarkMode }) => {
  const { data, loading, error, refetch } = useHomepageData();
  const [streak, setStreak] = useState(0);
  const { toast } = useToast();

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

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-black">
        <Header 
          setIsDonateModalOpen={setIsDonateModalOpen} 
          isDarkMode={isDarkMode} 
          setIsDarkMode={setIsDarkMode}
          streak={streak}
        />
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading good news...</p>
            <p className="text-sm text-muted-foreground mt-2">This should be much faster now!</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
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
    );
  }

  const { trending: trendingNews, dailyReads, blindspot: blindspots } = data;

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      <Header 
        setIsDonateModalOpen={setIsDonateModalOpen} 
        isDarkMode={isDarkMode} 
        setIsDarkMode={setIsDarkMode}
        streak={streak}
      />
      
      <div className="main-layout">
        {/* Daily Reads - Left Sidebar (1/6 width) - PERFECT ALIGNMENT */}
        <aside className="daily-reads-sidebar">
          <div className="daily-reads-separator">
            <DailyReads stories={dailyReads} />
          </div>
        </aside>

        {/* Main Trending Stories (2/3 width) - BORDERLESS & PERFECT ALIGNMENT */}
        <main className="trending-main">
          {/* Title on same horizontal plane as sidebar titles */}
          <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white" style={{ color: 'hsl(var(--purple-text))' }}>
            <svg className="inline-block w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Trending Stories
          </h2>
          
          {/* BORDERLESS TrendingStories component */}
          <TrendingStories stories={trendingNews} />
          
          {(!trendingNews || trendingNews.length === 0) && (
            <div className="text-center py-8">
              <p className="text-gray-500 dark:text-gray-400 mb-2">No trending stories available right now</p>
              <Button onClick={refetch} variant="outline" size="sm">
                Refresh Stories
              </Button>
            </div>
          )}
        </main>

        {/* Blindspot - Right Sidebar (1/6 width) - PERFECT ALIGNMENT */}
        <aside className="blindspot-sidebar">
          <div className="blindspot-separator">
            <Blindspot stories={blindspots} />
          </div>
        </aside>
      </div>
      
      <Footer />
    </div>
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

  return (
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
  );
};

export default App;
