import React, { useState } from 'react';
import { X, Check, Heart, Users, Megaphone } from 'lucide-react';

const PATREON_URL = 'https://www.patreon.com/c/itsActuallyGoodNews';

const TIERS = [
  {
    id: 'supporter',
    name: 'Supporter',
    price: 3,
    tagline: 'Keep the work going',
    description: 'Ad-free reading with supporter credits',
    icon: Heart,
    perks: [
      'Comment & react on Patreon posts',
      'Name in closing credits (optional)',
      'Member updates via Patreon feed',
      'Ad-free reading experience',
    ],
  },
  {
    id: 'ally',
    name: 'Ally',
    price: 7,
    tagline: 'Help us dig deeper',
    description: 'Early access video + community chat',
    icon: Users,
    perks: [
      'All Supporter perks',
      'Early access to 1 video/week (via Patreon)',
      'Priority topic suggestions',
      'Community chat access (via Patreon)',
      'Weekly insider updates',
    ],
  },
  {
    id: 'advocate',
    name: 'Advocate',
    price: 15,
    tagline: 'Fund investigations',
    description: 'Vote on projects + behind-the-scenes',
    icon: Megaphone,
    perks: [
      'All Ally perks',
      'Submit local good-news tips for coverage',
      'Vote on upcoming projects',
      'Quarterly behind-the-scenes mini-brief',
      'Direct line to editors',
      'Exclusive merch discounts + Early access',
    ],
  },
];

const SubscribeModal = ({ isOpen, onClose }) => {
  const [isLoading, setIsLoading] = useState(false);
  if (!isOpen) return null;

  const handleJoin = (tierId) => {
    setIsLoading(true);
    window.open(PATREON_URL, '_blank', 'noopener,noreferrer');
    setTimeout(() => setIsLoading(false), 600);
  };

  const handleGift = () => {
    window.open(PATREON_URL, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="fixed inset-0 z-50">
      <div className="w-full h-full overflow-y-auto" style={{ backgroundColor: '#A7E6C4' }}>
        <button onClick={onClose} className="fixed top-4 right-4 z-20 p-2 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors" aria-label="Close">
          <X size={24} />
        </button>

        <div className="min-h-full px-4 py-8 md:px-8">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
                <span className="text-xl font-bold" style={{ color: '#A7E6C4' }}>I</span>
              </div>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">Choose your membership</h1>
            <p className="text-base md:text-lg text-white/90 max-w-xl mx-auto">Join the community on Patreon</p>
          </div>

          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-8">
              {TIERS.map((t) => {
                const Icon = t.icon;
                return (
                  <div key={t.id} className="rounded-2xl p-4 md:p-6 transition-all duration-300 hover:transform hover:scale-105 shadow-lg hover:shadow-xl flex flex-col" style={{ backgroundColor: '#A69CFF', border: '2px solid rgba(255,255,255,0.2)' }}>
                    <div className="text-center mb-4 md:mb-5">
                      <div className="flex justify-center mb-3">
                        <div className="p-3 rounded-full bg-white/20"><Icon size={28} className="text-white" /></div>
                      </div>
                      <h2 className="text-lg md:text-xl font-bold text-white mb-2">{t.name}</h2>
                      <p className="text-white/80 text-xs md:text-sm mb-3">{t.description}</p>
                      <div className="mb-3">
                        <span className="text-2xl md:text-3xl font-bold text-white">${t.price}</span>
                        <span className="text-white/80 text-sm md:text-base">/month</span>
                      </div>
                    </div>

                    <div className="mb-4 md:mb-6 flex-1 flex flex-col">
                      <p className="text-white font-semibold mb-3 text-center text-xs md:text-sm">{t.tagline}</p>
                      <ul className="space-y-2 flex-1">
                        {t.perks.map((perk, i) => (
                          <li key={i} className="flex items-start text-white text-xs">
                            <Check size={14} className="text-white mr-2 mt-0.5 flex-shrink-0" />
                            <span>{perk}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <button onClick={() => handleJoin(t.id)} disabled={isLoading} className="w-full py-3 px-4 rounded-xl font-bold text-sm md:text-base transition-all duration-300 hover:transform hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed" style={{ backgroundColor: '#FFE8A0', color: '#1F1F1F' }}>
                      {isLoading ? 'Opening…' : 'Join on Patreon'}
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pb-8">
              <button onClick={handleGift} className="px-4 md:px-6 py-3 rounded-lg font-semibold text-sm md:text-base transition-all duration-300 hover:transform hover:-translate-y-1" style={{ backgroundColor: '#F99C8B', color: '#FFFFFF' }}>
                Gift a membership
              </button>
              <div className="text-center">
                <p className="text-white/80 text-xs md:text-sm">Cancel anytime • Patreon handles billing</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Hook
export const useSubscribeModal = () => {
  const [isOpen, setIsOpen] = useState(false);
  return {
    isOpen,
    openModal: () => setIsOpen(true),
    closeModal: () => setIsOpen(false),
    SubscribeModal: (props) => <SubscribeModal {...props} isOpen={isOpen} onClose={() => setIsOpen(false)} />,
  };
};

export default SubscribeModal;
