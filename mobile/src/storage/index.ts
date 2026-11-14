import AsyncStorage from '@react-native-async-storage/async-storage';
import { ArticleDetail, MobileSettings } from '../types';

const KEY_READ_IDS = '@gitfeed_read_ids';
const KEY_STARRED_IDS = '@gitfeed_starred_ids';
const KEY_SETTINGS = '@gitfeed_settings';
const KEY_ARTICLE_PREFIX = '@gitfeed_article_';

export const DEFAULT_SETTINGS: MobileSettings = {
  dataSourceUrl: 'https://codeusb.github.io/gitfeed/data',
  githubToken: '',
  githubRepo: 'codeusb/gitfeed',
  theme: 'dark',
  fontSize: 'md',
  autoMarkReadOnOpen: true,
};

export const Storage = {
  async getReadIds(): Promise<Set<string>> {
    try {
      const raw = await AsyncStorage.getItem(KEY_READ_IDS);
      return raw ? new Set(JSON.parse(raw)) : new Set();
    } catch {
      return new Set();
    }
  },

  async markRead(id: string): Promise<void> {
    const current = await this.getReadIds();
    current.add(id);
    await AsyncStorage.setItem(KEY_READ_IDS, JSON.stringify(Array.from(current)));
  },

  async markUnread(id: string): Promise<void> {
    const current = await this.getReadIds();
    current.delete(id);
    await AsyncStorage.setItem(KEY_READ_IDS, JSON.stringify(Array.from(current)));
  },

  async markMultipleRead(ids: string[]): Promise<void> {
    const current = await this.getReadIds();
    ids.forEach((id) => current.add(id));
    await AsyncStorage.setItem(KEY_READ_IDS, JSON.stringify(Array.from(current)));
  },

  async getStarredIds(): Promise<Set<string>> {
    try {
      const raw = await AsyncStorage.getItem(KEY_STARRED_IDS);
      return raw ? new Set(JSON.parse(raw)) : new Set();
    } catch {
      return new Set();
    }
  },

  async toggleStar(id: string, isStarred: boolean): Promise<void> {
    const current = await this.getStarredIds();
    if (isStarred) {
      current.add(id);
    } else {
      current.delete(id);
    }
    await AsyncStorage.setItem(KEY_STARRED_IDS, JSON.stringify(Array.from(current)));
  },

  async getCachedArticle(id: string): Promise<ArticleDetail | null> {
    try {
      const raw = await AsyncStorage.getItem(`${KEY_ARTICLE_PREFIX}${id}`);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },

  async cacheArticle(article: ArticleDetail): Promise<void> {
    try {
      await AsyncStorage.setItem(`${KEY_ARTICLE_PREFIX}${article.id}`, JSON.stringify(article));
    } catch (e) {
      console.warn('Failed to cache article offline:', e);
    }
  },

  async getSettings(): Promise<MobileSettings> {
    try {
      const raw = await AsyncStorage.getItem(KEY_SETTINGS);
      return raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  },

  async saveSettings(settings: MobileSettings): Promise<void> {
    await AsyncStorage.setItem(KEY_SETTINGS, JSON.stringify(settings));
  },
};
