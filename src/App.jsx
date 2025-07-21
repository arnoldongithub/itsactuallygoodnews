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

// ENHANCED Story Summary Page Component with bullet point summaries
const StoryPage = ({ setIsDonateModalOpen, isDarkMode, setIsDarkMode }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [story, setStory] = useState(null);
  const [relatedStories, setRelatedStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Helper function to convert text to bullet points
  const createBulletPoints = (text) => {
    if (!text) return [];
    
    // Split by sentences and clean up
    const sentences = text
      .split(/[.!?]+/)
      .map(s => s.trim())
      .filter(s => s.length > 10)
      .slice(0, 5); // Max 5 bullet points
    
    return sentences.map(sentence => sentence.charAt(0).toUpperCase() + sentence.slice(1));
  };

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
      
      <div className="max-w-4xl mx-auto my-8 px-4">
        <article className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 mb-8 border border-gray-100 dark:border-gray-700">
          <div className="mb-6">
            <span 
              className="text-sm font-semibold uppercase tracking-wide px-3 py-1 rounded-full text-white" 
              style={{ backgroundColor: 'hsl(var(--orange-accent))' }}
            >
              {story.category}
            </span>
          </div>
          
          <h1 className="text-4xl font-bold mb-6 leading-tight text-gray-900 dark:text-white">
            {story.title}
          </h1>
          
          {story.image_url && (
            <img 
              src={story.image_url} 
              alt={story.title}
              className="w-full h-80 object-cover rounded-xl mb-8 shadow-md"
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
          )}
          
          {/* SINGLE BULLET POINT SUMMARY */}
          {bulletPoints.length > 0 && (
            <div className="story-summary">
              <h3>Story Summary</h3>
              <ul className="summary-bullets">
                {bulletPoints.map((point, index) => (
                  <li key={index}>{point}</li>
                ))}
              </ul>
            </div>
          )}
          
          <div className="flex items-center justify-between pt-6 border-t border-gray-200 dark:border-gray-600">
            <div className="text-sm text-gray-500 dark:text-gray-400 space-y-1">
              <p><strong>Source:</strong> {story.source || story.source_name || 'Unknown'}</p>
              <p><strong>Published:</strong> {new Date(story.published_at).toLocaleDateString()}</p>
              {story.author && <p><strong>Author:</strong> {story.author}</p>}
              {story.positivity_score && (
                <p><strong>Positivity Score:</strong> 
                  <span 
                    className="ml-2 px-2 py-1 rounded text-xs font-semibold text-white"
                    style={{ backgroundColor: 'hsl(var(--orange-accent))' }}
                  >
                    {story.positivity_score}/10
                  </span>
                </p>
              )}
            </div>
            
            <a 
              href={story.url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="px-6 py-3 rounded-lg font-medium transition-all duration-300 hover:shadow-lg text-white"
              style={{ backgroundColor: 'hsl(var(--purple-text))' }}
            >
              Read Full Article →
            </a>
          </div>
        </article>

        {/* Enhanced Related Stories */}
        {relatedStories.length > 0 && (
          <div className="bg-gray-50 dark:bg-gray-800 rounded-xl shadow-lg p-8 border border-gray-100 dark:border-gray-700">
            <h2 
              className="text-2xl font-bold mb-6 text-gray-900 dark:text-white" 
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
                      <h3 className="related-story-title">
                        {relatedStory.title}
                      </h3>
                    </button>
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
      
      <Footer />
    </div>
  );
};

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

// === OPTIMIZED HOMEPAGE with single data fetch ===
const HomePage = ({ setIsDonateModalOpen, isDarkMode, setIsDarkMode }) => {
  // Use the new optimized hook instead of multiple API calls
  const { data, loading, error, refetch } = useHomepageData();
  const [streak, setStreak] = useState(0);
  const { toast } = useToast();

  // Streak logic remains the same
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
      
      // Show streak notification
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
      
      // Welcome back message
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

  // Loading state with better UX
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
            <p className="text-sm text-muted-foreground mt-2">This should only take a moment</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // Error state with retry option
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

  // Extract data from the optimized hook
  const { trending: trendingNews, dailyReads, blindspot: blindspots } = data;

  console.log('🏠 Homepage render:', {
    trending: trendingNews?.length || 0,
    dailyReads: dailyReads?.length || 0,
    blindspot: blindspots?.length || 0
  });

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      <Header 
        setIsDonateModalOpen={setIsDonateModalOpen} 
        isDarkMode={isDarkMode} 
        setIsDarkMode={setIsDarkMode}
        streak={streak}
      />
      
      <div className="main-layout">
        {/* Daily Reads - Left Sidebar (1/6 width) */}
        <aside className="daily-reads-sidebar">
          <div className="daily-reads-separator">
            <DailyReads stories={dailyReads} />
          </div>
        </aside>

        {/* Main Trending Stories (2/3 width) */}
        <main className="trending-main">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">
              <svg className="inline-block w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Trending Stories
            </h2>
            <TrendingStories stories={trendingNews} />
            {(!trendingNews || trendingNews.length === 0) && (
              <div className="text-center py-8">
                <p className="text-gray-500 dark:text-gray-400 mb-2">No trending stories available right now</p>
                <Button onClick={refetch} variant="outline" size="sm">
                  Refresh Stories
                </Button>
              </div>
            )}
          </div>
        </main>

        {/* Blindspot - Right Sidebar (1/6 width) */}
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

const App = () => {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('darkMode');
      if (saved !== null) return JSON.parse(saved);
      // Follow system preference as default
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  const [isDonateModalOpen, setIsDonateModalOpen] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode);
    localStorage.setItem('darkMode', JSON.stringify(isDarkMode));
  }, [isDarkMode]);

  // Listen for system theme changes if no manual preference is set
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
