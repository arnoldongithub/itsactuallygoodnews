// src/components/Subscription.jsx
import React from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

const tiers = [
  {
    id: 'supporter',
    name: 'Supporter',
    price: '$3/mo',
    blurb: 'Keep the lights on. Get access to supporters-only posts.',
    perks: [
      'Supporter badge on site',
      'Access to supporters-only posts',
      'Vote in occasional polls'
    ],
    cta: 'Join Supporter'
  },
  {
    id: 'member',
    name: 'Member',
    price: '$7/mo',
    blurb: 'Everything in Supporter, plus comment access and community chat.',
    perks: [
      'Everything in Supporter',
      'Comment access on site',
      'Community chat (Discord) access',
      'Submit underreported story tips'
    ],
    highlight: true,
    cta: 'Become a Member'
  },
  {
    id: 'ally',
    name: 'Ally',
    price: '$15/mo',
    blurb: 'Back the mission. Priority tip review + name in credits.',
    perks: [
      'Everything in Member',
      'Priority review of story tips',
      'Name in monthly credits',
      'Early notice & vote on new formats'
    ],
    cta: 'Join as Ally'
  }
];

// Color system: uses your Tailwind theme (accent = brand)
// Card highlight uses ring-accent; buttons use bg-accent.
const Subscription = () => {
  return (
    <section className="max-w-6xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="text-center mb-10">
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-foreground">
          Support <span className="text-accent">It’s Actually Good News</span>
        </h1>
        <p className="mt-3 text-muted-foreground max-w-2xl mx-auto">
          Transparent, non-predatory tiers. Cancel anytime. Your support funds reporting,
          research, and tools that surface progress and accountability.
        </p>
      </div>

      {/* Tiers */}
      <div className="grid md:grid-cols-3 gap-6">
        {tiers.map((t) => (
          <div
            key={t.id}
            className={cn(
              'rounded-2xl border bg-card text-card-foreground shadow-sm flex flex-col',
              t.highlight ? 'ring-2 ring-accent border-accent/30' : 'border-border'
            )}
          >
            <div className="p-6 pb-4">
              <div className="flex items-baseline justify-between">
                <h3 className="text-xl font-bold">{t.name}</h3>
                <div className="text-2xl font-extrabold text-accent">{t.price}</div>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{t.blurb}</p>
            </div>

            <div className="px-6 pb-4">
              <ul className="space-y-2 text-sm">
                {t.perks.map((p, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="mt-0.5 rounded-full bg-accent/10 p-1">
                      <Check className="w-4 h-4 text-accent" />
                    </span>
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-auto p-6 pt-0">
              <button
                className={cn(
                  'w-full inline-flex items-center justify-center rounded-lg px-4 py-2 font-semibold',
                  'bg-accent text-white hover:bg-accent/90 transition-colors'
                )}
                onClick={() => {
                  // simple outbound (replace with your payment link/router)
                  window.open('https://www.patreon.com/c/itsActuallyGoodNews', '_blank');
                }}
              >
                {t.cta}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Footnote */}
      <p className="mt-8 text-xs text-center text-muted-foreground">
        No newsletter promises. No spam. You can upgrade, downgrade, or cancel any time.
      </p>
    </section>
  );
};

export default Subscription;

