import React, { useState } from 'react';
import {
  Rss,
  Inbox,
  Star,
  BookOpen,
  ChevronDown,
  ChevronRight,
  Settings,
  RefreshCw,
  Folder,
  Sliders,
  HelpCircle,
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
  onOpenHelp: () => void;
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
  onOpenHelp,
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
    <aside className="w-full md:w-64 lg:w-72 h-full flex flex-col bg-slate-100/90 dark:bg-slate-900/90 border-r border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 select-none">
      {/* Brand Header */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-orange-500 to-amber-500 flex items-center justify-center text-white shadow-sm">
            <Rss className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-bold text-base leading-tight tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5">
              GitFeed
              <span className="text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded bg-orange-500/10 text-orange-600 dark:text-orange-400">
                PWA
              </span>
            </h1>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">Git-as-Backend RSS</p>
          </div>
        </div>

        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          title="Refresh feeds"
          className="p-1.5 rounded-md hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-orange-500' : ''}`} />
        </button>
      </div>

      {/* Main Views */}
      <div className="px-3 pt-3 pb-2 space-y-1">
        <button
          onClick={() => handleSelect({ type: 'unread', title: '未读文章' })}
          className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
            currentSelection.type === 'unread'
              ? 'bg-orange-500 text-white shadow-sm shadow-orange-500/30'
              : 'hover:bg-slate-200/60 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300'
          }`}
        >
          <div className="flex items-center space-x-2.5">
            <Inbox className="w-4 h-4" />
            <span>未读文章</span>
          </div>
          {unreadCount > 0 && (
            <span
              className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                currentSelection.type === 'unread'
                  ? 'bg-white/20 text-white'
                  : 'bg-orange-500/10 text-orange-600 dark:text-orange-400'
              }`}
            >
              {unreadCount}
            </span>
          )}
        </button>

        <button
          onClick={() => handleSelect({ type: 'all', title: '全部文章' })}
          className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
            currentSelection.type === 'all'
              ? 'bg-orange-500 text-white shadow-sm shadow-orange-500/30'
              : 'hover:bg-slate-200/60 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300'
          }`}
        >
          <div className="flex items-center space-x-2.5">
            <BookOpen className="w-4 h-4" />
            <span>全部文章</span>
          </div>
        </button>

        <button
          onClick={() => handleSelect({ type: 'starred', title: '星标收藏' })}
          className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
            currentSelection.type === 'starred'
              ? 'bg-orange-500 text-white shadow-sm shadow-orange-500/30'
              : 'hover:bg-slate-200/60 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300'
          }`}
        >
          <div className="flex items-center space-x-2.5">
            <Star className="w-4 h-4" />
            <span>星标收藏</span>
          </div>
          {starredCount > 0 && (
            <span
              className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                currentSelection.type === 'starred'
                  ? 'bg-white/20 text-white'
                  : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
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
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            订阅源列表
          </span>
          <button
            onClick={onOpenFeedManager}
            className="text-[11px] text-orange-600 dark:text-orange-400 hover:underline font-medium"
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
                className={`group flex items-center justify-between px-2 py-1.5 rounded-md text-xs font-semibold cursor-pointer transition-colors ${
                  isCategorySelected
                    ? 'bg-slate-200 dark:bg-slate-800 text-orange-600 dark:text-orange-400'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-800/50'
                }`}
              >
                <div
                  className="flex items-center space-x-1.5 flex-1 min-w-0"
                  onClick={() => handleSelect({ type: 'category', id: category.id, title: category.name })}
                >
                  <Folder className="w-3.5 h-3.5 opacity-70 shrink-0" />
                  <span className="truncate">{category.name}</span>
                </div>

                <div className="flex items-center space-x-1 shrink-0">
                  {catUnread > 0 && (
                    <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-300/60 dark:bg-slate-800 font-bold">
                      {catUnread}
                    </span>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleCategory(category.id);
                    }}
                    className="p-0.5 hover:text-slate-900 dark:hover:text-white"
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
                <div className="pl-3.5 space-y-0.5 border-l border-slate-200 dark:border-slate-800 ml-2 mt-1">
                  {catFeeds.map((feed) => {
                    const isFeedSelected =
                      currentSelection.type === 'feed' && currentSelection.id === feed.id;
                    const unread = feedUnreadCounts[feed.id] || 0;

                    return (
                      <button
                        key={feed.id}
                        onClick={() => handleSelect({ type: 'feed', id: feed.id, title: feed.title })}
                        className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs transition-colors ${
                          isFeedSelected
                            ? 'bg-orange-500/10 text-orange-600 dark:text-orange-400 font-medium'
                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-800/50'
                        }`}
                      >
                        <span className="truncate pr-1 text-left">{feed.title}</span>
                        {unread > 0 && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-orange-500/10 text-orange-600 dark:text-orange-400 font-semibold shrink-0">
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
      <div className="p-3 border-t border-slate-200 dark:border-slate-800 space-y-2">
        <a
          href="https://github.com/codeusb/gitfeed/releases/latest"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center space-x-1.5 py-1.5 px-3 rounded-lg bg-orange-500/10 hover:bg-orange-500/20 text-orange-600 dark:text-orange-400 text-xs font-semibold transition-colors"
          title="在 GitHub Releases 下载安卓客户端安装包"
        >
          <span>📲 下载 Android APK</span>
        </a>

        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <button
            onClick={onMarkAllRead}
            className="flex items-center space-x-1.5 px-2 py-1 rounded hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
            title="全部标为已读"
          >
            <CheckCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>全部已读</span>
          </button>

          <div className="flex items-center space-x-1">
            <button
              onClick={onToggleTheme}
              className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
              title="切换主题"
            >
              {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            </button>

            <button
              onClick={onOpenHelp}
              className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
              title="快捷键说明"
            >
              <HelpCircle className="w-4 h-4" />
            </button>

            <button
              onClick={onOpenSettings}
              className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
              title="设置"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>

        {stats?.lastUpdated && (
          <div className="text-[10px] text-center text-slate-400 dark:text-slate-500 truncate">
            更新于: {new Date(stats.lastUpdated).toLocaleDateString()} {new Date(stats.lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        )}
      </div>
    </aside>
  );
};
