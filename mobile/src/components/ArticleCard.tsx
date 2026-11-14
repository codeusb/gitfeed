import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { ArticleSummary } from '../types';

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
      style={[styles.container, isRead && styles.containerRead]}
    >
      {/* Top Meta */}
      <View style={styles.topMeta}>
        <View style={styles.leftMeta}>
          {!isRead && <View style={styles.unreadDot} />}
          <Text style={styles.feedTitle} numberOfLines={1}>
            {article.feedTitle}
          </Text>
          <Text style={styles.dotSeparator}>•</Text>
          <Text style={styles.timeText}>{formatTime(article.publishedAt)}</Text>
        </View>

        <View style={styles.rightActions}>
          <TouchableOpacity onPress={onToggleStar} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text style={[styles.actionIcon, isStarred && styles.starActive]}>
              {isStarred ? '★' : '☆'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={onToggleRead}
            style={{ marginLeft: 12 }}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={[styles.actionIcon, !isRead && styles.unreadAction]}>
              {isRead ? '✓' : '○'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Title & Body */}
      <View style={styles.contentRow}>
        <View style={styles.textColumn}>
          <Text style={[styles.title, isRead && styles.titleRead]} numberOfLines={2}>
            {article.title}
          </Text>
          <Text style={styles.snippet} numberOfLines={2}>
            {article.snippet}
          </Text>
        </View>

        {article.coverImage && (
          <Image
            source={{ uri: article.coverImage }}
            style={styles.thumbnail}
            resizeMode="cover"
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
    backgroundColor: '#222222',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  containerRead: {
    opacity: 0.72,
    backgroundColor: '#1c1c1c',
    borderColor: 'rgba(255, 255, 255, 0.04)',
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
    backgroundColor: '#EB6E00',
    marginRight: 6,
  },
  feedTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ffffff',
    maxWidth: 160,
  },
  dotSeparator: {
    color: '#666666',
    marginHorizontal: 6,
    fontSize: 10,
  },
  timeText: {
    fontSize: 11,
    color: '#9e9e9e',
    fontVariant: ['tabular-nums'],
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionIcon: {
    fontSize: 15,
    color: '#888888',
  },
  unreadAction: {
    color: '#EB6E00',
  },
  starActive: {
    color: '#f59e0b',
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
    color: '#ffffff',
    lineHeight: 21,
    marginBottom: 4,
    letterSpacing: -0.2,
  },
  titleRead: {
    color: '#9e9e9e',
    fontWeight: '400',
  },
  snippet: {
    fontSize: 12,
    color: '#888888',
    lineHeight: 18,
  },
  thumbnail: {
    width: 62,
    height: 62,
    borderRadius: 12,
    backgroundColor: '#262626',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
});
