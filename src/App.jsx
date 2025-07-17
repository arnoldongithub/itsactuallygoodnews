import React, { useState, useEffect } from 'react';
import { Routes, Route, BrowserRouter as Router, useParams } from 'react-router-dom';
import { Toaster } from "@/components/ui/toaster";
import { useToast } from "@/components/ui/use-toast";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import NewsCard from "@/components/NewsCard";
import Button from "@/components/ui/buttons";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { motion, AnimatePresence } from 'framer-motion';
import { fetchTrendingNews, fetchDailyReads, fetchBlindspotStories, fetchNews } from '@/lib/news-api';

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
  }, [category]);

  return (
    <div className="min-h-screen px-4">
      <Header setIsDonateModalOpen={setIsDonateModalOpen} />
      <div className="my-6">
        <h2 className="text-xl font-bold mb-4 capitalize">{decodeURIComponent(category)} News</h2>
        {loading ? (
          <div className="flex justify-center items-center h-60">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredNews.map((item) => (
              <NewsCard key={item.id} article={item} />
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
  const [streak, setStreak] = useState(0);
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
      setStreak(newStreak);
      toast({
        title: "🔥 You're on a roll!",
        description: `Day ${newStreak} in a row. Keep it up!`,
      });
    } else {
      localStorage.setItem('streak', 1);
      setStreak(1);
    }
    localStorage.setItem('lastVisitDate', today);
  }, []);

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
  }, []);

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
      <div className="grid grid-cols-1 lg:grid-cols-6 gap-6 my-6">
        <aside className="lg:col-span-1 space-y-4">
          <h2 className="text-lg font-semibold">Daily Reads</h2>
          {dailyReads.slice(0, 2).map((item) => (
            <NewsCard key={item.id} article={item} />
          ))}
          <hr className="border-t border-muted/30 my-2" />
          <ul className="space-y-2 pl-2 border-l">
            {dailyReads.slice(2, 5).map((item) => (
              <li key={item.id}>
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline text-sm block"
                >
                  {item.title.slice(0, 80)}{item.title.length > 80 ? '...' : ''}
                </a>
              </li>
            ))}
          </ul>
        </aside>

        <main className="lg:col-span-4">
          <h2 className="text-xl font-bold mb-4">Trending Good News (Last 36 Hours)</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {trendingNews.map((item) => (
              <NewsCard key={item.id} article={item} />
            ))}
          </div>
        </main>

        <aside className="lg:col-span-1 space-y-4">
          <h2 className="text-lg font-semibold">Blindspots</h2>
          {blindspots.slice(0, 2).map((item) => (
            <NewsCard key={item.id} article={item} />
          ))}
          <hr className="border-t border-muted/30 my-2" />
          <ul className="space-y-2 pl-2 border-l">
            {blindspots.slice(2, 5).map((item) => (
              <li key={item.id}>
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline text-sm block"
                >
                  {item.title.slice(0, 80)}{item.title.length > 80 ? '...' : ''}
                </a>
              </li>
            ))}
          </ul>
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
