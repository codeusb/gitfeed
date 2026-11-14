import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { ArticleSummary, Category, Feed, FeedStats, UserSettings, ViewSelection } from './types';
import { DataService } from './services/dataService';
import { SyncService } from './services/syncService';
import {
  getLocalReadIds,
  getLocalStarredIds,
  markArticleRead,
  markArticleUnread,
  markMultipleArticlesRead,
  toggleArticleStarred,
  loadSettings,
  saveSettings,
} from './db';
import { Sidebar } from './components/Sidebar';
import { ArticleList } from './components/ArticleList';
import { ReaderView } from './components/ReaderView';
import { MobileNav } from './components/MobileNav';
import { SettingsModal } from './components/SettingsModal';
import { FeedManagerModal } from './components/FeedManagerModal';
import { KeyboardHelpModal } from './components/KeyboardHelpModal';

export const App: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [feeds, setFeeds] = useState<Feed[]>([]);
  const [articles, setArticles] = useState<ArticleSummary[]>([]);
  const [stats, setStats] = useState<FeedStats | null>(null);

  const [currentSelection, setCurrentSelection] = useState<ViewSelection>({
    type: 'all',
    title: '全部文章',
  });
  const [selectedArticle, setSelectedArticle] = useState<ArticleSummary | null>(null);

  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const [starredIds, setStarredIds] = useState<Set<string>>(new Set());

  const [settings, setSettings] = useState<UserSettings>({
    dataSourceUrl: '',
    githubToken: '',
    githubRepo: '',
    theme: 'dark',
    fontFamily: 'sans',
    fontSize: 'md',
    autoMarkReadOnOpen: true,
  });

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [feedManagerModalOpen, setFeedManagerModalOpen] = useState(false);
  const [helpModalOpen, setHelpModalOpen] = useState(false);

  // Mobile view navigation: 'list' or 'reader'
  const [mobileView, setMobileView] = useState<'list' | 'reader'>('list');

  // Load initial settings and theme
  useEffect(() => {
    loadSettings().then((s) => {
      setSettings(s);
      applyTheme(s.theme, s.palette);
    });
  }, []);

  const applyTheme = (theme: 'dark' | 'light' | 'system', palette?: import('./types').ColorPalette) => {
    const root = document.documentElement;
    const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    if (isDark) {
      root.classList.add('dark');
      root.setAttribute('data-theme', 'dark');
    } else {
      root.classList.remove('dark');
      root.setAttribute('data-theme', 'light');
    }
    root.setAttribute('data-palette', palette || settings.palette || 'orange');
  };

  const toggleTheme = () => {
    const nextTheme: 'dark' | 'light' = (settings.theme === 'dark' || (!document.documentElement.classList.contains('dark') ? false : true)) ? 'light' : 'dark';
    const updated: UserSettings = { ...settings, theme: nextTheme };
    setSettings(updated);
    saveSettings(updated);
    applyTheme(nextTheme, updated.palette);
  };

  // Load data & local states
  const refreshAllData = useCallback(async (currentSettings: UserSettings) => {
    setIsRefreshing(true);
    try {
      // 1. Load local read & starred IDs
      const [rIds, sIds] = await Promise.all([getLocalReadIds(), getLocalStarredIds()]);
      setReadIds(rIds);
      setStarredIds(sIds);

      // 2. Fetch Feeds, Index & Stats
      const [feedsData, indexData, statsData] = await Promise.all([
        DataService.fetchFeeds(currentSettings).catch(() => ({ categories: [], feeds: [] })),
        DataService.fetchIndex(currentSettings).catch(() => []),
        DataService.fetchStats(currentSettings),
      ]);

      setCategories(feedsData.categories || []);
      setFeeds(feedsData.feeds || []);
      setArticles(indexData || []);
      setStats(statsData);

      // 3. Optional background sync if token configured
      if (currentSettings.githubToken && currentSettings.githubRepo) {
        SyncService.syncWithGitHub(currentSettings).then(async (res) => {
          if (res.success && res.newReadCount > 0) {
            const updatedR = await getLocalReadIds();
            const updatedS = await getLocalStarredIds();
            setReadIds(updatedR);
            setStarredIds(updatedS);
          }
        });
      }
    } catch (e) {
      console.error('Failed to load data:', e);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    refreshAllData(settings);
  }, [refreshAllData, settings.dataSourceUrl]);

  // Handle article selection
  const handleSelectArticle = useCallback((art: ArticleSummary) => {
    setSelectedArticle(art);
    setMobileView('reader');

    if (settings.autoMarkReadOnOpen && !readIds.has(art.id)) {
      markArticleRead(art.id).then(() => {
        setReadIds((prev) => new Set([...prev, art.id]));
      });
    }
  }, [settings.autoMarkReadOnOpen, readIds]);

  // Read toggle
  const handleToggleRead = useCallback(async (articleId: string) => {
    const isCurrentlyRead = readIds.has(articleId);
    if (isCurrentlyRead) {
      await markArticleUnread(articleId);
      setReadIds((prev) => {
        const next = new Set(prev);
        next.delete(articleId);
        return next;
      });
    } else {
      await markArticleRead(articleId);
      setReadIds((prev) => new Set([...prev, articleId]));
    }
  }, [readIds]);

  // Star toggle
  const handleToggleStar = useCallback(async (articleId: string) => {
    const isCurrentlyStarred = starredIds.has(articleId);
    await toggleArticleStarred(articleId, !isCurrentlyStarred);
    setStarredIds((prev) => {
      const next = new Set(prev);
      if (isCurrentlyStarred) {
        next.delete(articleId);
      } else {
        next.add(articleId);
      }
      return next;
    });
  }, [starredIds]);

  // Mark all read in current view
  const handleMarkCurrentViewRead = useCallback(async () => {
    const targetArticles = articles.filter((art) => {
      if (currentSelection.type === 'unread') return !readIds.has(art.id);
      if (currentSelection.type === 'starred') return starredIds.has(art.id);
      if (currentSelection.type === 'category') return art.category === currentSelection.id;
      if (currentSelection.type === 'feed') return art.feedId === currentSelection.id;
      return true;
    });

    const unreadTargetIds = targetArticles.map((a) => a.id).filter((id) => !readIds.has(id));
    if (unreadTargetIds.length === 0) return;

    await markMultipleArticlesRead(unreadTargetIds);
    setReadIds((prev) => new Set([...prev, ...unreadTargetIds]));
  }, [articles, currentSelection, readIds, starredIds]);

  // Filtered articles list for keyboard navigation
  const visibleArticles = useMemo(() => {
    return articles.filter((art) => {
      if (currentSelection.type === 'unread') return !readIds.has(art.id);
      if (currentSelection.type === 'starred') return starredIds.has(art.id);
      if (currentSelection.type === 'category') return art.category === currentSelection.id;
      if (currentSelection.type === 'feed') return art.feedId === currentSelection.id;
      return true;
    });
  }, [articles, currentSelection, readIds, starredIds]);

  const currentIndex = useMemo(() => {
    if (!selectedArticle) return -1;
    return visibleArticles.findIndex((a) => a.id === selectedArticle.id);
  }, [visibleArticles, selectedArticle]);

  const handleNextArticle = useCallback(() => {
    if (visibleArticles.length === 0) return;
    const nextIdx = currentIndex + 1 < visibleArticles.length ? currentIndex + 1 : 0;
    handleSelectArticle(visibleArticles[nextIdx]);
  }, [visibleArticles, currentIndex, handleSelectArticle]);

  const handlePrevArticle = useCallback(() => {
    if (visibleArticles.length === 0) return;
    const prevIdx = currentIndex - 1 >= 0 ? currentIndex - 1 : visibleArticles.length - 1;
    handleSelectArticle(visibleArticles[prevIdx]);
  }, [visibleArticles, currentIndex, handleSelectArticle]);

  // Keyboard Shortcuts Handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept typing in inputs
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        if (e.key === 'Escape') {
          target.blur();
        }
        return;
      }

      if (e.key === 'Escape') {
        if (settingsModalOpen || feedManagerModalOpen || helpModalOpen) {
          setSettingsModalOpen(false);
          setFeedManagerModalOpen(false);
          setHelpModalOpen(false);
        } else if (mobileView === 'reader') {
          setMobileView('list');
        } else if (selectedArticle) {
          setSelectedArticle(null);
        }
        return;
      }

      switch (e.key.toLowerCase()) {
        case 'j':
          e.preventDefault();
          handleNextArticle();
          break;
        case 'k':
          e.preventDefault();
          handlePrevArticle();
          break;
        case 'm':
          if (selectedArticle) {
            e.preventDefault();
            handleToggleRead(selectedArticle.id);
          }
          break;
        case 's':
          if (selectedArticle) {
            e.preventDefault();
            handleToggleStar(selectedArticle.id);
          }
          break;
        case 'o':
        case 'v':
          if (selectedArticle) {
            e.preventDefault();
            window.open(selectedArticle.link, '_blank', 'noopener,noreferrer');
          }
          break;
        case 'r':
          e.preventDefault();
          refreshAllData(settings);
          break;
        case '?':
          e.preventDefault();
          setHelpModalOpen((prev) => !prev);
          break;
        case '/':
          e.preventDefault();
          const searchInput = document.querySelector('input[type="text"]') as HTMLInputElement;
          if (searchInput) searchInput.focus();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    selectedArticle,
    handleNextArticle,
    handlePrevArticle,
    handleToggleRead,
    handleToggleStar,
    refreshAllData,
    settings,
    settingsModalOpen,
    feedManagerModalOpen,
    helpModalOpen,
    mobileView,
  ]);

  // Calculate unread counts
  const totalUnreadCount = useMemo(() => {
    return articles.filter((a) => !readIds.has(a.id)).length;
  }, [articles, readIds]);

  const starredCount = useMemo(() => {
    return starredIds.size;
  }, [starredIds]);

  const feedUnreadCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const art of articles) {
      if (!readIds.has(art.id)) {
        counts[art.feedId] = (counts[art.feedId] || 0) + 1;
      }
    }
    return counts;
  }, [articles, readIds]);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#f1f1f1] dark:bg-[#1b1b1b] text-black dark:text-white font-sans selection:bg-[#EB6E00]/20 selection:text-[#EB6E00]">
      {/* 1. Desktop Sidebar */}
      <div className="hidden md:flex h-full shrink-0">
        <Sidebar
          categories={categories}
          feeds={feeds}
          stats={stats}
          currentSelection={currentSelection}
          onSelect={(sel) => {
            setCurrentSelection(sel);
            setSelectedArticle(null);
          }}
          unreadCount={totalUnreadCount}
          starredCount={starredCount}
          feedUnreadCounts={feedUnreadCounts}
          onRefresh={() => refreshAllData(settings)}
          isRefreshing={isRefreshing}
          onOpenSettings={() => setSettingsModalOpen(true)}
          onOpenFeedManager={() => setFeedManagerModalOpen(true)}
          onOpenHelp={() => setHelpModalOpen(true)}
          onMarkAllRead={handleMarkCurrentViewRead}
          theme={settings.theme}
          onToggleTheme={toggleTheme}
        />
      </div>

      {/* Mobile Drawer (Sidebar overlay on mobile) */}
      {mobileDrawerOpen && (
        <div className="fixed inset-0 z-40 md:hidden flex">
          <div
            className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-md"
            onClick={() => setMobileDrawerOpen(false)}
          />
          <div className="relative w-72 max-w-[80vw] h-full z-10 shadow-2xl animate-in slide-in-from-left duration-200">
            <Sidebar
              categories={categories}
              feeds={feeds}
              stats={stats}
              currentSelection={currentSelection}
              onSelect={(sel) => {
                setCurrentSelection(sel);
                setSelectedArticle(null);
                setMobileView('list');
              }}
              unreadCount={totalUnreadCount}
              starredCount={starredCount}
              feedUnreadCounts={feedUnreadCounts}
              onRefresh={() => refreshAllData(settings)}
              isRefreshing={isRefreshing}
              onOpenSettings={() => setSettingsModalOpen(true)}
              onOpenFeedManager={() => setFeedManagerModalOpen(true)}
              onOpenHelp={() => setHelpModalOpen(true)}
              onMarkAllRead={handleMarkCurrentViewRead}
              theme={settings.theme}
              onToggleTheme={toggleTheme}
              onCloseMobileDrawer={() => setMobileDrawerOpen(false)}
            />
          </div>
        </div>
      )}

      {/* 2. Middle Article List Column */}
      <div
        className={`h-full flex-col md:flex md:w-80 lg:w-96 shrink-0 ${
          mobileView === 'list' ? 'flex flex-1' : 'hidden'
        }`}
      >
        <ArticleList
          articles={articles}
          currentSelection={currentSelection}
          selectedArticleId={selectedArticle?.id || null}
          readIds={readIds}
          starredIds={starredIds}
          onSelectArticle={handleSelectArticle}
          onToggleRead={handleToggleRead}
          onToggleStar={handleToggleStar}
          onMarkCurrentViewRead={handleMarkCurrentViewRead}
          onOpenMobileDrawer={() => setMobileDrawerOpen(true)}
        />
        {/* Mobile bottom navigation bar */}
        <MobileNav
          currentSelection={currentSelection}
          unreadCount={totalUnreadCount}
          starredCount={starredCount}
          onOpenDrawer={() => setMobileDrawerOpen(true)}
          onSelectArticles={() => {
            setCurrentSelection({ type: 'all', title: '全部文章' });
            setMobileView('list');
          }}
          onSelectStarred={() => {
            setCurrentSelection({ type: 'starred', title: '星标收藏' });
            setMobileView('list');
          }}
          onOpenSettings={() => setSettingsModalOpen(true)}
        />
      </div>

      {/* 3. Right Reader View Column */}
      <div
        className={`h-full flex-col flex-1 ${
          mobileView === 'reader' ? 'flex' : 'hidden md:flex'
        }`}
      >
        <ReaderView
          articleSummary={selectedArticle}
          settings={settings}
          isRead={selectedArticle ? readIds.has(selectedArticle.id) : false}
          isStarred={selectedArticle ? starredIds.has(selectedArticle.id) : false}
          onToggleRead={() => selectedArticle && handleToggleRead(selectedArticle.id)}
          onToggleStar={() => selectedArticle && handleToggleStar(selectedArticle.id)}
          onNextArticle={handleNextArticle}
          onPrevArticle={handlePrevArticle}
          hasNext={currentIndex + 1 < visibleArticles.length}
          hasPrev={currentIndex > 0}
          onBackToList={() => setMobileView('list')}
        />
      </div>

      {/* Modals */}
      <SettingsModal
        isOpen={settingsModalOpen}
        onClose={() => setSettingsModalOpen(false)}
        settings={settings}
        onSaveSettings={(newSettings) => {
          setSettings(newSettings);
          saveSettings(newSettings);
          applyTheme(newSettings.theme, newSettings.palette);
        }}
        onSyncComplete={async () => {
          const updatedR = await getLocalReadIds();
          const updatedS = await getLocalStarredIds();
          setReadIds(updatedR);
          setStarredIds(updatedS);
        }}
      />

      <FeedManagerModal
        isOpen={feedManagerModalOpen}
        onClose={() => setFeedManagerModalOpen(false)}
        categories={categories}
        feeds={feeds}
        stats={stats}
      />

      <KeyboardHelpModal
        isOpen={helpModalOpen}
        onClose={() => setHelpModalOpen(false)}
      />
    </div>
  );
};
