import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useParams, useNavigate } from 'react-router-dom';
import { Toaster } from "@/components/ui/toaster";
import { useToast } from "@/components/ui/use-toast";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import NewsCard from "@/components/NewsCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { motion, AnimatePresence } from 'framer-motion';
import { categories as allCategories } from '@/lib/placeholder-data';
import { fetchNews } from '@/lib/news-api';
import { Sun, Moon, Bookmark, Rss, Info, Gift, ExternalLink, Heart } from 'lucide-react';

const HomePage = ({ setIsDonateModalOpen }) => {
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bookmarkedArticles, setBookmarkedArticles] = useState(() => {
    const saved = localStorage.getItem('bookmarkedArticles');
    return saved ? JSON.parse(saved) : [];
  });
  const [showBookmarks, setShowBookmarks] = useState(false);
  const { categoryName } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const selectedCategory = categoryName ? decodeURIComponent(categoryName) : 'All';

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    const loadNews = async () => {
      setLoading(true);
      try {
        const fetchedArticles = await fetchNews(selectedCategory);
        const categorizedArticles = fetchedArticles.map(article => ({
          ...article,
          category: article.category || 'General' // fallback to 'General' if no category
        }));
        setArticles(categorizedArticles);
      } catch (error) {
        toast({
          title: "Error fetching news",
          description: "Could not load articles. Please try again later.",
          variant: "destructive",
        });
        setArticles([]); 
      } finally {
        setLoading(false);
      }
    };

    loadNews();
    
    const intervalId = setInterval(loadNews, 24 * 60 * 60 * 1000); 
    return () => clearInterval(intervalId);

  }, [selectedCategory, toast]);

  useEffect(() => {
    localStorage.setItem('bookmarkedArticles', JSON.stringify(bookmarkedArticles));
  }, [bookmarkedArticles]);

  const handleUnsupportedFeature = () => {
    toast({
      title: "🚧 Feature in Progress!",
      description: "This feature isn't implemented yet—but don't worry! You can request it in your next prompt! 🚀",
    });
  };

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  const toggleBookmark = (articleId) => {
    setBookmarkedArticles(prev => {
      const newBookmarkedArticles = prev.includes(articleId)
        ? prev.filter(id => id !== articleId)
        : [...prev, articleId];
      
      const articleTitle = articles.find(a => a.id === articleId)?.title || "Story";
      toast({ 
        title: prev.includes(articleId) ? "Bookmark Removed" : "Bookmarked!",
        description: prev.includes(articleId) ? `${articleTitle} removed from your bookmarks.` : `${articleTitle} saved to your bookmarks.`
      });
      return newBookmarkedArticles;
    });
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.07 } },
  };

  const getFilteredArticles = () => {
    if (showBookmarks) {
      return articles.filter(a => bookmarkedArticles.includes(a.id));
    }
    if (selectedCategory !== 'All') {
        return articles.filter(a => a.category === selectedCategory);
    }
    return articles;
  };

  const displayedArticles = getFilteredArticles();
  
  const handleCategorySelect = (category) => {
    setShowBookmarks(false);
    if (category === 'All') {
      navigate('/');
    } else {
      navigate(`/category/${encodeURIComponent(category)}`);
    }
  }
  
  const currentPath = window.location.pathname;
  useEffect(() => {
    if (currentPath === '/bookmarks') {
      setShowBookmarks(true);
    } else {
      const pathCategory = currentPath.startsWith('/category/') ? decodeURIComponent(currentPath.split('/category/')[1]) : 'All';
      if(pathCategory !== selectedCategory) {
         navigate(pathCategory === 'All' ? '/' : `/category/${pathCategory}`, { replace: true });
      }
      setShowBookmarks(false);
    }
  }, [currentPath, selectedCategory, navigate]);

  return (
    <div className="flex flex-col min-h-screen bg-secondary/30 dark:bg-background font-sans antialiased">
      <Header setIsDonateModalOpen={setIsDonateModalOpen} />
      <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="font-bold text-lg mb-3 text-foreground/80">Browse Categories</h2>
          <div className="flex overflow-x-auto space-x-3 pb-2 -mx-1 px-1">
            {allCategories.map(category => (
              <Button 
                key={category} 
                variant={selectedCategory === category && !showBookmarks ? "default" : "outline"}
                onClick={() => handleCategorySelect(category)} 
                className="shrink-0"
              >
                {category}
              </Button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <aside className="lg:col-span-3 lg:sticky top-24 self-start">
            <div className="space-y-6">
               <div>
                <h2 className="font-bold text-lg mb-4 text-foreground/80">My Feed</h2>
                 <div className="space-y-2">
                    <button 
                      onClick={() => { setShowBookmarks(true); navigate('/bookmarks'); }} 
                      className={`w-full text-left p-2 rounded-md flex items-center text-sm font-medium transition-colors ${showBookmarks ? 'bg-primary/20 text-primary' : 'hover:bg-muted'}`}>
                      <Bookmark className="h-4 w-4 mr-2" /> Bookmarks ({bookmarkedArticles.length})
                    </button>
                 </div>
              </div>
            </div>
          </aside>

          <div className="lg:col-span-6">
            <div className="flex justify-between items-center mb-8">
              <h1 className="text-3xl md:text-4xl font-bold text-foreground tracking-tighter">
                {showBookmarks ? "Your Bookmarks" : selectedCategory}
              </h1>
              <button onClick={toggleTheme} className="p-2 rounded-full bg-card text-foreground hover:bg-muted transition-colors" aria-label="Toggle theme">
                <AnimatePresence mode="wait" initial={false}>
                  <motion.div key={theme} initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }} transition={{ duration: 0.2 }}>
                    {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
                  </motion.div>
                </AnimatePresence>
              </button>
            </div>
            <AnimatePresence>
              {loading ? (
                 <motion.div className="space-y-8">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="bg-card p-4 rounded-lg shadow-sm h-48 animate-pulse flex gap-4">
                            <div className="w-1/3 bg-muted rounded-md"></div>
                            <div className="w-2/3 space-y-3">
                                <div className="h-4 bg-muted rounded w-1/4"></div>
                                <div className="h-6 bg-muted rounded w-3/4"></div>
                                <div className="h-4 bg-muted rounded w-full"></div>
                                <div className="h-4 bg-muted rounded w-5/6"></div>
                            </div>
                        </div>
                    ))}
                </motion.div>
              ) : (
                <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-8">
                  {displayedArticles.length > 0 ? displayedArticles.map((article) => (
                    <NewsCard 
                      key={article.id} 
                      article={article} 
                      isBookmarked={bookmarkedArticles.includes(article.id)}
                      onBookmarkToggle={() => toggleBookmark(article.id)}
                    />
                  )) : (
                    <div className="text-center py-16">
                      <p className="text-muted-foreground">
                        {showBookmarks ? "You haven't bookmarked any stories yet." : "No stories found in this category."}
                      </p>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <aside className="hidden lg:block lg:col-span-3 lg:sticky top-24 self-start">
             <div className="space-y-6">
                 <div className="bg-card p-6 rounded-lg shadow-sm border">
                    <h3 className="font-bold text-lg mb-3 flex items-center"><Rss className="h-5 w-5 mr-2 text-primary"/> Weekly Digest</h3>
                    <p className="text-sm text-muted-foreground mb-4">Get the best stories delivered to your inbox every Friday.</p>
                    <form className="space-y-3" onSubmit={(e) => {e.preventDefault(); handleUnsupportedFeature()}}>
                      <Input type="email" placeholder="your.email@example.com" required/>
                      <Button type="submit" className="w-full bg-accent hover:bg-accent/90">Subscribe</Button>
                    </form>
                </div>
             </div>
          </aside>
        </div>
      </main>
      <Footer setIsDonateModalOpen={setIsDonateModalOpen} />
      <Toaster />
    </div>
  );
};

const App = () => {
  const [isDonateModalOpen, setIsDonateModalOpen] = useState(false);
  
  const openLink = (url) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  const donationPlatforms = [
    { name: "GoFundMe", url: "https://www.gofundme.com", description: "Popular crowdfunding platform for personal causes and charities." },
    { name: "GlobalGiving", url: "https://www.globalgiving.org", description: "Connects nonprofits, donors, and companies in nearly every country." },
    { name: "CrowdSpace (Example)", url: "https://example.com/crowdspace", description: "Platform for community-focused projects (replace with actual if exists)." },
    { name: "Indiegogo", url: "https://www.indiegogo.com", description: "Platform for entrepreneurial ideas, creative works, and community projects." },
  ];

  const BookmarksPageWrapper = () => <HomePage setIsDonateModalOpen={setIsDonateModalOpen} />;
  const MainHomePageWrapper = () => <HomePage setIsDonateModalOpen={setIsDonateModalOpen} />;

  return (
    <>
      <Routes>
        <Route path="/" element={<MainHomePageWrapper />} />
        <Route path="/category/:categoryName" element={<MainHomePageWrapper />} />
        <Route path="/bookmarks" element={<BookmarksPageWrapper />} />
      </Routes>
      <Dialog open={isDonateModalOpen} onOpenChange={setIsDonateModalOpen}>
          <DialogContent className="sm:max-w-[525px]">
              <DialogHeader>
                  <DialogTitle className="flex items-center"><Gift className="h-5 w-5 mr-2 text-red-500"/>Support Our Mission</DialogTitle>
                  <DialogDescription>
                      Your generous donations help us continue finding and sharing positive news from around the world. Choose a platform below to contribute:
                  </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                  {donationPlatforms.map(platform => (
                       <Button variant="outline" key={platform.name} onClick={() => openLink(platform.url)} className="justify-between h-auto py-3">
                          <div className="flex-grow text-left">
                              <p className="font-semibold">{platform.name}</p>
                              <p className="text-xs text-muted-foreground">{platform.description}</p>
                           </div>
                           <ExternalLink className="h-4 w-4 text-muted-foreground ml-2 shrink-0"/>
                       </Button>
                  ))}
              </div>
              <DialogFooter>
                  <DialogClose asChild>
                      <Button type="button" variant="secondary">Close</Button>
                  </DialogClose>
              </DialogFooter>
          </DialogContent>
      </Dialog>
    </>
  );
};

export default App;