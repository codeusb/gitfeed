import { ArticleSummary, ArticleDetail, Feed, Category, FeedStats, UserSettings } from '../types';
import { getCachedArticle, cacheArticle } from '../db';

export class DataService {
  private static getBaseUrl(settings: UserSettings): string {
    let url = (settings.dataSourceUrl || '').trim();
    if (!url) {
      return './data';
    }
    // Remove trailing slash
    return url.replace(/\/+$/, '');
  }

  static async fetchIndex(settings: UserSettings): Promise<ArticleSummary[]> {
    const baseUrl = this.getBaseUrl(settings);
    const resp = await fetch(`${baseUrl}/index.json?_t=${Date.now()}`);
    if (!resp.ok) {
      throw new Error(`Failed to fetch articles index (${resp.status} ${resp.statusText})`);
    }
    return resp.json();
  }

  static async fetchFeeds(settings: UserSettings): Promise<{ categories: Category[]; feeds: Feed[] }> {
    const baseUrl = this.getBaseUrl(settings);
    const resp = await fetch(`${baseUrl}/feeds.json?_t=${Date.now()}`);
    if (!resp.ok) {
      throw new Error(`Failed to fetch feeds configuration (${resp.status} ${resp.statusText})`);
    }
    return resp.json();
  }

  static async fetchStats(settings: UserSettings): Promise<FeedStats | null> {
    const baseUrl = this.getBaseUrl(settings);
    try {
      const resp = await fetch(`${baseUrl}/stats.json?_t=${Date.now()}`);
      if (resp.ok) {
        return await resp.json();
      }
    } catch (e) {
      console.warn('Failed to load stats.json', e);
    }
    return null;
  }

  static async fetchArticleDetail(id: string, settings: UserSettings): Promise<ArticleDetail> {
    // 1. Try local offline cache first
    const cached = await getCachedArticle(id);
    if (cached && cached.content) {
      return cached;
    }

    // 2. Fetch from remote
    const baseUrl = this.getBaseUrl(settings);
    const resp = await fetch(`${baseUrl}/articles/${id}.json`);
    if (!resp.ok) {
      throw new Error(`Article not found (${resp.status} ${resp.statusText})`);
    }
    const data: ArticleDetail = await resp.json();

    // 3. Cache into IndexedDB for offline reading
    await cacheArticle(data);

    return data;
  }
}
