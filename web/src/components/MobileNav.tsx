import React from 'react';
import { Rss, BookOpen, Star, Settings } from 'lucide-react';
import { ViewSelection } from '../types';

interface MobileNavProps {
  currentSelection: ViewSelection;
  unreadCount: number;
  starredCount: number;
  onOpenDrawer: () => void;
  onSelectArticles: () => void;
  onSelectStarred: () => void;
  onOpenSettings: () => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({
  currentSelection,
  unreadCount,
  starredCount,
  onOpenDrawer,
  onSelectArticles,
  onSelectStarred,
  onOpenSettings,
}) => {
  return (
    <nav className="md:hidden h-14 bg-white/95 dark:bg-slate-900/95 backdrop-blur border-t border-slate-200 dark:border-slate-800 flex items-center justify-around px-2 shrink-0 z-20 pb-safe">
      <button
        onClick={onOpenDrawer}
        className="flex flex-col items-center justify-center py-1 px-3 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
      >
        <Rss className="w-5 h-5 mb-0.5" />
        <span className="text-[10px] font-medium">订阅源</span>
      </button>

      <button
        onClick={onSelectArticles}
        className={`flex flex-col items-center justify-center py-1 px-3 relative transition-colors ${
          currentSelection.type !== 'starred'
            ? 'text-orange-500 font-semibold'
            : 'text-slate-500 dark:text-slate-400'
        }`}
      >
        <BookOpen className="w-5 h-5 mb-0.5" />
        <span className="text-[10px]">文章</span>
        {unreadCount > 0 && (
          <span className="absolute top-1 right-2 w-2 h-2 rounded-full bg-orange-500" />
        )}
      </button>

      <button
        onClick={onSelectStarred}
        className={`flex flex-col items-center justify-center py-1 px-3 relative transition-colors ${
          currentSelection.type === 'starred'
            ? 'text-orange-500 font-semibold'
            : 'text-slate-500 dark:text-slate-400'
        }`}
      >
        <Star className={`w-5 h-5 mb-0.5 ${currentSelection.type === 'starred' ? 'fill-current' : ''}`} />
        <span className="text-[10px]">星标</span>
        {starredCount > 0 && (
          <span className="absolute top-1 right-2 w-2 h-2 rounded-full bg-amber-500" />
        )}
      </button>

      <button
        onClick={onOpenSettings}
        className="flex flex-col items-center justify-center py-1 px-3 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
      >
        <Settings className="w-5 h-5 mb-0.5" />
        <span className="text-[10px] font-medium">设置</span>
      </button>
    </nav>
  );
};
