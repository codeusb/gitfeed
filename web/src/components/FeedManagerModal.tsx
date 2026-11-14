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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Rss className="w-5 h-5 text-orange-500" />
            <h2 className="text-base font-bold text-slate-900 dark:text-white">订阅源管理与健康状态</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar & Category filter */}
        <div className="px-6 py-3 bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center space-x-1 overflow-x-auto text-xs">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                selectedCategory === 'all'
                  ? 'bg-orange-500 text-white'
                  : 'bg-slate-200/70 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
              }`}
            >
              全部 ({feeds.length})
            </button>
            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedCategory(c.id)}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                  selectedCategory === c.id
                    ? 'bg-orange-500 text-white'
                    : 'bg-slate-200/70 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                {c.name} ({feeds.filter((f) => f.category === c.id).length})
              </button>
            ))}
          </div>

          <button
            onClick={handleExportOpml}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 shadow-sm transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-orange-500" />
            <span>导出 OPML 订阅列表</span>
          </button>
        </div>

        {/* Feeds List Table */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          <div className="p-3 bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-900/40 rounded-xl text-xs text-orange-800 dark:text-orange-300 flex items-start space-x-2.5">
            <FileCode className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong>提示：</strong> 增加或删除订阅源非常简单，只需在你的 GitHub 仓库根目录编辑 <code className="bg-orange-100 dark:bg-orange-900/60 px-1 py-0.5 rounded font-mono">feeds.json</code> 即可。下次 GitHub Actions 运行时会自动抓取新增的订阅源。
            </p>
          </div>

          <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">订阅源名称</th>
                  <th className="py-2.5 px-3">分类</th>
                  <th className="py-2.5 px-3">状态</th>
                  <th className="py-2.5 px-3 text-right">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {filteredFeeds.map((feed) => {
                  const feedStat = stats?.feedStatuses?.[feed.id];
                  const isOk = feedStat?.status === 'ok' || !feedStat;

                  return (
                    <tr key={feed.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-2.5 px-3">
                        <div className="font-semibold text-slate-900 dark:text-slate-100">
                          {feed.title}
                        </div>
                        <div className="text-[11px] text-slate-400 truncate max-w-xs font-mono">
                          {feed.url}
                        </div>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                          {categories.find((c) => c.id === feed.category)?.name || feed.category}
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        {isOk ? (
                          <span className="inline-flex items-center space-x-1 text-emerald-600 dark:text-emerald-400 font-medium">
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
                      <td className="py-2.5 px-3 text-right">
                        <a
                          href={feed.siteUrl || feed.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 inline-block"
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
        <div className="px-6 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-semibold bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 transition-colors"
          >
            完成
          </button>
        </div>
      </div>
    </div>
  );
};
