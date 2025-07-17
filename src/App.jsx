import React, { useState, useEffect } from 'react';
import { Routes, Route, BrowserRouter as Router, useParams } from 'react-router-dom';
import { Toaster } from "@/components/ui/toaster";
import { useToast } from "@/components/ui/use-toast";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import NewsCard from "@/components/NewsCard";
import TrendingStories from "@/components/TrendingStories";
import DailyReads from "@/components/DailyReads";
import Blindspot from "@/components/Blindspot";
import Button from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { motion, AnimatePresence } from 'framer-motion';
import { fetchTrendingNews, fetchDailyReads, fetchBlindspotStories, fetchNews } from '@/lib/news-api';

// Ad Component for strategic placement
const AdPlacement = ({ position }) => {
  const adConfig = {
    top: { height: 'h-24', content: 'Top Banner Ad' },
    sidebar: { height: 'h-32', content: 'Sidebar Ad' },
    middle: { height: 'h-20', content: 'Content Ad' },
    bottom: { height: 'h-24', content: 'Bottom Banner Ad' }
  };

  const config = adConfig[position] || adConfig.middle;

  return (
    <div className={`${config.height} bg-gray-100 border border-gray-300 rounded-lg flex items-center justify-center mb-6`}>
      <div className="text-center">
        <p className="text-sm text-gray-600">{config.content}</p>
        <p className="text-xs text-gray-500">Advertisement</p>
      </div>
    </div>
  );
};

// Story Summary Page Component
const StoryPage = ({ setIsDonateModalOpen }) => {
  const { id } = useParams();
  const [story, setStory] = useState(null);
  const [relatedStories, setRelatedStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchStory = async () => {
      try {
        setLoading(true);
        // Fetch main story
        const allNews = await fetchNews();
        const foundStory = allNews.find(item => item.id === id);
        
        if (foundStory) {
          setStory(foundStory);
          
          // Fetch related stories from same category
          const related = allNews
            .filter(item => item.category === foundStory.category && item.id !== id)
            .slice(0, 5);
          setRelatedStories(related);
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Failed to load story:', error);
        toast({
          title: 'Error',
          description: 'Failed to load story',
          variant: 'destructive'
        });
        setLoading(false);
      }
    };

    fetchStory();
  }, [id, toast]);

  if (loading) {
    return (
      <div className="min-h-screen px-4">
        <Header setIsDonateModalOpen={setIsDonateModalOpen} />
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!story) {
    return (
      <div className="min-h-screen px-4">
        <Header setIsDonateModalOpen={setIsDonateModalOpen} />
        <div className="text-center py-20">
          <h2 className="text-2xl font-bold mb-4">Story Not Found</h2>
          <p className="text-gray-600 mb-4">The story you're looking for doesn't exist.</p>
          <Button onClick={() => window.history.back()}>Go Back</Button>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4">
      <Header setIsDonateModalOpen={setIsDonateModalOpen} />
      
      <div className="max-w-4xl mx-auto my-8">
        <AdPlacement position="top" />
        
        <article className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="mb-4">
            <span className="text-sm font-semibold text-blue-600 uppercase">
              {story.category}
            </span>
          </div>
          
          <h1 className="text-3xl font-bold mb-4 leading-tight">
            {story.title}
          </h1>
          
          {story.image_url && (
            <img 
              src={story.image_url} 
              alt={story.title}
              className="w-full h-64 object-cover rounded-lg mb-6"
            />
          )}
          
          <div className="prose max-w-none">
            <p className="text-gray-700 text-lg leading-relaxed mb-6">
              {story.summary || story.content || 'Summary not available for this story.'}
            </p>
          </div>
          
          <div className="flex items-center justify-between pt-4 border-t">
            <div className="text-sm text-gray-500">
              <p>Source: {story.source || 'Unknown'}</p>
              <p>Published: {new Date(story.published_at).toLocaleDateString()}</p>
            </div>
            
            <a 
              href={story.url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              Read Full Article →
            </a>
          </div>
        </article>

        <AdPlacement position="middle" />

        {/* Related Stories */}
        {relatedStories.length > 0 && (
          <div className="bg-gray-50 rounded-lg p-6">
            <h2 className="text-xl font-bold mb-4">Related Stories</h2>
            <div className="space-y-3">
              {relatedStories.map((relatedStory) => (
                <div key={relatedStory.id} className="border-b border-gray-200 pb-3 last:border-b-0">
                  <a
                    href={relatedStory.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block hover:text-blue-600 transition-colors"
                  >
                    <h3 className="font-bold text-base leading-tight">
                      {relatedStory.title}
                    </h3>
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}

        <AdPlacement position="bottom" />
      </div>
      
      <Footer />
    </div>
  );
};

const CategoryPage = ({ setIsDonateModalOpen }) => {
  const { category } = useParams();
  const [filteredNews, setFilteredNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    setLoading(true);
    fetchNews(category)
      .then((data) => {
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
    <div className="min-h-screen px-4">
      <Header setIsDonateModalOpen={setIsDonateModalOpen} />
      <div className="my-6">
        <AdPlacement position="top" />
        
        <h2 className="text-xl font-bold mb-4 capitalize">{decodeURIComponent(category)} News</h2>
        {loading ? (
          <div className="flex justify-center items-center h-60">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredNews.map((item, index) => (
              <React.Fragment key={item.id}>
                <NewsCard article={item} />
                {index === Math.floor(filteredNews.length / 2) && (
                  <div className="col-span-1 md:col-span-2">
                    <AdPlacement position="middle" />
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
};

const HomePage = ({ setIsDonateModalOpen }) => {
  const [trendingNews, setTrendingNews] = useState([]);
  const [dailyReads, setDailyReads] = useState([]);
  const [blindspots, setBlindspots] = useState([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const today = new Date().toDateString();
    const lastVisit = localStorage.getItem('lastVisitDate');
    const currentStreak = parseInt(localStorage.getItem('streak') || '0');

    if (lastVisit === today) return;

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    if (lastVisit === yesterday.toDateString()) {
      const newStreak = Math.min(currentStreak + 1, 999);
      localStorage.setItem('streak', newStreak);
      toast({
        title: "🔥 You're on a roll!",
        description: `Day ${newStreak} in a row. Keep it up!`,
      });
    } else {
      localStorage.setItem('streak', 1);
    }
    localStorage.setItem('lastVisitDate', today);
  }, [toast]);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetchTrendingNews(),
      fetchDailyReads(),
      fetchBlindspotStories()
    ])
      .then(([trending, daily, blind]) => {
        setTrendingNews(trending);
        setDailyReads(daily);
        setBlindspots(blind);
        setLoading(false);
      })
      .catch((error) => {
        console.error('Failed to load news:', error);
        toast({ 
          title: 'Error', 
          description: 'Failed to load news', 
          variant: 'destructive' 
        });
        setLoading(false);
      });
  }, [toast]);

  if (loading) {
    return (
      <div className="min-h-screen px-4">
        <Header setIsDonateModalOpen={setIsDonateModalOpen} />
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading news...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4">
      <Header setIsDonateModalOpen={setIsDonateModalOpen} />
      
      <AdPlacement position="top" />
      
      <div className="grid grid-cols-1 lg:grid-cols-6 gap-6 my-6">
        {/* Daily Reads - Left Sidebar */}
        <aside className="lg:col-span-1">
          <div className="border-r border-white pr-4">
            <DailyReads stories={dailyReads} />
          </div>
        </aside>

        {/* Main Trending Stories */}
        <main className="lg:col-span-4">
          <TrendingStories stories={trendingNews} />
          <div className="mt-8">
            <AdPlacement position="middle" />
          </div>
        </main>

        {/* Blindspot - Right Sidebar */}
        <aside className="lg:col-span-1">
          <div className="border-l border-white pl-4">
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
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  const [isDonateModalOpen, setIsDonateModalOpen] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode);
    localStorage.setItem('darkMode', JSON.stringify(isDarkMode));
  }, [isDarkMode]);

  return (
    <Router>
      <div className="bg-white dark:bg-black text-black dark:text-white transition-colors duration-300 min-h-screen">
        <Routes>
          <Route path="/" element={<HomePage setIsDonateModalOpen={setIsDonateModalOpen} />} />
          <Route path="/category/:category" element={<CategoryPage setIsDonateModalOpen={setIsDonateModalOpen} />} />
          <Route path="/article/:id" element={<StoryPage setIsDonateModalOpen={setIsDonateModalOpen} />} />
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
