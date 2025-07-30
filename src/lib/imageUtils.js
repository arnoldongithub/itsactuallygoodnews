// Add this to your news-api.js or create a new hook
import { useState, useEffect } from 'react';

export const useHomepageDataWithSkeleton = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Add minimum loading time for skeleton visibility
      const minLoadingTime = new Promise(resolve => setTimeout(resolve, 1500));
      
      const [trending, dailyReads, blindspot] = await Promise.all([
        fetchTrendingNews().catch(() => []),
        fetchDailyReads().catch(() => []),
        fetchBlindspotStories().catch(() => []),
        minLoadingTime // Ensure skeleton shows for at least 1.5 seconds
      ]);
      
      setData({
        trending,
        dailyReads,
        blindspot
      });
      
    } catch (err) {
      console.error('Failed to load homepage data:', err);
      setError('Failed to load news data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return { data, loading, error, refetch: fetchData };
};
