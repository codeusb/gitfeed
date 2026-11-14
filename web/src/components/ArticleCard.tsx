import React from 'react';
import { Star, CheckCircle, Circle, Clock } from 'lucide-react';
import { ArticleSummary } from '../types';

interface ArticleCardProps {
  article: ArticleSummary;
  isSelected: boolean;
  isRead: boolean;
  isStarred: boolean;
  onSelect: () => void;
  onToggleRead: (e: React.MouseEvent) => void;
  onToggleStar: (e: React.MouseEvent) => void;
}

export const ArticleCard: React.FC<ArticleCardProps> = ({
  article,
  isSelected,
  isRead,
  isStarred,
  onSelect,
  onToggleRead,
  onToggleStar,
}) => {
  const formatTime = (dateStr: string) => {
    try {
      const pubDate = new Date(dateStr);
      const now = new Date();
      const diffMs = now.getTime() - pubDate.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffMins < 1) return '刚刚';
      if (diffMins < 60) return `${diffMins}m 前`;
      if (diffHours < 24) return `${diffHours}h 前`;
      if (diffDays === 1) return '昨天';
      if (diffDays < 7) return `${diffDays}d 前`;
      return pubDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    } catch {
      return '';
    }
  };

  return (
    <div
      onClick={onSelect}
      className={`group relative mx-2.5 my-1.5 p-3.5 rounded-2xl border transition-all duration-175 ease-astryx cursor-pointer ${
        isSelected
          ? 'bg-theme-accent-subtle border-theme-accent shadow-sm ring-1 ring-theme-accent/40'
          : isRead
          ? 'bg-theme-card/60 border-theme-subtle opacity-75 hover:opacity-100 hover:bg-theme-card'
          : 'bg-theme-card border-theme-subtle hover:border-theme-muted shadow-xs'
      }`}
    >
      {/* Top Meta */}
      <div className="flex items-center justify-between text-xs mb-1.5 text-theme-secondary">
        <div className="flex items-center space-x-1.5 min-w-0 pr-2">
          {!isRead && (
            <span className="w-2 h-2 rounded-full bg-theme-accent shrink-0" title="未读" />
          )}
          <span className="font-semibold text-theme-primary truncate text-[11px] tracking-tight">
            {article.feedTitle}
          </span>
          <span className="text-theme-muted">•</span>
          <span className="shrink-0 font-mono text-[11px] text-theme-muted">
            {formatTime(article.publishedAt)}
          </span>
        </div>

        <div className="flex items-center space-x-1.5 shrink-0">
          <span className="text-[10px] font-mono text-theme-muted flex items-center gap-0.5">
            <Clock className="w-3 h-3" />
            {article.readTime}m
          </span>
          <button
            onClick={onToggleStar}
            className={`p-1 rounded-lg transition-all duration-175 ${
              isStarred
                ? 'text-amber-500 hover:text-amber-600'
                : 'text-theme-muted opacity-0 group-hover:opacity-100 hover:text-amber-500 hover:bg-theme-subtle'
            }`}
            title={isStarred ? '取消收藏' : '添加收藏'}
          >
            <Star className={`w-3.5 h-3.5 ${isStarred ? 'fill-current' : ''}`} />
          </button>
          <button
            onClick={onToggleRead}
            className="p-1 rounded-lg text-theme-muted hover:text-theme-primary opacity-0 group-hover:opacity-100 hover:bg-theme-subtle transition-all duration-175"
            title={isRead ? '标为未读' : '标为已读'}
          >
            {isRead ? <Circle className="w-3.5 h-3.5" /> : <CheckCircle className="w-3.5 h-3.5 text-theme-accent" />}
          </button>
        </div>
      </div>

      {/* Main Body with thumbnail */}
      <div className="flex gap-3">
        <div className="flex-1 min-w-0">
          <h2
            className={`text-sm leading-snug line-clamp-2 mb-1 tracking-tight ${
              isRead
                ? 'text-theme-secondary font-normal'
                : 'text-theme-primary font-semibold'
            }`}
          >
            {article.title}
          </h2>
          <p className="text-xs text-theme-muted line-clamp-2 leading-relaxed">
            {article.snippet}
          </p>
        </div>

        {article.coverImage && (
          <div className="w-16 h-16 rounded-xl overflow-hidden bg-theme-subtle border border-theme-subtle shrink-0 self-start">
            <img
              src={article.coverImage}
              alt=""
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
};
