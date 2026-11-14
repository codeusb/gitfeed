import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Category, Feed } from '../types';

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
  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.container}>
        <View style={styles.navbar}>
          <Text style={styles.title}>订阅源与分类</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Text style={styles.closeBtnText}>完成</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scroll}>
          {/* All articles option */}
          <TouchableOpacity
            onPress={() => {
              onSelectCategory(null);
              onSelectFeed(null);
              onClose();
            }}
            style={[styles.item, !selectedCategory && !selectedFeed && styles.itemActive]}
          >
            <Text style={[styles.itemText, !selectedCategory && !selectedFeed && styles.itemTextActive]}>
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
                  style={[styles.catHeader, isCatActive && styles.itemActive]}
                >
                  <Text style={[styles.catTitle, isCatActive && styles.itemTextActive]}>
                    📁 {cat.name}
                  </Text>
                </TouchableOpacity>

                <View style={styles.subFeeds}>
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
                        style={[styles.feedItem, isFeedActive && styles.feedItemActive]}
                      >
                        <Text
                          style={[styles.feedTitle, isFeedActive && styles.feedTitleActive]}
                          numberOfLines={1}
                        >
                          {feed.title}
                        </Text>
                        {unread > 0 && (
                          <View style={styles.badge}>
                            <Text style={styles.badgeText}>{unread}</Text>
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
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
    letterSpacing: -0.2,
  },
  closeBtn: {
    padding: 6,
  },
  closeBtnText: {
    color: '#EB6E00',
    fontWeight: 'bold',
    fontSize: 14,
  },
  scroll: {
    flex: 1,
    padding: 16,
  },
  item: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    marginBottom: 6,
  },
  itemActive: {
    backgroundColor: 'rgba(235, 110, 0, 0.15)',
  },
  itemText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#ffffff',
  },
  itemTextActive: {
    color: '#FF7A1A',
  },
  catGroup: {
    marginTop: 12,
  },
  catHeader: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
  },
  catTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#9e9e9e',
  },
  subFeeds: {
    paddingLeft: 18,
    marginTop: 4,
    borderLeftWidth: 1,
    borderLeftColor: 'rgba(255, 255, 255, 0.08)',
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
  feedItemActive: {
    backgroundColor: 'rgba(235, 110, 0, 0.15)',
  },
  feedTitle: {
    fontSize: 13,
    color: '#d4d4d4',
    flex: 1,
    paddingRight: 8,
  },
  feedTitleActive: {
    color: '#FF7A1A',
    fontWeight: '600',
  },
  badge: {
    backgroundColor: 'rgba(235, 110, 0, 0.18)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  badgeText: {
    color: '#FF7A1A',
    fontSize: 10,
    fontWeight: 'bold',
  },
});
