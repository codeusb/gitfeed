import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Linking,
  ScrollView,
  Dimensions,
  Modal,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { ThemeTokens } from '../theme/tokens';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface RichContentRendererProps {
  content: string;
  fontSize?: number;
  tokens: ThemeTokens;
  coverImage?: string | null;
}

// -------------------------------------------------------------
// HTML Entity Decoder
// -------------------------------------------------------------
function decodeHtmlEntities(str: string): string {
  if (!str) return '';
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, '/')
    .replace(/&nbsp;/g, ' ')
    .replace(/&mdash;/g, '—')
    .replace(/&ndash;/g, '–')
    .replace(/&hellip;/g, '…')
    .replace(/&#(\d+);/g, (_, dec) => {
      try {
        return String.fromCharCode(Number(dec));
      } catch {
        return '';
      }
    });
}

// -------------------------------------------------------------
// Inline Tokenizer (bold, italic, code, links)
// -------------------------------------------------------------
interface InlineToken {
  type: 'text' | 'bold' | 'italic' | 'code' | 'link';
  text: string;
  url?: string;
}

function parseInlineTokens(text: string): InlineToken[] {
  if (!text) return [];

  const tokens: InlineToken[] = [];
  const tagPattern =
    /(<a\s+[^>]*href=["']([^"']+)["'][^>]*>(.*?)<\/a>)|(<strong[^>]*>(.*?)<\/strong>)|(<b[^>]*>(.*?)<\/b>)|(<em[^>]*>(.*?)<\/em>)|(<i[^>]*>(.*?)<\/i>)|(<code[^>]*>(.*?)<\/code>)|(\[(.*?)\]\((.*?)\))|(\*\*(.*?)\*\*)|(\*(.*?)\*)|(`(.*?)`)/gi;

  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = tagPattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      const plain = text.slice(lastIndex, match.index);
      if (plain) {
        tokens.push({ type: 'text', text: decodeHtmlEntities(plain) });
      }
    }

    if (match[1]) {
      tokens.push({
        type: 'link',
        url: match[2],
        text: decodeHtmlEntities(match[3].replace(/<[^>]+>/g, '')),
      });
    } else if (match[4] || match[6]) {
      const inner = match[5] || match[7];
      tokens.push({ type: 'bold', text: decodeHtmlEntities(inner.replace(/<[^>]+>/g, '')) });
    } else if (match[8] || match[10]) {
      const inner = match[9] || match[11];
      tokens.push({ type: 'italic', text: decodeHtmlEntities(inner.replace(/<[^>]+>/g, '')) });
    } else if (match[12]) {
      tokens.push({ type: 'code', text: decodeHtmlEntities(match[13].replace(/<[^>]+>/g, '')) });
    } else if (match[14]) {
      tokens.push({ type: 'link', text: decodeHtmlEntities(match[15]), url: match[16] });
    } else if (match[17]) {
      tokens.push({ type: 'bold', text: decodeHtmlEntities(match[18]) });
    } else if (match[19]) {
      tokens.push({ type: 'italic', text: decodeHtmlEntities(match[20]) });
    } else if (match[21]) {
      tokens.push({ type: 'code', text: decodeHtmlEntities(match[22]) });
    }

    lastIndex = tagPattern.lastIndex;
  }

  if (lastIndex < text.length) {
    tokens.push({ type: 'text', text: decodeHtmlEntities(text.slice(lastIndex)) });
  }

  return tokens;
}

// -------------------------------------------------------------
// Block Types
// -------------------------------------------------------------
export interface OverviewItem {
  text: string;
  link?: string;
  ref?: string;
}

export interface OverviewCategory {
  title: string;
  items: OverviewItem[];
}

export type ContentBlock =
  | { type: 'video'; youtubeUrl?: string; bilibiliUrl?: string; title?: string }
  | { type: 'overview'; categories: OverviewCategory[] }
  | { type: 'heading'; level: number; text: string; anchor?: string; link?: string }
  | { type: 'paragraph'; text: string }
  | { type: 'image'; src: string; alt?: string }
  | { type: 'image_gallery'; images: { src: string; alt?: string }[] }
  | { type: 'code'; code: string; lang?: string }
  | { type: 'quote'; text: string }
  | { type: 'list'; items: string[]; ordered: boolean }
  | { type: 'related_links'; links: { title?: string; url: string }[] }
  | { type: 'hr' };

// -------------------------------------------------------------
// Robust Content Parser
// -------------------------------------------------------------
function parseContentToBlocks(raw: string, coverImage?: string | null): ContentBlock[] {
  if (!raw) return [];

  let cleaned = raw.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  cleaned = cleaned.replace(/<(script|style|noscript)[^>]*>[\s\S]*?<\/\1>/gi, '');

  const rawBlocks: ContentBlock[] = [];

  // 1. Detect Hero Video Block (daily.juya.uk video section)
  const videoRegex =
    /<(?:p|section)[^>]*>[\s\S]*?(?:视频版|Video|视频)[\s\S]*?<a\s+[^>]*href=["']([^"']*(?:youtube|youtu\.be)[^"']*)["'][^>]*>[\s\S]*?<\/a>[\s\S]*?<a\s+[^>]*href=["']([^"']*(?:bilibili)[^"']*)["'][^>]*>[\s\S]*?<\/a>[\s\S]*?<\/(?:p|section)>/i;
  const videoMatch = cleaned.match(videoRegex);
  if (videoMatch) {
    rawBlocks.push({
      type: 'video',
      youtubeUrl: videoMatch[1],
      bilibiliUrl: videoMatch[2],
    });
    cleaned = cleaned.replace(videoMatch[0], '');
  }

  // 2. Detect "概览" (TOC Overview Card)
  const overviewRegex =
    /<h2[^>]*>(?:概览|Overview|目录)<\/h2>([\s\S]*?)(?=<hr|<h2|$)/i;
  const overviewMatch = cleaned.match(overviewRegex);
  if (overviewMatch) {
    const overviewContent = overviewMatch[1];
    const categories: OverviewCategory[] = [];
    const catRegex = /<h3[^>]*>([\s\S]*?)<\/h3>([\s\S]*?)(?=<h3|$)/gi;
    let catMatch: RegExpExecArray | null;

    while ((catMatch = catRegex.exec(overviewContent)) !== null) {
      const catTitle = decodeHtmlEntities(catMatch[1].replace(/<[^>]+>/g, '').trim());
      const catBody = catMatch[2];
      const items: OverviewItem[] = [];

      const liRegex = /<li[^>]*>([\s\S]*?)<\/li>/gi;
      let liMatch: RegExpExecArray | null;
      while ((liMatch = liRegex.exec(catBody)) !== null) {
        const liHtml = liMatch[1];
        const linkMatch = liHtml.match(/<a\s+[^>]*href=["']([^"']+)["'][^>]*>(?:↗|&nearr;)?<\/a>/i);
        const refMatch = liHtml.match(/(?:<code>|&lt;code&gt;)?#(\d+)(?:<\/code>|&lt;\/code&gt;)?/i);

        let cleanText = liHtml
          .replace(/<a\s+[^>]*href=["'][^"']+["'][^>]*>(?:↗|&nearr;)?<\/a>/gi, '')
          .replace(/(?:<code>|&lt;code&gt;)?#\d+(?:<\/code>|&lt;\/code&gt;)?/gi, '')
          .replace(/<[^>]+>/g, '')
          .trim();

        items.push({
          text: decodeHtmlEntities(cleanText),
          link: linkMatch ? linkMatch[1] : undefined,
          ref: refMatch ? `#${refMatch[1]}` : undefined,
        });
      }

      if (items.length > 0) {
        categories.push({ title: catTitle, items });
      }
    }

    if (categories.length > 0) {
      rawBlocks.push({ type: 'overview', categories });
      cleaned = cleaned.replace(overviewMatch[0], '');
    }
  }

  // 3. Strip container wrappers (div, section, article, main, details, summary) so tags inside are flat
  cleaned = cleaned.replace(/<\/?(div|section|article|main|details|summary)[^>]*>/gi, '');

  // 4. Tag-based block parser (bulletproof: avoids fragile group numbering)
  const blockRegex =
    /<(h[1-6]|blockquote|pre|ul|ol|p)([^>]*)>([\s\S]*?)<\/\1>|<img\s+([^>]*)\/?>|<hr\s*\/?>/gi;

  let match: RegExpExecArray | null;
  while ((match = blockRegex.exec(cleaned)) !== null) {
    const tagName = match[1] ? match[1].toLowerCase() : null;
    const tagAttrs = match[2] || '';
    const inner = match[3] || '';
    const isHr = match[0].toLowerCase().startsWith('<hr');
    const isImg = match[0].toLowerCase().startsWith('<img');

    if (isImg) {
      const srcMatch = match[0].match(/src=["']([^"']+)["']/i);
      const altMatch = match[0].match(/alt=["']([^"']*)["']/i);
      if (srcMatch && srcMatch[1] && !srcMatch[1].startsWith('data:image/svg')) {
        rawBlocks.push({ type: 'image', src: srcMatch[1], alt: altMatch ? altMatch[1] : undefined });
      }
    } else if (isHr) {
      rawBlocks.push({ type: 'hr' });
    } else if (tagName && tagName.startsWith('h')) {
      const level = parseInt(tagName[1], 10) || 2;
      const refMatch = inner.match(/(?:<code>|&lt;code&gt;)?#(\d+)(?:<\/code>|&lt;\/code&gt;)?/i);
      const aMatch = inner.match(/<a\s+[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/i);
      const cleanText = inner
        .replace(/(?:<code>|&lt;code&gt;)?#\d+(?:<\/code>|&lt;\/code&gt;)?/gi, '')
        .replace(/<[^>]+>/g, '')
        .trim();
      if (cleanText) {
        rawBlocks.push({
          type: 'heading',
          level,
          text: decodeHtmlEntities(cleanText),
          anchor: refMatch ? `#${refMatch[1]}` : undefined,
          link: aMatch ? aMatch[1] : undefined,
        });
      }
    } else if (tagName === 'blockquote') {
      const cleanQuote = inner.replace(/<[^>]+>/g, '').trim();
      if (cleanQuote) {
        rawBlocks.push({ type: 'quote', text: decodeHtmlEntities(cleanQuote) });
      }
    } else if (tagName === 'pre') {
      const cleanCode = inner.replace(/<[^>]+>/g, '').trim();
      rawBlocks.push({ type: 'code', code: decodeHtmlEntities(cleanCode) });
    } else if (tagName === 'ul' || tagName === 'ol') {
      if (tagAttrs.includes('event-related-links') || inner.includes('event-related-links') || inner.includes('http')) {
        const links: { title?: string; url: string }[] = [];
        const aRegex = /<a\s+[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
        let aM: RegExpExecArray | null;
        while ((aM = aRegex.exec(inner)) !== null) {
          links.push({
            url: aM[1],
            title: decodeHtmlEntities(aM[2].replace(/<[^>]+>/g, '').trim()),
          });
        }
        if (links.length > 0) {
          rawBlocks.push({ type: 'related_links', links });
        } else {
          const items: string[] = [];
          const liRegex = /<li[^>]*>([\s\S]*?)<\/li>/gi;
          let liM: RegExpExecArray | null;
          while ((liM = liRegex.exec(inner)) !== null) {
            const t = liM[1].replace(/<[^>]+>/g, '').trim();
            if (t) items.push(decodeHtmlEntities(t));
          }
          if (items.length > 0) rawBlocks.push({ type: 'list', items, ordered: tagName === 'ol' });
        }
      } else {
        const items: string[] = [];
        const liRegex = /<li[^>]*>([\s\S]*?)<\/li>/gi;
        let liM: RegExpExecArray | null;
        while ((liM = liRegex.exec(inner)) !== null) {
          const t = liM[1].replace(/<[^>]+>/g, '').trim();
          if (t) items.push(decodeHtmlEntities(t));
        }
        if (items.length > 0) rawBlocks.push({ type: 'list', items, ordered: tagName === 'ol' });
      }
    } else if (tagName === 'p') {
      const imgM = inner.match(/<img\s+[^>]*src=["']([^"']+)["'][^>]*>/i);
      if (imgM && imgM[1]) {
        const altM = imgM[0].match(/alt=["']([^"']*)["']/i);
        rawBlocks.push({ type: 'image', src: imgM[1], alt: altM ? altM[1] : undefined });
        const remaining = inner.replace(imgM[0], '').replace(/<[^>]+>/g, '').trim();
        if (remaining) rawBlocks.push({ type: 'paragraph', text: decodeHtmlEntities(remaining) });
      } else if (inner.includes('相关链接')) {
        // Skip pure label since the list follows
      } else {
        const cleanP = inner.trim();
        if (cleanP) rawBlocks.push({ type: 'paragraph', text: decodeHtmlEntities(cleanP) });
      }
    }
  }

  // 5. Merge Adjacent Images into Multi-Image Gallery
  const finalBlocks: ContentBlock[] = [];
  let pendingImages: { src: string; alt?: string }[] = [];

  const flushImages = () => {
    if (pendingImages.length === 1) {
      finalBlocks.push({
        type: 'image',
        src: pendingImages[0].src,
        alt: pendingImages[0].alt,
      });
    } else if (pendingImages.length > 1) {
      finalBlocks.push({
        type: 'image_gallery',
        images: [...pendingImages],
      });
    }
    pendingImages = [];
  };

  for (const block of rawBlocks) {
    if (block.type === 'image') {
      if (
        coverImage &&
        finalBlocks.length === 0 &&
        block.src.includes(coverImage.slice(-20))
      ) {
        continue;
      }
      pendingImages.push({ src: block.src, alt: block.alt });
    } else {
      flushImages();
      finalBlocks.push(block);
    }
  }
  flushImages();

  return finalBlocks;
}

// -------------------------------------------------------------
// Component: Fullscreen Lightbox Modal
// -------------------------------------------------------------
interface LightboxModalProps {
  visible: boolean;
  images: { src: string; alt?: string }[];
  initialIndex: number;
  tokens: ThemeTokens;
  onClose: () => void;
}

const LightboxModal: React.FC<LightboxModalProps> = ({
  visible,
  images,
  initialIndex,
  tokens,
  onClose,
}) => {
  const [index, setIndex] = useState(initialIndex);

  useEffect(() => {
    setIndex(initialIndex);
  }, [initialIndex]);

  if (!visible || images.length === 0) return null;

  const current = images[index] || images[0];

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.lightboxContainer}>
        <View style={styles.lightboxHeader}>
          <Text style={styles.lightboxCounter}>
            {images.length > 1 ? `${index + 1} / ${images.length}` : '图片预览'}
          </Text>
          <TouchableOpacity onPress={onClose} style={styles.lightboxCloseBtn} activeOpacity={0.8}>
            <Text style={styles.lightboxCloseText}>✕</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.lightboxImageWrap}>
          <Image
            source={{ uri: current.src }}
            style={styles.lightboxImage}
            resizeMode="contain"
          />
        </View>

        <View style={styles.lightboxFooter}>
          {Boolean(current.alt) ? (
            <Text style={styles.lightboxAltText} numberOfLines={2}>
              {current.alt}
            </Text>
          ) : null}

          <View style={styles.lightboxControlsRow}>
            {images.length > 1 ? (
              <View style={styles.lightboxNavRow}>
                <TouchableOpacity
                  disabled={index <= 0}
                  onPress={() => setIndex((i) => Math.max(0, i - 1))}
                  style={[styles.lightboxNavBtn, index <= 0 && { opacity: 0.3 }]}
                >
                  <Text style={styles.lightboxNavBtnText}>‹</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  disabled={index >= images.length - 1}
                  onPress={() => setIndex((i) => Math.min(images.length - 1, i + 1))}
                  style={[styles.lightboxNavBtn, index >= images.length - 1 && { opacity: 0.3 }]}
                >
                  <Text style={styles.lightboxNavBtnText}>›</Text>
                </TouchableOpacity>
              </View>
            ) : null}

            <TouchableOpacity
              onPress={() => Linking.openURL(current.src)}
              style={styles.lightboxOpenBtn}
            >
              <Text style={styles.lightboxOpenText}>查看原图 ↗</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

// -------------------------------------------------------------
// Component: Single Article Image
// -------------------------------------------------------------
const ArticleImage: React.FC<{
  src: string;
  alt?: string;
  tokens: ThemeTokens;
  onOpenLightbox: (src: string, alt?: string) => void;
}> = ({ src, alt, tokens, onOpenLightbox }) => {
  const [aspectRatio, setAspectRatio] = useState<number>(16 / 9);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!src || src.startsWith('data:')) return;
    try {
      Image.getSize(
        encodeURI(src),
        (w, h) => {
          if (w > 0 && h > 0) {
            setAspectRatio(Math.min(2.5, Math.max(0.65, w / h)));
          }
        },
        () => setError(true)
      );
    } catch {
      setError(true);
    }
  }, [src]);

  if (error || !src) return null;

  if (src.includes('shields.io') || src.includes('badge')) {
    return (
      <View style={styles.badgeContainer}>
        <Image source={{ uri: src }} style={styles.badgeImage} resizeMode="contain" />
      </View>
    );
  }

  const hasCaption = Boolean(alt && alt.trim().length > 0 && !alt.startsWith('http'));

  return (
    <TouchableOpacity
      activeOpacity={0.92}
      onPress={() => onOpenLightbox(src, alt)}
      style={[
        styles.singleImageCard,
        {
          borderColor: tokens.borderSubtle,
          backgroundColor: tokens.bgSubtle,
        },
      ]}
    >
      <Image
        source={{ uri: src }}
        style={[styles.singleImage, { aspectRatio }]}
        resizeMode="contain"
      />
      {hasCaption ? (
        <View style={[styles.captionBox, { borderTopColor: tokens.borderSubtle }]}>
          <Text style={[styles.captionText, { color: tokens.textMuted }]}>{alt}</Text>
        </View>
      ) : null}
      <View style={[styles.imageZoomBadge, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
        <Text style={styles.imageZoomText}>🔍 点击放大</Text>
      </View>
    </TouchableOpacity>
  );
};

// -------------------------------------------------------------
// Component: Multi-Image Horizontal Gallery
// -------------------------------------------------------------
const ArticleImageGallery: React.FC<{
  images: { src: string; alt?: string }[];
  tokens: ThemeTokens;
  onOpenLightbox: (index: number) => void;
}> = ({ images, tokens, onOpenLightbox }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollRef = useRef<ScrollView>(null);
  const cardWidth = SCREEN_WIDTH - 64;

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const x = e.nativeEvent.contentOffset.x;
    const idx = Math.round(x / cardWidth);
    if (idx !== currentIndex && idx >= 0 && idx < images.length) {
      setCurrentIndex(idx);
    }
  };

  const scrollTo = (idx: number) => {
    if (idx >= 0 && idx < images.length) {
      scrollRef.current?.scrollTo({ x: idx * cardWidth, animated: true });
      setCurrentIndex(idx);
    }
  };

  return (
    <View style={styles.galleryContainer}>
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        pagingEnabled
        snapToInterval={cardWidth}
        decelerationRate="fast"
        onScroll={handleScroll}
        scrollEventThrottle={16}
        contentContainerStyle={styles.galleryScrollContent}
      >
        {images.map((item, idx) => (
          <TouchableOpacity
            key={idx}
            activeOpacity={0.92}
            onPress={() => onOpenLightbox(idx)}
            style={[
              styles.galleryCard,
              {
                width: cardWidth,
                borderColor: tokens.borderSubtle,
                backgroundColor: tokens.bgSubtle,
              },
            ]}
          >
            <Image
              source={{ uri: item.src }}
              style={styles.galleryImage}
              resizeMode="contain"
            />
            {Boolean(item.alt) ? (
              <View style={[styles.captionBox, { borderTopColor: tokens.borderSubtle }]}>
                <Text style={[styles.captionText, { color: tokens.textMuted }]} numberOfLines={1}>
                  {item.alt}
                </Text>
              </View>
            ) : null}
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={styles.galleryControls}>
        <TouchableOpacity
          disabled={currentIndex <= 0}
          onPress={() => scrollTo(currentIndex - 1)}
          style={[
            styles.galleryButton,
            { backgroundColor: tokens.bgSubtle },
            currentIndex <= 0 && { opacity: 0.3 },
          ]}
        >
          <Text style={[styles.galleryButtonText, { color: tokens.textPrimary }]}>‹</Text>
        </TouchableOpacity>

        <View
          style={[
            styles.galleryCountBadge,
            { backgroundColor: tokens.bgSubtle, borderColor: tokens.borderSubtle },
          ]}
        >
          <Text style={[styles.galleryCountText, { color: tokens.textSecondary }]}>
            {currentIndex + 1} / {images.length}
          </Text>
        </View>

        <TouchableOpacity
          disabled={currentIndex >= images.length - 1}
          onPress={() => scrollTo(currentIndex + 1)}
          style={[
            styles.galleryButton,
            { backgroundColor: tokens.bgSubtle },
            currentIndex >= images.length - 1 && { opacity: 0.3 },
          ]}
        >
          <Text style={[styles.galleryButtonText, { color: tokens.textPrimary }]}>›</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// -------------------------------------------------------------
// Component: Hero Video / Media Player Card
// -------------------------------------------------------------
const HeroVideoCard: React.FC<{
  video: { youtubeUrl?: string; bilibiliUrl?: string; title?: string };
  coverImage?: string | null;
  tokens: ThemeTokens;
}> = ({ video, coverImage, tokens }) => {
  const [platform, setPlatform] = useState<'youtube' | 'bilibili'>('youtube');

  const primaryUrl =
    platform === 'youtube'
      ? video.youtubeUrl || video.bilibiliUrl
      : video.bilibiliUrl || video.youtubeUrl;

  const handleOpenVideo = () => {
    if (primaryUrl) {
      Linking.openURL(primaryUrl);
    }
  };

  return (
    <View
      style={[
        styles.heroVideoCard,
        {
          borderColor: tokens.borderSubtle,
          backgroundColor: tokens.bgSubtle,
        },
      ]}
    >
      <View style={styles.heroVideoFrame}>
        {Boolean(coverImage) ? (
          <Image source={{ uri: coverImage! }} style={styles.heroVideoCover} resizeMode="cover" />
        ) : (
          <View style={[styles.heroVideoCover, { backgroundColor: '#18181b' }]} />
        )}

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={handleOpenVideo}
          style={styles.heroPlayOverlay}
        >
          <View style={[styles.heroPlayCircle, { backgroundColor: '#e11d48' }]}>
            <Text style={styles.heroPlayTriangle}>▶</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={handleOpenVideo}
          style={styles.heroTopRightBadge}
        >
          <Text style={styles.heroTopRightText}>前往平台观看 ↗</Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.heroVideoToolbar, { borderTopColor: tokens.borderSubtle }]}>
        <View style={styles.heroPlatformSwitchRow}>
          {Boolean(video.youtubeUrl) ? (
            <TouchableOpacity
              onPress={() => setPlatform('youtube')}
              style={[
                styles.heroPlatformBtn,
                platform === 'youtube' && {
                  backgroundColor: tokens.accent,
                },
                platform !== 'youtube' && {
                  backgroundColor: tokens.bgSubtle,
                },
              ]}
            >
              <Text
                style={[
                  styles.heroPlatformBtnText,
                  {
                    color: platform === 'youtube' ? '#ffffff' : tokens.textSecondary,
                  },
                ]}
              >
                YouTube
              </Text>
            </TouchableOpacity>
          ) : null}

          {Boolean(video.bilibiliUrl) ? (
            <TouchableOpacity
              onPress={() => setPlatform('bilibili')}
              style={[
                styles.heroPlatformBtn,
                platform === 'bilibili' && {
                  backgroundColor: tokens.accent,
                },
                platform !== 'bilibili' && {
                  backgroundColor: tokens.bgSubtle,
                },
              ]}
            >
              <Text
                style={[
                  styles.heroPlatformBtnText,
                  {
                    color: platform === 'bilibili' ? '#ffffff' : tokens.textSecondary,
                  },
                ]}
              >
                哔哩哔哩
              </Text>
            </TouchableOpacity>
          ) : null}
        </View>

        <TouchableOpacity onPress={handleOpenVideo} style={styles.heroWatchDirectBtn}>
          <Text style={[styles.heroWatchDirectText, { color: tokens.accent }]}>
            立即播放 ↗
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// -------------------------------------------------------------
// Component: Issue Overview Card (TOC / 概览) with Full Font Scaling
// -------------------------------------------------------------
const IssueOverviewCard: React.FC<{
  categories: OverviewCategory[];
  fontSize: number;
  tokens: ThemeTokens;
}> = ({ categories, fontSize, tokens }) => {
  return (
    <View
      style={[
        styles.overviewContainer,
        {
          borderColor: tokens.borderSubtle,
          backgroundColor: tokens.bgSurface,
        },
      ]}
    >
      <View style={styles.overviewHeaderRow}>
        <Text style={[styles.overviewMainTitle, { color: tokens.textPrimary, fontSize: fontSize * 1.25 }]}>
          概览
        </Text>
        <View style={[styles.overviewBadge, { backgroundColor: tokens.accentSubtle }]}>
          <Text style={[styles.overviewBadgeText, { color: tokens.accent, fontSize: Math.max(10, fontSize * 0.7) }]}>
            导读目录
          </Text>
        </View>
      </View>

      {categories.map((cat, catIdx) => (
        <View key={catIdx} style={styles.overviewCategorySection}>
          <Text style={[styles.overviewCategoryTitle, { color: tokens.textPrimary, fontSize: fontSize * 1.05 }]}>
            {cat.title}
          </Text>
          <View style={styles.overviewItemList}>
            {cat.items.map((item, itemIdx) => (
              <View key={itemIdx} style={styles.overviewItemRow}>
                <Text style={[styles.overviewBullet, { color: tokens.accent, fontSize: fontSize * 0.95 }]}>•</Text>
                <View style={styles.overviewItemContent}>
                  <Text style={[styles.overviewItemText, { color: tokens.textPrimary, fontSize: fontSize * 0.95, lineHeight: fontSize * 1.55 }]}>
                    {item.text}
                    {Boolean(item.link) ? (
                      <Text
                        style={[styles.overviewExternalArrow, { color: tokens.accent, fontSize: fontSize * 0.85 }]}
                        onPress={() => item.link && Linking.openURL(item.link)}
                      >
                        {' '}
                        ↗
                      </Text>
                    ) : null}
                  </Text>
                </View>
                {Boolean(item.ref) ? (
                  <View
                    style={[
                      styles.overviewAnchorPill,
                      {
                        backgroundColor: tokens.accentSubtle,
                        borderColor: tokens.accent,
                      },
                    ]}
                  >
                    <Text style={[styles.overviewAnchorText, { color: tokens.accent, fontSize: Math.max(10, fontSize * 0.72) }]}>
                      {item.ref}
                    </Text>
                  </View>
                ) : null}
              </View>
            ))}
          </View>
        </View>
      ))}
    </View>
  );
};

// -------------------------------------------------------------
// Component: Related Links Card (daily.juya.uk .event-related-links style)
// -------------------------------------------------------------
const RelatedLinksCard: React.FC<{
  links: { title?: string; url: string }[];
  fontSize: number;
  tokens: ThemeTokens;
}> = ({ links, fontSize, tokens }) => {
  return (
    <View style={styles.relatedLinksContainer}>
      <Text style={[styles.relatedTitle, { color: tokens.textSecondary, fontSize: fontSize * 0.9 }]}>
        相关链接：
      </Text>
      <View style={styles.relatedList}>
        {links.map((link, idx) => (
          <TouchableOpacity
            key={idx}
            activeOpacity={0.7}
            onPress={() => Linking.openURL(link.url)}
            style={styles.relatedLinkRow}
          >
            <Text style={[styles.relatedBullet, { color: tokens.textMuted, fontSize: fontSize * 0.9 }]}>•</Text>
            <Text style={[styles.relatedLinkText, { color: tokens.accent, fontSize: fontSize * 0.85, lineHeight: fontSize * 1.45 }]}>
              {link.title || link.url}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

// -------------------------------------------------------------
// Main RichContentRenderer Component
// -------------------------------------------------------------
export const RichContentRenderer: React.FC<RichContentRendererProps> = ({
  content,
  fontSize = 16,
  tokens,
  coverImage,
}) => {
  const [lightboxState, setLightboxState] = useState<{
    visible: boolean;
    images: { src: string; alt?: string }[];
    index: number;
  }>({
    visible: false,
    images: [],
    index: 0,
  });

  const blocks = useMemo(() => {
    try {
      const parsed = parseContentToBlocks(content, coverImage);
      if (parsed.length > 0) return parsed;
      return [
        {
          type: 'paragraph' as const,
          text: content ? decodeHtmlEntities(content.replace(/<[^>]+>/g, '')) : '',
        },
      ];
    } catch (e) {
      console.warn('Failed to parse rich content:', e);
      return [
        {
          type: 'paragraph' as const,
          text: content ? decodeHtmlEntities(content.replace(/<[^>]+>/g, '')) : '',
        },
      ];
    }
  }, [content, coverImage]);

  const openLightbox = (images: { src: string; alt?: string }[], index: number = 0) => {
    setLightboxState({
      visible: true,
      images,
      index,
    });
  };

  const renderInline = (text: string, baseStyle: any) => {
    const tokensList = parseInlineTokens(text);
    return (
      <Text style={baseStyle}>
        {tokensList.map((token, idx) => {
          if (token.type === 'bold') {
            return (
              <Text key={idx} style={{ fontWeight: '700', color: tokens.textPrimary }}>
                {token.text}
              </Text>
            );
          }
          if (token.type === 'italic') {
            return (
              <Text key={idx} style={{ fontStyle: 'italic', color: tokens.textSecondary }}>
                {token.text}
              </Text>
            );
          }
          if (token.type === 'code') {
            return (
              <Text
                key={idx}
                style={[
                  styles.inlineCode,
                  {
                    backgroundColor: tokens.bgSubtle,
                    color: tokens.accent,
                    borderColor: tokens.borderSubtle,
                    fontSize: fontSize * 0.88,
                  },
                ]}
              >
                {` ${token.text} `}
              </Text>
            );
          }
          if (token.type === 'link' && token.url) {
            return (
              <Text
                key={idx}
                style={[styles.inlineLink, { color: tokens.accent }]}
                onPress={() => {
                  if (token.url) {
                    Linking.canOpenURL(token.url).then((ok) => {
                      if (ok) Linking.openURL(token.url!);
                    });
                  }
                }}
              >
                {token.text}
              </Text>
            );
          }
          return <Text key={idx}>{token.text}</Text>;
        })}
      </Text>
    );
  };

  if (!blocks || blocks.length === 0) {
    return (
      <Text style={{ color: tokens.textSecondary, fontSize, lineHeight: fontSize * 1.7 }}>
        {decodeHtmlEntities(content.replace(/<[^>]+>/g, ''))}
      </Text>
    );
  }

  return (
    <View style={styles.container}>
      {blocks.map((block, index) => {
        switch (block.type) {
          case 'video':
            return (
              <HeroVideoCard
                key={index}
                video={block}
                coverImage={coverImage}
                tokens={tokens}
              />
            );

          case 'overview':
            return (
              <IssueOverviewCard
                key={index}
                categories={block.categories}
                fontSize={fontSize}
                tokens={tokens}
              />
            );

          case 'heading': {
            const hFontSize =
              block.level === 1
                ? fontSize * 1.45
                : block.level === 2
                ? fontSize * 1.3
                : fontSize * 1.15;
            return (
              <View key={index} style={styles.headingBox}>
                <View style={styles.headingRow}>
                  <Text
                    style={[
                      styles.headingText,
                      {
                        fontSize: hFontSize,
                        lineHeight: hFontSize * 1.35,
                        color: tokens.textPrimary,
                        flex: 1,
                      },
                    ]}
                    onPress={() => {
                      if (block.link) Linking.openURL(block.link);
                    }}
                  >
                    {block.text}
                    {Boolean(block.link) ? (
                      <Text style={{ color: tokens.accent, fontSize: hFontSize * 0.85 }}> ↗</Text>
                    ) : null}
                  </Text>
                  {Boolean(block.anchor) ? (
                    <View
                      style={[
                        styles.headingAnchorPill,
                        {
                          backgroundColor: tokens.accentSubtle,
                          borderColor: tokens.accent,
                        },
                      ]}
                    >
                      <Text style={[styles.headingAnchorText, { color: tokens.accent, fontSize: Math.max(10, fontSize * 0.72) }]}>
                        {block.anchor}
                      </Text>
                    </View>
                  ) : null}
                </View>
              </View>
            );
          }

          case 'image':
            return (
              <ArticleImage
                key={index}
                src={block.src}
                alt={block.alt}
                tokens={tokens}
                onOpenLightbox={(src, alt) => openLightbox([{ src, alt }], 0)}
              />
            );

          case 'image_gallery':
            return (
              <ArticleImageGallery
                key={index}
                images={block.images}
                tokens={tokens}
                onOpenLightbox={(idx) => openLightbox(block.images, idx)}
              />
            );

          case 'quote':
            return (
              <View
                key={index}
                style={[
                  styles.quoteBox,
                  {
                    borderColor: tokens.borderSubtle,
                    backgroundColor: tokens.bgSurface,
                  },
                ]}
              >
                {renderInline(block.text, {
                  fontSize: fontSize * 0.98,
                  lineHeight: fontSize * 1.75,
                  color: tokens.textPrimary,
                })}
              </View>
            );

          case 'code':
            return (
              <View
                key={index}
                style={[
                  styles.codeBox,
                  {
                    backgroundColor: tokens.bgSurface,
                    borderColor: tokens.borderSubtle,
                  },
                ]}
              >
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <Text
                    style={[
                      styles.codeText,
                      { color: tokens.textPrimary, fontSize: Math.max(11, fontSize * 0.85), lineHeight: fontSize * 1.35 },
                    ]}
                  >
                    {block.code}
                  </Text>
                </ScrollView>
              </View>
            );

          case 'list':
            return (
              <View key={index} style={styles.listBox}>
                {block.items.map((item, i) => (
                  <View key={i} style={styles.listItemRow}>
                    <Text style={[styles.listBullet, { color: tokens.accent, fontSize: fontSize * 0.95 }]}>
                      {block.ordered ? `${i + 1}.` : '•'}
                    </Text>
                    <View style={styles.listItemContent}>
                      {renderInline(item, {
                        fontSize: fontSize * 0.95,
                        lineHeight: fontSize * 1.65,
                        color: tokens.textPrimary,
                      })}
                    </View>
                  </View>
                ))}
              </View>
            );

          case 'related_links':
            return <RelatedLinksCard key={index} links={block.links} fontSize={fontSize} tokens={tokens} />;

          case 'hr':
            return (
              <View
                key={index}
                style={[styles.hrLine, { backgroundColor: tokens.borderSubtle }]}
              />
            );

          case 'paragraph':
          default:
            return (
              <View key={index} style={styles.paragraphBox}>
                {renderInline(block.text, {
                  fontSize,
                  lineHeight: fontSize * 1.75,
                  color: tokens.textPrimary,
                })}
              </View>
            );
        }
      })}

      {/* Lightbox Modal */}
      <LightboxModal
        visible={lightboxState.visible}
        images={lightboxState.images}
        initialIndex={lightboxState.index}
        tokens={tokens}
        onClose={() => setLightboxState({ visible: false, images: [], index: 0 })}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  paragraphBox: {
    marginBottom: 16,
  },
  headingBox: {
    marginTop: 24,
    marginBottom: 12,
  },
  headingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  headingText: {
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  headingAnchorPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  headingAnchorText: {
    fontWeight: '700',
    fontFamily: 'monospace',
  },
  inlineLink: {
    textDecorationLine: 'underline',
    fontWeight: '500',
  },
  inlineCode: {
    fontFamily: 'monospace',
    borderRadius: 4,
    borderWidth: 0.5,
  },
  quoteBox: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 16,
    marginVertical: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  codeBox: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    marginVertical: 14,
  },
  codeText: {
    fontFamily: 'monospace',
  },
  listBox: {
    marginVertical: 10,
    paddingLeft: 4,
  },
  listItemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  listBullet: {
    marginRight: 8,
    lineHeight: 24,
    fontWeight: '700',
  },
  listItemContent: {
    flex: 1,
  },
  hrLine: {
    height: 1,
    marginVertical: 24,
    width: '100%',
  },
  singleImageCard: {
    borderWidth: 1,
    borderRadius: 18,
    marginVertical: 16,
    overflow: 'hidden',
    alignItems: 'center',
  },
  singleImage: {
    width: '100%',
    maxHeight: 420,
  },
  captionBox: {
    width: '100%',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderTopWidth: 1,
  },
  captionText: {
    fontSize: 12,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  imageZoomBadge: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  imageZoomText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '600',
  },
  badgeContainer: {
    marginVertical: 4,
    marginRight: 6,
  },
  badgeImage: {
    height: 20,
    width: 80,
  },
  // Gallery styles
  galleryContainer: {
    marginVertical: 16,
  },
  galleryScrollContent: {
    gap: 12,
  },
  galleryCard: {
    borderWidth: 1,
    borderRadius: 18,
    overflow: 'hidden',
    height: 250,
  },
  galleryImage: {
    width: '100%',
    height: 210,
  },
  galleryControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    marginTop: 10,
  },
  galleryButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  galleryButtonText: {
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 20,
  },
  galleryCountBadge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
  },
  galleryCountText: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'monospace',
  },
  // Hero Video Card styles
  heroVideoCard: {
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
    marginVertical: 14,
  },
  heroVideoFrame: {
    width: '100%',
    aspectRatio: 16 / 9,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroVideoCover: {
    ...StyleSheet.absoluteFillObject,
  },
  heroPlayOverlay: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroPlayCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 5,
  },
  heroPlayTriangle: {
    color: '#ffffff',
    fontSize: 22,
    marginLeft: 3,
  },
  heroTopRightBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  heroTopRightText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '600',
  },
  heroVideoToolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderTopWidth: 1,
  },
  heroPlatformSwitchRow: {
    flexDirection: 'row',
    gap: 8,
  },
  heroPlatformBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  heroPlatformBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },
  heroWatchDirectBtn: {
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  heroWatchDirectText: {
    fontSize: 12,
    fontWeight: '600',
  },
  // Overview TOC Card styles (daily.juya.uk)
  overviewContainer: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 18,
    marginVertical: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  overviewHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(150, 150, 150, 0.15)',
  },
  overviewMainTitle: {
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  overviewBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  overviewBadgeText: {
    fontWeight: '700',
  },
  overviewCategorySection: {
    marginBottom: 16,
  },
  overviewCategoryTitle: {
    fontWeight: '700',
    marginBottom: 10,
    marginTop: 4,
  },
  overviewItemList: {
    paddingLeft: 4,
  },
  overviewItemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
    gap: 8,
  },
  overviewBullet: {
    lineHeight: 22,
    fontWeight: '700',
  },
  overviewItemContent: {
    flex: 1,
  },
  overviewItemText: {
  },
  overviewExternalArrow: {
    fontWeight: '700',
  },
  overviewAnchorPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  overviewAnchorText: {
    fontWeight: '700',
    fontFamily: 'monospace',
  },
  // Related Links styles (daily.juya.uk .event-related-links style)
  relatedLinksContainer: {
    marginVertical: 16,
    paddingTop: 10,
  },
  relatedTitle: {
    fontWeight: '700',
    marginBottom: 10,
  },
  relatedList: {
    paddingLeft: 4,
  },
  relatedLinkRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
    gap: 8,
  },
  relatedBullet: {
    lineHeight: 20,
    fontWeight: '700',
  },
  relatedLinkText: {
    flex: 1,
    fontFamily: 'monospace',
    textDecorationLine: 'none',
  },
  // Lightbox Modal styles
  lightboxContainer: {
    flex: 1,
    backgroundColor: 'rgba(15, 15, 15, 0.96)',
    justifyContent: 'space-between',
  },
  lightboxHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 16,
  },
  lightboxCounter: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'monospace',
  },
  lightboxCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lightboxCloseText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  lightboxImageWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  lightboxImage: {
    width: '100%',
    height: '100%',
  },
  lightboxFooter: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    paddingTop: 16,
  },
  lightboxAltText: {
    color: '#e4e4e7',
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 14,
  },
  lightboxControlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  lightboxNavRow: {
    flexDirection: 'row',
    gap: 16,
  },
  lightboxNavBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lightboxNavBtnText: {
    color: '#ffffff',
    fontSize: 24,
    lineHeight: 26,
    fontWeight: '700',
  },
  lightboxOpenBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  lightboxOpenText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
  },
});
