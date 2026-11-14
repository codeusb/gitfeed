import React from 'react';
import { X, Keyboard } from 'lucide-react';

interface KeyboardHelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const KeyboardHelpModal: React.FC<KeyboardHelpModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const shortcuts = [
    { key: 'J', desc: '阅读下一篇文章' },
    { key: 'K', desc: '阅读上一篇文章' },
    { key: 'M', desc: '切换已读 / 未读状态' },
    { key: 'S', desc: '星标 / 取消星标收藏' },
    { key: 'O / V', desc: '在新标签页中打开原文' },
    { key: '/', desc: '快速聚焦搜索输入框' },
    { key: 'R', desc: '刷新文章与远程同步' },
    { key: '?', desc: '打开 / 关闭本快捷键指南' },
    { key: 'Esc', desc: '关闭弹窗 / 取消文章选中' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Keyboard className="w-5 h-5 text-orange-500" />
            <h2 className="text-base font-bold text-slate-900 dark:text-white">键盘快捷键</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Shortcuts list */}
        <div className="p-6 divide-y divide-slate-100 dark:divide-slate-800/80 text-xs">
          {shortcuts.map((item, idx) => (
            <div key={idx} className="py-2.5 flex items-center justify-between">
              <span className="text-slate-600 dark:text-slate-300 font-medium">{item.desc}</span>
              <kbd className="px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-mono font-semibold shadow-xs">
                {item.key}
              </kbd>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-semibold bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 transition-colors"
          >
            知道了
          </button>
        </div>
      </div>
    </div>
  );
};
