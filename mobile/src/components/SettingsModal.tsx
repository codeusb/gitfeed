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
              placeholderTextColor="#666666"
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
              placeholderTextColor="#666666"
              autoCapitalize="none"
            />

            <Text style={styles.label}>Personal Access Token</Text>
            <TextInput
              style={styles.input}
              value={formData.githubToken}
              onChangeText={(text) => setFormData({ ...formData, githubToken: text })}
              placeholder="github_pat_..."
              placeholderTextColor="#666666"
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
              当前版本：v1.0.3。点击下方按钮即可一键检查 GitHub Releases 上的最新 APK 安装包。
            </Text>

            <TouchableOpacity
              onPress={handleCheckUpdate}
              disabled={checkingUpdate}
              style={styles.updateBtn}
            >
              {checkingUpdate ? (
                <ActivityIndicator size="small" color="#EB6E00" />
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
    backgroundColor: '#1b1b1b',
  },
  navbar: {
    height: 52,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
    backgroundColor: '#1b1b1b',
  },
  navBtn: {
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  navBtnText: {
    color: '#9e9e9e',
    fontSize: 14,
  },
  navTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: -0.2,
  },
  navBtnSave: {
    backgroundColor: '#EB6E00',
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 12,
  },
  navBtnSaveText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: 'bold',
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: 16,
    gap: 16,
  },
  section: {
    backgroundColor: '#222222',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  sectionTitle: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 4,
    letterSpacing: -0.2,
  },
  sectionDesc: {
    color: '#9e9e9e',
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 12,
  },
  label: {
    color: '#d4d4d4',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
    marginTop: 8,
  },
  input: {
    backgroundColor: '#1b1b1b',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#ffffff',
    fontSize: 13,
  },
  syncBtn: {
    backgroundColor: '#262626',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 14,
  },
  syncBtnText: {
    color: '#5aa0f8',
    fontSize: 13,
    fontWeight: 'bold',
  },
  updateBtn: {
    backgroundColor: '#262626',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  updateBtnText: {
    color: '#EB6E00',
    fontSize: 13,
    fontWeight: 'bold',
  },
});
