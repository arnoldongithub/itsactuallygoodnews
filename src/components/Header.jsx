import React from 'react';
import { Search, Gift, Heart, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from "@/components/ui/use-toast";
import Logo from '@/components/Logo';
import { Link } from 'react-router-dom';

const Header = ({ setIsDonateModalOpen }) => {
  const { toast } = useToast();

  const handleUnsupportedFeature = () => {
    toast({
      title: "🚧 Feature in Progress!",
      description: "This feature isn't implemented yet—but don't worry! You can request it in your next prompt! 🚀",
      variant: "default",
    });
  };

  const openPatreonLink = () => {
    window.open("https://www.patreon.com", '_blank', 'noopener,noreferrer');
  };

  const openShopifyLink = () => {
    window.open("https://www.shopify.com", '_blank', 'noopener,noreferrer');
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-header dark:bg-black/80 backdrop-blur-sm supports-[backdrop-filter]:bg-header/80">
      <div className="container flex flex-col sm:flex-row h-auto sm:h-20 items-center py-2 sm:py-0">
        <div className="mr-0 sm:mr-2 md:mr-4 flex items-center self-start sm:self-center">
          <Link to="/">
            <Logo />
          </Link>
        </div>

        <div className="flex-1 w-full sm:w-auto flex flex-col sm:flex-row items-center sm:justify-end mt-2 sm:mt-0 space-y-2 sm:space-y-0 sm:space-x-1 md:space-x-2">
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

          <div className="flex flex-row sm:flex-row w-full sm:w-auto justify-around sm:justify-end space-x-1 md:space-x-2">
            <Button
              variant="default"
              size="sm"
              onClick={openPatreonLink}
              className="flex items-center bg-accent hover:bg-accent/90 w-full sm:w-auto justify-center"
            >
              <Heart className="h-4 w-4 mr-1 md:mr-2 text-pink-500" />
              <span className="text-xs sm:text-sm">Member</span>
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={() => setIsDonateModalOpen(true)}
              className="flex items-center bg-accent hover:bg-accent/90 w-full sm:w-auto justify-center"
            >
              <Gift className="h-4 w-4 mr-1 md:mr-2 text-red-500" />
              <span className="text-xs sm:text-sm">Donate</span>
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={openShopifyLink}
              className="flex items-center bg-accent hover:bg-accent/90 w-full sm:w-auto justify-center"
            >
              <ShoppingCart className="h-4 w-4 mr-1 md:mr-2 text-blue-500" />
              <span className="text-xs sm:text-sm">Shop</span>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;

