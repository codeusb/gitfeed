import React, { useState, useMemo } from 'react';
import { Search, CheckCheck, Menu, X, Inbox } from 'lucide-react';
import { ArticleSummary, ViewSelection, FilterMode } from '../types';
import { ArticleCard } from './ArticleCard';

interface ArticleListProps {
  articles: ArticleSummary[];
  currentSelection: ViewSelection;
  selectedArticleId: string | null;
  readIds: Set<string>;
  starredIds: Set<string>;
  onSelectArticle: (article: ArticleSummary) => void;
  onToggleRead: (articleId: string) => void;
  onToggleStar: (articleId: string) => void;
  onMarkCurrentViewRead: () => void;
  onOpenMobileDrawer: () => void;
}

export const ArticleList: React.FC<ArticleListProps> = ({
  articles,
  currentSelection,
  selectedArticleId,
  readIds,
  starredIds,
  onSelectArticle,
  onToggleRead,
  onToggleStar,
  onMarkCurrentViewRead,
  onOpenMobileDrawer,
}) => {
  const [filterMode, setFilterMode] = useState<FilterMode>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // 1. Filter by currentSelection
  const scopedArticles = useMemo(() => {
    return articles.filter((art) => {
      if (currentSelection.type === 'unread') {
        return !readIds.has(art.id);
      }
      if (currentSelection.type === 'starred') {
        return starredIds.has(art.id);
      }
      if (currentSelection.type === 'category') {
        return art.category === currentSelection.id;
      }
      if (currentSelection.type === 'feed') {
        return art.feedId === currentSelection.id;
      }
      return true; // 'all'
    });
  }, [articles, currentSelection, readIds, starredIds]);

  // 2. Filter by search & filterMode
  const filteredArticles = useMemo(() => {
    return scopedArticles.filter((art) => {
      // Sub filter mode
      if (filterMode === 'unread' && readIds.has(art.id)) return false;
      if (filterMode === 'starred' && !starredIds.has(art.id)) return false;

      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const titleMatch = art.title.toLowerCase().includes(query);
        const snippetMatch = art.snippet.toLowerCase().includes(query);
        const authorMatch = art.author?.toLowerCase().includes(query);
        return titleMatch || snippetMatch || authorMatch;
      }

      return true;
    });
  }, [scopedArticles, filterMode, searchQuery, readIds, starredIds]);

  const unreadInCurrentView = scopedArticles.filter(a => !readIds.has(a.id)).length;

  return (
    <div className="flex-1 md:w-80 lg:w-96 md:flex-initial h-full flex flex-col bg-[#f1f1f1] dark:bg-[#1b1b1b] border-r border-black/[0.08] dark:border-white/[0.1] select-none transition-colors duration-175 ease-astryx">
      {/* Header */}
      <div className="p-3 border-b border-black/[0.08] dark:border-white/[0.1] bg-white/80 dark:bg-[#1b1b1b]/80 backdrop-blur-md space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <button
              onClick={onOpenMobileDrawer}
              className="md:hidden p-1.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 text-[#474747] dark:text-[#9e9e9e]"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h2 className="font-bold text-base text-black dark:text-white truncate max-w-[200px] tracking-tight">
              {currentSelection.title || '全部文章'}
            </h2>
            <span className="text-xs font-mono text-[#919191] dark:text-[#6a6a6a]">
              ({filteredArticles.length})
            </span>
          </div>

          {unreadInCurrentView > 0 && (
            <button
              onClick={onMarkCurrentViewRead}
              className="text-xs flex items-center space-x-1 text-[#474747] hover:text-[#EB6E00] dark:text-[#9e9e9e] dark:hover:text-[#FF7A1A] py-1 px-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 transition-all duration-175 ease-astryx"
              title="将当前列表全部标为已读"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              <span className="hidden sm:inline font-medium">标为已读</span>
            </button>
          )}
        </div>

        {/* Search bar */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#919191]" />
          <input
            type="text"
            placeholder="搜索文章或作者 (按 / 聚焦)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-8 py-2 text-xs rounded-xl bg-white dark:bg-[#222222] border border-black/[0.08] dark:border-white/[0.1] focus:border-[#EB6E00] focus:ring-1 focus:ring-[#EB6E00]/40 text-black dark:text-white placeholder:text-[#919191] outline-none transition-all duration-175 ease-astryx"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-[#919191] hover:text-black dark:hover:text-white"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Filter pills */}
        <div className="flex items-center space-x-1 bg-black/[0.04] dark:bg-white/[0.06] p-1 rounded-xl text-xs font-medium border border-black/[0.04] dark:border-white/[0.06]">
          {(['all', 'unread', 'starred'] as FilterMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => setFilterMode(mode)}
              className={`flex-1 py-1 rounded-lg transition-all duration-175 ease-astryx capitalize ${
                filterMode === mode
                  ? 'bg-white dark:bg-[#262626] text-black dark:text-white shadow-xs font-semibold'
                  : 'text-[#474747] dark:text-[#9e9e9e] hover:text-black dark:hover:text-white'
              }`}
            >
              {mode === 'all' ? '全部' : mode === 'unread' ? '未读' : '星标'}
            </button>
          ))}
        </div>
      </div>

      {/* Articles List */}
      <div className="flex-1 overflow-y-auto py-1.5">
        {filteredArticles.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center p-6 text-center text-[#919191]">
            <Inbox className="w-12 h-12 stroke-[1.2] mb-3 text-[#d4d4d4] dark:text-[#525252]" />
            <p className="text-sm font-medium text-black dark:text-white">暂无文章</p>
            <p className="text-xs text-[#919191] dark:text-[#6a6a6a] mt-1">
              {searchQuery ? '没有找到匹配的搜索结果' : '所有文章已读完，放松一下吧'}
            </p>
          </div>
        ) : (
          filteredArticles.map((article) => (
            <ArticleCard
              key={article.id}
              article={article}
              isSelected={selectedArticleId === article.id}
              isRead={readIds.has(article.id)}
              isStarred={starredIds.has(article.id)}
              onSelect={() => onSelectArticle(article)}
              onToggleRead={(e) => {
                e.stopPropagation();
                onToggleRead(article.id);
              }}
              onToggleStar={(e) => {
                e.stopPropagation();
                onToggleStar(article.id);
              }}
            />
          ))
        )}
      </div>
    </div>
  );
};
