import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { ArticleDetail, UserSettings } from '../types';

interface GitFeedDB extends DBSchema {
  articles: {
    key: string;
    value: ArticleDetail;
  };
  user_state: {
    key: string;
    value: { id: string; timestamp: number };
  };
  settings: {
    key: string;
    value: any;
  };
}

const DB_NAME = 'gitfeed_db';
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<GitFeedDB>> | null = null;

export function getDB(): Promise<IDBPDatabase<GitFeedDB>> {
  if (!dbPromise) {
    dbPromise = openDB<GitFeedDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('articles')) {
          db.createObjectStore('articles', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('user_state')) {
          db.createObjectStore('user_state', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings');
        }
      },
    });
  }
  return dbPromise;
}

// Local read and starred states
export async function getLocalReadIds(): Promise<Set<string>> {
  const db = await getDB();
  const tx = db.transaction('user_state', 'readonly');
  const store = tx.objectStore('user_state');
  const all = await store.getAll();
  const readIds = new Set<string>();
  for (const item of all) {
    if (item.id.startsWith('read:')) {
      readIds.add(item.id.replace('read:', ''));
    }
  }
  return readIds;
}

export async function markArticleRead(id: string): Promise<void> {
  const db = await getDB();
  await db.put('user_state', { id: `read:${id}`, timestamp: Date.now() });
}

export async function markArticleUnread(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('user_state', `read:${id}`);
}

export async function markMultipleArticlesRead(ids: string[]): Promise<void> {
  const db = await getDB();
  const tx = db.transaction('user_state', 'readwrite');
  const now = Date.now();
  for (const id of ids) {
    tx.store.put({ id: `read:${id}`, timestamp: now });
  }
  await tx.done;
}

export async function getLocalStarredIds(): Promise<Set<string>> {
  const db = await getDB();
  const tx = db.transaction('user_state', 'readonly');
  const all = await tx.objectStore('user_state').getAll();
  const starredIds = new Set<string>();
  for (const item of all) {
    if (item.id.startsWith('starred:')) {
      starredIds.add(item.id.replace('starred:', ''));
    }
  }
  return starredIds;
}

export async function toggleArticleStarred(id: string, isStarred: boolean): Promise<void> {
  const db = await getDB();
  if (isStarred) {
    await db.put('user_state', { id: `starred:${id}`, timestamp: Date.now() });
  } else {
    await db.delete('user_state', `starred:${id}`);
  }
}

// Cached article details
export async function getCachedArticle(id: string): Promise<ArticleDetail | undefined> {
  const db = await getDB();
  return db.get('articles', id);
}

export async function cacheArticle(article: ArticleDetail): Promise<void> {
  const db = await getDB();
  await db.put('articles', article);
}

// Settings
const DEFAULT_SETTINGS: UserSettings = {
  dataSourceUrl: '',
  githubToken: '',
  githubRepo: '',
  theme: 'dark',
  fontFamily: 'sans',
  fontSize: 'md',
  autoMarkReadOnOpen: true,
};

export async function loadSettings(): Promise<UserSettings> {
  try {
    const raw = localStorage.getItem('gitfeed_settings');
    if (raw) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
    }
  } catch (e) {
    console.error('Failed to parse settings from localStorage', e);
  }
  return DEFAULT_SETTINGS;
}

export async function saveSettings(settings: UserSettings): Promise<void> {
  localStorage.setItem('gitfeed_settings', JSON.stringify(settings));
}
