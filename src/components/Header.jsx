import React, { useState } from 'react';
import { Search, Gift, Heart, ShoppingCart, Sun, Moon, ExternalLink, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from "@/components/ui/use-toast";
import Logo from '@/components/Logo';
import { Link, useLocation, useNavigate } from 'react-router-dom';

// UPDATED categories (labels preserved for URL; adds AI Watch)
const categories = [
  'All',
  'Movement Tracker + Accountability',
  'Capitalism & Inequality Watch',
  'Justice Lens',
  'Hope in Struggle',
  'AI Watch',
];

const Header = ({ isDarkMode, setIsDarkMode, setIsDonateModalOpen, streak }) => {
  const { toast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [isDonateDropdownOpen, setIsDonateDropdownOpen] = useState(false);

  // Get current category from URL path (/ or /category/:name)
  const getCurrentCategory = () => {
    if (location.pathname === '/') return 'All';
    const match = location.pathname.match(/\/category\/(.+)/);
    if (match) return decodeURIComponent(match[1]);
    return 'All';
  };
  const currentCategory = getCurrentCategory();

  // Build route for a given label (keeps your /category/:name scheme)
  const routeFor = (cat) => (cat === 'All' ? '/' : `/category/${encodeURIComponent(cat)}`);

  const handleCategoryClick = (cat) => {
    navigate(routeFor(cat));
  };

  const handleUnsupportedFeature = () => {
    toast({
      title: "🚧 Feature in Progress!",
      description: "This feature isn't implemented yet—but don't worry!",
      variant: "default",
    });
  };

  const handleDonationPlatform = (platform) => {
    const donationUrls = {
      givesendgo: 'https://www.givesendgo.com',
      gofundme: 'https://www.gofundme.com',
      indiegogo: 'https://www.indiegogo.com',
      paypal: 'https://www.paypal.com',
      kickstarter: 'https://www.kickstarter.com',
    };
    window.open(donationUrls[platform], '_blank');
    setIsDonateDropdownOpen(false);
  };

  const handleMemberClick = () => {
    window.open('https://www.patreon.com/c/itsActuallyGoodNews', '_blank');
  };

  const handleShopClick = () => {
    window.open('https://shopify.com', '_blank');
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-header dark:bg-black/80 backdrop-blur-sm supports-[backdrop-filter]:bg-header/80">
      <div className="w-full max-w-none px-4 py-3">
        {/* Desktop */}
        <div className="hidden lg:flex flex-col space-y-4">
          {/* Top row */}
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center flex-shrink-0 min-w-0">
              <Link to="/" className="w-10 h-10 flex-shrink-0">
                <Logo />
              </Link>
            </div>

            {/* Search */}
            <div className="flex flex-1 max-w-md mx-4">
              <div className="relative w-full">
                <Input
                  type="search"
                  placeholder="Search stories..."
                  className="pl-10 bg-background/50 text-foreground placeholder:text-muted-foreground w-full"
                  onFocus={handleUnsupportedFeature}
                />
                <div className="absolute inset-y-0 left-0 flex items-center pl-3">
                  <Search className="h-5 w-5 text-muted-foreground" />
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center space-x-3">
              <div className="flex space-x-2">
                {/* Donate dropdown */}
                <div className="relative">
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => setIsDonateDropdownOpen(!isDonateDropdownOpen)}
                    className="px-4 py-2 text-sm rounded-lg bg-accent hover:bg-accent/90 flex items-center"
                  >
                    <Heart className="h-4 w-4 mr-1 text-pink-500" />
                    <span>Donate</span>
                    <ChevronDown className="h-3 w-3 ml-1" />
                  </Button>

                  {isDonateDropdownOpen && (
                    <div className="absolute top-full left-0 mt-1 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50">
                      <div className="py-1">
                        <button onClick={() => handleDonationPlatform('givesendgo')} className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center">
                          <ExternalLink className="mr-2 h-4 w-4" />
                          GiveSendGo
                        </button>
                        <button onClick={() => handleDonationPlatform('gofundme')} className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center">
                          <ExternalLink className="mr-2 h-4 w-4" />
                          GoFundMe
                        </button>
                        <button onClick={() => handleDonationPlatform('indiegogo')} className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center">
                          <ExternalLink className="mr-2 h-4 w-4" />
                          Indiegogo
                        </button>
                        <button onClick={() => handleDonationPlatform('paypal')} className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center">
                          <ExternalLink className="mr-2 h-4 w-4" />
                          PayPal
                        </button>
                        <button onClick={() => handleDonationPlatform('kickstarter')} className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center">
                          <ExternalLink className="mr-2 h-4 w-4" />
                          Kickstarter
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <Button
                  variant="default"
                  size="sm"
                  onClick={handleMemberClick}
                  className="px-4 py-2 text-sm rounded-lg bg-accent hover:bg-accent/90"
                >
                  <Gift className="h-4 w-4 mr-1 text-red-500" />
                  <span>Member</span>
                </Button>

                <Button
                  variant="default"
                  size="sm"
                  onClick={handleShopClick}
                  className="px-4 py-2 text-sm rounded-lg bg-accent hover:bg-accent/90"
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
                className="w-8 h-8 bg-background/20 backdrop-blur-sm"
              >
                {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </Button>
            </div>
          </div>

          {/* Categories + Streak */}
          <div className="flex items-center justify-between w-full pt-4">
            <nav className="flex space-x-3 overflow-x-auto scrollbar-none">
              {categories.map(cat => {
                const active = cat === currentCategory;
                return (
                  <button
                    key={cat}
                    onClick={() => handleCategoryClick(cat)}
                    className={`px-4 py-2 text-sm rounded-full whitespace-nowrap flex-shrink-0 transition-all duration-200 ${
                      active
                        ? 'bg-accent text-white shadow-sm'
                        : 'bg-background/50 dark:bg-white/10 text-foreground dark:text-muted-foreground hover:bg-accent/20'
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </nav>

            {streak > 0 && (
              <div className="flex items-center space-x-2 bg-orange-100 dark:bg-orange-900 px-3 py-2 rounded-lg flex-shrink-0">
                <span className="text-orange-500">🔥</span>
                <span className="text-orange-600 font-bold text-lg">{streak}</span>
                <span className="text-orange-700 dark:text-orange-300 text-sm">day streak</span>
              </div>
            )}
          </div>
        </div>

        {/* Mobile */}
        <div className="lg:hidden flex flex-col space-y-4">
          {/* Top row */}
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center flex-shrink-0 min-w-0">
              <Link to="/" className="w-8 h-8 flex-shrink-0">
                <Logo />
              </Link>
            </div>

            <div className="flex items-center space-x-2">
              {isSearchExpanded ? (
                <div className="flex items-center space-x-2 flex-1">
                  <div className="relative flex-1">
                    <Input
                      type="search"
                      placeholder="Search stories..."
                      className="pl-10 bg-background/50 text-foreground placeholder:text-muted-foreground"
                      onFocus={handleUnsupportedFeature}
                      onBlur={() => setIsSearchExpanded(false)}
                      autoFocus
                    />
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3">
                      <Search className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsSearchExpanded(false)}
                    className="w-8 h-8 flex-shrink-0"
                  >
                    ✕
                  </Button>
                </div>
              ) : (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsSearchExpanded(true)}
                    aria-label="Search"
                    className="w-8 h-8 bg-background/20 backdrop-blur-sm flex-shrink-0"
                  >
                    <Search className="h-5 w-5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsDarkMode(!isDarkMode)}
                    aria-label="Toggle theme"
                    className="w-8 h-8 bg-background/20 backdrop-blur-sm flex-shrink-0"
                  >
                    {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Mobile actions */}
          {!isSearchExpanded && (
            <div className="flex items-center justify-between w-full pt-4">
              <div className="flex space-x-3 flex-1">
                {/* Donate */}
                <div className="relative flex-1">
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => setIsDonateDropdownOpen(!isDonateDropdownOpen)}
                    className="px-3 py-1.5 text-sm rounded-lg w-full bg-accent hover:bg-accent/90 flex items-center justify-center"
                  >
                    <Heart className="h-4 w-4 mr-1 text-pink-500" />
                    <span>Donate</span>
                    <ChevronDown className="h-3 w-3 ml-1" />
                  </Button>

                  {isDonateDropdownOpen && (
                    <div className="absolute top-full left-0 mt-1 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50">
                      <div className="py-1">
                        <button onClick={() => handleDonationPlatform('givesendgo')} className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center">
                          <ExternalLink className="mr-2 h-4 w-4" />
                          GiveSendGo
                        </button>
                        <button onClick={() => handleDonationPlatform('gofundme')} className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center">
                          <ExternalLink className="mr-2 h-4 w-4" />
                          GoFundMe
                        </button>
                        <button onClick={() => handleDonationPlatform('indiegogo')} className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center">
                          <ExternalLink className="mr-2 h-4 w-4" />
                          Indiegogo
                        </button>
                        <button onClick={() => handleDonationPlatform('paypal')} className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center">
                          <ExternalLink className="mr-2 h-4 w-4" />
                          PayPal
                        </button>
                        <button onClick={() => handleDonationPlatform('kickstarter')} className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center">
                          <ExternalLink className="mr-2 h-4 w-4" />
                          Kickstarter
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <Button
                  variant="default"
                  size="sm"
                  onClick={handleMemberClick}
                  className="px-3 py-1.5 text-sm rounded-lg flex-1 bg-accent hover:bg-accent/90"
                >
                  <Gift className="h-4 w-4 mr-1 text-red-500" />
                  <span>Member</span>
                </Button>

                <Button
                  variant="default"
                  size="sm"
                  onClick={handleShopClick}
                  className="px-3 py-1.5 text-sm rounded-lg flex-1 bg-accent hover:bg-accent/90"
                >
                  <ShoppingCart className="h-4 w-4 mr-1 text-blue-500" />
                  <span>Shop</span>
                </Button>
              </div>

              {streak > 0 && (
                <div className="flex items-center space-x-1 ml-3 flex-shrink-0 bg-orange-100 dark:bg-orange-900 px-2 py-1 rounded-full">
                  <span className="text-orange-500 text-sm">🔥</span>
                  <span className="text-orange-600 font-bold text-sm">{streak}</span>
                </div>
              )}
            </div>
          )}

          <div className="border-t border-white/30"></div>

          {/* Mobile categories */}
          <div className="flex w-full">
            <nav className="flex space-x-3 overflow-x-auto scrollbar-none w-full pb-1">
              {categories.map(cat => {
                const active = cat === currentCategory;
                return (
                  <button
                    key={cat}
                    onClick={() => handleCategoryClick(cat)}
                    className={`px-4 py-2 text-sm rounded-full whitespace-nowrap flex-shrink-0 transition-all duration-200 ${
                      active
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
        </div>
      </div>
    </header>
  );
};

export default Header;

