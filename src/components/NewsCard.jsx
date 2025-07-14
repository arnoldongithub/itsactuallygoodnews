import React from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Bookmark, Linkedin, MessageCircle } from 'lucide-react';
import { useToast } from "@/components/ui/use-toast";

const NewsCard = ({ article, isBookmarked, onBookmarkToggle }) => {
  const { toast } = useToast();
  const {
    category,
    title,
    summary,
    source,
    coverage,
    image_url,
    thumbnail_url,
    url,
    is_ad,
    ad_image_url,
    ad_link_url
  } = article;

  const handleShare = (platform) => {
    const shareUrl = encodeURIComponent(url);
    const shareText = encodeURIComponent(title);
    let urlToOpen = '';

    switch (platform) {
      case 'instagram':
        urlToOpen = `https://www.instagram.com/?url=${shareUrl}`;
        break;
      case 'whatsapp':
        urlToOpen = `https://api.whatsapp.com/send?text=${shareText}%20${shareUrl}`;
        break;
      case 'linkedin':
        urlToOpen = `https://www.linkedin.com/shareArticle?mini=true&url=${shareUrl}&title=${shareText}`;
        break;
      default:
        toast({
          title: "🚧 Feature in Progress!",
          description: "This sharing option isn't implemented yet! 🚀",
        });
        return;
    }

    window.open(urlToOpen, '_blank', 'noopener,noreferrer');
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="h-full flex flex-col overflow-hidden bg-card shadow-sm hover:shadow-lg transition-shadow duration-300 border-border/60">
        {is_ad ? (
          <a href={ad_link_url || "#"} target="_blank" rel="noopener noreferrer">
            <img
              src={ad_image_url || "https://via.placeholder.com/728x90.png?text=Ad"}
              alt="Sponsored"
              className="w-full object-cover h-48 sm:h-60 md:h-72"
            />
            <div className="p-4 text-center">
              <p className="text-sm text-muted-foreground">Sponsored Content</p>
            </div>
          </a>
        ) : (
          <div className="md:flex">
            <div className="md:w-1/3 h-48 md:h-auto">
              <img
                alt={title}
                className="h-full w-full object-cover"
                src={
                  thumbnail_url || image_url || "https://images.unsplash.com/photo-1657097100900-a218a5178242"
                }
              />
            </div>
            <div className="md:w-2/3 flex flex-col p-6">
              <p className="text-sm font-semibold text-primary mb-1">{category}</p>
              <h3 className="text-xl font-bold leading-snug mb-2 hover:text-primary transition-colors">
                <a href={url} target="_blank" rel="noopener noreferrer">{title}</a>
              </h3>
              <p className="text-muted-foreground text-sm flex-grow mb-4">{summary}</p>

              <div className="flex items-center justify-between mt-auto">
                <div className="flex items-center gap-2">
                  <p className="text-xs font-semibold text-foreground/80 mr-2">Coverage:</p>
                  {coverage && coverage.slice(0, 3).map((src, index) => (
                    <Avatar key={index} className="h-6 w-6 border-2 border-background">
                      <AvatarImage src={`https://logo.clearbit.com/${src.domain}`} alt={src.name} />
                      <AvatarFallback>{src.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                  ))}
                  {coverage && coverage.length > 3 && (
                    <div className="text-xs text-muted-foreground">+{coverage.length - 3}</div>
                  )}
                </div>

                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" onClick={onBookmarkToggle} aria-label="Bookmark">
                    <Bookmark className={`h-5 w-5 transition-all ${isBookmarked ? 'fill-accent text-accent' : 'text-muted-foreground'}`} />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleShare('instagram')} aria-label="Share on Instagram">
                    <svg className="h-4 w-4 text-muted-foreground" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M7 2C4.243 2 2 4.243 2 7v10c0 2.757 2.243 5 5 5h10c2.757 0 5-2.243 5-5V7c0-2.757-2.243-5-5-5H7zm10 2c1.654 0 3 1.346 3 3v10c0 1.654-1.346 3-3 3H7c-1.654 0-3-1.346-3-3V7c0-1.654 1.346-3 3-3h10zM12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10zm0 2a3 3 0 1 1 0 6 3 3 0 0 1 0-6zm4.5-2a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3z"/>
                    </svg>
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleShare('whatsapp')} aria-label="Share on WhatsApp">
                    <MessageCircle className="h-5 w-5 text-muted-foreground" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleShare('linkedin')} aria-label="Share on LinkedIn">
                    <Linkedin className="h-5 w-5 text-muted-foreground" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </Card>
    </motion.div>
  );
};

export default NewsCard;

