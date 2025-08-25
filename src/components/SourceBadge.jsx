// src/components/SourceBadge.jsx
import React from 'react';
import { getSourceName, getSourceLogo } from '@/lib/utils';

const SourceBadge = ({ name }) => {
  const clean = getSourceName(name || 'Unknown');
  const logo = getSourceLogo(clean).replace(/[^\w]/g, '');
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-gray-200 dark:border-gray-700 px-2.5 py-1 text-xs bg-white/70 dark:bg-gray-800/60 backdrop-blur">
      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-gray-900 text-white text-[10px] font-bold dark:bg-gray-100 dark:text-gray-900">
        {logo}
      </span>
      <span className="text-gray-700 dark:text-gray-200">{clean}</span>
    </div>
  );
};

export default SourceBadge;

