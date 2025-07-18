import React from 'react';
import { useLocation } from 'react-router-dom';

const NewsCard = ({ article, isBookmarked, onBookmarkToggle }) => {
  const location = useLocation();

  if (!article) return null;

  const {
    id,
    category,
    title,
    image_url,
    thumbnail_url,
    is_ad,
    ad_image_url,
    ad_link_url
  } = article;

  const fallbackImage = "https://images.unsplash.com/photo-1657097100900-a218a5178242";

  // Check if this is a category page to use the appropriate styling
  const isCategoryPage = location.pathname.includes('/category');

  if (is_ad) {
    return (
      <a href={ad_link_url || "#"} target="_blank" rel="noopener noreferrer" className="block">
        <div className="category-newscard">
          <img
            src={ad_image_url || fallbackImage}
            alt="Sponsored"
            className="category-newscard-image"
          />
          <div className="category-newscard-overlay">
            <div className="category-newscard-category">Sponsored</div>
            <h3 className="category-newscard-title">This ad supports the platform</h3>
          </div>
        </div>
      </a>
    );
  }

  if (isCategoryPage) {
    // Category page: Use image overlay style
    return (
      <a
        href={`/article/${id}`}
        className="category-newscard group"
      >
        <img
          src={image_url || thumbnail_url || fallbackImage}
          alt={title}
          className="category-newscard-image group-hover:scale-105 transition-transform duration-300"
        />
        <div className="category-newscard-overlay">
          {category && (
            <div className="category-newscard-category">
              {category}
            </div>
          )}
          <h3 className="category-newscard-title">
            {title}
          </h3>
        </div>
      </a>
    );
  }

  // Default newscard for other pages (if needed)
  return (
    <div className="category-newscard">
      <img
        src={image_url || thumbnail_url || fallbackImage}
        alt={title}
        className="category-newscard-image"
      />
      <div className="category-newscard-overlay">
        {category && (
          <div className="category-newscard-category">
            {category}
          </div>
        )}
        <h3 className="category-newscard-title">
          <a href={`/article/${id}`} className="hover:text-blue-300 transition-colors">
            {title}
          </a>
        </h3>
      </div>
    </div>
  );
};

export default NewsCard;
