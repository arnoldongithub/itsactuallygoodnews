// src/components/SourcePositivityBar.jsx - SAFE VERSION
import React from 'react';

const SourcePositivityBar = ({ source, positivityScore, isViral = false, isFirst = false }) => {
  // Don't show bar for viral stories or first 2 stories
  if (isViral || isFirst) {
    return null;
  }

  // SAFE: Sanitize source input to prevent invalid characters
  const sanitizeSource = (sourceName) => {
    if (!sourceName || typeof sourceName !== 'string') return 'Unknown';
    // Remove all potentially problematic characters
    return sourceName.replace(/[^\w\s.-]/g, '').trim() || 'Unknown';
  };

  // Extract source name and create logo with character sanitization
  const getSourceInfo = (sourceName) => {
    const cleanSource = sanitizeSource(sourceName).toLowerCase().replace('www.', '');
    
    // Common source mappings - all safe strings
    const sourceMap = {
      'cnn': { name: 'CNN', logo: 'CNN' },
      'bbc': { name: 'BBC', logo: 'BBC' },
      'reuters': { name: 'Reuters', logo: 'R' },
      'ap': { name: 'AP News', logo: 'AP' },
      'npr': { name: 'NPR', logo: 'NPR' },
      'guardian': { name: 'Guardian', logo: 'G' },
      'nytimes': { name: 'NY Times', logo: 'NYT' },
      'washingtonpost': { name: 'Wash Post', logo: 'WP' },
      'techcrunch': { name: 'TechCrunch', logo: 'TC' },
      'theverge': { name: 'The Verge', logo: 'V' },
      'wired': { name: 'Wired', logo: 'W' },
      'sciencedaily': { name: 'Science Daily', logo: 'SD' },
      'medicalxpress': { name: 'Medical Xpress', logo: 'MX' },
      'grist': { name: 'Grist', logo: 'G' },
      'treehugger': { name: 'TreeHugger', logo: 'TH' },
      'reliefweb': { name: 'ReliefWeb', logo: 'RW' },
      'unicef': { name: 'UNICEF', logo: 'U' },
      'redcross': { name: 'Red Cross', logo: 'RC' },
      'goodnewsnetwork': { name: 'Good News', logo: 'GNN' },
      'positive': { name: 'Positive News', logo: 'PN' },
      'brightvibes': { name: 'Bright Vibes', logo: 'BV' },
      'upworthy': { name: 'Upworthy', logo: 'UW' }
    };

    // Check if we have a mapping (safe key lookup)
    for (const [domain, info] of Object.entries(sourceMap)) {
      if (cleanSource.includes(domain)) {
        return info;
      }
    }

    // Fallback: create from source name (safe processing)
    const words = cleanSource.split(/[.-\s]+/).filter(w => w.length > 0);
    if (words.length > 0) {
      const firstWord = words[0];
      const name = firstWord.charAt(0).toUpperCase() + firstWord.slice(1);
      const logo = firstWord.charAt(0).toUpperCase();
      return { name, logo };
    }

    // Ultimate fallback
    return { name: 'Unknown', logo: '?' };
  };

  const sourceInfo = getSourceInfo(source);
  
  // SAFE: Sanitize score to prevent invalid values
  const safeScore = Math.max(0, Math.min(10, Math.round(Number(positivityScore) || 0)));

  return (
    <div className="source-positivity-bar">
      <div className="source-info">
        <div 
          className="source-logo"
          // SAFE: Ensure logo text contains only valid characters
          title={sourceInfo.name.replace(/[^\w\s]/g, '')}
        >
          {sourceInfo.logo.replace(/[^\w]/g, '')}
        </div>
        <span title={sourceInfo.name}>
          {sourceInfo.name.replace(/[^\w\s.-]/g, '')}
        </span>
      </div>
      <div className="positivity-score">
        Positivity: {safeScore}
      </div>
    </div>
  );
};

export default SourcePositivityBar;
