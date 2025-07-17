import React from 'react';

const InlineAd = ({ 
  title = "Discover Amazing Products", 
  description = "Find what you need", 
  imageUrl = null,
  clickUrl = "#",
  className = "" 
}) => {
  // Sample ad data - in production, this would come from your ad network
  const sampleAds = [
    {
      title: "Eco-Friendly Products",
      description: "Sustainable living made simple",
      imageUrl: "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=50&h=50&fit=crop",
      clickUrl: "#eco-products"
    },
    {
      title: "Online Learning",
      description: "Expand your knowledge today",
      imageUrl: "https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=50&h=50&fit=crop",
      clickUrl: "#learn-online"
    },
    {
      title: "Health & Wellness",
      description: "Your wellbeing matters",
      imageUrl: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=50&h=50&fit=crop",
      clickUrl: "#health-wellness"
    },
    {
      title: "Good News Network",
      description: "Support positive journalism",
      imageUrl: "https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=50&h=50&fit=crop",
      clickUrl: "#support-journalism"
    },
    {
      title: "Community Impact",
      description: "Make a difference locally",
      imageUrl: "https://images.unsplash.com/photo-1559027615-cd4628902d4a?w=50&h=50&fit=crop",
      clickUrl: "#community-impact"
    }
  ];

  // Randomly select an ad or use provided props
  const selectedAd = title === "Discover Amazing Products" 
    ? sampleAds[Math.floor(Math.random() * sampleAds.length)]
    : { title, description, imageUrl, clickUrl };

  const handleClick = (e) => {
    e.preventDefault();
    // Track ad click analytics here
    console.log('Ad clicked:', selectedAd.title);
    if (selectedAd.clickUrl !== '#') {
      window.open(selectedAd.clickUrl, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className={`inline-ad inline-ad-enter ${className}`}>
      <a 
        href={selectedAd.clickUrl}
        onClick={handleClick}
        className="flex items-center w-full no-underline"
      >
        <div className="inline-ad-content">
          <div className="inline-ad-title">
            {selectedAd.title}
          </div>
          <div className="inline-ad-description">
            {selectedAd.description}
          </div>
        </div>
        
        <div className="inline-ad-image relative">
          {selectedAd.imageUrl ? (
            <img 
              src={selectedAd.imageUrl} 
              alt={selectedAd.title}
              className="rounded"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-blue-400 to-blue-600 rounded flex items-center justify-center">
              <span className="text-white text-xs font-bold">AD</span>
            </div>
          )}
          <div className="inline-ad-badge">
            sponsored
          </div>
        </div>
      </a>
    </div>
  );
};

export default InlineAd;
