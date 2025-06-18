// news-import-setup.js - Initialize and manage news imports
import { setupAutoImport, importNewsNow, newsImporter } from './rss-news-importer.js';
import { supabase } from './supa.js'; // or './supabaseClient.js' if that's your filename

// Optional: Create import logs table for tracking
const createImportLogsTable = async () => {
  const { error } = await supabase.rpc('create_import_logs_table', {
    sql_query: `
      CREATE TABLE IF NOT EXISTS import_logs (
        id SERIAL PRIMARY KEY,
        import_type VARCHAR(50) NOT NULL,
        import_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        results JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `
  });
  
  if (error) {
    console.log('Note: Could not create import_logs table, continuing without logging');
  } else {
    console.log('✅ Import logs table ready');
  }
};

// Initialize news import system
export const initializeNewsImport = async () => {
  console.log('🔧 Initializing news import system...');
  
  try {
    // Optional: Create logs table
    await createImportLogsTable();
    
    // Start auto-import
    setupAutoImport();
    
    console.log('✅ News import system initialized successfully!');
    console.log('📰 News will be imported every 24 hours automatically');
    console.log('🎯 Use importNewsNow() to trigger manual import');
    
  } catch (error) {
    console.error('❌ Error initializing news import:', error);
  }
};

// Manual control functions
export const newsImportControls = {
  // Trigger immediate import
  importNow: async () => {
    console.log('🚀 Starting manual news import...');
    return await importNewsNow();
  },
  
  // Get import statistics
  getStats: async () => {
    try {
      const { data: totalArticles } = await supabase
        .from('news')
        .select('*', { count: 'exact', head: true });
      
      const { data: byCategory } = await supabase
        .from('news')
        .select('category')
        .then(result => {
          const counts = {};
          result.data?.forEach(article => {
            counts[article.category] = (counts[article.category] || 0) + 1;
          });
          return { data: counts };
        });
      
      const { data: recentArticles } = await supabase
        .from('news')
        .select('published_at')
        .order('published_at', { ascending: false })
        .limit(1);
      
      return {
        totalArticles: totalArticles?.length || 0,
        byCategory: byCategory || {},
        lastImported: recentArticles?.[0]?.published_at || 'Never'
      };
    } catch (error) {
      console.error('Error getting stats:', error);
      return null;
    }
  },
  
  // Clear all news data
  clearAllNews: async () => {
    const confirmed = confirm('⚠️ Are you sure you want to delete ALL news articles? This cannot be undone.');
    if (!confirmed) return false;
    
    try {
      const { error } = await supabase
        .from('news')
        .delete()
        .neq('id', 0); // Delete all rows
      
      if (error) throw error;
      
      console.log('🗑️ All news articles deleted');
      return true;
    } catch (error) {
      console.error('Error clearing news:', error);
      return false;
    }
  },
  
  // Test RSS feeds
  testFeeds: async () => {
    console.log('🧪 Testing RSS feeds...');
    const results = {};
    
    for (const [category, feeds] of Object.entries(newsImporter.RSS_FEEDS)) {
      results[category] = [];
      
      for (const feed of feeds) {
        try {
          const items = await newsImporter.fetchRSSFeed(feed);
          results[category].push({
            url: feed,
            status: 'success',
            itemCount: items.length
          });
        } catch (error) {
          results[category].push({
            url: feed,
            status: 'error',
            error: error.message
          });
        }
      }
    }
    
    console.log('📊 Feed test results:', results);
    return results;
  }
};

// Auto-initialize when this module is loaded
// Comment out this line if you want to manually control initialization
initializeNewsImport();

// Usage examples in browser console:
/*
// Manual import
await newsImportControls.importNow();

// Get statistics
const stats = await newsImportControls.getStats();
console.log(stats);

// Test feeds
await newsImportControls.testFeeds();

// Clear all data (careful!)
await newsImportControls.clearAllNews();
*/
