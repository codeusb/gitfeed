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
          ? 'bg-black/[0.04] dark:bg-white/[0.08] border-[#EB6E00] dark:border-[#FF7A1A] shadow-sm ring-1 ring-[#EB6E00]/40'
          : isRead
          ? 'bg-white/50 dark:bg-[#1e1e1e]/60 border-black/[0.04] dark:border-white/[0.05] opacity-75 hover:opacity-100 hover:bg-white dark:hover:bg-[#222222]'
          : 'bg-white dark:bg-[#222222] border-black/[0.08] dark:border-white/[0.1] hover:border-black/20 dark:hover:border-white/20 shadow-xs'
      }`}
    >
      {/* Top Meta */}
      <div className="flex items-center justify-between text-xs mb-1.5 text-[#474747] dark:text-[#9e9e9e]">
        <div className="flex items-center space-x-1.5 min-w-0 pr-2">
          {!isRead && (
            <span className="w-2 h-2 rounded-full bg-[#EB6E00] shrink-0" title="未读" />
          )}
          <span className="font-semibold text-black dark:text-white truncate text-[11px] tracking-tight">
            {article.feedTitle}
          </span>
          <span className="text-[#919191]">•</span>
          <span className="shrink-0 font-mono text-[11px] text-[#919191] dark:text-[#6a6a6a]">
            {formatTime(article.publishedAt)}
          </span>
        </div>

        <div className="flex items-center space-x-1.5 shrink-0">
          <span className="text-[10px] font-mono text-[#919191] dark:text-[#6a6a6a] flex items-center gap-0.5">
            <Clock className="w-3 h-3" />
            {article.readTime}m
          </span>
          <button
            onClick={onToggleStar}
            className={`p-1 rounded-lg transition-all duration-175 ${
              isStarred
                ? 'text-amber-500 hover:text-amber-600'
                : 'text-[#919191] opacity-0 group-hover:opacity-100 hover:text-amber-500 hover:bg-black/5 dark:hover:bg-white/10'
            }`}
            title={isStarred ? '取消收藏' : '添加收藏'}
          >
            <Star className={`w-3.5 h-3.5 ${isStarred ? 'fill-current' : ''}`} />
          </button>
          <button
            onClick={onToggleRead}
            className="p-1 rounded-lg text-[#919191] hover:text-black dark:hover:text-white opacity-0 group-hover:opacity-100 hover:bg-black/5 dark:hover:bg-white/10 transition-all duration-175"
            title={isRead ? '标为未读' : '标为已读'}
          >
            {isRead ? <Circle className="w-3.5 h-3.5" /> : <CheckCircle className="w-3.5 h-3.5 text-[#EB6E00]" />}
          </button>
        </div>
      </div>

      {/* Main Body with thumbnail */}
      <div className="flex gap-3">
        <div className="flex-1 min-w-0">
          <h2
            className={`text-sm leading-snug line-clamp-2 mb-1 tracking-tight ${
              isRead
                ? 'text-[#474747] dark:text-[#9e9e9e] font-normal'
                : 'text-black dark:text-white font-semibold'
            }`}
          >
            {article.title}
          </h2>
          <p className="text-xs text-[#6a6a6a] dark:text-[#919191] line-clamp-2 leading-relaxed">
            {article.snippet}
          </p>
        </div>

        {article.coverImage && (
          <div className="w-16 h-16 rounded-xl overflow-hidden bg-black/5 dark:bg-white/5 border border-black/[0.06] dark:border-white/[0.08] shrink-0 self-start">
            <img
              src={article.coverImage}
              alt=""
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
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
