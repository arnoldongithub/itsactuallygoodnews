// File: src/components/SubscribeModal.jsx
import React, { useState, useEffect } from 'react';
import { X, Check, Heart, Users, Megaphone } from 'lucide-react';

const SubscribeModal = ({ isOpen, onClose }) => {
  const [paddle, setPaddle] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Environment variables - use process.env for Vite compatibility
  const paddleConfig = {
    environment: process.env.VITE_PADDLE_ENVIRONMENT || 'sandbox',
    token: process.env.VITE_PADDLE_CLIENT_TOKEN || 'test_77ff4b880294c8d3852cdba2ab1',
    supporterPriceId: process.env.VITE_PADDLE_SUPPORTER_PRICE_ID || 'pri_01k4psqzjhaa4k3hyvdvjczd6w',
    allyPriceId: process.env.VITE_PADDLE_ALLY_PRICE_ID || 'pri_01k4psx68hrb5y17rg96n65ajy',
    advocatePriceId: process.env.VITE_PADDLE_ADVOCATE_PRICE_ID || 'pri_01k4pt23r2c6b5hkhpcz1reptt'
  };

  // Initialize Paddle
  useEffect(() => {
    const initializePaddle = async () => {
      if (typeof window !== 'undefined' && window.Paddle) {
        try {
          const paddleInstance = new window.Paddle({
            environment: paddleConfig.environment,
            token: paddleConfig.token
          });
          setPaddle(paddleInstance);
        } catch (error) {
          console.error('Paddle initialization error:', error);
        }
      }
    };
    
    initializePaddle();
  }, []);

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
        "Ad-free experience",
        "Comment & react on Patreon posts", 
        "Name in closing credits (optional)",
        "Member updates via Patreon feed"
      ],
      highlight: false
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
        "Everything in Supporter, plus:",
        "Early access to 1 video/week (via Patreon)",
        "Priority topic suggestions",
        "Community chat access (via Patreon)",
        "Weekly insider updates"
      ],
      highlight: true
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
        "Everything in Ally, plus:",
        "Submit local good-news tips for coverage",
        "Vote on upcoming projects",
        "Quarterly behind-the-scenes mini-brief", 
        "Direct line to editors",
        "Exclusive merch discounts + Early access"
      ],
      highlight: false
    }
  ];

  const handleSubscribe = async (tier) => {
    if (!paddle || !tier.priceId) {
      console.error('Paddle not initialized or missing price ID');
      return;
    }

    setIsLoading(true);
    
    try {
      await paddle.Checkout.open({
        items: [{ priceId: tier.priceId }],
        customData: {
          tier: tier.id,
          source: 'iagn_subscribe_modal'
        },
        successUrl: `${window.location.origin}/?subscription=success&tier=${tier.id}`,
        onComplete: (data) => {
          setTimeout(() => {
            window.open('https://www.patreon.com/c/itsActuallyGoodNews', '_blank');
            onClose();
          }, 2000);
        }
      });
    } catch (error) {
      console.error('Paddle checkout error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        {/* Backdrop */}
        <div 
          className="fixed inset-0 transition-opacity" 
          style={{ backgroundColor: 'rgba(167, 230, 196, 0.95)' }}
          onClick={onClose}
        />
        
        {/* Modal Container */}
        <div 
          className="relative w-full max-w-6xl max-h-[95vh] overflow-y-auto rounded-2xl shadow-2xl"
          style={{ backgroundColor: '#A7E6C4' }}
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-6 right-6 z-10 p-2 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors"
          >
            <X size={24} />
          </button>

          {/* Header Section */}
          <div className="text-center px-8 py-12">
            <div className="flex items-center justify-center mb-6">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center">
                <span className="text-2xl font-bold" style={{ color: '#A7E6C4' }}>I</span>
              </div>
            </div>
            <h1 className="text-4xl font-bold text-white mb-4">
              Choose your membership
            </h1>
            <p className="text-xl text-white/90 max-w-2xl mx-auto">
              Join thousands getting the positive news that matters
            </p>
          </div>

          {/* Pricing Cards */}
          <div className="px-8 pb-12">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {TIERS.map((tier) => {
                const IconComponent = tier.icon;
                return (
                  <div
                    key={tier.id}
                    className={`rounded-2xl p-8 transition-all duration-300 hover:transform hover:scale-105 ${
                      tier.highlight 
                        ? 'ring-4 ring-white/50 shadow-2xl' 
                        : 'shadow-lg hover:shadow-xl'
                    }`}
                    style={{ 
                      backgroundColor: '#A69CFF',
                      border: tier.highlight ? '3px solid #FFE8A0' : '2px solid rgba(255,255,255,0.2)'
                    }}
                  >
                    {/* Tier Header */}
                    <div className="text-center mb-6">
                      <div className="flex justify-center mb-4">
                        <div className="p-3 rounded-full bg-white/20">
                          <IconComponent size={32} className="text-white" />
                        </div>
                      </div>
                      <h2 className="text-2xl font-bold text-white mb-2">
                        {tier.name}
                      </h2>
                      <p className="text-white/80 text-sm mb-4">
                        {tier.description}
                      </p>
                      <div className="mb-4">
                        <span className="text-4xl font-bold text-white">
                          ${tier.price}
                        </span>
                        <span className="text-white/80 text-lg">
                          /month
                        </span>
                      </div>
                    </div>

                    {/* Features List */}
                    <div className="mb-8">
                      <p className="text-white font-semibold mb-4 text-center">
                        {tier.tagline}
                      </p>
                      <ul className="space-y-3">
                        {tier.perks.map((perk, index) => (
                          <li key={index} className="flex items-start text-white text-sm">
                            <Check size={16} className="text-white mr-3 mt-0.5 flex-shrink-0" />
                            <span>{perk}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* CTA Button */}
                    <button
                      onClick={() => handleSubscribe(tier)}
                      disabled={isLoading}
                      className="w-full py-4 px-6 rounded-xl font-bold text-lg transition-all duration-300 hover:transform hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                      style={{
                        backgroundColor: tier.highlight ? '#FFE8A0' : '#F99C8B',
                        color: tier.highlight ? '#1F1F1F' : '#FFFFFF'
                      }}
                    >
                      {isLoading ? 'Processing...' : 'Join Now'}
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Gift Membership Section */}
            <div 
              className="mt-12 mx-auto max-w-2xl rounded-2xl p-8 text-center"
              style={{ backgroundColor: '#FFE8A0' }}
            >
              <div className="flex items-center justify-center mb-4">
                <Heart size={32} style={{ color: '#F99C8B' }} className="mr-3" />
                <h3 className="text-2xl font-bold" style={{ color: '#1F1F1F' }}>
                  Gift a membership to IAGN
                </h3>
              </div>
              <p className="text-lg mb-6" style={{ color: '#1F1F1F' }}>
                Share the power of positive news with someone you care about
              </p>
              <button
                onClick={() => {
                  window.open('https://www.patreon.com/c/itsActuallyGoodNews', '_blank');
                }}
                className="px-8 py-3 rounded-lg font-semibold text-white transition-all duration-300 hover:transform hover:-translate-y-1"
                style={{ backgroundColor: '#F99C8B' }}
              >
                Gift Now
              </button>
            </div>

            {/* Footer */}
            <div className="mt-8 text-center">
              <p className="text-white/80 text-sm">
                Cancel anytime • 30-day money-back guarantee
              </p>
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
