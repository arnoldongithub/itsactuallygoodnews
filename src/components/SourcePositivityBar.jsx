import React from 'react';
import SourceBadge from './SourceBadge';

/**
 * Backwards-compat shim:
 * Replaces the old "positivity bar" with the new compact SourceBadge.
 * Keeps the same prop signature so existing calls don't break.
 */
export default function SourcePositivityBar({
  source,
  positivityScore,   // ignored
  isViral = false,    // ignored
  isFirst = false     // ignored
}) {
  const name =
    typeof source === 'string' && source.trim()
      ? source.replace(/[^\w\s.-]/g, '').trim()
      : 'Source';

  return (
    <div className="mb-2">
      <SourceBadge name={name} />
    </div>
  );
}
