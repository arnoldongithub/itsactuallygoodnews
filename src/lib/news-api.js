import { createClient } from '@supabase/supabase-js';

// Setup your Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Fetch top trending stories
export const fetchTrendingStories = async (limit = 20) => {
  const { data, error } = await supabase
    .from('news')
    .select('*')
    .order('published_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching trending stories:', error);
    return [];
  }

  return data;
};

// Fetch daily reads (or similar logic)
export const fetchDailyReads = async (limit = 10) => {
  const { data, error } = await supabase
    .from('news')
    .select('*')
    .order('published_at', { ascending: false })
    .limit(limit)
    .neq('category', 'Blindspot'); // Optional filter

  if (error) {
    console.error('Error fetching daily reads:', error);
    return [];
  }

  return data;
};

// Fetch blindspot stories
export const fetchBlindspotStories = async (limit = 5) => {
  const { data, error } = await supabase
    .from('news')
    .select('*')
    .eq('category', 'Blindspot')
    .order('published_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching blindspot stories:', error);
    return [];
  }

  return data;
};

// General-purpose fetch with category
export const fetchNews = async (category, limit = 10) => {
  const { data, error } = await supabase
    .from('news')
    .select('*')
    .eq('category', category)
    .order('published_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error(`Error fetching news for ${category}:`, error);
    return [];
  }

  return data;
};

// Optional: wrapper hook for preloading
export const useHomepageData = async () => {
  const [trending, blindspot, dailyReads] = await Promise.all([
    fetchTrendingStories(20),
    fetchBlindspotStories(5),
    fetchDailyReads(10),
  ]);

  return {
    trending,
    blindspot,
    dailyReads,
  };
};

