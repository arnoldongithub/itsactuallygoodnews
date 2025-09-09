// File: src/components/SubscribeModal.jsx
import React, { useState, useEffect } from 'react';
import { X, Check, Heart, Users, Megaphone } from 'lucide-react';

const SubscribeModal = ({ isOpen, onClose }) => {
  const [paddle, setPaddle] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [paddleLoading, setPaddleLoading] = useState(false);
  const [paddleError, setPaddleError] = useState(null);

  // Environment variables - use process.env for Vite compatibility
  const paddleConfig = {
    environment: process.env.VITE_PADDLE_ENVIRONMENT || 'sandbox',
    token: process.env.VITE_PADDLE_CLIENT_TOKEN || 'test_77ff4b880294c8d3852cdba2ab1',
    supporterPriceId: process.env.VITE_PADDLE_SUPPORTER_PRICE_ID || 'pri_01k4psqzjhaa4k3hyvdvjczd6w',
    allyPriceId: process.env.VITE_PADDLE_ALLY_PRICE_ID || 'pri_01k4psx68hrb5y17rg96n65ajy',
    advocatePriceId: process.env.VITE_PADDLE_ADVOCATE_PRICE_ID || 'pri_01k4pt23r2c6b5hkhpcz1reptt'
  };

  // Initialize Paddle when modal opens
  useEffect(() => {
    if (!isOpen) return;

    const initializePaddle = async () => {
      // Check if Paddle is already loaded
      if (window.Paddle && !paddle) {
        try {
          // Paddle v2 uses Setup() instead of new Paddle()
          window.Paddle.Setup({
            environment: paddleConfig.environment,
            token: paddleConfig.token
          });
          setPaddle(window.Paddle);
          console.log('Paddle initialized from existing script');
          return;
        } catch (error) {
          console.error('Error initializing existing Paddle:', error);
          setPaddleError('Failed to initialize payment system');
        }
      }

      // Load Paddle script dynamically
      if (!window.Paddle && !paddleLoading) {
        setPaddleLoading(true);
        setPaddleError(null);
        
        try {
          const script = document.createElement('script');
          script.src = 'https://cdn.paddle.com/paddle/v2/paddle.js';
          script.async = true;
          
          script.onload = () => {
            try {
              if (window.Paddle) {
                // Paddle v2 uses Setup() instead of new Paddle()
                window.Paddle.Setup({
                  environment: paddleConfig.environment,
                  token: paddleConfig.token
                });
                setPaddle(window.Paddle);
                console.log('Paddle v2 loaded and initialized successfully');
              } else {
                throw new Error('Paddle not available after script load');
              }
            } catch (error) {
              console.error('Error initializing Paddle after load:', error);
              setPaddleError('Payment system initialization failed');
            } finally {
              setPaddleLoading(false);
            }
          };
          
          script.onerror = () => {
            console.error('Failed to load Paddle script');
            setPaddleError('Failed to load payment system');
            setPaddleLoading(false);
          };
          
          document.head.appendChild(script);
          
        } catch (error) {
          console.error('Error creating Paddle script:', error);
          setPaddleError('Failed to setup payment system');
          setPaddleLoading(false);
        }
      }
    };
    
    initializePaddle();
  }, [isOpen, paddleLoading]);

  const TIERS = [
    {
      id: "supporter",
      name: "Supporter",
      price: 3,
      tagline: "Keep the work going",
      description: "Ad-free reading with supporter credits",
      priceId: paddleConfig.supporterPriceId,
      icon: Heart,
      perks: [
        "Comment & react on Patreon posts",
        "Name in closing credits (optional)",
        "Member updates via Patreon feed",
        "Ad-free reading experience"
      ]
    },
    {
      id: "ally",
      name: "Ally",
      price: 7,
      tagline: "Help us dig deeper", 
      description: "Complete positive news analysis and morning intel",
      priceId: paddleConfig.allyPriceId,
      icon: Users,
      perks: [
        "All Supporter perks",
        "Early access to 1 video/week (via Patreon)",
        "Priority topic suggestions",
        "Community chat access (via Patreon)",
        "Weekly insider updates"
      ]
    },
    {
      id: "advocate",
      name: "Advocate",
      price: 15,
      tagline: "Fund investigations",
      description: "Full strategic insights and quarterly analysis",
      priceId: paddleConfig.advocatePriceId,
      icon: Megaphone,
      perks: [
        "All Ally perks",
        "Submit local good-news tips for coverage",
        "Vote on upcoming projects",
        "Quarterly behind-the-scenes mini-brief",
        "Direct line to editors",
        "Exclusive merch discounts + Early access"
      ]
    }
  ];

  const handleSubscribe = async (tier) => {
    if (!paddle || !tier.priceId) {
      console.error('Paddle not initialized or missing price ID');
      setPaddleError('Payment system not ready. Please try again.');
      return;
    }

    setIsLoading(true);
    
    try {
      // Paddle v2 syntax
      paddle.Checkout.open({
        items: [{ priceId: tier.priceId }],
        customData: {
          tier: tier.id,
          source: 'iagn_subscribe_modal'
        },
        successUrl: `${window.location.origin}/?subscription=success&tier=${tier.id}`,
      });
      
      console.log('Paddle checkout opened for tier:', tier.name);
    } catch (error) {
      console.error('Paddle checkout error:', error);
      setPaddleError('Checkout failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGiftMembership = () => {
    window.open('https://www.patreon.com/c/itsActuallyGoodNews', '_blank');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Full Screen Modal - No Scrolling */}
      <div 
        className="w-full h-full flex flex-col"
        style={{ backgroundColor: '#A7E6C4' }}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 z-10 p-2 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors"
        >
          <X size={24} />
        </button>

        {/* Header Section - Compact */}
        <div className="text-center px-8 py-8">
          <div className="flex items-center justify-center mb-4">
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
              <span className="text-xl font-bold" style={{ color: '#A7E6C4' }}>I</span>
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Choose your membership
          </h1>
          <p className="text-lg text-white/90 max-w-xl mx-auto">
            Join thousands getting the positive news that matters
          </p>
        </div>

        {/* Loading/Error States */}
        {paddleLoading && (
          <div className="text-center py-4">
            <p className="text-white/80 text-sm">Loading payment system...</p>
          </div>
        )}
        
        {paddleError && (
          <div className="text-center py-4">
            <p className="text-red-200 text-sm">{paddleError}</p>
            <button 
              onClick={() => {
                setPaddleError(null);
                setPaddleLoading(false);
                // Retry initialization
                if (isOpen) {
                  window.location.reload();
                }
              }}
              className="text-white underline text-sm mt-2"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Main Content - Centered */}
        <div className="flex-1 flex items-center justify-center px-8">
          <div className="w-full max-w-5xl">
            {/* Pricing Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {TIERS.map((tier) => {
                const IconComponent = tier.icon;
                return (
                  <div
                    key={tier.id}
                    className="rounded-2xl p-6 transition-all duration-300 hover:transform hover:scale-105 shadow-lg hover:shadow-xl flex flex-col h-full"
                    style={{ 
                      backgroundColor: '#A69CFF',
                      border: '2px solid rgba(255,255,255,0.2)'
                    }}
                  >
                    {/* Tier Header */}
                    <div className="text-center mb-5">
                      <div className="flex justify-center mb-3">
                        <div className="p-3 rounded-full bg-white/20">
                          <IconComponent size={28} className="text-white" />
                        </div>
                      </div>
                      <h2 className="text-xl font-bold text-white mb-2">
                        {tier.name}
                      </h2>
                      <p className="text-white/80 text-sm mb-3">
                        {tier.description}
                      </p>
                      <div className="mb-3">
                        <span className="text-3xl font-bold text-white">
                          ${tier.price}
                        </span>
                        <span className="text-white/80 text-base">
                          /month
                        </span>
                      </div>
                    </div>

                    {/* Features List - Fixed height for alignment */}
                    <div className="mb-6 flex-1 flex flex-col">
                      <p className="text-white font-semibold mb-3 text-center text-sm">
                        {tier.tagline}
                      </p>
                      <ul className="space-y-2 flex-1">
                        {tier.perks.map((perk, index) => (
                          <li key={index} className="flex items-start text-white text-xs">
                            <Check size={14} className="text-white mr-2 mt-0.5 flex-shrink-0" />
                            <span>{perk}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* CTA Button - All Same Color (Pastel Yellow) */}
                    <button
                      onClick={() => handleSubscribe(tier)}
                      disabled={isLoading || paddleLoading || !paddle}
                      className="w-full py-3 px-4 rounded-xl font-bold text-base transition-all duration-300 hover:transform hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                      style={{
                        backgroundColor: '#FFE8A0',
                        color: '#1F1F1F'
                      }}
                    >
                      {isLoading ? 'Processing...' : 
                       paddleLoading ? 'Loading...' : 
                       !paddle ? 'Payment Loading...' : 
                       'Join Now'}
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Bottom Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={handleGiftMembership}
                className="px-6 py-3 rounded-lg font-semibold transition-all duration-300 hover:transform hover:-translate-y-1"
                style={{ 
                  backgroundColor: '#F99C8B',
                  color: '#FFFFFF'
                }}
              >
                Gift a membership to IAGN
              </button>
              
              <div className="text-center">
                <p className="text-white/80 text-sm">
                  Cancel anytime • Join the community today
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Hook to use the modal
export const useSubscribeModal = () => {
  const [isOpen, setIsOpen] = useState(false);

  const openModal = () => setIsOpen(true);
  const closeModal = () => setIsOpen(false);

  return {
    isOpen,
    openModal,
    closeModal,
    SubscribeModal: (props) => <SubscribeModal {...props} isOpen={isOpen} onClose={closeModal} />
  };
};

export default SubscribeModal;
