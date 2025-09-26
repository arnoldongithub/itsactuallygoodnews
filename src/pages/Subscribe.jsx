// File: src/pages/Subscribe.jsx
import React from "react";
import "../styles/subscribe.css";

const TIERS = [
  {
    id: "supporter",
    name: "Supporter",
    price: 3,
    tagline: "Keep the work going",
    cta: "Subscribe for $3/month",
    patreonTier: "supporter", // Add Patreon tier mapping
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
    patreonTier: "ally",
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
    patreonTier: "advocate",
    perks: [
      "All Ally perks",
      "Submit local good-news tips for coverage",
      "Vote on upcoming projects", 
      "Quarterly behind-the-scenes mini-brief",
      "Direct line to editors"
    ],
  },
];

const PATREON_BASE_URL = "https://www.patreon.com/c/itsActuallyGoodNews";

export default function Subscribe() {
  const handleSubscribeClick = (tier) => {
    // Direct redirect to Patreon
    window.open(PATREON_BASE_URL, '_blank', 'noopener,noreferrer');
    
    // Optional: Track the tier selection for analytics
    if (window.gtag) {
      window.gtag('event', 'subscribe_click', {
        tier: tier.id,
        price: tier.price,
        event_category: 'subscription',
        event_label: `${tier.name} - $${tier.price}/month`
      });
    }
  };

  return (
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
              onClick={() => handleSubscribeClick(t)}
              aria-label={`${t.cta} - Opens Patreon in new tab`}
            >
              {t.cta}
            </button>
          </article>
        ))}
      </section>

      <footer className="sub-faq">
        <details>
          <summary>How do cancellations work?</summary>
          <p>Manage or cancel anytime from your Patreon account. No lock-ins, no hidden fees.</p>
        </details>
        <details>
          <summary>Is my name public?</summary>
          <p>Credit roll is opt-in on Patreon. Stay anonymous if you prefer.</p>
        </details>
        <details>
          <summary>Do members influence coverage?</summary>
          <p>
            Yes—members can suggest topics and vote in periodic polls through Patreon. Editorial standards
            still apply.
          </p>
        </details>
        <details>
          <summary>How does Patreon work?</summary>
          <p>
            Click any subscribe button to join our Patreon community. You'll get immediate access to tier-specific content, 
            community features, and exclusive updates. Patreon handles all billing and account management.
          </p>
        </details>
      </footer>
    </main>
  );
}