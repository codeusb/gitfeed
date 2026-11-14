export interface Category {
  id: string;
  name: string;
  nameEn?: string;
  icon?: string;
}

export interface Feed {
  id: string;
  title: string;
  url: string;
  siteUrl?: string;
  category: string;
  description?: string;
  enabled: boolean;
}

export interface Attachment {
  url: string;
  type?: string;
  length?: string | number;
}

export interface ArticleSummary {
  id: string;
  feedId: string;
  feedTitle: string;
  category: string;
  title: string;
  link: string;
  author: string;
  publishedAt: string;
  snippet: string;
  coverImage?: string | null;
  readTime: number;
}

export interface ArticleDetail extends ArticleSummary {
  content: string;
  attachments?: Attachment[];
}

export interface FeedStatusRecord {
  title: string;
  category: string;
  url: string;
  lastChecked: string;
  status: 'ok' | 'error';
  articlesFetched: number;
  error?: string | null;
}

export interface FeedStats {
  lastUpdated: string;
  totalArticles: number;
  newArticlesInThisRun: number;
  prunedArticles: number;
  activeFeeds: number;
  feedStatuses: Record<string, FeedStatusRecord>;
}

export type ThemeMode = 'dark' | 'light' | 'system';
export type ColorPalette = 'orange' | 'blue' | 'purple' | 'green' | 'monochrome';

export interface MobileSettings {
  dataSourceUrl: string;
  githubToken: string;
  githubRepo: string;
  theme: ThemeMode;
  palette?: ColorPalette;
  fontSize: 'sm' | 'md' | 'lg';
  autoMarkReadOnOpen: boolean;
}
