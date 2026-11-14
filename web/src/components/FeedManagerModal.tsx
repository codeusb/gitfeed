import React, { useState } from 'react';
import { X, Rss, Download, ExternalLink, CheckCircle, AlertTriangle, FileCode } from 'lucide-react';
import { Category, Feed, FeedStats } from '../types';
import { OpmlService } from '../services/opmlService';

interface FeedManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  feeds: Feed[];
  stats: FeedStats | null;
}

export const FeedManagerModal: React.FC<FeedManagerModalProps> = ({
  isOpen,
  onClose,
  categories,
  feeds,
  stats,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  if (!isOpen) return null;

  const handleExportOpml = () => {
    OpmlService.downloadOpmlFile(categories, feeds);
  };

  const filteredFeeds = feeds.filter(
    (f) => selectedCategory === 'all' || f.category === selectedCategory
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
      <div className="w-full max-w-2xl bg-white dark:bg-[#222222] rounded-2xl shadow-2xl border border-black/[0.08] dark:border-white/[0.1] overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-black/[0.08] dark:border-white/[0.1] flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <Rss className="w-5 h-5 text-[#EB6E00]" />
            <h2 className="text-base font-bold text-black dark:text-white tracking-tight">订阅源管理与健康状态</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-[#919191] hover:text-black dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-all duration-175"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar & Category filter */}
        <div className="px-6 py-3 bg-black/[0.02] dark:bg-white/[0.02] border-b border-black/[0.08] dark:border-white/[0.1] flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center space-x-1.5 overflow-x-auto text-xs py-1">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-1.5 rounded-xl font-medium transition-all duration-175 ease-astryx ${
                selectedCategory === 'all'
                  ? 'bg-[#EB6E00] text-white shadow-xs'
                  : 'bg-black/5 dark:bg-white/10 text-[#474747] dark:text-[#9e9e9e] hover:text-black dark:hover:text-white'
              }`}
            >
              全部 ({feeds.length})
            </button>
            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedCategory(c.id)}
                className={`px-3 py-1.5 rounded-xl font-medium transition-all duration-175 ease-astryx ${
                  selectedCategory === c.id
                    ? 'bg-[#EB6E00] text-white shadow-xs'
                    : 'bg-black/5 dark:bg-white/10 text-[#474747] dark:text-[#9e9e9e] hover:text-black dark:hover:text-white'
                }`}
              >
                {c.name} ({feeds.filter((f) => f.category === c.id).length})
              </button>
            ))}
          </div>

          <button
            onClick={handleExportOpml}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white dark:bg-[#1b1b1b] hover:bg-black/5 dark:hover:bg-white/10 text-black dark:text-white border border-black/[0.08] dark:border-white/[0.1] shadow-xs transition-all duration-175 ease-astryx"
          >
            <Download className="w-3.5 h-3.5 text-[#EB6E00]" />
            <span>导出 OPML 订阅列表</span>
          </button>
        </div>

        {/* Feeds List Table */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="p-3.5 bg-[#EB6E00]/5 border border-[#EB6E00]/20 rounded-xl text-xs text-[#EB6E00] dark:text-[#FF7A1A] flex items-start space-x-2.5">
            <FileCode className="w-4 h-4 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong>提示：</strong> 增加或删除订阅源非常简单，只需在你的 GitHub 仓库根目录编辑 <code className="bg-[#EB6E00]/10 px-1.5 py-0.5 rounded font-mono text-[11px]">feeds.json</code> 即可。下次 GitHub Actions 运行时会自动抓取新增的订阅源。
            </p>
          </div>

          <div className="border border-black/[0.08] dark:border-white/[0.1] rounded-2xl overflow-hidden bg-white dark:bg-[#1f1f1f]">
            <table className="w-full text-left text-xs">
              <thead className="bg-black/[0.03] dark:bg-white/[0.05] text-[#474747] dark:text-[#9e9e9e] font-semibold border-b border-black/[0.08] dark:border-white/[0.1]">
                <tr>
                  <th className="py-3 px-4">订阅源名称</th>
                  <th className="py-3 px-4">分类</th>
                  <th className="py-3 px-4">状态</th>
                  <th className="py-3 px-4 text-right">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/[0.06] dark:divide-white/[0.08]">
                {filteredFeeds.map((feed) => {
                  const feedStat = stats?.feedStatuses?.[feed.id];
                  const isOk = feedStat?.status === 'ok' || !feedStat;

                  return (
                    <tr key={feed.id} className="hover:bg-black/[0.02] dark:hover:bg-white/[0.04] transition-colors duration-175">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-black dark:text-white">
                          {feed.title}
                        </div>
                        <div className="text-[11px] text-[#919191] dark:text-[#6a6a6a] truncate max-w-xs font-mono">
                          {feed.url}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-full font-mono text-[11px] bg-black/5 dark:bg-white/10 text-[#474747] dark:text-[#9e9e9e]">
                          {categories.find((c) => c.id === feed.category)?.name || feed.category}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {isOk ? (
                          <span className="inline-flex items-center space-x-1 text-[#0B991F] font-medium">
                            <CheckCircle className="w-3.5 h-3.5" />
                            <span>正常</span>
                          </span>
                        ) : (
                          <span
                            className="inline-flex items-center space-x-1 text-rose-500 font-medium cursor-help"
                            title={feedStat?.error || '抓取遇到错误'}
                          >
                            <AlertTriangle className="w-3.5 h-3.5" />
                            <span>异常</span>
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <a
                          href={feed.siteUrl || feed.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 text-[#919191] hover:text-black dark:hover:text-white inline-block rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                          title="访问主页"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-black/[0.08] dark:border-white/[0.1] bg-black/[0.02] dark:bg-white/[0.02] flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/15 text-black dark:text-white transition-all duration-175"
          >
            完成
          </button>
        </div>
      </div>
    </div>
  );
};
