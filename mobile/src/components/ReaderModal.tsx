import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Share,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArticleDetail, ArticleSummary, MobileSettings } from '../types';
import { MobileDataService } from '../services/dataService';
import { useTheme } from '../theme/ThemeContext';

interface ReaderModalProps {
  visible: boolean;
  articleSummary: ArticleSummary | null;
  settings: MobileSettings;
  isRead: boolean;
  isStarred: boolean;
  onClose: () => void;
  onToggleRead: () => void;
  onToggleStar: () => void;
}

export const ReaderModal: React.FC<ReaderModalProps> = ({
  visible,
  articleSummary,
  settings,
  isRead,
  isStarred,
  onClose,
  onToggleRead,
  onToggleStar,
}) => {
  const { tokens } = useTheme();
  const [detail, setDetail] = useState<ArticleDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [fontSize, setFontSize] = useState<number>(16);

  useEffect(() => {
    if (!articleSummary || !visible) {
      setDetail(null);
      return;
    }

    setLoading(true);
    MobileDataService.fetchArticleDetail(articleSummary.id, settings)
      .then((res) => {
        setDetail(res);
      })
      .catch((e) => {
        console.warn('Failed to load article detail:', e);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [articleSummary?.id, visible, settings]);

  if (!articleSummary) return null;

  const handleShare = () => {
    Share.share({
      title: articleSummary.title,
      url: articleSummary.link,
      message: `${articleSummary.title}\n${articleSummary.link}`,
    });
  };

  const handleOpenBrowser = () => {
    Linking.openURL(articleSummary.link);
  };

  // Strip simple HTML tags for text display or clean preview
  const cleanContent = detail?.content
    ? detail.content.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/\n\s*\n/g, '\n\n')
    : articleSummary.snippet;

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={[styles.container, { backgroundColor: tokens.bgPage }]}>
        {/* Top Navigation Bar */}
        <View style={[styles.navbar, { borderBottomColor: tokens.borderSubtle, backgroundColor: tokens.bgPage }]}>
          <TouchableOpacity onPress={onClose} style={styles.navButton}>
            <Text style={[styles.navButtonText, { color: tokens.textSecondary }]}>✕ 关闭</Text>
          </TouchableOpacity>

          <View style={styles.rightActions}>
            <TouchableOpacity
              onPress={() => setFontSize((s) => Math.max(13, s - 2))}
              style={[styles.toolBtn, { backgroundColor: tokens.bgSurface, borderColor: tokens.borderSubtle }]}
            >
              <Text style={[styles.toolBtnText, { color: tokens.textPrimary }]}>A-</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setFontSize((s) => Math.min(24, s + 2))}
              style={[styles.toolBtn, { backgroundColor: tokens.bgSurface, borderColor: tokens.borderSubtle }]}
            >
              <Text style={[styles.toolBtnText, { color: tokens.textPrimary }]}>A+</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={onToggleStar}
              style={[styles.toolBtn, { backgroundColor: tokens.bgSurface, borderColor: tokens.borderSubtle }]}
            >
              <Text style={[styles.toolIcon, { color: isStarred ? '#f59e0b' : tokens.textPrimary }]}>
                {isStarred ? '★' : '☆'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleShare}
              style={[styles.toolBtn, { backgroundColor: tokens.bgSurface, borderColor: tokens.borderSubtle }]}
            >
              <Text style={[styles.toolIcon, { color: tokens.textPrimary }]}>⇪</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleOpenBrowser}
              style={[styles.toolBtn, { backgroundColor: tokens.bgSurface, borderColor: tokens.borderSubtle }]}
            >
              <Text style={[styles.toolIcon, { color: tokens.textPrimary }]}>↗</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Article Body */}
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
          <View style={[styles.header, { borderBottomColor: tokens.borderSubtle }]}>
            <Text
              style={[
                styles.feedBadge,
                { backgroundColor: tokens.accentSubtle, color: tokens.accent },
              ]}
            >
              {articleSummary.feedTitle}
            </Text>
            <Text style={[styles.title, { color: tokens.textPrimary }]}>{articleSummary.title}</Text>
            <View style={styles.metaRow}>
              <Text style={[styles.author, { color: tokens.textPrimary }]}>
                {articleSummary.author || articleSummary.feedTitle}
              </Text>
              <Text style={[styles.metaSeparator, { color: tokens.textMuted }]}>•</Text>
              <Text style={[styles.metaText, { color: tokens.textSecondary }]}>
                {articleSummary.readTime} 分钟阅读
              </Text>
            </View>
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={tokens.accent} />
              <Text style={[styles.loadingText, { color: tokens.textSecondary }]}>正在加载正文...</Text>
            </View>
          ) : (
            <Text style={[styles.prose, { color: tokens.textPrimary, fontSize, lineHeight: fontSize * 1.7 }]}>
              {cleanContent}
            </Text>
          )}

          <TouchableOpacity
            onPress={handleOpenBrowser}
            style={[
              styles.bottomOpenBtn,
              { backgroundColor: tokens.bgSurface, borderColor: tokens.borderSubtle },
            ]}
          >
            <Text style={[styles.bottomOpenText, { color: tokens.accent }]}>在浏览器中打开原网页 ↗</Text>
          </TouchableOpacity>
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
  navButton: {
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  navButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  toolBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
  },
  toolBtnText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  toolIcon: {
    fontSize: 16,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 20,
    borderBottomWidth: 1,
    paddingBottom: 16,
  },
  feedBadge: {
    alignSelf: 'flex-start',
    fontSize: 12,
    fontWeight: 'bold',
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 8,
    marginBottom: 10,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    lineHeight: 30,
    marginBottom: 10,
    letterSpacing: -0.3,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  author: {
    fontSize: 12,
    fontWeight: '500',
  },
  metaSeparator: {
    marginHorizontal: 6,
  },
  metaText: {
    fontSize: 12,
  },
  loadingContainer: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 13,
  },
  prose: {
    letterSpacing: 0.2,
  },
  bottomOpenBtn: {
    marginTop: 40,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
  },
  bottomOpenText: {
    fontWeight: '600',
    fontSize: 14,
  },
});
