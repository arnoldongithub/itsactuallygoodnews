import React, { useState } from 'react';
import { Search, Gift, Heart, ShoppingCart, Sun, Moon, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from "@/components/ui/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
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

  const handleDonationPlatform = (platform) => {
    // Placeholder URLs - replace with actual account URLs when accounts are set up
    const donationUrls = {
      givesendgo: 'https://www.givesendgo.com', // Add your account path when ready
      gofundme: 'https://www.gofundme.com', // Add your account path when ready
      indiegogo: 'https://www.indiegogo.com', // Add your account path when ready
      paypal: 'https://www.paypal.com', // Add your account path when ready
      kickstarter: 'https://www.kickstarter.com', // Add your account path when ready
    };
    
    window.open(donationUrls[platform], '_blank');
  };

  const handleMemberClick = () => {
    window.open('https://www.patreon.com/c/itsActuallyGoodNews', '_blank');
  };

  const handleShopClick = () => {
    // Placeholder - replace with actual Shopify store URL when set up
    window.open('https://shopify.com', '_blank'); // Replace with your actual store URL
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-header dark:bg-black/80 backdrop-blur-sm supports-[backdrop-filter]:bg-header/80">
      <div className="w-full max-w-none px-4 py-3">
        <div className="flex flex-col space-y-4">
          
          {/* Top row - Logo, Search, Theme */}
          <div className="flex items-center justify-between w-full">
            {/* Logo Section */}
            <div className="flex items-center flex-shrink-0 min-w-0">
              <Link to="/" className="w-8 h-8 lg:w-10 lg:h-10 flex-shrink-0">
                <Logo />
              </Link>
            </div>

            {/* Desktop Search - Always visible */}
            <div className="hidden lg:flex flex-1 max-w-md mx-4">
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

            {/* Mobile Search - Expandable */}
            <div className="lg:hidden flex items-center space-x-2">
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

            {/* Desktop Right Section */}
            <div className="hidden lg:flex items-center space-x-3">
              <div className="flex space-x-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="default"
                      size="sm"
                      className="px-4 py-2 text-sm rounded-lg bg-accent hover:bg-accent/90"
                    >
                      <Heart className="h-4 w-4 mr-1 text-pink-500" />
                      <span>Donate</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem onClick={() => handleDonationPlatform('givesendgo')}>
                      <ExternalLink className="mr-2 h-4 w-4" />
                      GiveSendGo
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleDonationPlatform('gofundme')}>
                      <ExternalLink className="mr-2 h-4 w-4" />
                      GoFundMe
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleDonationPlatform('indiegogo')}>
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Indiegogo
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleDonationPlatform('paypal')}>
                      <ExternalLink className="mr-2 h-4 w-4" />
                      PayPal
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleDonationPlatform('kickstarter')}>
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Kickstarter
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

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

          {/* Mobile Action Buttons Row */}
          {!isSearchExpanded && (
            <div className="flex items-center justify-between w-full lg:hidden">
              <div className="flex space-x-2 flex-1">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="default"
                      size="sm"
                      className="px-3 py-1.5 text-sm rounded-lg flex-1 bg-accent hover:bg-accent/90"
                    >
                      <Heart className="h-4 w-4 mr-1 text-pink-500" />
                      <span>Donate</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-48">
                    <DropdownMenuItem onClick={() => handleDonationPlatform('givesendgo')}>
                      <ExternalLink className="mr-2 h-4 w-4" />
                      GiveSendGo
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleDonationPlatform('gofundme')}>
                      <ExternalLink className="mr-2 h-4 w-4" />
                      GoFundMe
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleDonationPlatform('indiegogo')}>
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Indiegogo
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleDonationPlatform('paypal')}>
                      <ExternalLink className="mr-2 h-4 w-4" />
                      PayPal
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleDonationPlatform('kickstarter')}>
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Kickstarter
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

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

              {/* Mobile Streak Indicator */}
              {streak > 0 && (
                <div className="flex items-center space-x-1 ml-3 flex-shrink-0 bg-orange-100 dark:bg-orange-900 px-2 py-1 rounded-full">
                  <span className="text-orange-500 text-sm">🔥</span>
                  <span className="text-orange-600 font-bold text-sm">{streak}</span>
                </div>
              )}
            </div>
          )}

          {/* Separator Line */}
          <div className="border-t border-white/30"></div>

          {/* Categories Section - Horizontal Scroll */}
          <div className="flex flex-col space-y-3">
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

            {/* Desktop Streak Indicator */}
            <div className="hidden lg:flex justify-end">
              {streak > 0 && (
                <div className="flex items-center space-x-2 bg-orange-100 dark:bg-orange-900 px-3 py-2 rounded-lg">
                  <span className="text-orange-500">🔥</span>
                  <span className="text-orange-600 font-bold text-lg">{streak}</span>
                  <span className="text-orange-700 dark:text-orange-300 text-sm">day streak</span>
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
