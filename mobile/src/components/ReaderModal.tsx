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
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArticleDetail, ArticleSummary, MobileSettings } from '../types';
import { MobileDataService } from '../services/dataService';
import { useTheme } from '../theme/ThemeContext';
import { RichContentRenderer } from './RichContentRenderer';

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
  const [heroError, setHeroError] = useState(false);

  useEffect(() => {
    if (!articleSummary || !visible) {
      setDetail(null);
      setHeroError(false);
      return;
    }

    setLoading(true);
    setHeroError(false);
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

  const formatPubDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '';
    }
  };

  const hasValidHeroImage = Boolean(
    articleSummary.coverImage &&
    !heroError &&
    typeof articleSummary.coverImage === 'string' &&
    articleSummary.coverImage.startsWith('http') &&
    !articleSummary.coverImage.toLowerCase().endsWith('.svg') &&
    !articleSummary.coverImage.includes('shields.io') &&
    !articleSummary.coverImage.includes('/assets/icons/')
  );

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={[styles.container, { backgroundColor: tokens.bgPage }]}>
        {/* Top Astryx Navigation Bar */}
        <View
          style={[
            styles.navbar,
            {
              borderBottomColor: tokens.borderSubtle,
              backgroundColor: tokens.bgSurface,
            },
          ]}
        >
          <TouchableOpacity onPress={onClose} style={styles.navButton} activeOpacity={0.7}>
            <Text style={[styles.navButtonText, { color: tokens.textSecondary }]}>✕ 关闭</Text>
          </TouchableOpacity>

          <View style={styles.rightActions}>
            {/* Font Size Scaling */}
            <TouchableOpacity
              onPress={() => setFontSize((s) => Math.max(13, s - 2))}
              style={[
                styles.toolBtn,
                { backgroundColor: tokens.bgSubtle, borderColor: tokens.borderSubtle },
              ]}
              activeOpacity={0.7}
            >
              <Text style={[styles.toolBtnText, { color: tokens.textPrimary }]}>A-</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setFontSize((s) => Math.min(24, s + 2))}
              style={[
                styles.toolBtn,
                { backgroundColor: tokens.bgSubtle, borderColor: tokens.borderSubtle },
              ]}
              activeOpacity={0.7}
            >
              <Text style={[styles.toolBtnText, { color: tokens.textPrimary }]}>A+</Text>
            </TouchableOpacity>

            {/* Toggle Star */}
            <TouchableOpacity
              onPress={onToggleStar}
              style={[
                styles.toolBtn,
                { backgroundColor: tokens.bgSubtle, borderColor: tokens.borderSubtle },
              ]}
              activeOpacity={0.7}
            >
              <Text style={[styles.toolIcon, { color: isStarred ? '#f59e0b' : tokens.textPrimary }]}>
                {isStarred ? '★' : '☆'}
              </Text>
            </TouchableOpacity>

            {/* Share */}
            <TouchableOpacity
              onPress={handleShare}
              style={[
                styles.toolBtn,
                { backgroundColor: tokens.bgSubtle, borderColor: tokens.borderSubtle },
              ]}
              activeOpacity={0.7}
            >
              <Text style={[styles.toolIcon, { color: tokens.textPrimary }]}>⇪</Text>
            </TouchableOpacity>

            {/* Open in external browser */}
            <TouchableOpacity
              onPress={handleOpenBrowser}
              style={[
                styles.toolBtn,
                { backgroundColor: tokens.bgSubtle, borderColor: tokens.borderSubtle },
              ]}
              activeOpacity={0.7}
            >
              <Text style={[styles.toolIcon, { color: tokens.textPrimary }]}>↗</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Article Body Scroll */}
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
          {/* Article Header Card */}
          <View
            style={[
              styles.headerCard,
              {
                backgroundColor: tokens.bgCard,
                borderColor: tokens.borderSubtle,
              },
            ]}
          >
            <View style={styles.feedRow}>
              <Text
                style={[
                  styles.feedBadge,
                  { backgroundColor: tokens.accentSubtle, color: tokens.accent },
                ]}
              >
                {articleSummary.feedTitle}
              </Text>
              <Text style={[styles.readTimeText, { color: tokens.textMuted }]}>
                {articleSummary.readTime} 分钟阅读
              </Text>
            </View>

            <Text style={[styles.title, { color: tokens.textPrimary }]}>
              {articleSummary.title}
            </Text>

            <View style={styles.metaRow}>
              <Text style={[styles.author, { color: tokens.textSecondary }]}>
                {articleSummary.author || articleSummary.feedTitle}
              </Text>
              <Text style={[styles.metaSeparator, { color: tokens.textMuted }]}>•</Text>
              <Text style={[styles.metaDate, { color: tokens.textMuted }]}>
                {formatPubDate(articleSummary.publishedAt)}
              </Text>
            </View>

            {/* Hero Cover Image if present */}
            {hasValidHeroImage ? (
              <View
                style={[
                  styles.heroImageWrapper,
                  {
                    borderColor: tokens.borderSubtle,
                    backgroundColor: tokens.bgSubtle,
                  },
                ]}
              >
                <Image
                  source={{ uri: articleSummary.coverImage! }}
                  style={styles.heroImage}
                  resizeMode="cover"
                  onError={() => setHeroError(true)}
                />
              </View>
            ) : null}
          </View>

          {/* Article Content Container */}
          <View
            style={[
              styles.contentCard,
              {
                backgroundColor: tokens.bgCard,
                borderColor: tokens.borderSubtle,
              },
            ]}
          >
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={tokens.accent} />
                <Text style={[styles.loadingText, { color: tokens.textSecondary }]}>
                  正在排版与加载正文...
                </Text>
              </View>
            ) : (
              <RichContentRenderer
                content={detail?.content || `<p>${articleSummary.snippet}</p>`}
                fontSize={fontSize}
                tokens={tokens}
              />
            )}
          </View>

          {/* Bottom Actions Bar */}
          <View style={styles.bottomBar}>
            <TouchableOpacity
              onPress={handleOpenBrowser}
              style={[
                styles.bottomActionBtn,
                { backgroundColor: tokens.bgCard, borderColor: tokens.borderSubtle },
              ]}
              activeOpacity={0.7}
            >
              <Text style={[styles.bottomBtnText, { color: tokens.accent }]}>
                在浏览器中打开原网页 ↗
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={onToggleRead}
              style={[
                styles.bottomActionBtn,
                { backgroundColor: tokens.bgCard, borderColor: tokens.borderSubtle },
              ]}
              activeOpacity={0.7}
            >
              <Text style={[styles.bottomBtnText, { color: tokens.textPrimary }]}>
                {isRead ? '标记为未读 ○' : '标记为已读 ✓'}
              </Text>
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
  navButton: {
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  navButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  toolBtn: {
    height: 34,
    minWidth: 34,
    borderRadius: 10,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 6,
    paddingHorizontal: 8,
  },
  toolBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  toolIcon: {
    fontSize: 15,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 12,
    paddingBottom: 40,
  },
  headerCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 18,
    marginBottom: 12,
  },
  feedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  feedBadge: {
    fontSize: 11,
    fontWeight: '700',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    overflow: 'hidden',
  },
  readTimeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    lineHeight: 28,
    letterSpacing: -0.4,
    marginBottom: 10,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  author: {
    fontSize: 13,
    fontWeight: '600',
  },
  metaSeparator: {
    marginHorizontal: 8,
    fontSize: 12,
  },
  metaDate: {
    fontSize: 12,
  },
  heroImageWrapper: {
    marginTop: 14,
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
  },
  heroImage: {
    width: '100%',
    height: 180,
  },
  contentCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 18,
    minHeight: 180,
  },
  loadingContainer: {
    paddingVertical: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 13,
  },
  bottomBar: {
    marginTop: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  bottomActionBtn: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
