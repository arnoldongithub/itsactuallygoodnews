import React, { useState, useEffect } from 'react';
import { Routes, Route, BrowserRouter as Router } from 'react-router-dom';
import { Toaster } from "@/components/ui/toaster";
import { useToast } from "@/components/ui/use-toast";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import NewsCard from "@/components/NewsCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { motion, AnimatePresence } from 'framer-motion';
import { fetchNews } from '@/lib/news-api';
import { Sun, Moon, Bookmark, Rss, Info, Gift, ExternalLink, Heart } from 'lucide-react';

// ✅ Matches updated RSS feed categories
const allCategories = [
  'All',
  'Health',
  'Innovation & Tech',
  'Environment & Sustainability',
  'Education',
  'Science & Space',
  'Policy & Governance',
  'Community & Culture',
  'Philanthropy / Nonprofits'
];

const HomePage = ({ setIsDonateModalOpen }) => {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    setLoading(true);
    fetchNews()
      .then((data) => {
        setNews(data);
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
        {news.map((item) => (
          <NewsCard key={item.id} article={item} />
        ))}
      </div>
      <Footer />
    </div>
  );
};

const App = () => {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    // Initialize from localStorage or system preference
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('darkMode');
      if (saved !== null) {
        return JSON.parse(saved);
      }
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });
  const [isDonateModalOpen, setIsDonateModalOpen] = useState(false);

  useEffect(() => {
    // Apply dark mode class
    document.documentElement.classList.toggle('dark', isDarkMode);
    // Save to localStorage
    localStorage.setItem('darkMode', JSON.stringify(isDarkMode));
  }, [isDarkMode]);

  return (
    <Router>
      <div className="bg-white dark:bg-black text-black dark:text-white transition-colors duration-300 min-h-screen">
        {/* Fixed positioning to prevent layout shifts */}
        <div className="fixed top-4 right-4 z-50">
          <Button
            onClick={() => setIsDarkMode(!isDarkMode)}
            variant="ghost"
            size="icon"
            className="bg-background/80 backdrop-blur-sm border"
          >
            {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
        </div>

        <Routes>
          <Route path="/" element={<HomePage setIsDonateModalOpen={setIsDonateModalOpen} />} />
          {/* Add more routes as needed */}
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
