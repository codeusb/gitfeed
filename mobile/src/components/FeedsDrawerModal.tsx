import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Category, Feed } from '../types';
import { useTheme } from '../theme/ThemeContext';
import { X, Folder, Rss } from 'lucide-react-native';

interface FeedsDrawerModalProps {
  visible: boolean;
  onClose: () => void;
  categories: Category[];
  feeds: Feed[];
  selectedCategory: string | null;
  selectedFeed: string | null;
  onSelectCategory: (id: string | null) => void;
  onSelectFeed: (id: string | null) => void;
  feedUnreadCounts: Record<string, number>;
}

export const FeedsDrawerModal: React.FC<FeedsDrawerModalProps> = ({
  visible,
  onClose,
  categories,
  feeds,
  selectedCategory,
  selectedFeed,
  onSelectCategory,
  onSelectFeed,
  feedUnreadCounts,
}) => {
  const { tokens } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView
        edges={['top', 'bottom', 'left', 'right']}
        style={[styles.container, { backgroundColor: tokens.bgPage }]}
      >
        <View style={[styles.navbar, { borderBottomColor: tokens.borderSubtle, backgroundColor: tokens.bgPage }]}>
          <Text style={[styles.title, { color: tokens.textPrimary }]}>订阅源与分类</Text>
          <TouchableOpacity
            onPress={onClose}
            style={[styles.closeCircleBtn, { backgroundColor: tokens.bgSubtle, borderColor: tokens.borderSubtle }]}
            activeOpacity={0.7}
          >
            <X size={18} color={tokens.textPrimary} />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={{
            padding: 16,
            paddingBottom: Math.max(insets.bottom, 16) + 16,
          }}
        >
          {/* All articles option */}
          <TouchableOpacity
            onPress={() => {
              onSelectCategory(null);
              onSelectFeed(null);
              onClose();
            }}
            style={[
              styles.item,
              !selectedCategory && !selectedFeed && { backgroundColor: tokens.accentSubtle },
            ]}
          >
            <Rss size={16} color={!selectedCategory && !selectedFeed ? tokens.accent : tokens.textSecondary} style={{ marginRight: 8 }} />
            <Text
              style={[
                styles.itemText,
                { color: !selectedCategory && !selectedFeed ? tokens.accent : tokens.textPrimary },
              ]}
            >
              全部订阅
            </Text>
          </TouchableOpacity>

          {/* Categories & Feeds */}
          {categories.map((cat) => {
            const catFeeds = feeds.filter((f) => f.category === cat.id);
            const isCatActive = selectedCategory === cat.id && !selectedFeed;

            return (
              <View key={cat.id} style={styles.catGroup}>
                <TouchableOpacity
                  onPress={() => {
                    onSelectCategory(cat.id);
                    onSelectFeed(null);
                    onClose();
                  }}
                  style={[
                    styles.catHeader,
                    isCatActive && { backgroundColor: tokens.accentSubtle },
                  ]}
                >
                  <Folder size={15} color={isCatActive ? tokens.accent : tokens.textSecondary} style={{ marginRight: 7 }} />
                  <Text
                    style={[
                      styles.catTitle,
                      { color: isCatActive ? tokens.accent : tokens.textSecondary },
                    ]}
                  >
                    {cat.name}
                  </Text>
                </TouchableOpacity>

                <View style={[styles.subFeeds, { borderLeftColor: tokens.borderSubtle }]}>
                  {catFeeds.map((feed) => {
                    const isFeedActive = selectedFeed === feed.id;
                    const unread = feedUnreadCounts[feed.id] || 0;

                    return (
                      <TouchableOpacity
                        key={feed.id}
                        onPress={() => {
                          onSelectCategory(null);
                          onSelectFeed(feed.id);
                          onClose();
                        }}
                        style={[
                          styles.feedItem,
                          isFeedActive && { backgroundColor: tokens.accentSubtle },
                        ]}
                      >
                        <Text
                          style={[
                            styles.feedTitle,
                            { color: isFeedActive ? tokens.accent : tokens.textPrimary },
                            isFeedActive && styles.feedTitleActive,
                          ]}
                          numberOfLines={1}
                        >
                          {feed.title}
                        </Text>
                        {unread > 0 && (
                          <View style={[styles.badge, { backgroundColor: tokens.accentSubtle }]}>
                            <Text style={[styles.badgeText, { color: tokens.accent }]}>{unread}</Text>
                          </View>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            );
          })}
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
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: -0.2,
  },
  closeCircleBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeIcon: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  scroll: {
    flex: 1,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    marginBottom: 6,
  },
  itemText: {
    fontSize: 15,
    fontWeight: '600',
  },
  catGroup: {
    marginTop: 12,
  },
  catHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
  },
  catTitle: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  subFeeds: {
    paddingLeft: 18,
    marginTop: 4,
    borderLeftWidth: 1,
    marginLeft: 14,
  },
  feedItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 9,
    paddingHorizontal: 10,
    borderRadius: 10,
    marginVertical: 1,
  },
  feedTitle: {
    fontSize: 13,
    flex: 1,
    paddingRight: 8,
  },
  feedTitleActive: {
    fontWeight: '600',
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
});
