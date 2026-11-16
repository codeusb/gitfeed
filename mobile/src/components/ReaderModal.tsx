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
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArticleDetail, ArticleSummary, MobileSettings } from '../types';
import { MobileDataService } from '../services/dataService';
import { useTheme } from '../theme/ThemeContext';
import { RichContentRenderer } from './RichContentRenderer';

const KEY_FONT_SIZE = '@gitfeed_reader_font_size';

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
  const insets = useSafeAreaInsets();
  const [detail, setDetail] = useState<ArticleDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [fontSize, setFontSize] = useState<number>(16);
  const [scrollProgress, setScrollProgress] = useState<number>(0);

  // Load persisted font size
  useEffect(() => {
    if (visible) {
      AsyncStorage.getItem(KEY_FONT_SIZE).then((val) => {
        if (val) {
          const num = Number(val);
          if (num >= 12 && num <= 26) setFontSize(num);
        }
      });
    }
  }, [visible]);

  const handleUpdateFontSize = (delta: number) => {
    setFontSize((prev) => {
      const next = Math.min(26, Math.max(12, prev + delta));
      AsyncStorage.setItem(KEY_FONT_SIZE, String(next));
      return next;
    });
  };

  useEffect(() => {
    if (!articleSummary || !visible) {
      setDetail(null);
      setScrollProgress(0);
      return;
    }

    setLoading(true);
    setScrollProgress(0);
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

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent;
    const maxScroll = contentSize.height - layoutMeasurement.height;
    if (maxScroll > 0) {
      const p = Math.min(1, Math.max(0, contentOffset.y / maxScroll));
      setScrollProgress(p);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView
        edges={['top', 'bottom', 'left', 'right']}
        style={[styles.container, { backgroundColor: tokens.bgPage }]}
      >
        {/* Top Minimal Header (daily.juya.uk style) */}
        <View
          style={[
            styles.navbar,
            {
              borderBottomColor: tokens.borderSubtle,
              backgroundColor: tokens.bgSurface,
            },
          ]}
        >
          {/* Back button */}
          <TouchableOpacity
            onPress={onClose}
            style={[
              styles.toolCircleBtn,
              { backgroundColor: tokens.bgSubtle, borderColor: tokens.borderSubtle },
            ]}
            activeOpacity={0.7}
          >
            <Text style={[styles.toolIcon, { color: tokens.textSecondary }]}>✕</Text>
          </TouchableOpacity>

          {/* Center Brand / Feed pill */}
          <View
            style={[
              styles.feedBrandPill,
              { backgroundColor: tokens.accentSubtle, borderColor: tokens.accentSubtle },
            ]}
          >
            <Text style={[styles.feedBrandText, { color: tokens.accent }]} numberOfLines={1}>
              {articleSummary.feedTitle}
            </Text>
          </View>

          {/* Right Action buttons */}
          <View style={styles.rightActions}>
            <TouchableOpacity
              onPress={() => handleUpdateFontSize(-2)}
              style={[
                styles.toolCircleBtn,
                { backgroundColor: tokens.bgSubtle, borderColor: tokens.borderSubtle },
              ]}
              activeOpacity={0.7}
            >
              <Text style={[styles.toolBtnText, { color: tokens.textPrimary }]}>A-</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => handleUpdateFontSize(2)}
              style={[
                styles.toolCircleBtn,
                { backgroundColor: tokens.bgSubtle, borderColor: tokens.borderSubtle },
              ]}
              activeOpacity={0.7}
            >
              <Text style={[styles.toolBtnText, { color: tokens.textPrimary }]}>A+</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={onToggleStar}
              style={[
                styles.toolCircleBtn,
                { backgroundColor: tokens.bgSubtle, borderColor: tokens.borderSubtle },
              ]}
              activeOpacity={0.7}
            >
              <Text style={[styles.toolIcon, { color: isStarred ? '#f59e0b' : tokens.textPrimary }]}>
                {isStarred ? '★' : '☆'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleShare}
              style={[
                styles.toolCircleBtn,
                { backgroundColor: tokens.bgSubtle, borderColor: tokens.borderSubtle },
              ]}
              activeOpacity={0.7}
            >
              <Text style={[styles.toolIcon, { color: tokens.textPrimary }]}>⇪</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleOpenBrowser}
              style={[
                styles.toolCircleBtn,
                { backgroundColor: tokens.bgSubtle, borderColor: tokens.borderSubtle },
              ]}
              activeOpacity={0.7}
            >
              <Text style={[styles.toolIcon, { color: tokens.textPrimary }]}>↗</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Reading Progress Line */}
        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressBar,
              {
                width: `${Math.round(scrollProgress * 100)}%`,
                backgroundColor: tokens.accent,
              },
            ]}
          />
        </View>

        {/* Article Body Scroll */}
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: Math.max(insets.bottom, 16) + 24 },
          ]}
          onScroll={handleScroll}
          scrollEventThrottle={16}
        >
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
                  {
                    backgroundColor: tokens.accentSubtle,
                    color: tokens.accent,
                    fontSize: Math.max(10, fontSize * 0.72),
                  },
                ]}
              >
                {articleSummary.feedTitle}
              </Text>
              <Text
                style={[
                  styles.readTimeText,
                  {
                    color: tokens.textMuted,
                    fontSize: Math.max(10, fontSize * 0.72),
                  },
                ]}
              >
                {articleSummary.readTime} 分钟阅读
              </Text>
            </View>

            <Text
              style={[
                styles.title,
                {
                  color: tokens.textPrimary,
                  fontSize: fontSize * 1.35,
                  lineHeight: fontSize * 1.8,
                },
              ]}
            >
              {articleSummary.title}
            </Text>

            <View style={styles.metaRow}>
              <Text
                style={[
                  styles.author,
                  {
                    color: tokens.textSecondary,
                    fontSize: Math.max(11, fontSize * 0.75),
                  },
                ]}
              >
                {articleSummary.author || articleSummary.feedTitle}
              </Text>
              <Text
                style={[
                  styles.metaSeparator,
                  {
                    color: tokens.textMuted,
                    fontSize: Math.max(11, fontSize * 0.75),
                  },
                ]}
              >
                •
              </Text>
              <Text
                style={[
                  styles.metaDate,
                  {
                    color: tokens.textMuted,
                    fontSize: Math.max(11, fontSize * 0.75),
                  },
                ]}
              >
                {formatPubDate(articleSummary.publishedAt)}
              </Text>
            </View>
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
                coverImage={articleSummary.coverImage}
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
    paddingHorizontal: 10,
    borderBottomWidth: 1,
  },
  feedBrandPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    maxWidth: 95,
  },
  feedBrandText: {
    fontSize: 11,
    fontWeight: '700',
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  toolCircleBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  toolBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },
  toolIcon: {
    fontSize: 14,
    fontWeight: '600',
  },
  progressTrack: {
    width: '100%',
    height: 2,
    backgroundColor: 'transparent',
  },
  progressBar: {
    height: 2,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 12,
    paddingBottom: 40,
  },
  headerCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 18,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  feedRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  feedBadge: {
    fontSize: 11,
    fontWeight: '700',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  readTimeText: {
    fontSize: 11,
    fontWeight: '500',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    lineHeight: 30,
    marginBottom: 10,
    letterSpacing: -0.3,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  author: {
    fontSize: 12,
    fontWeight: '500',
  },
  metaSeparator: {
    marginHorizontal: 8,
    fontSize: 12,
  },
  metaDate: {
    fontSize: 12,
  },
  contentCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  loadingContainer: {
    paddingVertical: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 13,
  },
  bottomBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    marginTop: 16,
  },
  bottomActionBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
