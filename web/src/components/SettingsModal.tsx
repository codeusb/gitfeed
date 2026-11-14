import React, { useState } from 'react';
import { X, Save, RefreshCw, Key, Database, Sliders, CheckCircle2, AlertCircle } from 'lucide-react';
import { UserSettings } from '../types';
import { SyncService } from '../services/syncService';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: UserSettings;
  onSaveSettings: (settings: UserSettings) => void;
  onSyncComplete?: (newReadCount: number) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
  onSyncComplete,
}) => {
  const [formData, setFormData] = useState<UserSettings>({ ...settings });
  const [syncStatus, setSyncStatus] = useState<{
    loading: boolean;
    success?: boolean;
    message?: string;
  }>({ loading: false });

  if (!isOpen) return null;

  const handleSave = () => {
    onSaveSettings(formData);
    onClose();
  };

  const handleManualSync = async () => {
    setSyncStatus({ loading: true });
    const res = await SyncService.syncWithGitHub(formData);
    setSyncStatus({
      loading: false,
      success: res.success,
      message: res.message,
    });
    if (res.success && onSyncComplete) {
      onSyncComplete(res.newReadCount);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Sliders className="w-5 h-5 text-orange-500" />
            <h2 className="text-base font-bold text-slate-900 dark:text-white">系统与同步设置</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-sm">
          {/* Section 1: Data Source */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2 text-slate-900 dark:text-slate-100 font-semibold">
              <Database className="w-4 h-4 text-orange-500" />
              <span>数据源加速地址 (CDN / Pages)</span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              国内网络环境下可将仓库连接到 Cloudflare Pages，并在此填入分配的域名（例如 <code className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded">https://gitfeed.pages.dev/data</code>）。留空则使用默认相对路径 <code className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded">./data</code>。
            </p>
            <input
              type="text"
              placeholder="默认相对路径: ./data"
              value={formData.dataSourceUrl}
              onChange={(e) => setFormData({ ...formData, dataSourceUrl: e.target.value })}
              className="w-full px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs focus:border-orange-500 focus:outline-none"
            />
          </div>

          <div className="h-[1px] bg-slate-200 dark:bg-slate-800" />

          {/* Section 2: Git-as-Backend Sync */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2 text-slate-900 dark:text-slate-100 font-semibold">
              <Key className="w-4 h-4 text-orange-500" />
              <span>多设备已读同步 (Git-as-Backend)</span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              无需自建或购买数据库，通过 GitHub Fine-grained PAT 读写本仓库的 <code className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded">data/state.json</code> 实现全平台无缝已读同步。
            </p>

            <div className="space-y-2">
              <div>
                <label className="text-xs text-slate-600 dark:text-slate-400 block mb-1">
                  GitHub 仓库 (格式: 用户名/仓库名)
                </label>
                <input
                  type="text"
                  placeholder="例如: yourname/gitfeed"
                  value={formData.githubRepo}
                  onChange={(e) => setFormData({ ...formData, githubRepo: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs focus:border-orange-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs text-slate-600 dark:text-slate-400 block mb-1">
                  GitHub Personal Access Token (仅需当前仓库 contents:write 权限)
                </label>
                <input
                  type="password"
                  placeholder="github_pat_..."
                  value={formData.githubToken}
                  onChange={(e) => setFormData({ ...formData, githubToken: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs focus:border-orange-500 focus:outline-none font-mono"
                />
              </div>

              <div className="pt-2 flex items-center justify-between">
                <button
                  type="button"
                  onClick={handleManualSync}
                  disabled={syncStatus.loading || !formData.githubToken || !formData.githubRepo}
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 disabled:opacity-50 transition-colors"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${syncStatus.loading ? 'animate-spin' : ''}`} />
                  <span>立即同步远程已读状态</span>
                </button>

                {syncStatus.message && (
                  <span className={`text-xs flex items-center gap-1 ${
                    syncStatus.success ? 'text-emerald-500' : 'text-rose-500'
                  }`}>
                    {syncStatus.success ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                    {syncStatus.message}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="h-[1px] bg-slate-200 dark:bg-slate-800" />

          {/* Section 3: Reader Preferences */}
          <div className="space-y-3">
            <span className="text-slate-900 dark:text-slate-100 font-semibold block">阅读器偏好</span>

            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-600 dark:text-slate-400">打开文章时自动标记已读</span>
              <input
                type="checkbox"
                checked={formData.autoMarkReadOnOpen}
                onChange={(e) => setFormData({ ...formData, autoMarkReadOnOpen: e.target.checked })}
                className="w-4 h-4 text-orange-500 rounded focus:ring-orange-500 focus:ring-offset-0"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 flex items-center justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-orange-500 hover:bg-orange-600 text-white shadow-sm transition-colors"
          >
            <Save className="w-3.5 h-3.5" />
            <span>保存设置</span>
          </button>
        </div>
      </div>
    </div>
  );
};
