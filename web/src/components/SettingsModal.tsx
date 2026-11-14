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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
      <div className="w-full max-w-lg bg-white dark:bg-[#222222] rounded-2xl shadow-2xl border border-black/[0.08] dark:border-white/[0.1] overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-black/[0.08] dark:border-white/[0.1] flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <Sliders className="w-5 h-5 text-[#EB6E00]" />
            <h2 className="text-base font-bold text-black dark:text-white tracking-tight">系统与同步设置</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-[#919191] hover:text-black dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-all duration-175"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-sm">
          {/* Section 1: Data Source */}
          <div className="space-y-2.5">
            <div className="flex items-center space-x-2 text-black dark:text-white font-semibold">
              <Database className="w-4 h-4 text-[#EB6E00]" />
              <span>数据源加速地址 (CDN / Pages)</span>
            </div>
            <p className="text-xs text-[#6a6a6a] dark:text-[#9e9e9e] leading-relaxed">
              国内网络环境下可将仓库连接到 Cloudflare Pages，并在此填入分配的域名（例如 <code className="bg-black/5 dark:bg-white/10 px-1.5 py-0.5 rounded font-mono text-[11px]">https://gitfeed.pages.dev/data</code>）。留空则使用默认相对路径 <code className="bg-black/5 dark:bg-white/10 px-1.5 py-0.5 rounded font-mono text-[11px]">./data</code>。
            </p>
            <input
              type="text"
              placeholder="默认相对路径: ./data"
              value={formData.dataSourceUrl}
              onChange={(e) => setFormData({ ...formData, dataSourceUrl: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-black/[0.03] dark:bg-white/[0.05] border border-black/[0.08] dark:border-white/[0.1] text-xs text-black dark:text-white focus:border-[#EB6E00] focus:ring-1 focus:ring-[#EB6E00]/40 focus:outline-none transition-all duration-175"
            />
          </div>

          <div className="h-[1px] bg-black/[0.08] dark:bg-white/[0.1]" />

          {/* Section 2: Git-as-Backend Sync */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2 text-black dark:text-white font-semibold">
              <Key className="w-4 h-4 text-[#EB6E00]" />
              <span>多设备已读同步 (Git-as-Backend)</span>
            </div>
            <p className="text-xs text-[#6a6a6a] dark:text-[#9e9e9e] leading-relaxed">
              无需自建或购买数据库，通过 GitHub Fine-grained PAT 读写本仓库的 <code className="bg-black/5 dark:bg-white/10 px-1.5 py-0.5 rounded font-mono text-[11px]">data/state.json</code> 实现全平台无缝已读同步。
            </p>

            <div className="space-y-3">
              <div>
                <label className="text-xs text-[#474747] dark:text-[#9e9e9e] block mb-1 font-medium">
                  GitHub 仓库 (格式: 用户名/仓库名)
                </label>
                <input
                  type="text"
                  placeholder="例如: yourname/gitfeed"
                  value={formData.githubRepo}
                  onChange={(e) => setFormData({ ...formData, githubRepo: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-black/[0.03] dark:bg-white/[0.05] border border-black/[0.08] dark:border-white/[0.1] text-xs text-black dark:text-white focus:border-[#EB6E00] focus:ring-1 focus:ring-[#EB6E00]/40 focus:outline-none transition-all duration-175"
                />
              </div>

              <div>
                <label className="text-xs text-[#474747] dark:text-[#9e9e9e] block mb-1 font-medium">
                  GitHub Personal Access Token (仅需当前仓库 contents:write 权限)
                </label>
                <input
                  type="password"
                  placeholder="github_pat_..."
                  value={formData.githubToken}
                  onChange={(e) => setFormData({ ...formData, githubToken: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-black/[0.03] dark:bg-white/[0.05] border border-black/[0.08] dark:border-white/[0.1] text-xs text-black dark:text-white focus:border-[#EB6E00] focus:ring-1 focus:ring-[#EB6E00]/40 focus:outline-none font-mono transition-all duration-175"
                />
              </div>

              <div className="pt-2 flex items-center justify-between">
                <button
                  type="button"
                  onClick={handleManualSync}
                  disabled={syncStatus.loading || !formData.githubToken || !formData.githubRepo}
                  className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/15 text-black dark:text-white disabled:opacity-40 transition-all duration-175"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${syncStatus.loading ? 'animate-spin' : ''}`} />
                  <span>立即同步远程已读状态</span>
                </button>

                {syncStatus.message && (
                  <span className={`text-xs flex items-center gap-1 font-medium ${
                    syncStatus.success ? 'text-[#0B991F]' : 'text-rose-500'
                  }`}>
                    {syncStatus.success ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                    {syncStatus.message}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="h-[1px] bg-black/[0.08] dark:bg-white/[0.1]" />

          {/* Section 3: Appearance & Tokenized Palette */}
          <div className="space-y-4">
            <span className="text-black dark:text-white font-semibold block">外观与颜色色系 (Astryx Tokens)</span>

            {/* Mode selection */}
            <div>
              <label className="text-xs text-[#474747] dark:text-[#9e9e9e] block mb-2 font-medium">
                显示模式 (Theme Mode)
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'dark', label: '深色模式 🌙' },
                  { id: 'light', label: '浅色模式 ☀️' },
                  { id: 'system', label: '跟随系统 💻' },
                ].map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setFormData({ ...formData, theme: m.id as any })}
                    className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all duration-175 ${
                      formData.theme === m.id
                        ? 'border-[#EB6E00] bg-[#EB6E00]/10 text-[#EB6E00] dark:text-[#FF7A1A]'
                        : 'border-black/[0.08] dark:border-white/[0.1] bg-black/[0.02] dark:bg-white/[0.04] text-[#474747] dark:text-[#9e9e9e] hover:text-black dark:hover:text-white'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Palette selection */}
            <div>
              <label className="text-xs text-[#474747] dark:text-[#9e9e9e] block mb-2 font-medium">
                强调色系 (Accent Palette)
              </label>
              <div className="grid grid-cols-5 gap-2">
                {[
                  { id: 'orange', name: '暖橙', color: '#EB6E00' },
                  { id: 'blue', name: '蔚蓝', color: '#0171E3' },
                  { id: 'purple', name: '极光紫', color: '#6B1EFD' },
                  { id: 'green', name: '翡翠绿', color: '#0B991F' },
                  { id: 'monochrome', name: '黑白', color: '#1b1b1b' },
                ].map((p) => {
                  const isSelected = (formData.palette || 'orange') === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setFormData({ ...formData, palette: p.id as any })}
                      className={`flex flex-col items-center gap-1.5 p-2 rounded-xl border transition-all duration-175 ${
                        isSelected
                          ? 'border-[#EB6E00] bg-black/[0.04] dark:bg-white/[0.08]'
                          : 'border-black/[0.08] dark:border-white/[0.1] hover:bg-black/[0.02] dark:hover:bg-white/[0.04]'
                      }`}
                    >
                      <span
                        className="w-5 h-5 rounded-full border border-black/10 dark:border-white/20 shadow-xs"
                        style={{ backgroundColor: p.color }}
                      />
                      <span className="text-[11px] font-medium text-black dark:text-white">
                        {p.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="h-[1px] bg-black/[0.08] dark:bg-white/[0.1]" />

          {/* Section 4: Reader Preferences */}
          <div className="space-y-3">
            <span className="text-black dark:text-white font-semibold block">阅读器偏好</span>

            <div className="flex items-center justify-between">
              <span className="text-xs text-[#474747] dark:text-[#9e9e9e]">打开文章时自动标记已读</span>
              <input
                type="checkbox"
                checked={formData.autoMarkReadOnOpen}
                onChange={(e) => setFormData({ ...formData, autoMarkReadOnOpen: e.target.checked })}
                className="w-4 h-4 text-[#EB6E00] rounded-md focus:ring-[#EB6E00] focus:ring-offset-0"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-black/[0.08] dark:border-white/[0.1] bg-black/[0.02] dark:bg-white/[0.02] flex items-center justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-[#474747] dark:text-[#9e9e9e] hover:bg-black/5 dark:hover:bg-white/10 transition-all duration-175"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-[#EB6E00] hover:bg-[#d66100] text-white shadow-sm shadow-[#EB6E00]/25 transition-all duration-175 ease-astryx"
          >
            <Save className="w-3.5 h-3.5" />
            <span>保存设置</span>
          </button>
        </div>
      </div>
    </div>
  );
};
