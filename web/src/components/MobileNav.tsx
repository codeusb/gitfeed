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
    <nav className="md:hidden h-14 bg-white/90 dark:bg-[#1b1b1b]/90 backdrop-blur-lg border-t border-black/[0.08] dark:border-white/[0.1] flex items-center justify-around px-2 shrink-0 z-20 pb-safe transition-colors duration-175 ease-astryx">
      <button
        onClick={onOpenDrawer}
        className="flex flex-col items-center justify-center py-1.5 px-3 rounded-xl text-[#474747] dark:text-[#9e9e9e] hover:text-black dark:hover:text-white transition-all duration-175"
      >
        <Rss className="w-5 h-5 mb-0.5" />
        <span className="text-[10px] font-medium tracking-tight">订阅源</span>
      </button>

      <button
        onClick={onSelectArticles}
        className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-xl relative transition-all duration-175 ${
          currentSelection.type !== 'starred'
            ? 'text-[#EB6E00] dark:text-[#FF7A1A] font-semibold'
            : 'text-[#474747] dark:text-[#9e9e9e]'
        }`}
      >
        <BookOpen className="w-5 h-5 mb-0.5" />
        <span className="text-[10px] tracking-tight">文章</span>
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-2.5 w-1.5 h-1.5 rounded-full bg-[#EB6E00]" />
        )}
      </button>

      <button
        onClick={onSelectStarred}
        className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-xl relative transition-all duration-175 ${
          currentSelection.type === 'starred'
            ? 'text-[#EB6E00] dark:text-[#FF7A1A] font-semibold'
            : 'text-[#474747] dark:text-[#9e9e9e]'
        }`}
      >
        <Star className={`w-5 h-5 mb-0.5 ${currentSelection.type === 'starred' ? 'fill-current text-amber-500' : ''}`} />
        <span className="text-[10px] tracking-tight">星标</span>
        {starredCount > 0 && (
          <span className="absolute top-1.5 right-2.5 w-1.5 h-1.5 rounded-full bg-amber-500" />
        )}
      </button>

      <button
        onClick={onOpenSettings}
        className="flex flex-col items-center justify-center py-1.5 px-3 rounded-xl text-[#474747] dark:text-[#9e9e9e] hover:text-black dark:hover:text-white transition-all duration-175"
      >
        <Settings className="w-5 h-5 mb-0.5" />
        <span className="text-[10px] font-medium tracking-tight">设置</span>
      </button>
    </nav>
  );
};
