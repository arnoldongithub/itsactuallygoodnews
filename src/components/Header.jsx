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

const Header = ({ isDarkMode, setIsDarkMode, setIsDonateModalOpen, streak }) => {
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
      description: "This feature isn't implemented yet—but don't worry!",
      variant: "default",
    });
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-header dark:bg-black/80 backdrop-blur-sm supports-[backdrop-filter]:bg-header/80">
      <div className="header-container">
        <div className="header-main">
          
          {/* Mobile & Desktop: Top row - Logo, Search, Theme */}
          <div className="header-top-row">
            {/* Logo Section */}
            <div className="header-logo-section">
              <Link to="/" className="header-logo">
                <Logo />
              </Link>
              <h1 className="header-title hidden sm:block">ItsActuallyGoodNews</h1>
            </div>

            {/* Search (Desktop) */}
            <div className="header-search hidden lg:block">
              <div className="relative">
                <Input
                  type="search"
                  placeholder="Search stories..."
                  className="pl-10 bg-background/50 text-foreground placeholder:text-muted-foreground"
                  onFocus={handleUnsupportedFeature}
                />
                <div className="absolute inset-y-0 left-0 flex items-center pl-3">
                  <Search className="h-5 w-5 text-muted-foreground" />
                </div>
              </div>
            </div>

            {/* Desktop: Right section with actions and theme */}
            <div className="header-right-section hidden lg:flex">
              <div className="header-action-buttons">
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => setIsDonateModalOpen(true)}
                  className="header-action-button bg-accent hover:bg-accent/90"
                >
                  <Heart className="h-4 w-4 mr-1 text-pink-500" />
                  <span>Donate</span>
                </Button>

                <Button
                  variant="default"
                  size="sm"
                  onClick={handleUnsupportedFeature}
                  className="header-action-button bg-accent hover:bg-accent/90"
                >
                  <Gift className="h-4 w-4 mr-1 text-red-500" />
                  <span>Member</span>
                </Button>

                <Button
                  variant="default"
                  size="sm"
                  onClick={handleUnsupportedFeature}
                  className="header-action-button bg-accent hover:bg-accent/90"
                >
                  <ShoppingCart className="h-4 w-4 mr-1 text-blue-500" />
                  <span>Shop</span>
                </Button>
              </div>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsDarkMode(!isDarkMode)}
                aria-label="Toggle theme"
                className="header-theme-toggle bg-background/20 backdrop-blur-sm"
              >
                {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </Button>
            </div>

            {/* Mobile: Search and Theme only */}
            <div className="flex items-center space-x-2 lg:hidden">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleUnsupportedFeature}
                aria-label="Search"
                className="header-search bg-background/20 backdrop-blur-sm"
              >
                <Search className="h-5 w-5" />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsDarkMode(!isDarkMode)}
                aria-label="Toggle theme"
                className="header-theme-toggle bg-background/20 backdrop-blur-sm"
              >
                {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </Button>
            </div>
          </div>

          {/* Mobile: Action buttons row with streak */}
          <div className="header-action-row lg:hidden">
            <div className="header-action-buttons">
              <Button
                variant="default"
                size="sm"
                onClick={() => setIsDonateModalOpen(true)}
                className="header-action-button bg-accent hover:bg-accent/90"
              >
                <Heart className="h-4 w-4 mr-1 text-pink-500" />
                <span>Donate</span>
              </Button>

              <Button
                variant="default"
                size="sm"
                onClick={handleUnsupportedFeature}
                className="header-action-button bg-accent hover:bg-accent/90"
              >
                <Gift className="h-4 w-4 mr-1 text-red-500" />
                <span>Member</span>
              </Button>

              <Button
                variant="default"
                size="sm"
                onClick={handleUnsupportedFeature}
                className="header-action-button bg-accent hover:bg-accent/90"
              >
                <ShoppingCart className="h-4 w-4 mr-1 text-blue-500" />
                <span>Shop</span>
              </Button>
            </div>

            {/* Mobile Streak Indicator */}
            {streak > 0 && (
              <div className="header-streak-mobile">
                <span className="streak-icon">🔥</span>
                <span className="streak-number">{streak}</span>
              </div>
            )}
          </div>

          {/* Categories Section */}
          <div className="header-categories-section">
            <div className="header-categories-row">
              <nav className="header-categories">
                {categories.map(cat => {
                  const active = cat === currentCategory;
                  return (
                    <button
                      key={cat}
                      onClick={() => handleCategoryClick(cat)}
                      className={`header-category-button transition-all duration-200
                        ${active 
                          ? 'bg-accent text-white shadow-sm' 
                          : 'bg-background/50 dark:bg-white/10 text-foreground dark:text-muted-foreground hover:bg-accent/20'
                        }`}
                    >
                      {cat}
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Desktop: Streak indicator below categories */}
            <div className="header-streak-desktop hidden lg:block">
              {streak > 0 && (
                <div className="header-streak-indicator">
                  <span className="streak-icon">🔥</span>
                  <span className="streak-number">{streak}</span>
                  <span className="streak-text">day streak</span>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </header>
  );
};

export default Header;
