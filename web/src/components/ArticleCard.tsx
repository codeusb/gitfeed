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
      if (diffMins < 60) return `${diffMins} 分钟前`;
      if (diffHours < 24) return `${diffHours} 小时前`;
      if (diffDays === 1) return '昨天';
      if (diffDays < 7) return `${diffDays} 天前`;
      return pubDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    } catch {
      return '';
    }
  };

  return (
    <div
      onClick={onSelect}
      className={`group relative p-3.5 border-b border-slate-200 dark:border-slate-800/80 cursor-pointer transition-colors ${
        isSelected
          ? 'bg-orange-500/10 dark:bg-orange-950/30'
          : isRead
          ? 'bg-transparent opacity-75 hover:bg-slate-100/50 dark:hover:bg-slate-900/40'
          : 'bg-white dark:bg-slate-900/60 hover:bg-slate-50 dark:hover:bg-slate-900'
      }`}
    >
      {/* Top Meta */}
      <div className="flex items-center justify-between text-xs mb-1.5 text-slate-500 dark:text-slate-400">
        <div className="flex items-center space-x-1.5 min-w-0 pr-2">
          {!isRead && (
            <span className="w-2 h-2 rounded-full bg-orange-500 shrink-0" title="未读" />
          )}
          <span className="font-semibold text-slate-700 dark:text-slate-300 truncate">
            {article.feedTitle}
          </span>
          <span>•</span>
          <span className="shrink-0">{formatTime(article.publishedAt)}</span>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <span className="text-[11px] text-slate-400 flex items-center gap-0.5">
            <Clock className="w-3 h-3" />
            {article.readTime}m
          </span>
          <button
            onClick={onToggleStar}
            className={`p-1 rounded transition-colors ${
              isStarred
                ? 'text-amber-500 hover:text-amber-600'
                : 'text-slate-400 opacity-0 group-hover:opacity-100 hover:text-amber-500'
            }`}
            title={isStarred ? '取消收藏' : '添加收藏'}
          >
            <Star className={`w-3.5 h-3.5 ${isStarred ? 'fill-current' : ''}`} />
          </button>
          <button
            onClick={onToggleRead}
            className={`p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 opacity-0 group-hover:opacity-100 transition-opacity`}
            title={isRead ? '标为未读' : '标为已读'}
          >
            {isRead ? <Circle className="w-3.5 h-3.5" /> : <CheckCircle className="w-3.5 h-3.5 text-orange-500" />}
          </button>
        </div>
      </div>

      {/* Main Body with thumbnail */}
      <div className="flex gap-3">
        <div className="flex-1 min-w-0">
          <h2
            className={`text-sm font-semibold leading-snug line-clamp-2 mb-1 ${
              isRead
                ? 'text-slate-600 dark:text-slate-400 font-normal'
                : 'text-slate-900 dark:text-slate-100'
            }`}
          >
            {article.title}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
            {article.snippet}
          </p>
        </div>

        {article.coverImage && (
          <div className="w-16 h-16 rounded-md overflow-hidden bg-slate-200 dark:bg-slate-800 shrink-0 self-start">
            <img
              src={article.coverImage}
              alt=""
              loading="lazy"
              className="w-full h-full object-cover"
              onError={(e) => {
                // Hide broken images gracefully
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
};
