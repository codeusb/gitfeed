import AsyncStorage from '@react-native-async-storage/async-storage';
import { ArticleSummary, ArticleDetail, Category, Feed, FeedStats, MobileSettings } from '../types';
import { Storage } from '../storage';

const KEY_CACHED_INDEX = '@gitfeed_cached_index';
const KEY_CACHED_FEEDS = '@gitfeed_cached_feeds';

export class MobileDataService {
  private static getBaseUrl(settings: MobileSettings): string {
    const url = (settings.dataSourceUrl || '').trim();
    if (!url) {
      return 'https://codeusb.github.io/gitfeed/data';
    }
    return url.replace(/\/+$/, '');
  }

  static async fetchIndex(settings: MobileSettings): Promise<ArticleSummary[]> {
    const baseUrl = this.getBaseUrl(settings);
    try {
      const resp = await fetch(`${baseUrl}/index.json?_t=${Date.now()}`);
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const data: ArticleSummary[] = await resp.json();
      await AsyncStorage.setItem(KEY_CACHED_INDEX, JSON.stringify(data));
      return data;
    } catch (e) {
      // Offline fallback
      const cached = await AsyncStorage.getItem(KEY_CACHED_INDEX);
      if (cached) return JSON.parse(cached);
      throw e;
    }
  }

  static async fetchFeeds(settings: MobileSettings): Promise<{ categories: Category[]; feeds: Feed[] }> {
    const baseUrl = this.getBaseUrl(settings);
    try {
      const resp = await fetch(`${baseUrl}/feeds.json?_t=${Date.now()}`);
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const data = await resp.json();
      await AsyncStorage.setItem(KEY_CACHED_FEEDS, JSON.stringify(data));
      return data;
    } catch (e) {
      const cached = await AsyncStorage.getItem(KEY_CACHED_FEEDS);
      if (cached) return JSON.parse(cached);
      return { categories: [], feeds: [] };
    }
  }

  static async fetchArticleDetail(id: string, settings: MobileSettings): Promise<ArticleDetail> {
    // 1. Try local cache
    const cached = await Storage.getCachedArticle(id);
    if (cached) return cached;

    // 2. Fetch from remote CDN
    const baseUrl = this.getBaseUrl(settings);
    const resp = await fetch(`${baseUrl}/articles/${id}.json`);
    if (!resp.ok) throw new Error(`Failed to load article: ${resp.status}`);
    const data: ArticleDetail = await resp.json();

    // 3. Cache offline
    await Storage.cacheArticle(data);
    return data;
  }
}
