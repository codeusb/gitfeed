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
    <div className="flex-1 md:w-80 lg:w-96 md:flex-initial h-full flex flex-col bg-theme-page border-r border-theme-subtle select-none transition-colors duration-175 ease-astryx">
      {/* Header */}
      <div className="p-3 border-b border-theme-subtle bg-theme-surface/85 backdrop-blur-md space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <button
              onClick={onOpenMobileDrawer}
              className="md:hidden p-1.5 rounded-xl hover:bg-theme-subtle text-theme-secondary"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h2 className="font-bold text-base text-theme-primary truncate max-w-[200px] tracking-tight">
              {currentSelection.title || '全部文章'}
            </h2>
            <span className="text-xs font-mono text-theme-muted">
              ({filteredArticles.length})
            </span>
          </div>

          {unreadInCurrentView > 0 && (
            <button
              onClick={onMarkCurrentViewRead}
              className="text-xs flex items-center space-x-1 text-theme-secondary hover:text-theme-accent py-1 px-2 rounded-xl hover:bg-theme-subtle transition-all duration-175 ease-astryx"
              title="将当前列表全部标为已读"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              <span className="hidden sm:inline font-medium">标为已读</span>
            </button>
          )}
        </div>

        {/* Search bar */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-theme-muted" />
          <input
            type="text"
            placeholder="搜索文章或作者 (按 / 聚焦)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-8 py-2 text-xs rounded-xl bg-theme-card border border-theme-subtle focus:border-theme-accent focus:ring-1 focus:ring-theme-accent/40 text-theme-primary placeholder:text-theme-muted outline-none transition-all duration-175 ease-astryx"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-theme-muted hover:text-theme-primary"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Filter pills */}
        <div className="flex items-center space-x-1 bg-theme-subtle p-1 rounded-xl text-xs font-medium border border-theme-subtle">
          {(['all', 'unread', 'starred'] as FilterMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => setFilterMode(mode)}
              className={`flex-1 py-1 rounded-lg transition-all duration-175 ease-astryx capitalize ${
                filterMode === mode
                  ? 'bg-theme-card text-theme-primary shadow-xs font-semibold'
                  : 'text-theme-secondary hover:text-theme-primary'
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
          <div className="h-64 flex flex-col items-center justify-center p-6 text-center text-theme-muted">
            <Inbox className="w-12 h-12 stroke-[1.2] mb-3 opacity-40 text-theme-primary" />
            <p className="text-sm font-medium text-theme-primary">暂无文章</p>
            <p className="text-xs text-theme-muted mt-1">
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
