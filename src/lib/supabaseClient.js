// src/lib/news-api.js

import { supabase } from "./supabaseClient";


export async function fetchNews() {
  const { data, error } = await supabase
    .from('news')
    .select('*')
    .order('published_at', { ascending: false })
    .limit(50);

  if (error) {
    console.error('Error fetching news:', error.message);
    throw new Error('Could not fetch news');
  }

  return data;
}

export async function fetchNewsByCategory(category) {
  const { data, error } = await supabase
    .from('news')
    .select('*')
    .eq('category', category)
    .order('published_at', { ascending: false });

  if (error) {
    console.error(`Error fetching news in category ${category}:`, error.message);
    throw new Error(`Could not fetch news for category: ${category}`);
  }

  return data;
}

export async function fetchSingleNews(id) {
  const { data, error } = await supabase
    .from('news')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error(`Error fetching news with ID ${id}:`, error.message);
    throw new Error('Could not fetch the news article');
  }

  return data;
}
