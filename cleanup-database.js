#!/usr/bin/env node

// Database cleanup script for time-based article management
// Run this script via cron or manually to maintain database hygiene

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_KEY) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_KEY in .env');
  process.exit(1);
}

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// Configuration for cleanup rules
const CLEANUP_RULES = {
  viral: {
    categories: ['Viral'],
    maxAge: 24, // hours
    description: 'Viral content (24 hours)'
  },
  regular: {
    categories: ['Health', 'Innovation & Tech', 'Environment & Sustainability', 'Education', 'Science & Space', 'Humanitarian & Rescue', 'Blindspot'],
    maxAge: 36, // hours
    description: 'Regular categories (36 hours)'
  },
  archive: {
    categories: 'all',
    maxAge: 7 * 24, // 7 days
    description: 'Archive very old articles (7 days)'
  }
};

// Main cleanup function
async function performDatabaseCleanup(dryRun = false) {
  console.log(`\n🧹 DATABASE CLEANUP STARTED - ${new Date().toLocaleString()}`);
  console.log(`Mode: ${dryRun ? 'DRY RUN (no changes will be made)' : 'LIVE CLEANUP'}`);
  console.log('═══════════════════════════════════════════════════════════════');
  
  const stats = {
    totalProcessed: 0,
    totalDeleted: 0,
    duplicatesRemoved: 0,
    viralCleaned: 0,
    regularCleaned: 0,
    archivedCleaned: 0,
    errors: 0
  };
  
  try {
    // Get current database state
    const { data: allArticles, error: fetchError } = await supabase
      .from('news')
      .select('id, title, category, created_at, published_at, url')
      .order('created_at', { ascending: false });
    
    if (fetchError) {
      throw new Error(`Failed to fetch articles: ${fetchError.message}`);
    }
    
    stats.totalProcessed = allArticles.length;
    console.log(`📊 Found ${allArticles.length} total articles in database`);
    
    // 1. Clean up viral articles (24 hours)
    console.log(`\n🔥 CLEANING VIRAL ARTICLES (older than 24 hours)...`);
    const viralCutoff = new Date(Date.now() - CLEANUP_RULES.viral.maxAge * 60 * 60 * 1000);
    
    if (dryRun) {
      const viralToDelete = allArticles.filter(article => 
        CLEANUP_RULES.viral.categories.includes(article.category) &&
        new Date(article.created_at || article.published_at) < viralCutoff
      );
      console.log(`📋 DRY RUN: Would delete ${viralToDelete.length} viral articles`);
      viralToDelete.slice(0, 5).forEach(article => {
        console.log(`   - ${article.title.slice(0, 60)}... (${article.category})`);
      });
      stats.viralCleaned = viralToDelete.length;
    } else {
      const { data: deletedViral, error: viralError } = await supabase
        .from('news')
        .delete()
        .in('category', CLEANUP_RULES.viral.categories)
        .lt('created_at', viralCutoff.toISOString());
      
      if (viralError) {
        console.error(`❌ Error cleaning viral articles: ${viralError.message}`);
        stats.errors++;
      } else {
        stats.viralCleaned = deletedViral?.length || 0;
        console.log(`✅ Deleted ${stats.viralCleaned} old viral articles`);
      }
    }
    
    // 2. Clean up regular category articles (36 hours)
    console.log(`\n📰 CLEANING REGULAR ARTICLES (older than 36 hours)...`);
    const regularCutoff = new Date(Date.now() - CLEANUP_RULES.regular.maxAge * 60 * 60 * 1000);
    
    for (const category of CLEANUP_RULES.regular.categories) {
      if (dryRun) {
        const categoryToDelete = allArticles.filter(article => 
          article.category === category &&
          new Date(article.created_at || article.published_at) < regularCutoff
        );
        console.log(`📋 DRY RUN: Would delete ${categoryToDelete.length} ${category} articles`);
        stats.regularCleaned += categoryToDelete.length;
      } else {
        const { data: deletedRegular, error: regularError } = await supabase
          .from('news')
          .delete()
          .eq('category', category)
          .lt('created_at', regularCutoff.toISOString());
        
        if (regularError) {
          console.error(`❌ Error cleaning ${category}: ${regularError.message}`);
          stats.errors++;
        } else {
          const count = deletedRegular?.length || 0;
          stats.regularCleaned += count;
          if (count > 0) {
            console.log(`✅ Deleted ${count} old ${category} articles`);
          }
        }
      }
    }
    
    // 3. Remove duplicate articles (keep newest)
    console.log(`\n🔄 REMOVING DUPLICATE ARTICLES...`);
    
    if (dryRun) {
      const urlCounts = {};
      allArticles.forEach(article => {
        urlCounts[article.url] = (urlCounts[article.url] || 0) + 1;
      });
      
      const duplicateUrls = Object.keys(urlCounts).filter(url => urlCounts[url] > 1);
      const duplicateCount = duplicateUrls.reduce((sum, url) => sum + (urlCounts[url] - 1), 0);
      
      console.log(`📋 DRY RUN: Would remove ${duplicateCount} duplicate articles`);
      console.log(`📋 Found ${duplicateUrls.length} URLs with duplicates`);
      stats.duplicatesRemoved = duplicateCount;
    } else {
      // Get fresh data after deletions
      const { data: currentArticles } = await supabase
        .from('news')
        .select('url, id, created_at')
        .order('created_at', { ascending: false });
      
      if (currentArticles) {
        const seen = new Set();
        const toDelete = [];
        
        currentArticles.forEach(article => {
          if (seen.has(article.url)) {
            toDelete.push(article.id);
          } else {
            seen.add(article.url);
          }
        });
        
        if (toDelete.length > 0) {
          const { error: dupError } = await supabase
            .from('news')
            .delete()
            .in('id', toDelete);
          
          if (dupError) {
            console.error(`❌ Error removing duplicates: ${dupError.message}`);
            stats.errors++;
          } else {
            stats.duplicatesRemoved = toDelete.length;
            console.log(`✅ Removed ${toDelete.length} duplicate articles`);
          }
        } else {
          console.log(`✅ No duplicates found`);
        }
      }
    }
    
    // 4. Archive very old articles (7+ days)
    console.log(`\n🗂️ ARCHIVING VERY OLD ARTICLES (older than 7 days)...`);
    const archiveCutoff = new Date(Date.now() - CLEANUP_RULES.archive.maxAge * 60 * 60 * 1000);
    
    if (dryRun) {
      const archiveToDelete = allArticles.filter(article => 
        new Date(article.created_at || article.published_at) < archiveCutoff
      );
      console.log(`📋 DRY RUN: Would archive ${archiveToDelete.length} very old articles`);
      stats.archivedCleaned = archiveToDelete.length;
    } else {
      const { data: deletedArchive, error: archiveError } = await supabase
        .from('news')
        .delete()
        .lt('created_at', archiveCutoff.toISOString());
      
      if (archiveError) {
        console.error(`❌ Error archiving old articles: ${archiveError.message}`);
        stats.errors++;
      } else {
        stats.archivedCleaned = deletedArchive?.length || 0;
        console.log(`✅ Archived ${stats.archivedCleaned} very old articles`);
      }
    }
    
    // Calculate total deletions
    stats.totalDeleted = stats.viralCleaned + stats.regularCleaned + stats.duplicatesRemoved + stats.archivedCleaned;
    
    // 5. Get final database state
    console.log(`\n📊 FINAL DATABASE STATE...`);
    
    if (!dryRun) {
      const { data: remainingArticles } = await supabase
        .from('news')
        .select('category, created_at')
        .order('created_at', { ascending: false });
      
      if (remainingArticles) {
        const categoryStats = {};
        const now = Date.now();
        
        remainingArticles.forEach(article => {
          const category = article.category || 'Unknown';
          if (!categoryStats[category]) {
            categoryStats[category] = { total: 0, recent: 0 };
          }
          categoryStats[category].total++;
          
          const articleAge = now - new Date(article.created_at).getTime();
          if (articleAge <= 48 * 60 * 60 * 1000) { // 48 hours
            categoryStats[category].recent++;
          }
        });
        
        console.log('\n📈 REMAINING ARTICLES BY CATEGORY:');
        Object.entries(categoryStats)
          .sort(([,a], [,b]) => b.total - a.total)
          .forEach(([category, counts]) => {
            console.log(`   ${category}: ${counts.total} total (${counts.recent} recent)`);
          });
      }
    }
    
  } catch (error) {
    console.error(`💥 CLEANUP ERROR: ${error.message}`);
    stats.errors++;
  }
  
  // 6. Generate summary report
  console.log('\n' + '═'.repeat(60));
  console.log('🏁 CLEANUP SUMMARY REPORT');
  console.log('═'.repeat(60));
  console.log(`📊 Total articles processed: ${stats.totalProcessed}`);
  console.log(`🗑️ Total articles deleted: ${stats.totalDeleted}`);
  console.log(`   🔥 Viral articles (24h): ${stats.viralCleaned}`);
  console.log(`   📰 Regular articles (36h): ${stats.regularCleaned}`);
  console.log(`   🔄 Duplicate articles: ${stats.duplicatesRemoved}`);
  console.log(`   🗂️ Archived articles (7d): ${stats.archivedCleaned}`);
  console.log(`⚠️ Errors encountered: ${stats.errors}`);
  console.log(`✅ Success rate: ${((stats.totalProcessed - stats.errors) / stats.totalProcessed * 100).toFixed(1)}%`);
  
  if (dryRun) {
    console.log('\n💡 This was a DRY RUN - no changes were made to the database');
    console.log('💡 Run without --dry-run flag to perform actual cleanup');
  } else {
    console.log('\n🎉 Database cleanup completed successfully!');
  }
  
  console.log(`⏰ Cleanup completed at: ${new Date().toLocaleString()}`);
  
  return stats;
}

// Function to show current database statistics
async function showDatabaseStats() {
  console.log('\n📊 CURRENT DATABASE STATISTICS');
  console.log('═'.repeat(50));
  
  try {
    const { data: articles, error } = await supabase
      .from('news')
      .select('category, created_at, positivity_score, virality_score')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    const now = Date.now();
    const stats = {
      total: articles.length,
      categories: {},
      ageGroups: {
        '0-6h': 0,
        '6-12h': 0,
        '12-24h': 0,
        '24-36h': 0,
        '36h+': 0
      },
      qualityStats: {
        highQuality: 0, // positivity >= 8
        mediumQuality: 0, // positivity 6-7
        viral: 0 // virality >= 6
      }
    };
    
    articles.forEach(article => {
      // Category stats
      const category = article.category || 'Unknown';
      if (!stats.categories[category]) {
        stats.categories[category] = 0;
      }
      stats.categories[category]++;
      
      // Age group stats
      const articleAge = now - new Date(article.created_at).getTime();
      const hoursOld = articleAge / (1000 * 60 * 60);
      
      if (hoursOld <= 6) stats.ageGroups['0-6h']++;
      else if (hoursOld <= 12) stats.ageGroups['6-12h']++;
      else if (hoursOld <= 24) stats.ageGroups['12-24h']++;
      else if (hoursOld <= 36) stats.ageGroups['24-36h']++;
      else stats.ageGroups['36h+']++;
      
      // Quality stats
      const positivity = article.positivity_score || 0;
      const virality = article.virality_score || 0;
      
      if (positivity >= 8) stats.qualityStats.highQuality++;
      else if (positivity >= 6) stats.qualityStats.mediumQuality++;
      
      if (virality >= 6) stats.qualityStats.viral++;
    });
    
    console.log(`📈 Total articles: ${stats.total}`);
    console.log('\n📂 By Category:');
    Object.entries(stats.categories)
      .sort(([,a], [,b]) => b - a)
      .forEach(([category, count]) => {
        const percentage = ((count / stats.total) * 100).toFixed(1);
        console.log(`   ${category}: ${count} (${percentage}%)`);
      });
    
    console.log('\n⏰ By Age:');
    Object.entries(stats.ageGroups).forEach(([age, count]) => {
      const percentage = ((count / stats.total) * 100).toFixed(1);
      console.log(`   ${age}: ${count} (${percentage}%)`);
    });
    
    console.log('\n⭐ By Quality:');
    console.log(`   High Quality (8+ positivity): ${stats.qualityStats.highQuality}`);
    console.log(`   Medium Quality (6-7 positivity): ${stats.qualityStats.mediumQuality}`);
    console.log(`   Viral Content (6+ virality): ${stats.qualityStats.viral}`);
    
    // Highlight articles that will be cleaned up
    const viralOld = articles.filter(a => 
      a.category === 'Viral' && 
      (now - new Date(a.created_at).getTime()) > 24 * 60 * 60 * 1000
    ).length;
    
    const regularOld = articles.filter(a => 
      a.category !== 'Viral' && 
      (now - new Date(a.created_at).getTime()) > 36 * 60 * 60 * 1000
    ).length;
    
    console.log('\n🧹 Articles eligible for cleanup:');
    console.log(`   Viral articles (>24h): ${viralOld}`);
    console.log(`   Regular articles (>36h): ${regularOld}`);
    console.log(`   Total eligible: ${viralOld + regularOld}`);
    
  } catch (error) {
    console.error(`❌ Error fetching database stats: ${error.message}`);
  }
}

// Function to verify cleanup rules are working
async function verifyCleanupRules() {
  console.log('\n🔍 VERIFYING CLEANUP RULES');
  console.log('═'.repeat(40));
  
  try {
    const now = Date.now();
    const viralCutoff = now - 24 * 60 * 60 * 1000;
    const regularCutoff = now - 36 * 60 * 60 * 1000;
    
    // Check for articles that should have been cleaned up
    const { data: oldViral } = await supabase
      .from('news')
      .select('id, title, category, created_at')
      .eq('category', 'Viral')
      .lt('created_at', new Date(viralCutoff).toISOString())
      .limit(5);
    
    const { data: oldRegular } = await supabase
      .from('news')
      .select('id, title, category, created_at')
      .neq('category', 'Viral')
      .lt('created_at', new Date(regularCutoff).toISOString())
      .limit(5);
    
    if (oldViral && oldViral.length > 0) {
      console.log(`⚠️ Found ${oldViral.length} viral articles older than 24h:`);
      oldViral.forEach(article => {
        const hoursOld = Math.round((now - new Date(article.created_at).getTime()) / (1000 * 60 * 60));
        console.log(`   - ${article.title.slice(0, 50)}... (${hoursOld}h old)`);
      });
    } else {
      console.log(`✅ No viral articles older than 24h found`);
    }
    
    if (oldRegular && oldRegular.length > 0) {
      console.log(`⚠️ Found ${oldRegular.length} regular articles older than 36h:`);
      oldRegular.forEach(article => {
        const hoursOld = Math.round((now - new Date(article.created_at).getTime()) / (1000 * 60 * 60));
        console.log(`   - ${article.title.slice(0, 50)}... (${hoursOld}h old) [${article.category}]`);
      });
    } else {
      console.log(`✅ No regular articles older than 36h found`);
    }
    
  } catch (error) {
    console.error(`❌ Error verifying cleanup rules: ${error.message}`);
  }
}

// Main execution function
async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'help';
  const isDryRun = args.includes('--dry-run');
  
  console.log('🗄️ DATABASE CLEANUP UTILITY');
  console.log('═'.repeat(40));
  
  switch (command) {
    case 'cleanup':
      await performDatabaseCleanup(isDryRun);
      break;
      
    case 'stats':
      await showDatabaseStats();
      break;
      
    case 'verify':
      await verifyCleanupRules();
      break;
      
    case 'full':
      await showDatabaseStats();
      await verifyCleanupRules();
      await performDatabaseCleanup(isDryRun);
      break;
      
    case 'help':
    default:
      console.log(`
📚 USAGE:
  node cleanup-database.js <command> [options]

🔧 COMMANDS:
  cleanup    - Perform database cleanup (add --dry-run for simulation)
  stats      - Show current database statistics
  verify     - Check for articles that should be cleaned up
  full       - Run stats + verify + cleanup
  help       - Show this help message

🎛️ OPTIONS:
  --dry-run  - Simulate cleanup without making changes

📋 EXAMPLES:
  node cleanup-database.js stats
  node cleanup-database.js cleanup --dry-run
  node cleanup-database.js cleanup
  node cleanup-database.js full --dry-run

⏰ CRON SETUP:
  Add to crontab for automated cleanup:
  # Run cleanup every 6 hours
  0 */6 * * * cd /path/to/your/project && node cleanup-database.js cleanup

📝 CLEANUP RULES:
  - Viral articles: deleted after 24 hours
  - Regular articles: deleted after 36 hours  
  - Duplicates: removed (keeps newest)
  - Archive: articles older than 7 days
      `);
      break;
  }
}

// Handle process termination gracefully
process.on('SIGINT', () => {
  console.log('\n\n⚠️ Cleanup interrupted by user');
  process.exit(1);
});

process.on('unhandledRejection', (error) => {
  console.error('💥 Unhandled rejection:', error);
  process.exit(1);
});

// Run the main function
main().catch(error => {
  console.error('💥 CRITICAL ERROR:', error);
  process.exit(1);
});
