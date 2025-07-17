import React from 'react';
import { Search, Gift, Heart, ShoppingCart, Sun, Moon } from 'lucide-react';
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

// Custom Button component to replace the missing UI Button
const Button = ({ variant = 'default', size = 'default', className = '', onClick, children, ...props }) => {
  const baseClasses = 'inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none';
  
  const variantClasses = {
    default: 'bg-primary text-primary-foreground hover:bg-primary/90',
    ghost: 'hover:bg-accent hover:text-accent-foreground',
    outline: 'border border-input hover:bg-accent hover:text-accent-foreground'
  };
  
  const sizeClasses = {
    default: 'h-10 py-2 px-4',
    sm: 'h-9 px-3 text-sm',
    icon: 'h-10 w-10'
  };
  
  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  );
};

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
      <div className="container mx-auto flex flex-col sm:flex-row items-center py-2 px-4 sm:py-0">
        <div className="flex items-center flex-shrink-0 mr-4">
          <Link to="/">
            <Logo />
          </Link>
        </div>

        <div className="mt-2 sm:mt-0 flex-1 flex flex-col sm:flex-row items-center justify-between space-y-2 sm:space-y-0 sm:space-x-4">
          <div className="hidden md:block relative w-full sm:w-auto sm:max-w-xs">
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

          <nav className="overflow-x-auto whitespace-nowrap py-1">
            {categories.map(cat => {
              const active = cat === currentCategory;
              return (
                <button
                  key={cat}
                  onClick={() => handleCategoryClick(cat)}
                  className={`inline-block mx-1 px-3 py-1 rounded-full text-sm font-medium 
                    ${active ? 'bg-accent text-white' : 'bg-background/50 dark:bg-white/10 text-foreground dark:text-muted-foreground'} 
                    hover:opacity-90 transition`}
                >
                  {cat}
                </button>
              );
            })}
          </nav>

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
    </header>
  );
};

export default Header;
