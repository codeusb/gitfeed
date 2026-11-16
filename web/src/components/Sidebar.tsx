import React, { useState } from 'react';
import {
  Inbox,
  Star,
  BookOpen,
  ChevronDown,
  ChevronRight,
  Settings,
  RefreshCw,
  Folder,
  Sun,
  Moon,
  CheckCheck
} from 'lucide-react';
import { Category, Feed, ViewSelection, FeedStats } from '../types';

interface SidebarProps {
  categories: Category[];
  feeds: Feed[];
  stats: FeedStats | null;
  currentSelection: ViewSelection;
  onSelect: (selection: ViewSelection) => void;
  unreadCount: number;
  starredCount: number;
  feedUnreadCounts: Record<string, number>;
  onRefresh: () => void;
  isRefreshing: boolean;
  onOpenSettings: () => void;
  onOpenFeedManager: () => void;
  onMarkAllRead: () => void;
  theme: 'dark' | 'light' | 'system';
  onToggleTheme: () => void;
  onCloseMobileDrawer?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  categories,
  feeds,
  stats,
  currentSelection,
  onSelect,
  unreadCount,
  starredCount,
  feedUnreadCounts,
  onRefresh,
  isRefreshing,
  onOpenSettings,
  onOpenFeedManager,
  onMarkAllRead,
  theme,
  onToggleTheme,
  onCloseMobileDrawer,
}) => {
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({});

  const toggleCategory = (catId: string) => {
    setCollapsedCategories(prev => ({ ...prev, [catId]: !prev[catId] }));
  };

  const handleSelect = (selection: ViewSelection) => {
    onSelect(selection);
    if (onCloseMobileDrawer) {
      onCloseMobileDrawer();
    }
  };

  return (
    <aside className="w-full md:w-64 lg:w-72 h-full flex flex-col bg-theme-surface border-r border-theme-subtle text-theme-primary select-none transition-colors duration-175 ease-astryx">
      {/* Brand Header */}
      <div className="p-4 border-b border-theme-subtle flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <img
            src="./favicon.png"
            alt="GitFeed"
            className="w-8 h-8 rounded-xl object-cover border border-theme-subtle shadow-sm"
          />
          <div>
            <h1 className="font-bold text-base leading-tight tracking-tight text-theme-primary flex items-center gap-1.5 font-sans">
              GitFeed
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-full bg-theme-accent-subtle text-theme-accent">
                Tokens
              </span>
            </h1>
            <p className="text-[11px] text-theme-muted">Git-as-Backend RSS</p>
          </div>
        </div>

        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          title="Refresh feeds"
          className="p-2 rounded-xl hover:bg-theme-subtle text-theme-secondary hover:text-theme-primary transition-all duration-175 ease-astryx"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-theme-accent' : ''}`} />
        </button>
      </div>

      {/* Main Views */}
      <div className="px-3 pt-3 pb-2 space-y-1">
        <button
          onClick={() => handleSelect({ type: 'unread', title: '未读文章' })}
          className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm font-medium transition-all duration-175 ease-astryx ${
            currentSelection.type === 'unread'
              ? 'bg-theme-accent text-theme-accent-contrast shadow-sm'
              : 'hover:bg-theme-subtle text-theme-secondary hover:text-theme-primary'
          }`}
        >
          <div className="flex items-center space-x-2.5">
            <Inbox className="w-4 h-4" />
            <span>未读文章</span>
          </div>
          {unreadCount > 0 && (
            <span
              className={`text-xs px-2 py-0.5 rounded-full font-mono font-semibold ${
                currentSelection.type === 'unread'
                  ? 'bg-black/20 dark:bg-white/20 text-inherit'
                  : 'bg-theme-subtle text-theme-primary'
              }`}
            >
              {unreadCount}
            </span>
          )}
        </button>

        <button
          onClick={() => handleSelect({ type: 'all', title: '全部文章' })}
          className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm font-medium transition-all duration-175 ease-astryx ${
            currentSelection.type === 'all'
              ? 'bg-theme-accent text-theme-accent-contrast shadow-sm'
              : 'hover:bg-theme-subtle text-theme-secondary hover:text-theme-primary'
          }`}
        >
          <div className="flex items-center space-x-2.5">
            <BookOpen className="w-4 h-4" />
            <span>全部文章</span>
          </div>
        </button>

        <button
          onClick={() => handleSelect({ type: 'starred', title: '星标收藏' })}
          className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm font-medium transition-all duration-175 ease-astryx ${
            currentSelection.type === 'starred'
              ? 'bg-theme-accent text-theme-accent-contrast shadow-sm'
              : 'hover:bg-theme-subtle text-theme-secondary hover:text-theme-primary'
          }`}
        >
          <div className="flex items-center space-x-2.5">
            <Star className="w-4 h-4" />
            <span>星标收藏</span>
          </div>
          {starredCount > 0 && (
            <span
              className={`text-xs px-2 py-0.5 rounded-full font-mono font-semibold ${
                currentSelection.type === 'starred'
                  ? 'bg-black/20 dark:bg-white/20 text-inherit'
                  : 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
              }`}
            >
              {starredCount}
            </span>
          )}
        </button>
      </div>

      {/* Categories & Feeds Section */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-4">
        <div className="flex items-center justify-between px-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-theme-muted">
            订阅源列表
          </span>
          <button
            onClick={onOpenFeedManager}
            className="text-[11px] text-theme-accent hover:underline font-medium transition-colors"
          >
            管理源
          </button>
        </div>

        {categories.map((category) => {
          const catFeeds = feeds.filter(f => f.category === category.id);
          const isCollapsed = collapsedCategories[category.id];
          const isCategorySelected =
            currentSelection.type === 'category' && currentSelection.id === category.id;

          const catUnread = catFeeds.reduce(
            (sum, f) => sum + (feedUnreadCounts[f.id] || 0),
            0
          );

          return (
            <div key={category.id} className="space-y-0.5">
              <div
                className={`group flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-all duration-175 ease-astryx ${
                  isCategorySelected
                    ? 'bg-theme-accent-subtle text-theme-accent'
                    : 'text-theme-secondary hover:bg-theme-subtle hover:text-theme-primary'
                }`}
              >
                <div
                  className="flex items-center space-x-2 flex-1 min-w-0"
                  onClick={() => handleSelect({ type: 'category', id: category.id, title: category.name })}
                >
                  <Folder className="w-3.5 h-3.5 opacity-70 shrink-0" />
                  <span className="truncate">{category.name}</span>
                </div>

                <div className="flex items-center space-x-1 shrink-0">
                  {catUnread > 0 && (
                    <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-theme-subtle font-mono font-bold text-theme-primary">
                      {catUnread}
                    </span>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleCategory(category.id);
                    }}
                    className="p-1 hover:text-theme-primary rounded-md"
                  >
                    {isCollapsed ? (
                      <ChevronRight className="w-3.5 h-3.5" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Sub Feeds */}
              {!isCollapsed && (
                <div className="pl-3.5 space-y-0.5 border-l border-theme-subtle ml-2.5 mt-1">
                  {catFeeds.map((feed) => {
                    const isFeedSelected =
                      currentSelection.type === 'feed' && currentSelection.id === feed.id;
                    const unread = feedUnreadCounts[feed.id] || 0;

                    return (
                      <button
                        key={feed.id}
                        onClick={() => handleSelect({ type: 'feed', id: feed.id, title: feed.title })}
                        className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs transition-all duration-175 ease-astryx ${
                          isFeedSelected
                            ? 'bg-theme-accent-subtle text-theme-accent font-semibold'
                            : 'text-theme-secondary hover:bg-theme-subtle hover:text-theme-primary'
                        }`}
                      >
                        <span className="truncate pr-1 text-left">{feed.title}</span>
                        {unread > 0 && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-theme-accent-subtle text-theme-accent font-mono font-semibold shrink-0">
                            {unread}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Bottom Controls */}
      <div className="p-3 border-t border-theme-subtle space-y-2.5">
        <a
          href="https://github.com/codeusb/gitfeed/releases/latest"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center space-x-1.5 py-2 px-3 rounded-xl bg-theme-subtle hover:bg-theme-subtle-hover text-theme-primary text-xs font-semibold border border-theme-subtle transition-all duration-175 ease-astryx shadow-xs"
          title="在 GitHub Releases 下载安卓客户端安装包"
        >
          <span>📲 下载 Android APK</span>
        </a>

        <div className="flex items-center justify-between text-xs text-theme-secondary">
          <button
            onClick={onMarkAllRead}
            className="flex items-center space-x-1.5 px-2 py-1.5 rounded-xl hover:bg-theme-subtle text-theme-secondary hover:text-theme-primary transition-all duration-175 ease-astryx"
            title="全部标为已读"
          >
            <CheckCheck className="w-3.5 h-3.5 text-theme-success" />
            <span>全部已读</span>
          </button>

          <div className="flex items-center space-x-1">
            <button
              onClick={onToggleTheme}
              className="p-1.5 rounded-xl hover:bg-theme-subtle hover:text-theme-primary transition-all duration-175 ease-astryx"
              title="切换主题 (日间 / 夜间)"
            >
              {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            </button>

            <button
              onClick={onOpenSettings}
              className="p-1.5 rounded-xl hover:bg-theme-subtle hover:text-theme-primary transition-all duration-175 ease-astryx"
              title="设置"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>

        {stats?.lastUpdated && (
          <div className="text-[10px] text-center text-theme-muted font-mono truncate">
            更新于: {new Date(stats.lastUpdated).toLocaleDateString()} {new Date(stats.lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        )}
      </div>
    </aside>
  );
};
