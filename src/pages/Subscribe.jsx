import React from "react";
import "./subscribe.css";

/**
 * Set these in your Vercel env (Build & Runtime):
 *  VITE_PATREON_SUPPORTER_URL
 *  VITE_PATREON_ALLY_URL
 *  VITE_PATREON_ADVOCATE_URL
 *
 * Fallbacks below let the page render locally if envs aren't set.
 */
const PATREON = {
  supporter:
    import.meta.env.VITE_PATREON_SUPPORTER_URL ||
    "https://www.patreon.com/yourpage/join?tier=SUPPORTER_TIER_ID",
  ally:
    import.meta.env.VITE_PATREON_ALLY_URL ||
    "https://www.patreon.com/yourpage/join?tier=ALLY_TIER_ID",
  advocate:
    import.meta.env.VITE_PATREON_ADVOCATE_URL ||
    "https://www.patreon.com/yourpage/join?tier=ADVOCATE_TIER_ID",
};

const TIERS = [
  {
    id: "supporter",
    name: "Supporter",
    price: 3,
    tagline: "Keep the work going",
    cta: "Join Supporter on Patreon",
    // CHANGES: removed ads perk; comments happen on Patreon wall; removed monthly impact note
    perks: [
      "Comment & react on Patreon posts",
      "Name in closing credits (optional)",
      "Member updates via Patreon feed",
    ],
    link: PATREON.supporter,
  },
  {
    id: "ally",
    name: "Ally",
    price: 7,
    tagline: "Help us dig deeper",
    highlight: true,
    cta: "Join Ally on Patreon",
    // CHANGES: community chat lives on Patreon; no ads mention anywhere
    perks: [
      "All Supporter perks",
      "Early access to 1 video/week (via Patreon)",
      "Priority topic suggestions",
      "Community chat access (via Patreon)",
    ],
    link: PATREON.ally,
  },
  {
    id: "advocate",
    name: "Advocate",
    price: 15,
    tagline: "Fund investigations",
    cta: "Join Advocate on Patreon",
    perks: [
      "All Ally perks",
      "Submit local good-news tips for coverage",
      "Vote on upcoming projects",
      "Quarterly behind-the-scenes mini-brief",
    ],
    link: PATREON.advocate,
  },
];

export default function Subscribe() {
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

            <a
              className="tier-cta"
              href={t.link}
              rel="noopener nofollow"
              target="_blank"
              aria-label={`${t.cta}`}
            >
              {t.cta}
            </a>
          </article>
        ))}
      </section>

      <footer className="sub-faq">
        <details>
          <summary>How do cancellations work?</summary>
          <p>Manage or cancel anytime from Patreon. No lock-ins, no hidden fees.</p>
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
      </footer>
    </main>
  );
}
