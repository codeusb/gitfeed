import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
import { ArticleCard } from './components/ArticleCard';
import { ReaderModal } from './components/ReaderModal';
import { SettingsModal } from './components/SettingsModal';
import { FeedsDrawerModal } from './components/FeedsDrawerModal';

export default function App() {
  const [settings, setSettings] = useState<MobileSettings>(DEFAULT_SETTINGS);
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

  // Initialize
  useEffect(() => {
    Storage.getSettings().then((s) => {
      setSettings(s);
      loadAllData(s);
      // Quietly check for APK update on start
      UpdateService.checkForUpdates(s.githubRepo, true);
    });
  }, []);

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
    } catch (e) {
      console.warn('Error loading mobile feeds:', e);
    } finally {
      setRefreshing(false);
    }
  }, []);

  const handleSelectArticle = (art: ArticleSummary) => {
    setReadingArticle(art);
    if (settings.autoMarkReadOnOpen && !readIds.has(art.id)) {
      Storage.markRead(art.id).then(() => {
        setReadIds((prev) => new Set([...prev, art.id]));
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
  };

  const handleToggleStar = async (id: string) => {
    const isStarred = starredIds.has(id);
    await Storage.toggleStar(id, !isStarred);
    setStarredIds((prev) => {
      const next = new Set(prev);
      if (isStarred) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Filtered articles
  const filteredArticles = useMemo(() => {
    return articles.filter((art) => {
      // Category / Feed scope
      if (selectedFeed && art.feedId !== selectedFeed) return false;
      if (selectedCategory && art.category !== selectedCategory) return false;

      // Filter tabs
      if (filterMode === 'unread' && readIds.has(art.id)) return false;
      if (filterMode === 'starred' && !starredIds.has(art.id)) return false;

      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          art.title.toLowerCase().includes(q) ||
          art.snippet.toLowerCase().includes(q) ||
          art.author?.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [articles, selectedFeed, selectedCategory, filterMode, readIds, starredIds, searchQuery]);

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
    <SafeAreaProvider>
      <StatusBar barStyle="light-content" backgroundColor="#090d16" />
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setDrawerVisible(true)} style={styles.scopeButton}>
            <Text style={styles.scopeTitle} numberOfLines={1}>
              {currentViewTitle}
            </Text>
            <Text style={styles.scopeArrow}>▾</Text>
          </TouchableOpacity>

          <View style={styles.headerActions}>
            <TouchableOpacity onPress={() => loadAllData(settings)} style={styles.headerIconBtn}>
              <Text style={styles.headerIcon}>↻</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setSettingsVisible(true)} style={styles.headerIconBtn}>
              <Text style={styles.headerIcon}>⚙</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Search & Tabs Bar */}
        <View style={styles.filterBar}>
          <TextInput
            style={styles.searchInput}
            placeholder="搜索文章..."
            placeholderTextColor="#64748b"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />

          <View style={styles.tabRow}>
            {(['all', 'unread', 'starred'] as const).map((mode) => (
              <TouchableOpacity
                key={mode}
                onPress={() => setFilterMode(mode)}
                style={[styles.tab, filterMode === mode && styles.tabActive]}
              >
                <Text style={[styles.tabText, filterMode === mode && styles.tabTextActive]}>
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
              tintColor="#f97316"
              colors={['#f97316']}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyTitle}>暂无文章</Text>
              <Text style={styles.emptyDesc}>所有文章都已读完或当前分类下无文章</Text>
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
          onUpdateSettings={(newSettings) => {
            setSettings(newSettings);
            loadAllData(newSettings);
          }}
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
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#090d16',
  },
  header: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#1e293b',
  },
  scopeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
    paddingRight: 12,
  },
  scopeTitle: {
    color: '#f8fafc',
    fontSize: 18,
    fontWeight: 'bold',
  },
  scopeArrow: {
    color: '#f97316',
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
  },
  headerIcon: {
    fontSize: 18,
    color: '#94a3b8',
  },
  filterBar: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#1e293b',
    backgroundColor: '#0c111d',
    gap: 8,
  },
  searchInput: {
    backgroundColor: '#161f31',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 7,
    color: '#f8fafc',
    fontSize: 13,
  },
  tabRow: {
    flexDirection: 'row',
    backgroundColor: '#161f31',
    borderRadius: 8,
    padding: 3,
  },
  tab: {
    flex: 1,
    paddingVertical: 6,
    alignItems: 'center',
    borderRadius: 6,
  },
  tabActive: {
    backgroundColor: '#f97316',
  },
  tabText: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#fff',
    fontWeight: 'bold',
  },
  emptyContainer: {
    paddingVertical: 100,
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  emptyTitle: {
    color: '#64748b',
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptyDesc: {
    color: '#475569',
    fontSize: 12,
    marginTop: 6,
    textAlign: 'center',
  },
});
