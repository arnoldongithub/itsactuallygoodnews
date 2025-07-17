import React from 'react';
import { Search, Gift, Heart, ShoppingCart, Sun, Moon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from "@/components/ui/use-toast";
import Logo from '@/components/Logo';
import { Link, useLocation, useNavigate } from 'react-router-dom';

const categories = [
  'All',
  'Health',
  'Innovation & Tech',
  'Environment & Sustainability',
  'Education',
  'Science & Space',
  'Humanitarian & Rescue'
];

const Header = ({ isDarkMode, setIsDarkMode, setIsDonateModalOpen }) => {
  const { toast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();
  const currentCategory = new URLSearchParams(location.search).get('cat') || 'All';

  const handleCategoryClick = (cat) => {
    navigate(`/?cat=${encodeURIComponent(cat)}`);
  };

  const handleUnsupportedFeature = () => {
    toast({
      title: "🚧 Feature in Progress!",
      description: "This feature isn't implemented yet—but don't worry! You can request it in your next prompt! 🚀",
      variant: "default",
    });
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-header dark:bg-black/80 backdrop-blur-sm supports-[backdrop-filter]:bg-header/80">
      <div className="container mx-auto px-4">
        {/* First row: Logo, Search, and Action buttons */}
        <div className="flex items-center justify-between py-3">
          {/* Logo and Brand */}
          <div className="flex items-center flex-shrink-0">
            <Link to="/">
              <Logo />
            </Link>
          </div>

          {/* Search and Action buttons */}
          <div className="flex items-center space-x-4">
            {/* Search */}
            <div className="hidden md:block relative">
              <Input
                type="search"
                placeholder="Search stories..."
                className="pl-10 w-64 bg-background/50 text-foreground placeholder:text-muted-foreground"
                onFocus={handleUnsupportedFeature}
              />
              <div className="absolute inset-y-0 left-0 flex items-center pl-3">
                <Search className="h-5 w-5 text-muted-foreground" />
              </div>
            </div>

            {/* Action buttons group */}
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsDarkMode(!isDarkMode)}
                aria-label="Toggle theme"
                className="bg-background/20 backdrop-blur-sm"
              >
                {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </Button>

              <Button
                variant="default"
                size="sm"
                onClick={() => setIsDonateModalOpen(true)}
                className="flex items-center bg-accent hover:bg-accent/90"
              >
                <Heart className="h-4 w-4 mr-1 text-pink-500" />
                <span className="text-xs sm:text-sm">Donate</span>
              </Button>

              <Button
                variant="default"
                size="sm"
                onClick={handleUnsupportedFeature}
                className="flex items-center bg-accent hover:bg-accent/90"
              >
                <Gift className="h-4 w-4 mr-1 text-red-500" />
                <span className="text-xs sm:text-sm">Member</span>
              </Button>

              <Button
                variant="default"
                size="sm"
                onClick={handleUnsupportedFeature}
                className="flex items-center bg-accent hover:bg-accent/90"
              >
                <ShoppingCart className="h-4 w-4 mr-1 text-blue-500" />
                <span className="text-xs sm:text-sm">Shop</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Second row: Categories carousel */}
        <div className="border-t border-border/40 py-2">
          <nav className="overflow-x-auto scrollbar-hide">
            <div className="flex space-x-2 min-w-max">
              {categories.map(cat => {
                const active = cat === currentCategory;
                return (
                  <button
                    key={cat}
                    onClick={() => handleCategoryClick(cat)}
                    className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200
                      ${active 
                        ? 'bg-accent text-white shadow-sm' 
                        : 'bg-background/50 dark:bg-white/10 text-foreground dark:text-muted-foreground hover:bg-accent/20'
                      }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;
