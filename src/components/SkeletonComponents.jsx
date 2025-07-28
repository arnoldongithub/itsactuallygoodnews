// SkeletonComponents.jsx - Modern loading placeholders

import React from 'react';

// Base Skeleton component
export const Skeleton = ({ className = "", variant = "default", ...props }) => {
  const variantClasses = {
    default: "skeleton",
    fast: "skeleton skeleton-fast", 
    slow: "skeleton skeleton-slow",
    pulse: "skeleton-pulse"
  };

  return (
    <div 
      className={`${variantClasses[variant]} ${className}`}
      {...props}
    />
  );
};

// Skeleton NewsCard for trending stories
export const SkeletonNewsCard = ({ isLarge = false }) => {
  return (
    <div className={`skeleton-newscard ${isLarge ? 'mb-8' : ''}`}>
      <div className="skeleton-newscard-image" />
      <div className="skeleton-newscard-overlay">
        <div className="skeleton-newscard-category" />
        <div className="skeleton-newscard-title" />
        <div className="skeleton-newscard-title-line2" />
      </div>
    </div>
  );
};

// Skeleton for sidebar cards (Daily Reads & Blindspot)
export const SkeletonSidebarCard = () => {
  return (
    <div className="skeleton-sidebar-card">
      <div className="skeleton-sidebar-image" />
      <div className="skeleton-sidebar-overlay">
        <div className="skeleton-sidebar-title" />
        <div className="skeleton-sidebar-title-line2" />
      </div>
      <div className="skeleton-source-bar" />
    </div>
  );
};

// Skeleton for trending headlines
export const SkeletonHeadline = () => {
  return (
    <div className="skeleton-headline">
      <div className="skeleton-source-bar" />
      <div className="skeleton-headline-title" />
      <div className="skeleton-headline-title-line2" />
    </div>
  );
};

// Skeleton for section titles
export const SkeletonSectionTitle = ({ withIcon = true }) => {
  return (
    <div className="skeleton-section-title">
      {withIcon && <div className="skeleton-title-icon" />}
      <div className="flex-1">
        <div className="skeleton-title-text" />
        <div className="skeleton-title-underline" />
      </div>
    </div>
  );
};

// Skeleton for category page grid
export const SkeletonCategoryGrid = ({ count = 6 }) => {
  return (
    <div className="skeleton-category-grid">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="skeleton-category-card" />
      ))}
    </div>
  );
};

// Complete Homepage Skeleton
export const SkeletonHomepage = () => {
  return (
    <div className="skeleton-homepage">
      {/* Daily Reads Sidebar */}
      <div className="skeleton-sidebar">
        <SkeletonSectionTitle withIcon={true} />
        <div className="space-y-6">
          {Array.from({ length: 4 }, (_, i) => (
            <SkeletonSidebarCard key={`daily-${i}`} />
          ))}
        </div>
      </div>

      {/* Trending Main Content */}
      <div className="skeleton-main">
        <SkeletonSectionTitle withIcon={true} />
        
        {/* Featured trending stories */}
        <div className="space-y-6 mb-8">
          {Array.from({ length: 3 }, (_, i) => (
            <SkeletonNewsCard key={`trending-${i}`} isLarge={i === 0} />
          ))}
        </div>

        {/* Trending headlines */}
        <div className="space-y-0">
          {Array.from({ length: 8 }, (_, i) => (
            <SkeletonHeadline key={`headline-${i}`} />
          ))}
        </div>
      </div>

      {/* Blindspot Sidebar */}
      <div className="skeleton-sidebar">
        <SkeletonSectionTitle withIcon={true} />
        <div className="space-y-6">
          {Array.from({ length: 4 }, (_, i) => (
            <SkeletonSidebarCard key={`blindspot-${i}`} />
          ))}
        </div>
      </div>
    </div>
  );
};

// Category Page Skeleton
export const SkeletonCategoryPage = () => {
  return (
    <div className="px-4 lg:px-6 my-6">
      {/* Category title */}
      <div className="skeleton w-48 h-8 mb-6 rounded" />
      
      {/* Category grid */}
      <SkeletonCategoryGrid count={9} />
    </div>
  );
};

// Story Page Skeleton
export const SkeletonStoryPage = () => {
  return (
    <div className="max-w-7xl mx-auto my-4 px-4 lg:my-8">
      <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
        
        {/* Main Story Content */}
        <div className="lg:w-2/3">
          {/* Category badge */}
          <div className="skeleton w-24 h-6 mb-4 rounded-full" />
          
          {/* Title */}
          <div className="space-y-3 mb-6">
            <div className="skeleton w-full h-8 rounded" />
            <div className="skeleton w-3/4 h-8 rounded" />
          </div>
          
          {/* Image */}
          <div className="skeleton w-full h-48 lg:h-80 rounded-xl mb-6" />
          
          {/* Summary */}
          <div className="skeleton-container space-y-4 mb-8">
            <div className="skeleton w-32 h-6 rounded" />
            <div className="space-y-3">
              <div className="skeleton w-full h-4 rounded" />
              <div className="skeleton w-full h-4 rounded" />
              <div className="skeleton w-2/3 h-4 rounded" />
            </div>
          </div>

          {/* Related Stories */}
          <div className="space-y-4">
            <div className="skeleton w-40 h-6 rounded" />
            {Array.from({ length: 3 }, (_, i) => (
              <div key={i} className="border-b border-gray-100 dark:border-gray-700 pb-4">
                <div className="skeleton w-full h-5 rounded mb-2" />
                <div className="skeleton w-3/4 h-5 rounded mb-3" />
                <div className="skeleton-source-bar" />
              </div>
            ))}
          </div>
        </div>

        {/* Metadata Sidebar */}
        <div className="lg:w-1/3">
          <div className="space-y-4 p-6 border border-gray-200 dark:border-gray-700 rounded-lg">
            <div className="skeleton w-28 h-6 rounded" />
            <div className="skeleton w-full h-1 rounded" />
            <div className="space-y-3">
              {Array.from({ length: 5 }, (_, i) => (
                <div key={i} className="skeleton w-full h-5 rounded" />
              ))}
            </div>
            <div className="skeleton w-full h-10 rounded-lg mt-6" />
          </div>
        </div>
      </div>
    </div>
  );
};

// Text skeleton utilities
export const SkeletonText = ({ 
  lines = 1, 
  className = "", 
  width = "full" 
}) => {
  const widthClasses = {
    full: "w-full",
    "3/4": "w-3/4", 
    "1/2": "w-1/2",
    "1/4": "w-1/4"
  };

  if (lines === 1) {
    return <div className={`skeleton h-4 ${widthClasses[width]} ${className}`} />;
  }

  return (
    <div className={`skeleton-text-lines ${className}`}>
      {Array.from({ length: lines }, (_, i) => (
        <div 
          key={i} 
          className={`skeleton h-4 ${i === lines - 1 ? 'w-3/4' : 'w-full'}`} 
        />
      ))}
    </div>
  );
};

// Loading spinner component
export const LoadingSpinner = ({ 
  size = "md", 
  className = "",
  text = "Loading..." 
}) => {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-8 h-8", 
    lg: "w-12 h-12",
    xl: "w-16 h-16"
  };

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <div className={`${sizeClasses[size]} border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin`} />
      {text && (
        <p className="text-muted-foreground mt-2 text-sm">{text}</p>
      )}
    </div>
  );
};

// Loading overlay for full-screen loading
export const LoadingOverlay = ({ 
  isVisible = false, 
  text = "Loading...",
  onCancel 
}) => {
  if (!isVisible) return null;

  return (
    <div className="loading-overlay">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-8 text-center max-w-sm mx-4">
        <LoadingSpinner size="lg" text={text} />
        {onCancel && (
          <button 
            onClick={onCancel}
            className="mt-4 px-4 py-2 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  );
};

// Skeleton card for different layouts
export const SkeletonCard = ({ 
  aspectRatio = "16/9", 
  hasOverlay = true,
  hasCategory = true,
  className = "" 
}) => {
  const aspectClasses = {
    "16/9": "aspect-[16/9]",
    "3/4": "aspect-[3/4]", 
    "4/5": "aspect-[4/5]",
    "1/1": "aspect-square"
  };

  return (
    <div className={`skeleton-newscard ${aspectClasses[aspectRatio]} ${className}`}>
      <div className="skeleton-newscard-image" />
      {hasOverlay && (
        <div className="skeleton-newscard-overlay">
          {hasCategory && <div className="skeleton-newscard-category" />}
          <div className="skeleton-newscard-title" />
          <div className="skeleton-newscard-title-line2" />
        </div>
      )}
    </div>
  );
};

// Export all components as default
const SkeletonComponents = {
  Skeleton,
  SkeletonNewsCard,
  SkeletonSidebarCard,
  SkeletonHeadline,
  SkeletonSectionTitle,
  SkeletonCategoryGrid,
  SkeletonHomepage,
  SkeletonCategoryPage,
  SkeletonStoryPage,
  SkeletonText,
  LoadingSpinner,
  LoadingOverlay,
  SkeletonCard
};

export default SkeletonComponents;
