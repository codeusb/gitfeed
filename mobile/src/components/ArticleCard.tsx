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
      if (diffMin < 60) return `${diffMin}分钟前`;
      const diffHours = Math.floor(diffMin / 60);
      if (diffHours < 24) return `${diffHours}小时前`;
      const diffDays = Math.floor(diffHours / 24);
      if (diffDays === 1) return '昨天';
      if (diffDays < 7) return `${diffDays}天前`;
      return new Date(dateStr).toLocaleDateString();
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
            <Text style={styles.actionIcon}>{isRead ? '✓' : '○'}</Text>
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
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#1e293b',
    backgroundColor: '#090d16',
  },
  containerRead: {
    opacity: 0.65,
    backgroundColor: 'transparent',
  },
  topMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  leftMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingRight: 10,
  },
  unreadDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#f97316',
    marginRight: 6,
  },
  feedTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#cbd5e1',
    maxWidth: 160,
  },
  dotSeparator: {
    color: '#64748b',
    marginHorizontal: 5,
    fontSize: 10,
  },
  timeText: {
    fontSize: 11,
    color: '#64748b',
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionIcon: {
    fontSize: 15,
    color: '#64748b',
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
    color: '#f8fafc',
    lineHeight: 21,
    marginBottom: 4,
  },
  titleRead: {
    color: '#94a3b8',
    fontWeight: 'normal',
  },
  snippet: {
    fontSize: 12,
    color: '#64748b',
    lineHeight: 18,
  },
  thumbnail: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#1e293b',
  },
});
