// IAGN Positive Content Filter - Focus on constructive, solution-oriented news
import { supabase } from './supabase-client';
import { ProfessionalSummarizer } from './openai-summarizer';

const summarizer = new ProfessionalSummarizer();

export class PositiveContentFilter {
  constructor() {
    this.categories = {
      'Movement Tracker & Accountability': {
        weight: 20,
        keywords: [
          'policy reform', 'transparency initiative', 'accountability measure', 'democratic progress',
          'voter registration', 'election reform', 'gerrymandering challenge', 'budget oversight',
          'lobbying reform', 'ethics violation exposed', 'public record release', 'civic engagement'
        ]
      },
      'Capitalism & Inequality': {
        weight: 18,
        keywords: [
          'wage increase', 'union victory', 'worker protection', 'strike success', 'collective bargaining',
          'tax reform', 'wealth redistribution', 'housing affordability', 'debt relief', 'labor rights',
          'minimum wage', 'healthcare access', 'pension protection', 'gig worker rights'
        ]
      },
      'Justice Lens': {
        weight: 18,
        keywords: [
          'wrongful conviction overturned', 'police reform', 'criminal justice reform', 'civil rights victory',
          'racial equity', 'LGBTQ rights', 'disability rights', 'surveillance reform', 'prison reform',
          'restorative justice', 'community policing', 'bias training', 'discrimination lawsuit'
        ]
      },
      'Hope in Struggle': {
        weight: 16,
        keywords: [
          'grassroots victory', 'community organizing', 'mutual aid', 'solidarity action', 'youth activism',
          'environmental victory', 'education funding', 'school lunch program', 'student activism',
          'community garden', 'neighborhood improvement', 'volunteer effort', 'cross-movement alliance'
        ]
      },
      'AI Watch': {
        weight: 14,
        keywords: [
          'AI bias reduction', 'algorithmic fairness', 'worker protection from automation', 'AI transparency',
          'tech monopoly regulation', 'AI for climate', 'accessibility AI', 'ethical AI development',
          'AI governance', 'tech worker organizing', 'facial recognition ban', 'predictive policing reform'
        ]
      }
    };

    this.positivityIndicators = [
      'breakthrough', 'victory', 'success', 'progress', 'improvement', 'solution', 'reform',
      'increased access', 'reduced inequality', 'community wins', 'organizing victory',
      'accountability achieved', 'transparency gained', 'rights protected', 'justice served',
      'coalition building', 'grassroots success', 'policy change', 'system reform'
    ];

    this.constructiveOutcomes = [
      'expanded healthcare', 'affordable housing built', 'wages increased', 'workers protected',
      'corruption exposed', 'transparency increased', 'voting rights restored', 'environment protected',
      'community organized', 'coalition formed', 'rights extended', 'reform implemented'
    ];

    this.negativeFilters = [
      'tragic', 'devastating', 'crisis without solution', 'hopeless', 'inevitable decline',
      'nothing can be done', 'system cannot change', 'permanent inequality'
    ];
  }

  async processArticles(articles, options = {}) {
    const { fast = false, windowHrs = 24 } = options;
    
    console.log(`Processing ${articles.length} articles for positive content analysis`);

    const processedArticles = [];
    
    for (const article of articles) {
      try {
        const result = await this.analyzeArticle(article);
        
        if (result.isPositive && result.score >= 3) {
          // Generate summary for positive articles
          const summary = await summarizer.summarizeArticle({
            url: article.url,
            title: article.title,
            content: article.content,
            published_at: article.published_at
          });

          processedArticles.push({
            ...article,
            category: result.category,
            positivity_score: result.score,
            impact_level: this.calculateImpactLevel(result.score),
            summary: summary || article.summary,
            tags: result.tags,
            processed_at: new Date().toISOString()
          });
        }
      } catch (error) {
        console.error(`Error processing article ${article.url}:`, error);
      }
    }

    return processedArticles;
  }

  async analyzeArticle(article) {
    const content = `${article.title} ${article.content || article.summary || ''}`.toLowerCase();
    
    // Check for negative content that should be filtered out
    const hasNegativeContent = this.negativeFilters.some(filter => 
      content.includes(filter.toLowerCase())
    );
    
    if (hasNegativeContent) {
      return { isPositive: false, score: 0, category: 'Filtered', tags: [] };
    }

    // Score by category
    let bestCategory = 'Hope in Struggle'; // default
    let bestScore = 0;
    const tags = [];

    for (const [categoryName, categoryData] of Object.entries(this.categories)) {
      let categoryScore = 0;
      
      // Check keywords
      for (const keyword of categoryData.keywords) {
        if (content.includes(keyword.toLowerCase())) {
          categoryScore += 2;
          tags.push(keyword);
        }
      }

      // Check positivity indicators
      for (const indicator of this.positivityIndicators) {
        if (content.includes(indicator.toLowerCase())) {
          categoryScore += 1;
        }
      }

      // Check constructive outcomes
      for (const outcome of this.constructiveOutcomes) {
        if (content.includes(outcome.toLowerCase())) {
          categoryScore += 3;
        }
      }

      // Apply category weight
      const weightedScore = categoryScore * (categoryData.weight / 20);
      
      if (weightedScore > bestScore) {
        bestScore = weightedScore;
        bestCategory = categoryName;
      }
    }

    // Additional scoring for solution-oriented language
    const solutionWords = ['solution', 'fix', 'address', 'tackle', 'solve', 'improve', 'enhance'];
    const solutionScore = solutionWords.reduce((score, word) => {
      return content.includes(word) ? score + 1 : score;
    }, 0);

    const finalScore = Math.min(10, bestScore + solutionScore);
    
    return {
      isPositive: finalScore >= 3,
      score: finalScore,
      category: bestCategory,
      tags: [...new Set(tags)].slice(0, 5) // unique tags, max 5
    };
  }

  calculateImpactLevel(score) {
    if (score >= 8) return 'high';
    if (score >= 6) return 'medium';
    if (score >= 4) return 'low';
    return 'minimal';
  }

  async storeProcessedArticles(articles) {
    const batchSize = 50;
    
    for (let i = 0; i < articles.length; i += batchSize) {
      const batch = articles.slice(i, i + batchSize);
      
      const rows = batch.map(article => ({
        title: article.title,
        url: article.url,
        summary: article.summary,
        content: article.content,
        source_name: article.source_name || article.source,
        category: article.category,
        positivity_score: article.positivity_score,
        impact_level: article.impact_level,
        tags: article.tags,
        published_at: article.published_at,
        processed_at: article.processed_at,
        created_at: new Date().toISOString()
      }));

      const { error } = await supabase
        .from('stories')
        .upsert(rows, { onConflict: 'url' });

      if (error) {
        console.error('Error storing articles:', error);
        throw error;
      }
    }

    console.log(`Stored ${articles.length} positive articles`);
  }
}

export const positiveFilter = new PositiveContentFilter();
