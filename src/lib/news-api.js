import supabase from './supa.js';

export async function fetchTrendingNews() {
  const { data, error } = await supabase
    .from('news')
    .select('*')
    .eq('category', 'TrendingStories')
    .order('published_at', { ascending: false })
    .limit(12);

  if (error) throw error;
  return data;
}

export async function fetchDailyReads() {
  const { data, error } = await supabase
    .from('news')
    .select('*')
    .eq('category', 'DailyReads')
    .order('published_at', { ascending: false })
    .limit(10);

  if (error) throw error;
  return data;
}

export async function fetchBlindspotStories() {
  const { data, error } = await supabase
    .from('news')
    .select('*')
    .eq('category', 'Blindspot')
    .order('published_at', { ascending: false })
    .limit(10);

  if (error) throw error;
  return data;
}

export async function fetchNews(category = '') {
  const { data, error } = await supabase
    .from('news')
    .select('*')
    .eq('category', category)
    .order('published_at', { ascending: false })
    .limit(10);

  if (error) throw error;
  return data;
}

// Optimized fetcher for homepage
export async function useHomepageData() {
  try {
    const [trending, dailyReads, blindspot] = await Promise.all([
      fetchTrendingNews(),
      fetchDailyReads(),
      fetchBlindspotStories(),
    ]);

    return {
      data: { trending, dailyReads, blindspot },
      loading: false,
      error: null,
      refetch: useHomepageData, // provide ability to refetch
    };
  } catch (err) {
    return {
      data: null,
      loading: false,
      error: err.message || 'Error loading homepage data',
      refetch: useHomepageData,
    };
  }
}

