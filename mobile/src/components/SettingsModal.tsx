import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MobileSettings } from '../types';
import { Storage } from '../storage';
import { MobileSyncService } from '../services/syncService';
import { UpdateService } from '../services/updateService';

interface SettingsModalProps {
  visible: boolean;
  onClose: () => void;
  settings: MobileSettings;
  onUpdateSettings: (settings: MobileSettings) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  visible,
  onClose,
  settings,
  onUpdateSettings,
}) => {
  const [formData, setFormData] = useState<MobileSettings>({ ...settings });
  const [syncing, setSyncing] = useState(false);
  const [checkingUpdate, setCheckingUpdate] = useState(false);

  const handleSave = async () => {
    await Storage.saveSettings(formData);
    onUpdateSettings(formData);
    Alert.alert('设置已保存', '配置已成功更新');
    onClose();
  };

  const handleSyncNow = async () => {
    setSyncing(true);
    const res = await MobileSyncService.syncWithGitHub(formData);
    setSyncing(false);
    Alert.alert(res.success ? '同步成功' : '同步失败', res.message);
  };

  const handleCheckUpdate = async () => {
    setCheckingUpdate(true);
    await UpdateService.checkForUpdates(formData.githubRepo || 'codeusb/gitfeed', false);
    setCheckingUpdate(false);
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.container}>
        {/* Navbar */}
        <View style={styles.navbar}>
          <TouchableOpacity onPress={onClose} style={styles.navBtn}>
            <Text style={styles.navBtnText}>取消</Text>
          </TouchableOpacity>
          <Text style={styles.navTitle}>设置</Text>
          <TouchableOpacity onPress={handleSave} style={styles.navBtnSave}>
            <Text style={styles.navBtnSaveText}>保存</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
          {/* Section 1: Data Source */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>数据源地址 (CDN / Pages)</Text>
            <Text style={styles.sectionDesc}>
              默认读取 GitHub Pages 分发的静态数据。若使用 Cloudflare Pages 加速可填入其域名。
            </Text>
            <TextInput
              style={styles.input}
              value={formData.dataSourceUrl}
              onChangeText={(text) => setFormData({ ...formData, dataSourceUrl: text })}
              placeholder="https://codeusb.github.io/gitfeed/data"
              placeholderTextColor="#64748b"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          {/* Section 2: Git-as-Backend Sync */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>GitHub 多端已读同步</Text>
            <Text style={styles.sectionDesc}>
              填入具有 contents:write 权限的 Personal Access Token 即可与网页端无缝同步已读状态。
            </Text>

            <Text style={styles.label}>GitHub 仓库 (用户名/仓库名)</Text>
            <TextInput
              style={styles.input}
              value={formData.githubRepo}
              onChangeText={(text) => setFormData({ ...formData, githubRepo: text })}
              placeholder="codeusb/gitfeed"
              placeholderTextColor="#64748b"
              autoCapitalize="none"
            />

            <Text style={styles.label}>Personal Access Token</Text>
            <TextInput
              style={styles.input}
              value={formData.githubToken}
              onChangeText={(text) => setFormData({ ...formData, githubToken: text })}
              placeholder="github_pat_..."
              placeholderTextColor="#64748b"
              secureTextEntry
              autoCapitalize="none"
            />

            <TouchableOpacity
              onPress={handleSyncNow}
              disabled={syncing}
              style={[styles.syncBtn, syncing && { opacity: 0.6 }]}
            >
              {syncing ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.syncBtnText}>立即同步已读状态</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Section 3: App Update Check */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>应用版本与更新</Text>
            <Text style={styles.sectionDesc}>
              当前版本：v1.0.0。点击下方按钮即可一键检查 GitHub Releases 上的最新 APK 安装包。
            </Text>

            <TouchableOpacity
              onPress={handleCheckUpdate}
              disabled={checkingUpdate}
              style={styles.updateBtn}
            >
              {checkingUpdate ? (
                <ActivityIndicator size="small" color="#f97316" />
              ) : (
                <Text style={styles.updateBtnText}>检查新版本 (GitHub Releases)</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0f1d',
  },
  navbar: {
    height: 48,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#1e293b',
  },
  navBtn: {
    padding: 6,
  },
  navBtnText: {
    color: '#94a3b8',
    fontSize: 14,
  },
  navTitle: {
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: 'bold',
  },
  navBtnSave: {
    backgroundColor: '#f97316',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
  },
  navBtnSaveText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: 'bold',
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: 20,
    gap: 24,
  },
  section: {
    backgroundColor: '#111827',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1f2937',
  },
  sectionTitle: {
    color: '#f8fafc',
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  sectionDesc: {
    color: '#94a3b8',
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 12,
  },
  label: {
    color: '#cbd5e1',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
    marginTop: 8,
  },
  input: {
    backgroundColor: '#030712',
    borderWidth: 1,
    borderColor: '#374151',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#f8fafc',
    fontSize: 13,
  },
  syncBtn: {
    backgroundColor: '#1e293b',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 14,
  },
  syncBtnText: {
    color: '#38bdf8',
    fontSize: 13,
    fontWeight: 'bold',
  },
  updateBtn: {
    backgroundColor: '#1e293b',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  updateBtnText: {
    color: '#f97316',
    fontSize: 13,
    fontWeight: 'bold',
  },
});
