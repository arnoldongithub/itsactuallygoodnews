// File: src/pages/Subscribe.jsx
import React from "react";
import "./subscribe.css";
import { useSubscribeModal } from '@/components/SubscribeModal';

const TIERS = [
  {
    id: "supporter",
    name: "Supporter",
    price: 3,
    tagline: "Keep the work going",
    cta: "Subscribe for $3/month",
    perks: [
      "Comment & react on Patreon posts",
      "Name in closing credits (optional)", 
      "Member updates via Patreon feed",
      "Ad-free reading experience"
    ],
  },
  {
    id: "ally",
    name: "Ally", 
    price: 7,
    tagline: "Help us dig deeper",
    highlight: true,
    cta: "Subscribe for $7/month",
    perks: [
      "All Supporter perks",
      "Early access to 1 video/week (via Patreon)",
      "Priority topic suggestions",
      "Community chat access (via Patreon)",
      "Weekly insider updates"
    ],
  },
  {
    id: "advocate",
    name: "Advocate",
    price: 15,
    tagline: "Fund investigations", 
    cta: "Subscribe for $15/month",
    perks: [
      "All Ally perks",
      "Submit local good-news tips for coverage",
      "Vote on upcoming projects", 
      "Quarterly behind-the-scenes mini-brief",
      "Direct line to editors"
    ],
  },
];

export default function Subscribe() {
  const { openModal, SubscribeModal } = useSubscribeModal();

  const handleSubscribeClick = () => {
    openModal();
  };

  return (
    <>
      <main className="sub-wrap" aria-labelledby="subscribe-title">
        <header className="sub-hero">
          <h1 id="subscribe-title">Become a Member</h1>
          <p className="sub-deck">
            Simple, transparent tiers. Cancel anytime. Your support funds reporting,
            verification, and community tools.
          </p>
        </header>

        <section className="sub-grid" role="list">
          {TIERS.map((t) => (
            <article
              key={t.id}
              role="listitem"
              className={`tier ${t.highlight ? "tier--highlight" : ""}`}
              aria-labelledby={`${t.id}-title`}
            >
              <div className="tier-head">
                <h2 id={`${t.id}-title`} className="tier-title">
                  {t.name}
                </h2>
                <p className="tier-tag">{t.tagline}</p>
                <div className="tier-price">
                  <span className="tier-currency">$</span>
                  <span className="tier-amount">{t.price}</span>
                  <span className="tier-period">/mo</span>
                </div>
              </div>

              <ul className="tier-list">
                {t.perks.map((p, i) => (
                  <li key={i} className="tier-item">
                    <span className="tick" aria-hidden="true">✓</span>
                    {p}
                  </li>
                ))}
              </ul>

              <button
                className="tier-cta"
                onClick={handleSubscribeClick}
                aria-label={`${t.cta}`}
              >
                {t.cta}
              </button>
            </article>
          ))}
        </section>

        <footer className="sub-faq">
          <details>
            <summary>How do cancellations work?</summary>
            <p>Manage or cancel anytime from your account dashboard. No lock-ins, no hidden fees.</p>
          </details>
          <details>
            <summary>Is my name public?</summary>
            <p>Credit roll is opt-in. Stay anonymous if you prefer.</p>
          </details>
          <details>
            <summary>Do members influence coverage?</summary>
            <p>
              Yes—members can suggest topics and vote in periodic polls. Editorial standards
              still apply.
            </p>
          </details>
          <details>
            <summary>How does the Patreon integration work?</summary>
            <p>
              After subscribing here, you'll get access to our Patreon community. We'll send you an invite link and guide you through connecting your accounts for seamless access to tier-specific content.
            </p>
          </details>
        </footer>
      </main>
      
      {/* Render the Subscribe Modal */}
      <SubscribeModal />
    </>
  );
}
