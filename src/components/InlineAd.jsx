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
    <div className={`w-full my-4 ${className}`}>
      <a 
        href={selectedAd.clickUrl}
        onClick={handleClick}
        className="block w-full no-underline"
      >
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-4 hover:shadow-md transition-all duration-300 w-full">
          <div className="flex items-center justify-between w-full">
            <div className="flex-1 pr-4">
              <div className="font-medium text-sm text-gray-700 dark:text-gray-300 mb-1">
                {selectedAd.title}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {selectedAd.description}
              </div>
            </div>
            
            <div className="relative flex-shrink-0">
              {selectedAd.imageUrl ? (
                <img 
                  src={selectedAd.imageUrl} 
                  alt={selectedAd.title}
                  className="w-12 h-12 object-cover rounded"
                />
              ) : (
                <div 
                  className="w-12 h-12 rounded flex items-center justify-center text-white text-xs font-bold"
                  style={{ backgroundColor: 'hsl(var(--orange-accent))' }}
                >
                  AD
                </div>
              )}
              <div className="absolute -top-1 -right-1 bg-gray-400 text-white text-xs px-1 py-0.5 rounded opacity-60 font-medium">
                sponsored
              </div>
            </div>
          </div>
        </div>
      </a>
    </div>
  );
};

export default InlineAd;
