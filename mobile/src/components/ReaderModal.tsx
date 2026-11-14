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
      <SafeAreaView style={styles.container}>
        {/* Top Navigation Bar */}
        <View style={styles.navbar}>
          <TouchableOpacity onPress={onClose} style={styles.navButton}>
            <Text style={styles.navButtonText}>✕ 关闭</Text>
          </TouchableOpacity>

          <View style={styles.rightActions}>
            <TouchableOpacity
              onPress={() => setFontSize((s) => Math.max(13, s - 2))}
              style={styles.toolBtn}
            >
              <Text style={styles.toolBtnText}>A-</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setFontSize((s) => Math.min(24, s + 2))}
              style={styles.toolBtn}
            >
              <Text style={styles.toolBtnText}>A+</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={onToggleStar} style={styles.toolBtn}>
              <Text style={[styles.toolIcon, isStarred && { color: '#f59e0b' }]}>
                {isStarred ? '★' : '☆'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={handleShare} style={styles.toolBtn}>
              <Text style={styles.toolIcon}>⇪</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={handleOpenBrowser} style={styles.toolBtn}>
              <Text style={styles.toolIcon}>↗</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Article Body */}
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <Text style={styles.feedBadge}>{articleSummary.feedTitle}</Text>
            <Text style={styles.title}>{articleSummary.title}</Text>
            <View style={styles.metaRow}>
              <Text style={styles.author}>{articleSummary.author || articleSummary.feedTitle}</Text>
              <Text style={styles.metaSeparator}>•</Text>
              <Text style={styles.metaText}>{articleSummary.readTime} 分钟阅读</Text>
            </View>
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#f97316" />
              <Text style={styles.loadingText}>正在加载正文...</Text>
            </View>
          ) : (
            <Text style={[styles.prose, { fontSize, lineHeight: fontSize * 1.65 }]}>
              {cleanContent}
            </Text>
          )}

          <TouchableOpacity onPress={handleOpenBrowser} style={styles.bottomOpenBtn}>
            <Text style={styles.bottomOpenText}>在浏览器中打开原网页 ↗</Text>
          </TouchableOpacity>
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
  navButton: {
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  navButtonText: {
    fontSize: 14,
    color: '#94a3b8',
    fontWeight: '600',
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  toolBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#1e293b',
  },
  toolBtnText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#cbd5e1',
  },
  toolIcon: {
    fontSize: 16,
    color: '#cbd5e1',
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
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#1e293b',
    paddingBottom: 16,
  },
  feedBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(249, 115, 22, 0.15)',
    color: '#fb923c',
    fontSize: 12,
    fontWeight: 'bold',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginBottom: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#f8fafc',
    lineHeight: 30,
    marginBottom: 10,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  author: {
    fontSize: 12,
    color: '#94a3b8',
  },
  metaSeparator: {
    color: '#475569',
    marginHorizontal: 6,
  },
  metaText: {
    fontSize: 12,
    color: '#64748b',
  },
  loadingContainer: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 13,
    color: '#64748b',
  },
  prose: {
    color: '#e2e8f0',
    letterSpacing: 0.3,
  },
  bottomOpenBtn: {
    marginTop: 40,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#1e293b',
    alignItems: 'center',
  },
  bottomOpenText: {
    color: '#f97316',
    fontWeight: '600',
    fontSize: 14,
  },
});
