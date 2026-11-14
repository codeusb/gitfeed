import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { ArticleSummary } from '../types';
import { useTheme } from '../theme/ThemeContext';

interface ArticleCardProps {
  article: ArticleSummary;
  isRead: boolean;
  isStarred: boolean;
  onPress: () => void;
  onToggleRead: () => void;
  onToggleStar: () => void;
}

export const ArticleCard: React.FC<ArticleCardProps> = ({
  article,
  isRead,
  isStarred,
  onPress,
  onToggleRead,
  onToggleStar,
}) => {
  const { tokens } = useTheme();
  const [imageError, setImageError] = React.useState(false);

  const isValidCover =
    article.coverImage &&
    !imageError &&
    !article.coverImage.endsWith('.svg') &&
    !article.coverImage.includes('shields.io') &&
    !article.coverImage.includes('/assets/icons/');

  const formatTime = (dateStr: string) => {
    try {
      const pub = new Date(dateStr).getTime();
      const diffMin = Math.floor((Date.now() - pub) / 60000);
      if (diffMin < 1) return '刚刚';
      if (diffMin < 60) return `${diffMin}m前`;
      const diffHours = Math.floor(diffMin / 60);
      if (diffHours < 24) return `${diffHours}h前`;
      const diffDays = Math.floor(diffHours / 24);
      if (diffDays === 1) return '昨天';
      if (diffDays < 7) return `${diffDays}d前`;
      return new Date(dateStr).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    } catch {
      return '';
    }
  };

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      style={[
        styles.container,
        {
          backgroundColor: isRead ? tokens.bgCardRead : tokens.bgCard,
          borderColor: tokens.borderSubtle,
          opacity: isRead ? 0.72 : 1,
        },
      ]}
    >
      {/* Top Meta */}
      <View style={styles.topMeta}>
        <View style={styles.leftMeta}>
          {!isRead && <View style={[styles.unreadDot, { backgroundColor: tokens.accent }]} />}
          <Text style={[styles.feedTitle, { color: tokens.textPrimary }]} numberOfLines={1}>
            {article.feedTitle}
          </Text>
          <Text style={[styles.dotSeparator, { color: tokens.textMuted }]}>•</Text>
          <Text style={[styles.timeText, { color: tokens.textSecondary }]}>{formatTime(article.publishedAt)}</Text>
        </View>

        <View style={styles.rightActions}>
          <TouchableOpacity onPress={onToggleStar} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text style={[styles.actionIcon, { color: isStarred ? '#f59e0b' : tokens.textMuted }]}>
              {isStarred ? '★' : '☆'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={onToggleRead}
            style={{ marginLeft: 12 }}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={[styles.actionIcon, { color: isRead ? tokens.textMuted : tokens.accent }]}>
              {isRead ? '✓' : '○'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Title & Body */}
      <View style={styles.contentRow}>
        <View style={styles.textColumn}>
          <Text
            style={[
              styles.title,
              { color: isRead ? tokens.textSecondary : tokens.textPrimary },
              isRead && styles.titleRead,
            ]}
            numberOfLines={2}
          >
            {article.title}
          </Text>
          <Text style={[styles.snippet, { color: tokens.textMuted }]} numberOfLines={2}>
            {article.snippet}
          </Text>
        </View>

        {isValidCover && (
          <Image
            source={{ uri: article.coverImage }}
            style={[styles.thumbnail, { backgroundColor: tokens.bgSubtle, borderColor: tokens.borderSubtle }]}
            resizeMode="cover"
            onError={() => setImageError(true)}
          />
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 12,
    marginVertical: 4,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  topMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  leftMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingRight: 10,
  },
  unreadDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  feedTitle: {
    fontSize: 12,
    fontWeight: '700',
    maxWidth: 160,
  },
  dotSeparator: {
    marginHorizontal: 6,
    fontSize: 10,
  },
  timeText: {
    fontSize: 11,
    fontVariant: ['tabular-nums'],
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionIcon: {
    fontSize: 15,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  textColumn: {
    flex: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 21,
    marginBottom: 4,
    letterSpacing: -0.2,
  },
  titleRead: {
    fontWeight: '400',
  },
  snippet: {
    fontSize: 12,
    lineHeight: 18,
  },
  thumbnail: {
    width: 62,
    height: 62,
    borderRadius: 12,
    borderWidth: 1,
  },
});
