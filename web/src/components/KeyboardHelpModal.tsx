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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-white dark:bg-[#222222] rounded-2xl shadow-2xl border border-black/[0.08] dark:border-white/[0.1] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-black/[0.08] dark:border-white/[0.1] flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <Keyboard className="w-5 h-5 text-[#EB6E00]" />
            <h2 className="text-base font-bold text-black dark:text-white tracking-tight">键盘快捷键</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-[#919191] hover:text-black dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-all duration-175"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Shortcuts list */}
        <div className="p-6 divide-y divide-black/[0.05] dark:divide-white/[0.05] text-xs">
          {shortcuts.map((item, idx) => (
            <div key={idx} className="py-2.5 flex items-center justify-between">
              <span className="text-[#474747] dark:text-[#9e9e9e] font-medium">{item.desc}</span>
              <kbd className="px-2.5 py-1 rounded-xl bg-black/[0.04] dark:bg-white/[0.06] border border-black/[0.08] dark:border-white/[0.1] text-black dark:text-white font-mono font-semibold shadow-xs">
                {item.key}
              </kbd>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-black/[0.08] dark:border-white/[0.1] bg-black/[0.02] dark:bg-white/[0.02] flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/15 text-black dark:text-white transition-all duration-175"
          >
            知道了
          </button>
        </div>
      </div>
    </div>
  );
};
