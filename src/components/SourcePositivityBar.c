// src/components/SourcePositivityBar.jsx - Create this as a new file
import React from 'react';

const SourcePositivityBar = ({ source, positivityScore, isViral = false, isFirst = false }) => {
  // Don't show bar for viral stories or first 2 stories
  if (isViral || isFirst) {
    return null;
  }

  // Extract source name and create logo
  const getSourceInfo = (sourceName) => {
    if (!sourceName) return { name: 'Unknown', logo: '?' };
    
    const cleanSource = sourceName.replace('www.', '').toLowerCase();
    
    // Common source mappings
    const sourceMap = {
      'cnn.com': { name: 'CNN', logo: 'CNN' },
      'bbc.com': { name: 'BBC', logo: 'BBC' },
      'reuters.com': { name: 'Reuters', logo: 'R' },
      'ap.org': { name: 'AP News', logo: 'AP' },
      'npr.org': { name: 'NPR', logo: 'NPR' },
      'guardian.com': { name: 'Guardian', logo: 'G' },
      'nytimes.com': { name: 'NY Times', logo: 'NYT' },
      'washingtonpost.com': { name: 'Wash Post', logo: 'WP' },
      'techcrunch.com': { name: 'TechCrunch', logo: 'TC' },
      'theverge.com': { name: 'The Verge', logo: 'V' },
      'wired.com': { name: 'Wired', logo: 'W' },
      'sciencedaily.com': { name: 'Science Daily', logo: 'SD' },
      'medicalxpress.com': { name: 'Medical Xpress', logo: 'MX' },
      'grist.org': { name: 'Grist', logo: 'G' },
      'treehugger.com': { name: 'TreeHugger', logo: 'TH' },
      'reliefweb.int': { name: 'ReliefWeb', logo: 'RW' },
      'unicef.org': { name: 'UNICEF', logo: 'U' },
      'redcross.org': { name: 'Red Cross', logo: 'RC' }
    };

    // Check if we have a mapping
    for (const [domain, info] of Object.entries(sourceMap)) {
      if (cleanSource.includes(domain.split('.')[0])) {
        return info;
      }
    }

    // Fallback: create from source name
    const words = cleanSource.split(/[.-]/);
    const name = words[0].charAt(0).toUpperCase() + words[0].slice(1);
    const logo = words[0].charAt(0).toUpperCase();
    
    return { name, logo };
  };

  const sourceInfo = getSourceInfo(source);
  const score = Math.round(positivityScore || 0);

  return (
    <div className="source-positivity-bar">
      <div className="source-info">
        <div className="source-logo">
          {sourceInfo.logo}
        </div>
        <span>{sourceInfo.name}</span>
      </div>
      <div className="positivity-score">
        Positivity: {score}
      </div>
    </div>
  );
};

export default SourcePositivityBar;
