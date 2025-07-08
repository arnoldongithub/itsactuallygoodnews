
import React from 'react';
import { Sun } from 'lucide-react';

const Logo = () => {
  return (
    <div className="flex items-center gap-2 group">
      <div className="bg-primary/20 p-2 rounded-lg group-hover:bg-primary/30 transition-colors">
        <div className="bg-[#89D1C5] p-2 rounded-md">
           <Sun className="h-6 w-6 text-[#FDFD96]" />
        </div>
      </div>
      <span className="font-serif font-bold text-xl text-header-foreground tracking-tighter">ItsActuallyGoodNews</span>
    </div>
  );
};

export default Logo;
