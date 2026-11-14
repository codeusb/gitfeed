import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  RefreshControl,
  StatusBar,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { ArticleSummary, Category, Feed, MobileSettings } from './types';
import { Storage, DEFAULT_SETTINGS } from './storage';
import { MobileDataService } from './services/dataService';
import { UpdateService } from './services/updateService';
import { MobileSyncService } from './services/syncService';
import { ArticleCard } from './components/ArticleCard';
import { ReaderModal } from './components/ReaderModal';
import { SettingsModal } from './components/SettingsModal';
import { FeedsDrawerModal } from './components/FeedsDrawerModal';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ThemeProvider, useTheme } from './theme/ThemeContext';

function MainAppContent({
  settings,
  onUpdateSettings,
}: {
  settings: MobileSettings;
  onUpdateSettings: (s: MobileSettings) => void;
}) {
  const { tokens } = useTheme();
  const [categories, setCategories] = useState<Category[]>([]);
  const [feeds, setFeeds] = useState<Feed[]>([]);
  const [articles, setArticles] = useState<ArticleSummary[]>([]);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const [starredIds, setStarredIds] = useState<Set<string>>(new Set());

  const [refreshing, setRefreshing] = useState(false);
  const [filterMode, setFilterMode] = useState<'all' | 'unread' | 'starred'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedFeed, setSelectedFeed] = useState<string | null>(null);

  const [readingArticle, setReadingArticle] = useState<ArticleSummary | null>(null);
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);

  const loadAllData = useCallback(async (currentSettings: MobileSettings) => {
    setRefreshing(true);
    try {
      const [rIds, sIds] = await Promise.all([Storage.getReadIds(), Storage.getStarredIds()]);
      setReadIds(rIds);
      setStarredIds(sIds);

      const [feedsData, indexData] = await Promise.all([
        MobileDataService.fetchFeeds(currentSettings).catch(() => ({ categories: [], feeds: [] })),
        MobileDataService.fetchIndex(currentSettings).catch(() => []),
      ]);

      setCategories(feedsData.categories || []);
      setFeeds(feedsData.feeds || []);
      setArticles(indexData || []);

      // Trigger background silent sync if GitHub token and repo are configured
      if (currentSettings.githubToken && currentSettings.githubRepo) {
        MobileSyncService.syncWithGitHub(currentSettings).then(async (res) => {
          if (res.success && res.newReadCount > 0) {
            const [latestReads, latestStars] = await Promise.all([
              Storage.getReadIds(),
              Storage.getStarredIds(),
            ]);
            setReadIds(latestReads);
            setStarredIds(latestStars);
          }
        }).catch(() => {});
      }
    } catch (e) {
      console.warn('Error loading mobile feeds:', e);
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadAllData(settings);
    UpdateService.checkForUpdates(settings.githubRepo, true);
  }, [loadAllData, settings]);

  // Debounced auto-sync when read/starred state changes
  const syncTimeoutRef = useRef<any>(null);
  const triggerDebouncedSync = useCallback((currentSettings: MobileSettings) => {
    if (!currentSettings.githubToken || !currentSettings.githubRepo) return;
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
    }
    syncTimeoutRef.current = setTimeout(() => {
      MobileSyncService.syncWithGitHub(currentSettings).catch(() => {});
    }, 4000);
  }, []);

  const handleSelectArticle = (art: ArticleSummary) => {
    setReadingArticle(art);
    if (settings.autoMarkReadOnOpen && !readIds.has(art.id)) {
      Storage.markRead(art.id).then(() => {
        setReadIds((prev) => new Set([...prev, art.id]));
        triggerDebouncedSync(settings);
      });
    }
  };

  const handleToggleRead = async (id: string) => {
    if (readIds.has(id)) {
      await Storage.markUnread(id);
      setReadIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    } else {
      await Storage.markRead(id);
      setReadIds((prev) => new Set([...prev, id]));
    }
    triggerDebouncedSync(settings);
  };

  const handleToggleStar = async (id: string) => {
    const isStarred = starredIds.has(id);
    await Storage.toggleStar(id, !isStarred);
    setStarredIds((prev) => {
      const next = new Set(prev);
      if (isStarred) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
    triggerDebouncedSync(settings);
  };

  // Filtered articles
  const filteredArticles = useMemo(() => {
    return articles.filter((art) => {
      if (selectedCategory && art.category !== selectedCategory) return false;
      if (selectedFeed && art.feedId !== selectedFeed) return false;

      if (filterMode === 'unread' && readIds.has(art.id)) return false;
      if (filterMode === 'starred' && !starredIds.has(art.id)) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const titleMatch = art.title.toLowerCase().includes(q);
        const snippetMatch = art.snippet.toLowerCase().includes(q);
        return titleMatch || snippetMatch;
      }
      return true;
    });
  }, [articles, selectedCategory, selectedFeed, filterMode, readIds, starredIds, searchQuery]);

  const feedUnreadCounts = useMemo(() => {
    const map: Record<string, number> = {};
    for (const a of articles) {
      if (!readIds.has(a.id)) {
        map[a.feedId] = (map[a.feedId] || 0) + 1;
      }
    }
    return map;
  }, [articles, readIds]);

  const currentViewTitle = useMemo(() => {
    if (selectedFeed) {
      return feeds.find((f) => f.id === selectedFeed)?.title || '订阅源';
    }
    if (selectedCategory) {
      return categories.find((c) => c.id === selectedCategory)?.name || '分类';
    }
    return '全部订阅';
  }, [selectedFeed, selectedCategory, feeds, categories]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: tokens.bgPage }]}>
      <StatusBar barStyle={tokens.statusBar} backgroundColor={tokens.bgPage} />
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: tokens.borderSubtle, backgroundColor: tokens.bgPage }]}>
        <TouchableOpacity onPress={() => setDrawerVisible(true)} style={styles.scopeButton}>
          <Text style={[styles.scopeTitle, { color: tokens.textPrimary }]} numberOfLines={1}>
            {currentViewTitle}
          </Text>
          <Text style={[styles.scopeArrow, { color: tokens.accent }]}>▾</Text>
        </TouchableOpacity>

        <View style={styles.headerActions}>
          <TouchableOpacity onPress={() => loadAllData(settings)} style={styles.headerIconBtn}>
            <Text style={[styles.headerIcon, { color: tokens.textSecondary }]}>↻</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setSettingsVisible(true)} style={styles.headerIconBtn}>
            <Text style={[styles.headerIcon, { color: tokens.textSecondary }]}>⚙</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Search & Tabs Bar */}
      <View style={[styles.filterBar, { borderBottomColor: tokens.borderSubtle, backgroundColor: tokens.bgPage }]}>
        <TextInput
          style={[
            styles.searchInput,
            { backgroundColor: tokens.bgSurface, borderColor: tokens.borderSubtle, color: tokens.textPrimary },
          ]}
          placeholder="搜索文章..."
          placeholderTextColor={tokens.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />

        <View style={[styles.tabRow, { backgroundColor: tokens.bgSurface, borderColor: tokens.borderSubtle }]}>
          {(['all', 'unread', 'starred'] as const).map((mode) => (
            <TouchableOpacity
              key={mode}
              onPress={() => setFilterMode(mode)}
              style={[
                styles.tab,
                filterMode === mode && { backgroundColor: tokens.accent },
              ]}
            >
              <Text
                style={[
                  styles.tabText,
                  { color: filterMode === mode ? tokens.accentContrast : tokens.textSecondary },
                  filterMode === mode && styles.tabTextActive,
                ]}
              >
                {mode === 'all' ? '全部' : mode === 'unread' ? '未读' : '星标'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Articles List */}
      <FlatList
        data={filteredArticles}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ArticleCard
            article={item}
            isRead={readIds.has(item.id)}
            isStarred={starredIds.has(item.id)}
            onPress={() => handleSelectArticle(item)}
            onToggleRead={() => handleToggleRead(item.id)}
            onToggleStar={() => handleToggleStar(item.id)}
          />
        )}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadAllData(settings)}
            tintColor={tokens.accent}
            colors={[tokens.accent]}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyTitle, { color: tokens.textPrimary }]}>暂无文章</Text>
            <Text style={[styles.emptyDesc, { color: tokens.textMuted }]}>
              所有文章都已读完或当前分类下无文章
            </Text>
          </View>
        }
      />

      {/* Reader Modal */}
      <ReaderModal
        visible={!!readingArticle}
        articleSummary={readingArticle}
        settings={settings}
        isRead={readingArticle ? readIds.has(readingArticle.id) : false}
        isStarred={readingArticle ? starredIds.has(readingArticle.id) : false}
        onClose={() => setReadingArticle(null)}
        onToggleRead={() => readingArticle && handleToggleRead(readingArticle.id)}
        onToggleStar={() => readingArticle && handleToggleStar(readingArticle.id)}
      />

      {/* Settings Modal */}
      <SettingsModal
        visible={settingsVisible}
        onClose={() => setSettingsVisible(false)}
        settings={settings}
        onUpdateSettings={onUpdateSettings}
      />

      {/* Feeds Drawer Modal */}
      <FeedsDrawerModal
        visible={drawerVisible}
        onClose={() => setDrawerVisible(false)}
        categories={categories}
        feeds={feeds}
        selectedCategory={selectedCategory}
        selectedFeed={selectedFeed}
        onSelectCategory={setSelectedCategory}
        onSelectFeed={setSelectedFeed}
        feedUnreadCounts={feedUnreadCounts}
      />
    </SafeAreaView>
  );
}

export default function App() {
  const [settings, setSettings] = useState<MobileSettings>(DEFAULT_SETTINGS);

  useEffect(() => {
    Storage.getSettings().then((s) => {
      setSettings(s);
    });
  }, []);

  const handleUpdateSettings = (newSettings: MobileSettings) => {
    setSettings(newSettings);
    Storage.saveSettings(newSettings);
  };

  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <ThemeProvider mode={settings.theme} palette={settings.palette || 'orange'}>
          <MainAppContent settings={settings} onUpdateSettings={handleUpdateSettings} />
        </ThemeProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    height: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  scopeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
    paddingRight: 12,
  },
  scopeTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: -0.3,
  },
  scopeArrow: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerIconBtn: {
    padding: 6,
    borderRadius: 8,
  },
  headerIcon: {
    fontSize: 18,
  },
  filterBar: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    gap: 8,
  },
  searchInput: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 8,
    fontSize: 13,
  },
  tabRow: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 3,
    borderWidth: 1,
  },
  tab: {
    flex: 1,
    paddingVertical: 7,
    alignItems: 'center',
    borderRadius: 9,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
  },
  tabTextActive: {
    fontWeight: 'bold',
  },
  emptyContainer: {
    paddingVertical: 100,
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptyDesc: {
    fontSize: 12,
    marginTop: 6,
    textAlign: 'center',
  },
});
