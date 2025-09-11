export interface Standard {
  id: string;
  title: string;
  description: string;
  category: StandardCategory;
  priority: 'high' | 'medium' | 'low';
  lastUpdated: Date;
  content: string;
  keywords: string[];
  relatedStandards: string[];
}

export interface StandardCategory {
  id: string;
  name: string;
  description: string;
  color: string;
  icon: string;
}

export interface SearchResult {
  standard: Standard;
  relevanceScore: number;
  matchedKeywords: string[];
  matchedSections: string[];
}

export interface ProfessionalStandardsProps {
  onStandardSelect?: (standard: Standard) => void;
  searchQuery?: string;
  selectedCategory?: string;
}

export interface StandardsFilterProps {
  categories: StandardCategory[];
  selectedCategory: string | null;
  onCategorySelect: (categoryId: string | null) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export interface StandardCardProps {
  standard: Standard;
  onPress: (standard: Standard) => void;
  isExpanded?: boolean;
}

export interface OfflineData {
  standards: Standard[];
  categories: StandardCategory[];
  lastSynced: Date;
  version: string;
}

export interface StandardsServiceInterface {
  getStandards(): Promise<Standard[]>;
  getCategories(): Promise<StandardCategory[]>;
  searchStandards(query: string, categoryId?: string): Promise<SearchResult[]>;
  getStandardById(id: string): Promise<Standard | null>;
  syncOfflineData(): Promise<void>;
  getOfflineStatus(): Promise<{ isOffline: boolean; lastSync: Date | null }>;
}