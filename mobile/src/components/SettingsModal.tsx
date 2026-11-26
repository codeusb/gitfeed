import React, { useState, useEffect } from 'react';
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
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MobileSettings, ThemeMode, ColorPalette } from '../types';
import { Storage } from '../storage';
import { MobileSyncService } from '../services/syncService';
import { UpdateService, CURRENT_VERSION } from '../services/updateService';
import { useTheme } from '../theme/ThemeContext';
import { Moon, Sun, Laptop, RefreshCw } from 'lucide-react-native';

const KEY_FONT_SIZE = '@gitfeed_reader_font_size';

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
  const { tokens } = useTheme();
  const insets = useSafeAreaInsets();
  const [formData, setFormData] = useState<MobileSettings>({ ...settings });
  const [syncing, setSyncing] = useState(false);
  const [checkingUpdate, setCheckingUpdate] = useState(false);
  const [readerFontSize, setReaderFontSize] = useState<number>(16);

  useEffect(() => {
    if (visible) {
      setFormData({ ...settings });
      AsyncStorage.getItem(KEY_FONT_SIZE).then((val) => {
        if (val) {
          const num = Number(val);
          if (num >= 12 && num <= 26) setReaderFontSize(num);
        }
      });
    }
  }, [visible, settings]);

  const handleSelectFontSize = async (size: number) => {
    setReaderFontSize(size);
    await AsyncStorage.setItem(KEY_FONT_SIZE, String(size));
  };

  const handleSave = async () => {
    await Storage.saveSettings(formData);
    onUpdateSettings(formData);
    Alert.alert('设置已保存', '配置已成功更新');
    onClose();
  };

  const handleSyncNow = async () => {
    setSyncing(true);
    await Storage.saveSettings(formData);
    onUpdateSettings(formData);
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
      <SafeAreaView
        edges={['top', 'bottom', 'left', 'right']}
        style={[styles.container, { backgroundColor: tokens.bgPage }]}
      >
        {/* Navbar */}
        <View style={[styles.navbar, { borderBottomColor: tokens.borderSubtle, backgroundColor: tokens.bgPage }]}>
          <TouchableOpacity onPress={onClose} style={styles.navBtn}>
            <Text style={[styles.navBtnText, { color: tokens.textSecondary }]}>取消</Text>
          </TouchableOpacity>
          <Text style={[styles.navTitle, { color: tokens.textPrimary }]}>设置</Text>
          <TouchableOpacity
            onPress={handleSave}
            style={[styles.navBtnSave, { backgroundColor: tokens.accent }]}
          >
            <Text style={[styles.navBtnSaveText, { color: tokens.accentContrast }]}>保存</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.content, { paddingBottom: Math.max(insets.bottom, 16) + 24 }]}
        >
          {/* Section 1: Appearance & Tokens */}
          <View style={[styles.section, { backgroundColor: tokens.bgCard, borderColor: tokens.borderSubtle }]}>
            <Text style={[styles.sectionTitle, { color: tokens.textPrimary }]}>外观与主题色系 (Astryx Tokens)</Text>
            <Text style={[styles.sectionDesc, { color: tokens.textSecondary }]}>
              完全支持日间/夜间模式及未来多色系动态切换。
            </Text>

            {/* Mode selection */}
            <Text style={[styles.label, { color: tokens.textPrimary }]}>显示模式 (Theme Mode)</Text>
            <View style={styles.modeRow}>
              {[
                { id: 'dark', label: '深色', icon: Moon },
                { id: 'light', label: '浅色', icon: Sun },
                { id: 'system', label: '系统', icon: Laptop },
              ].map((m) => {
                const IconComponent = m.icon;
                const isActive = formData.theme === m.id;
                const iconColor = isActive ? tokens.accent : tokens.textSecondary;
                return (
                  <TouchableOpacity
                    key={m.id}
                    onPress={() => setFormData({ ...formData, theme: m.id as ThemeMode })}
                    style={[
                      styles.modeBtn,
                      { borderColor: tokens.borderSubtle, backgroundColor: tokens.bgSubtle },
                      isActive && {
                        borderColor: tokens.accent,
                        backgroundColor: tokens.accentSubtle,
                      },
                    ]}
                  >
                    <IconComponent size={14} color={iconColor} style={{ marginRight: 6 }} />
                    <Text
                      style={[
                        styles.modeBtnText,
                        { color: iconColor },
                      ]}
                    >
                      {m.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Palette selection */}
            <Text style={[styles.label, { color: tokens.textPrimary, marginTop: 14 }]}>
              强调色系 (Accent Palette)
            </Text>
            <View style={styles.paletteRow}>
              {[
                { id: 'orange', name: '暖橙', color: '#EB6E00' },
                { id: 'blue', name: '蔚蓝', color: '#0171E3' },
                { id: 'purple', name: '极光紫', color: '#6B1EFD' },
                { id: 'green', name: '翡翠绿', color: '#0B991F' },
                { id: 'monochrome', name: '黑白', color: tokens.isDark ? '#f1f1f1' : '#1b1b1b' },
              ].map((p) => {
                const isSelected = (formData.palette || 'orange') === p.id;
                return (
                  <TouchableOpacity
                    key={p.id}
                    onPress={() => setFormData({ ...formData, palette: p.id as ColorPalette })}
                    style={[
                      styles.paletteBtn,
                      { borderColor: tokens.borderSubtle },
                      isSelected && { borderColor: tokens.accent, backgroundColor: tokens.accentSubtle },
                    ]}
                  >
                    <View style={[styles.paletteDot, { backgroundColor: p.color }]} />
                    <Text
                      style={[
                        styles.paletteText,
                        { color: isSelected ? tokens.accent : tokens.textSecondary },
                      ]}
                    >
                      {p.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Section: Reader Font Size */}
          <View style={[styles.section, { backgroundColor: tokens.bgCard, borderColor: tokens.borderSubtle }]}>
            <Text style={[styles.sectionTitle, { color: tokens.textPrimary }]}>阅读正文字体大小</Text>
            <Text style={[styles.sectionDesc, { color: tokens.textSecondary }]}>
              设置文章详情页的默认正文字号（阅读文章时也可在顶部栏随时点击【A-】与【A+】无级调节）。
            </Text>

            <View style={styles.fontSizeRow}>
              {[
                { size: 14, label: '小 14' },
                { size: 16, label: '标准 16' },
                { size: 18, label: '中 18' },
                { size: 20, label: '大 20' },
                { size: 22, label: '特大 22' },
              ].map((item) => {
                const isSelected = readerFontSize === item.size;
                return (
                  <TouchableOpacity
                    key={item.size}
                    onPress={() => handleSelectFontSize(item.size)}
                    style={[
                      styles.fontSizeBtn,
                      { borderColor: tokens.borderSubtle, backgroundColor: tokens.bgSurface },
                      isSelected && { borderColor: tokens.accent, backgroundColor: tokens.accentSubtle },
                    ]}
                  >
                    <Text
                      style={[
                        styles.fontSizeBtnText,
                        { color: isSelected ? tokens.accent : tokens.textSecondary },
                        isSelected && { fontWeight: '700' },
                      ]}
                    >
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Section 2: Data Source */}
          <View style={[styles.section, { backgroundColor: tokens.bgCard, borderColor: tokens.borderSubtle }]}>
            <Text style={[styles.sectionTitle, { color: tokens.textPrimary }]}>数据源地址 (CDN / Pages)</Text>
            <Text style={[styles.sectionDesc, { color: tokens.textSecondary }]}>
              默认读取 GitHub Pages 分发的静态数据。若使用 Cloudflare Pages 加速可填入其域名。
            </Text>
            <TextInput
              style={[
                styles.input,
                { backgroundColor: tokens.bgInput, borderColor: tokens.borderSubtle, color: tokens.textPrimary },
              ]}
              value={formData.dataSourceUrl}
              onChangeText={(text) => setFormData({ ...formData, dataSourceUrl: text })}
              placeholder="https://codeusb.github.io/gitfeed/data"
              placeholderTextColor={tokens.textMuted}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          {/* Section 3: Git-as-Backend Sync */}
          <View style={[styles.section, { backgroundColor: tokens.bgCard, borderColor: tokens.borderSubtle }]}>
            <Text style={[styles.sectionTitle, { color: tokens.textPrimary }]}>多设备已读同步 (Git-as-Backend)</Text>
            <Text style={[styles.sectionDesc, { color: tokens.textSecondary }]}>
              通过 GitHub Fine-grained PAT 读写本仓库的 data/state.json 实现 Web 端与移动端无缝已读同步。
            </Text>

            <Text style={[styles.label, { color: tokens.textPrimary }]}>GitHub 仓库 (用户名/仓库名)</Text>
            <TextInput
              style={[
                styles.input,
                { backgroundColor: tokens.bgInput, borderColor: tokens.borderSubtle, color: tokens.textPrimary },
              ]}
              value={formData.githubRepo}
              onChangeText={(text) => setFormData({ ...formData, githubRepo: text })}
              placeholder="codeusb/gitfeed"
              placeholderTextColor={tokens.textMuted}
              autoCapitalize="none"
            />
            <Text style={[styles.helperNote, { color: tokens.textMuted }]}>
              提示：Web 端与移动端填写的仓库名必须完全一致（例如均为 codeusb/gitfeed），数据才能互通。
            </Text>

            <Text style={[styles.label, { color: tokens.textPrimary }]}>Personal Access Token (PAT)</Text>
            <TextInput
              style={[
                styles.input,
                { backgroundColor: tokens.bgInput, borderColor: tokens.borderSubtle, color: tokens.textPrimary },
              ]}
              value={formData.githubToken}
              onChangeText={(text) => setFormData({ ...formData, githubToken: text })}
              placeholder="github_pat_..."
              placeholderTextColor={tokens.textMuted}
              secureTextEntry
              autoCapitalize="none"
            />
            <Text style={[styles.helperNote, { color: tokens.textMuted }]}>
              提示：Web 端和移动端使用同一个具有 contents:write 权限的 PAT 即可。
            </Text>

            <View style={[styles.syncInfoCard, { backgroundColor: tokens.bgSubtle, borderColor: tokens.borderSubtle }]}>
              <Text style={[styles.syncInfoText, { color: tokens.textSecondary }]}>
                自动同步：已开启全自动双向静默同步。打开应用、下拉刷新、打开文章标记已读或加星标时，系统均会自动在后台静默同步，无需手动操作。
              </Text>
            </View>

            <TouchableOpacity
              onPress={handleSyncNow}
              disabled={syncing}
              style={[
                styles.syncBtn,
                { backgroundColor: tokens.bgSurface, borderColor: tokens.borderSubtle },
                syncing && { opacity: 0.6 },
              ]}
            >
              {syncing ? (
                <ActivityIndicator size="small" color={tokens.accent} />
              ) : (
                <Text style={[styles.syncBtnText, { color: tokens.accent }]}>立即同步已读状态 (强制拉取)</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Section 4: App Update Check */}
          <View style={[styles.section, { backgroundColor: tokens.bgCard, borderColor: tokens.borderSubtle }]}>
            <Text style={[styles.sectionTitle, { color: tokens.textPrimary }]}>应用版本与更新</Text>
            <Text style={[styles.sectionDesc, { color: tokens.textSecondary }]}>
              当前版本：{CURRENT_VERSION}。点击下方按钮即可一键检查 GitHub Releases 上的最新 APK 安装包。
            </Text>

            <TouchableOpacity
              onPress={handleCheckUpdate}
              disabled={checkingUpdate}
              style={[
                styles.updateBtn,
                { backgroundColor: tokens.bgSurface, borderColor: tokens.borderSubtle },
              ]}
            >
              {checkingUpdate ? (
                <ActivityIndicator size="small" color={tokens.accent} />
              ) : (
                <Text style={[styles.updateBtnText, { color: tokens.accent }]}>
                  检查新版本 (GitHub Releases)
                </Text>
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
  },
  navbar: {
    height: 52,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  navBtn: {
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  navBtnText: {
    fontSize: 14,
  },
  navTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: -0.2,
  },
  navBtnSave: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 12,
  },
  navBtnSaveText: {
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
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 4,
    letterSpacing: -0.2,
  },
  sectionDesc: {
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 12,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
    marginTop: 8,
  },
  modeRow: {
    flexDirection: 'row',
    gap: 8,
  },
  modeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  modeBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },
  paletteRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 4,
  },
  paletteBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    gap: 4,
  },
  paletteDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  paletteText: {
    fontSize: 10,
    fontWeight: '600',
  },
  fontSizeRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 6,
  },
  fontSizeBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    borderWidth: 1,
  },
  fontSizeBtnText: {
    fontSize: 12,
    fontWeight: '500',
  },
  helperNote: {
    fontSize: 11,
    lineHeight: 16,
    marginTop: 4,
    marginBottom: 4,
  },
  syncInfoCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    marginTop: 10,
  },
  syncInfoText: {
    fontSize: 12,
    lineHeight: 18,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
  },
  syncBtn: {
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 14,
  },
  syncBtnText: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  updateBtn: {
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  updateBtnText: {
    fontSize: 13,
    fontWeight: 'bold',
  },
});
