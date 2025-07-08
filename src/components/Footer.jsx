import React, { useState } from 'react';
import { Instagram, MessageCircle, Info, Heart, ShoppingBag, ExternalLink, Gift } from 'lucide-react';
import { useToast } from "@/components/ui/use-toast";
import Logo from '@/components/Logo';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const Footer = () => {
    const { toast } = useToast();
    const [isDonateModalOpen, setIsDonateModalOpen] = useState(false);

    const handleUnsupportedFeature = (e) => {
        e.preventDefault();
        toast({
            title: "🚧 Feature in Progress!",
            description: "This feature isn't implemented yet—but don't worry! You can request it in your next prompt! 🚀",
        });
    };

    const openLink = (url) => {
      window.open(url, '_blank', 'noopener,noreferrer');
    }

    const donationPlatforms = [
      { name: "GoFundMe", url: "https://www.gofundme.com", description: "Popular crowdfunding platform for personal causes and charities." },
      { name: "GlobalGiving", url: "https://www.globalgiving.org", description: "Connects nonprofits, donors, and companies in nearly every country." },
      { name: "CrowdSpace (Example)", url: "https://example.com/crowdspace", description: "Platform for community-focused projects (replace with actual if exists)." },
      { name: "Indiegogo", url: "https://www.indiegogo.com", description: "Platform for entrepreneurial ideas, creative works, and community projects." },
    ];

    return (
        <footer className="bg-card border-t">
            <div className="container mx-auto py-12 px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
                    <div>
                        <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-4">Support Us</h3>
                        <ul className="space-y-2">
                            <li><a href="https://www.patreon.com" target="_blank" rel="noopener noreferrer" className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center"><Heart className="h-4 w-4 mr-2 text-pink-500"/>Become a Member</a></li>
                            <li><a href="https://www.shopify.com" target="_blank" rel="noopener noreferrer" className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center"><ShoppingBag className="h-4 w-4 mr-2 text-green-500"/>Merch Store</a></li>
                            <li><button onClick={() => setIsDonateModalOpen(true)} className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center"><Gift className="h-4 w-4 mr-2 text-red-500"/>Donate</button></li>
                        </ul>
                    </div>
                    <div>
                        <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-4">Navigate</h3>
                        <ul className="space-y-2">
                            <li><a href="#" onClick={handleUnsupportedFeature} className="text-sm text-muted-foreground hover:text-primary transition-colors">Contact Us</a></li>
                            <li><a href="#" onClick={handleUnsupportedFeature} className="text-sm text-muted-foreground hover:text-primary transition-colors">Privacy Policy</a></li>
                            <li><a href="#" onClick={handleUnsupportedFeature} className="text-sm text-muted-foreground hover:text-primary transition-colors">Terms of Service</a></li>
                        </ul>
                    </div>
                    <div className="lg:col-span-2">
                        <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-4 flex items-center"><Info className="h-4 w-4 mr-2 text-primary"/>Our Mission</h3>
                        <p className="text-sm text-muted-foreground">
                            To fight news fatigue by focusing exclusively on positive, solutions-oriented journalism. We believe in the power of good news to inspire action and create a better world. We aim to highlight progress, innovation, and kindness.
                        </p>
                    </div>
                </div>

                <div className="mt-8 pt-8 border-t border-border/40 flex flex-col sm:flex-row justify-between items-center">
                    <div className="flex justify-center md:justify-start mb-4 sm:mb-0">
                       <Logo />
                    </div>
                    <div className="flex space-x-4 mb-4 sm:mb-0">
                        <a href="https://x.com" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary" aria-label="X page">
                            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"></path></svg>
                        </a>
                         <a href="https://whatsapp.com" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary" aria-label="WhatsApp">
                            <MessageCircle className="h-5 w-5" />
                        </a>
                        <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary" aria-label="LinkedIn page">
                            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path fillRule="evenodd" d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" clipRule="evenodd"></path></svg>
                        </a>
                        <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary" aria-label="Instagram page">
                            <Instagram className="h-5 w-5" />
                        </a>
                    </div>
                    <p className="text-sm text-muted-foreground text-center sm:text-right">&copy; {new Date().getFullYear()} ItsActuallyGoodNews. All rights reserved.</p>
                </div>
            </div>
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
        </footer>
    );
};

export default Footer;
