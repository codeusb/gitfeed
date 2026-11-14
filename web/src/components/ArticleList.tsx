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
    <div className="flex-1 md:w-80 lg:w-96 md:flex-initial h-full flex flex-col bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800">
      {/* Header */}
      <div className="p-3 border-b border-slate-200 dark:border-slate-800 space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <button
              onClick={onOpenMobileDrawer}
              className="md:hidden p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h2 className="font-bold text-base text-slate-900 dark:text-slate-100 truncate max-w-[200px]">
              {currentSelection.title || '全部文章'}
            </h2>
            <span className="text-xs text-slate-400 font-medium">
              ({filteredArticles.length})
            </span>
          </div>

          {unreadInCurrentView > 0 && (
            <button
              onClick={onMarkCurrentViewRead}
              className="text-xs flex items-center space-x-1 text-slate-500 hover:text-orange-600 dark:hover:text-orange-400 py-1 px-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="将当前列表全部标为已读"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">标为已读</span>
            </button>
          )}
        </div>

        {/* Search bar */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="搜索文章或作者 (按 / 聚焦)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-7 py-1.5 text-xs rounded-lg bg-slate-100 dark:bg-slate-800/80 border border-transparent focus:border-orange-500 focus:bg-white dark:focus:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 outline-none transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Filter pills */}
        <div className="flex items-center space-x-1 bg-slate-100 dark:bg-slate-800/60 p-0.5 rounded-lg text-xs font-medium">
          {(['all', 'unread', 'starred'] as FilterMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => setFilterMode(mode)}
              className={`flex-1 py-1 rounded-md transition-colors capitalize ${
                filterMode === mode
                  ? 'bg-white dark:bg-slate-900 text-orange-600 dark:text-orange-400 shadow-sm font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              {mode === 'all' ? '全部' : mode === 'unread' ? '未读' : '星标'}
            </button>
          ))}
        </div>
      </div>

      {/* Articles List */}
      <div className="flex-1 overflow-y-auto">
        {filteredArticles.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center p-6 text-center text-slate-400">
            <Inbox className="w-12 h-12 stroke-[1.2] mb-3 text-slate-300 dark:text-slate-700" />
            <p className="text-sm font-medium">暂无文章</p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
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
