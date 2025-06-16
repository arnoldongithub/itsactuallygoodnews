import React from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Bookmark, Linkedin, MessageCircle } from 'lucide-react';
import { useToast } from "@/components/ui/use-toast";

const NewsCard = ({ article, isBookmarked, onBookmarkToggle }) => {
  const { toast } = useToast();
  const { category, title, summary, source, coverage, imageUrl } = article;

  const handleShare = (platform) => {
    const shareUrl = encodeURIComponent(source.url);
    const shareText = encodeURIComponent(title);
    let url = '';
    switch(platform) {
        case 'x':
            url = `https://x.com/intent/tweet?url=${shareUrl}&text=${shareText}`;
            break;
        case 'whatsapp':
            url = `https://api.whatsapp.com/send?text=${shareText}%20${shareUrl}`;
            break;
        case 'linkedin':
            url = `https://www.linkedin.com/shareArticle?mini=true&url=${shareUrl}&title=${shareText}`;
            break;
        default:
            toast({
              title: "🚧 Feature in Progress!",
              description: "This sharing option isn't implemented yet! 🚀",
            });
            return;
    }
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const cardVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 100 } },
  };

  return (
    <motion.div variants={cardVariants}>
       <Card className="h-full flex flex-col md:flex-row overflow-hidden bg-card shadow-sm hover:shadow-lg transition-shadow duration-300 border-border/60">
        <div className="md:w-1/3 h-48 md:h-auto">
            <img  alt={title} className="h-full w-full object-cover" src={imageUrl} src="https://images.unsplash.com/photo-1657097100900-a218a5178242" />
        </div>
        <div className="md:w-2/3 flex flex-col p-6">
            <p className="text-sm font-semibold text-primary mb-1">{category}</p>
            <h3 className="text-xl font-bold leading-snug mb-2 hover:text-primary transition-colors"><a href={source.url} target="_blank" rel="noopener noreferrer">{title}</a></h3>
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
                  {coverage && coverage.length > 3 && <div className="text-xs text-muted-foreground">+{coverage.length-3}</div>}
              </div>

              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" onClick={onBookmarkToggle} aria-label="Bookmark">
                  <Bookmark className={`h-5 w-5 transition-all ${isBookmarked ? 'fill-accent text-accent' : 'text-muted-foreground'}`} />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => handleShare('x')} aria-label="Share on X">
                  <svg className="h-4 w-4 text-muted-foreground" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"></path></svg>
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
      </Card>
    </motion.div>
  );
};

export default NewsCard;