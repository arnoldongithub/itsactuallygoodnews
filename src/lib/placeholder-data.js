export const placeholderArticles = [
  // Viral Stories - Good news/heroism for the viral section
  {
    id: 1,
    category: 'Humanitarian & Rescue',
    title: 'Teacher Saves 30 Students from Burning School Building',
    summary: 'A heroic teacher risked her life to evacuate an entire classroom when a fire broke out, ensuring all students reached safety.',
    source: { name: 'CNN', url: 'https://www.cnn.com/heroic-teacher-saves-students' },
    url: 'https://www.cnn.com/heroic-teacher-saves-students',
    coverage: [
      { name: 'CNN', domain: 'cnn.com' },
      { name: 'BBC News', domain: 'bbc.com' },
      { name: 'Associated Press', domain: 'ap.org' }
    ],
    imageUrl: 'https://images.unsplash.com/photo-1544717297-fa95b6ee9643?auto=format&fit=crop&w=500&q=60',
    isViral: true,
    published_at: '2024-07-15T10:30:00Z'
  },
  {
    id: 2,
    category: 'Humanitarian & Rescue',
    title: 'Community Raises $500K for Cancer Patient\'s Treatment',
    summary: 'Local residents organized fundraising events that helped a young father afford life-saving cancer treatment.',
    source: { name: 'Good News Network', url: 'https://www.goodnewsnetwork.org/community-fundraising-cancer' },
    url: 'https://www.goodnewsnetwork.org/community-fundraising-cancer',
    coverage: [
      { name: 'Good News Network', domain: 'goodnewsnetwork.org' },
      { name: 'Local News 8', domain: 'localnews8.com' }
    ],
    imageUrl: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?auto=format&fit=crop&w=500&q=60',
    isViral: true,
    published_at: '2024-07-14T14:20:00Z'
  },
  {
    id: 3,
    category: 'Humanitarian & Rescue',
    title: 'Firefighter Adopts Dog He Rescued from Wildfire',
    summary: 'After rescuing a dog from devastating wildfires, a firefighter decided to give the animal a permanent home.',
    source: { name: 'People Magazine', url: 'https://people.com/firefighter-adopts-rescue-dog' },
    url: 'https://people.com/firefighter-adopts-rescue-dog',
    coverage: [
      { name: 'People Magazine', domain: 'people.com' },
      { name: 'Animal Planet', domain: 'animalplanet.com' }
    ],
    imageUrl: 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?auto=format&fit=crop&w=500&q=60',
    isViral: true,
    published_at: '2024-07-13T09:15:00Z'
  },
  {
    id: 4,
    category: 'Humanitarian & Rescue',
    title: 'Neighbor Builds Wheelchair Ramp for Elderly Resident',
    summary: 'A kind neighbor spent his weekend building a wheelchair ramp to help an elderly resident access her home safely.',
    source: { name: 'Upworthy', url: 'https://www.upworthy.com/neighbor-builds-wheelchair-ramp' },
    url: 'https://www.upworthy.com/neighbor-builds-wheelchair-ramp',
    coverage: [
      { name: 'Upworthy', domain: 'upworthy.com' }
    ],
    imageUrl: 'https://images.unsplash.com/photo-1521791055366-0d553872125f?auto=format&fit=crop&w=500&q=60',
    isViral: true,
    published_at: '2024-07-12T16:45:00Z'
  },

  // Regular Trending Stories (Headlines only)
  {
    id: 5,
    category: 'Environment & Sustainability',
    title: 'Global Reforestation Efforts Plant 15 Billion Trees, Setting New Record',
    summary: 'A coalition of environmental groups announced a new milestone in the fight against climate change, restoring ecosystems and creating vital carbon sinks worldwide.',
    source: { name: 'EcoWatch', url: 'https://www.ecowatch.com/reforestation-milestone' },
    url: 'https://www.ecowatch.com/reforestation-milestone',
    coverage: [
      { name: 'EcoWatch', domain: 'ecowatch.com' },
      { name: 'National Geographic', domain: 'nationalgeographic.com' },
      { name: 'The Guardian', domain: 'theguardian.com' }
    ],
    imageUrl: 'https://images.unsplash.com/photo-1518837695005-2083093ee35b?auto=format&fit=crop&w=500&q=60',
    isViral: false,
    published_at: '2024-07-16T08:00:00Z'
  },
  {
    id: 6,
    category: 'Innovation & Tech',
    title: 'Breakthrough AI Achieves 99% Accuracy in Early Cancer Detection',
    summary: 'Researchers at a leading university have developed a new AI model that helps doctors detect various forms of cancer from medical scans with unprecedented accuracy.',
    source: { name: 'TechCrunch', url: 'https://techcrunch.com/ai-cancer-detection' },
    url: 'https://techcrunch.com/ai-cancer-detection',
    coverage: [
      { name: 'TechCrunch', domain: 'techcrunch.com' },
      { name: 'Wired', domain: 'wired.com' },
      { name: 'MIT Technology Review', domain: 'technologyreview.com' }
    ],
    imageUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=500&q=60',
    isViral: false,
    published_at: '2024-07-15T12:30:00Z'
  },
  {
    id: 7,
    category: 'Health',
    title: 'New Vaccine Shows Promise in Preventing Alzheimer\'s Disease',
    summary: 'Early trials of a novel vaccine have shown remarkable success in clearing amyloid plaques, a key factor in the development of Alzheimer\'s disease.',
    source: { name: 'Reuters Health', url: 'https://www.reuters.com/alzheimer-vaccine-breakthrough' },
    url: 'https://www.reuters.com/alzheimer-vaccine-breakthrough',
    coverage: [
      { name: 'Reuters', domain: 'reuters.com' },
      { name: 'The New York Times', domain: 'nytimes.com' }
    ],
    imageUrl: 'https://images.unsplash.com/photo-1581093450021-4a7360dd9e68?auto=format&fit=crop&w=500&q=60',
    isViral: false,
    published_at: '2024-07-14T11:00:00Z'
  },
  {
    id: 8,
    category: 'Science & Space',
    title: 'James Webb Telescope Discovers Potentially Habitable Exoplanet',
    summary: 'Astronomers are buzzing after the JWST captured images of an exoplanet with an atmosphere containing water vapor, located within its star\'s habitable zone.',
    source: { name: 'NASA', url: 'https://www.nasa.gov/jwst-exoplanet-discovery' },
    url: 'https://www.nasa.gov/jwst-exoplanet-discovery',
    coverage: [
      { name: 'NASA', domain: 'nasa.gov' },
      { name: 'Space.com', domain: 'space.com' },
      { name: 'BBC News', domain: 'bbc.com' }
    ],
    imageUrl: 'https://images.unsplash.com/photo-1614726365904-7b535934d404?auto=format&fit=crop&w=500&q=60',
    isViral: false,
    published_at: '2024-07-13T15:20:00Z'
  },
  {
    id: 9,
    category: 'Education',
    title: 'University Offers Free Tuition to All Low-Income Students',
    summary: 'A major university has announced a pioneering new financial aid policy that will provide free tuition for all students from families earning below the national median income.',
    source: { name: 'Inside Higher Ed', url: 'https://www.insidehighered.com/free-tuition-policy' },
    url: 'https://www.insidehighered.com/free-tuition-policy',
    coverage: [
      { name: 'The Washington Post', domain: 'washingtonpost.com' },
      { name: 'Inside Higher Ed', domain: 'insidehighered.com' }
    ],
    imageUrl: 'https://images.unsplash.com/photo-1523240795610-571c6b596040?auto=format&fit=crop&w=500&q=60',
    isViral: false,
    published_at: '2024-07-12T13:45:00Z'
  },
  {
    id: 10,
    category: 'Innovation & Tech',
    title: 'New Solar Panel Technology Doubles Efficiency',
    summary: 'Scientists have developed a new type of solar cell that can convert sunlight into electricity with nearly double the efficiency of current market leaders.',
    source: { name: 'Renewable Energy World', url: 'https://www.renewableenergyworld.com/solar-efficiency-breakthrough' },
    url: 'https://www.renewableenergyworld.com/solar-efficiency-breakthrough',
    coverage: [
      { name: 'Renewable Energy World', domain: 'renewableenergyworld.com' },
      { name: 'CleanTechnica', domain: 'cleantechnica.com' }
    ],
    imageUrl: 'https://images.unsplash.com/photo-1509391366360-2e959784a276?auto=format&fit=crop&w=500&q=60',
    isViral: false,
    published_at: '2024-07-11T10:15:00Z'
  },

  // Daily Reads - Most read stories
  {
    id: 11,
    category: 'Science & Space',
    title: 'Scientists Discover New Species of Deep-Sea Coral',
    summary: 'A marine biology expedition has identified a vibrant new species of coral in previously unexplored depths of the Atlantic Ocean, highlighting marine biodiversity.',
    source: { name: 'National Geographic', url: 'https://www.nationalgeographic.com/deep-sea-coral-discovery' },
    url: 'https://www.nationalgeographic.com/deep-sea-coral-discovery',
    coverage: [
      { name: 'National Geographic', domain: 'nationalgeographic.com' },
      { name: 'Nature Journal', domain: 'nature.com' }
    ],
    imageUrl: 'https://images.unsplash.com/photo-1581044777550-4cfa60707c03?auto=format&fit=crop&w=500&q=60',
    isViral: false,
    isDailyRead: true,
    published_at: '2024-07-16T07:30:00Z'
  },
  {
    id: 12,
    category: 'Environment & Sustainability',
    title: 'Ocean Cleanup Project Removes 100 Tons of Plastic from Pacific Gyre',
    summary: 'The ambitious "Ocean Sweep" initiative reported a successful mission, extracting a significant amount of plastic waste from the Great Pacific Garbage Patch.',
    source: { name: 'Oceanographic Magazine', url: 'https://oceanographicmagazine.com/ocean-cleanup-milestone' },
    url: 'https://oceanographicmagazine.com/ocean-cleanup-milestone',
    coverage: [
      { name: 'Oceanographic Magazine', domain: 'oceanographicmagazine.com' },
      { name: 'Marine Conservation Society', domain: 'mcsuk.org' }
    ],
    imageUrl: 'https://images.unsplash.com/photo-1618549639803-cf69e0a79022?auto=format&fit=crop&w=500&q=60',
    isViral: false,
    isDailyRead: true,
    published_at: '2024-07-15T09:00:00Z'
  },

  // Blindspot - Underreported stories
  {
    id: 13,
    category: 'Health',
    title: 'Rural Communities Gain Access to Telemedicine Services',
    summary: 'A new initiative brings healthcare access to remote areas through innovative telemedicine technology and mobile health units.',
    source: { name: 'Rural Health News', url: 'https://ruralhealthnews.org/telemedicine-expansion' },
    url: 'https://ruralhealthnews.org/telemedicine-expansion',
    coverage: [
      { name: 'Rural Health News', domain: 'ruralhealthnews.org' }
    ],
    imageUrl: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?auto=format&fit=crop&w=500&q=60',
    isViral: false,
    isBlindspot: true,
    published_at: '2024-07-14T16:00:00Z'
  },
  {
    id: 14,
    category: 'Education',
    title: 'Indigenous Languages Being Preserved Through Digital Archives',
    summary: 'Communities are working with linguists to create comprehensive digital archives of endangered indigenous languages.',
    source: { name: 'Cultural Preservation Today', url: 'https://culturalpreservation.org/indigenous-languages' },
    url: 'https://culturalpreservation.org/indigenous-languages',
    coverage: [
      { name: 'Cultural Preservation Today', domain: 'culturalpreservation.org' }
    ],
    imageUrl: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?auto=format&fit=crop&w=500&q=60',
    isViral: false,
    isBlindspot: true,
    published_at: '2024-07-13T12:30:00Z'
  }
];

// Helper functions to filter stories by type
export const getViralStories = () => {
  return placeholderArticles.filter(article => article.isViral);
};

export const getTrendingStories = () => {
  return placeholderArticles.filter(article => !article.isViral && !article.isDailyRead && !article.isBlindspot);
};

export const getDailyReads = () => {
  return placeholderArticles.filter(article => article.isDailyRead);
};

export const getBlindspotStories = () => {
  return placeholderArticles.filter(article => article.isBlindspot);
};

export const getStoriesByCategory = (category) => {
  return placeholderArticles.filter(article => 
    article.category.toLowerCase().includes(category.toLowerCase())
  );
};

// Maximum story limits
export const STORY_LIMITS = {
  VIRAL: 4,
  TRENDING: 8,
  DAILY_READS: 2,
  BLINDSPOT: 2
};
