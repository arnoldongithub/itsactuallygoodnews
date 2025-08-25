import React from 'react';

/**
 * Compact, theme-friendly source chip used across sidebars/lists.
 * Safe for server builds (no window/btoa) and resilient to odd source strings.
 */
export default function SourceBadge({ name = 'Source' }) {
  const clean = String(name).replace(/[^\w\s.-]/g, '').trim() || 'Source';
  const initials = clean
    .split(/\s+/)
    .slice(0, 2)
    .map(w => w[0]?.toUpperCase() || '')
    .join('') || 'S';

  return (
    <span className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full border text-xs
      border-gray-200 bg-white text-gray-700
      dark:border-white/10 dark:bg-white/5 dark:text-gray-200">
      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full
        bg-[var(--aa-navy,#0a2342)] text-white text-[10px] font-bold">
        {initials}
      </span>
      <span className="font-medium">{clean}</span>
    </span>
  );
}
