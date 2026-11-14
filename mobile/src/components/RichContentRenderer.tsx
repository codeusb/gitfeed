import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Linking,
  ScrollView,
} from 'react-native';
import { ThemeTokens } from '../theme/tokens';

interface RichContentRendererProps {
  content: string;
  fontSize?: number;
  tokens: ThemeTokens;
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
    .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(Number(dec)));
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
  // Tokenize HTML tags: <a>, <strong>, <b>, <em>, <i>, <code> and Markdown: **bold**, *italic*, `code`, [link](url)
  const tagPattern = /(<a\s+[^>]*href=["']([^"']+)["'][^>]*>(.*?)<\/a>)|(<strong[^>]*>(.*?)<\/strong>)|(<b[^>]*>(.*?)<\/b>)|(<em[^>]*>(.*?)<\/em>)|(<i[^>]*>(.*?)<\/i>)|(<code[^>]*>(.*?)<\/code>)|(\[(.*?)\]\((.*?)\))|(\*\*(.*?)\*\*)|(\*(.*?)\*)|(`(.*?)`)/gi;

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
      // <a href="url">text</a>
      tokens.push({
        type: 'link',
        url: match[2],
        text: decodeHtmlEntities(match[3].replace(/<[^>]+>/g, '')),
      });
    } else if (match[4] || match[6]) {
      // <strong> or <b>
      const inner = match[5] || match[7];
      tokens.push({ type: 'bold', text: decodeHtmlEntities(inner.replace(/<[^>]+>/g, '')) });
    } else if (match[8] || match[10]) {
      // <em> or <i>
      const inner = match[9] || match[11];
      tokens.push({ type: 'italic', text: decodeHtmlEntities(inner.replace(/<[^>]+>/g, '')) });
    } else if (match[12]) {
      // <code>
      tokens.push({ type: 'code', text: decodeHtmlEntities(match[13].replace(/<[^>]+>/g, '')) });
    } else if (match[14]) {
      // Markdown [text](url)
      tokens.push({ type: 'link', text: decodeHtmlEntities(match[15]), url: match[16] });
    } else if (match[17]) {
      // Markdown **bold**
      tokens.push({ type: 'bold', text: decodeHtmlEntities(match[18]) });
    } else if (match[19]) {
      // Markdown *italic*
      tokens.push({ type: 'italic', text: decodeHtmlEntities(match[20]) });
    } else if (match[21]) {
      // Markdown `code`
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
type Block =
  | { type: 'heading'; level: number; text: string }
  | { type: 'paragraph'; text: string }
  | { type: 'image'; src: string; alt?: string }
  | { type: 'code'; code: string; lang?: string }
  | { type: 'quote'; text: string }
  | { type: 'list'; items: string[]; ordered: boolean }
  | { type: 'hr' };

function parseContentToBlocks(raw: string): Block[] {
  if (!raw) return [];

  // Normalize line endings
  let cleaned = raw.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  // Strip scripts, styles, iframes
  cleaned = cleaned.replace(/<(script|style|iframe|noscript)[^>]*>[\s\S]*?<\/\1>/gi, '');

  const blocks: Block[] = [];

  // Match block-level elements: headings, images, pre/code, blockquotes, lists, hr, paragraphs
  const blockRegex = /(<h([1-6])[^>]*>([\s\S]*?)<\/h\2>)|(<img\s+[^>]*src=["']([^"']+)["'][^>]*>)|(<pre[^>]*><code[^>]*>([\s\S]*?)<\/code><\/pre>)|(<pre[^>]*>([\s\S]*?)<\/pre>)|(<blockquote[^>]*>([\s\S]*?)<\/blockquote>)|(<(ul|ol)[^>]*>([\s\S]*?)<\/(?:ul|ol)>)|(<hr\s*\/?>)|(<p[^>]*>([\s\S]*?)<\/p>)/gi;

  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = blockRegex.exec(cleaned)) !== null) {
    if (match.index > lastIndex) {
      const inter = cleaned.slice(lastIndex, match.index).trim();
      if (inter) {
        // May contain text or markdown lines
        processMarkdownLines(inter, blocks);
      }
    }

    if (match[1]) {
      // Heading
      const level = parseInt(match[2], 10) || 2;
      const text = match[3].replace(/<[^>]+>/g, '').trim();
      if (text) blocks.push({ type: 'heading', level, text });
    } else if (match[4]) {
      // <img>
      const src = match[5];
      const altMatch = match[4].match(/alt=["']([^"']*)["']/i);
      const alt = altMatch ? altMatch[1] : undefined;
      if (src && !src.startsWith('data:image/svg')) {
        blocks.push({ type: 'image', src, alt });
      }
    } else if (match[6] || match[8]) {
      // <pre><code> or <pre>
      const codeRaw = match[7] || match[9] || '';
      blocks.push({
        type: 'code',
        code: decodeHtmlEntities(codeRaw.replace(/<[^>]+>/g, '')),
      });
    } else if (match[10]) {
      // <blockquote>
      const quoteText = match[11].replace(/<[^>]+>/g, '').trim();
      if (quoteText) blocks.push({ type: 'quote', text: quoteText });
    } else if (match[12]) {
      // <ul> or <ol>
      const ordered = match[12].toLowerCase() === 'ol';
      const listContent = match[13] || '';
      const items: string[] = [];
      const liRegex = /<li[^>]*>([\s\S]*?)<\/li>/gi;
      let liMatch;
      while ((liMatch = liRegex.exec(listContent)) !== null) {
        const itemText = liMatch[1].replace(/<[^>]+>/g, '').trim();
        if (itemText) items.push(itemText);
      }
      if (items.length > 0) {
        blocks.push({ type: 'list', items, ordered });
      }
    } else if (match[14]) {
      // <hr/>
      blocks.push({ type: 'hr' });
    } else if (match[15]) {
      // <p>
      const pContent = match[16].trim();
      // Check if p contains an img tag
      const pImgMatch = pContent.match(/<img\s+[^>]*src=["']([^"']+)["'][^>]*>/i);
      if (pImgMatch && pImgMatch[1]) {
        const altMatch = pImgMatch[0].match(/alt=["']([^"']*)["']/i);
        blocks.push({
          type: 'image',
          src: pImgMatch[1],
          alt: altMatch ? altMatch[1] : undefined,
        });
        const remaining = pContent.replace(pImgMatch[0], '').trim();
        if (remaining) {
          blocks.push({ type: 'paragraph', text: remaining });
        }
      } else if (pContent) {
        blocks.push({ type: 'paragraph', text: pContent });
      }
    }

    lastIndex = blockRegex.lastIndex;
  }

  if (lastIndex < cleaned.length) {
    const trailing = cleaned.slice(lastIndex).trim();
    if (trailing) {
      processMarkdownLines(trailing, blocks);
    }
  }

  return blocks;
}

function processMarkdownLines(text: string, blocks: Block[]) {
  const lines = text.split('\n');
  let inCode = false;
  let codeBuffer: string[] = [];
  let codeLang = '';

  for (let line of lines) {
    const trimmed = line.trim();

    if (trimmed.startsWith('```')) {
      if (inCode) {
        blocks.push({ type: 'code', code: codeBuffer.join('\n'), lang: codeLang });
        codeBuffer = [];
        inCode = false;
      } else {
        inCode = true;
        codeLang = trimmed.replace('```', '').trim();
      }
      continue;
    }

    if (inCode) {
      codeBuffer.push(line);
      continue;
    }

    if (!trimmed) continue;

    // Markdown Heading
    const hMatch = trimmed.match(/^(#{1,6})\s+(.*)$/);
    if (hMatch) {
      blocks.push({ type: 'heading', level: hMatch[1].length, text: hMatch[2] });
      continue;
    }

    // Markdown Image
    const imgMatch = trimmed.match(/^!\[(.*?)\]\((.*?)\)$/);
    if (imgMatch) {
      blocks.push({ type: 'image', alt: imgMatch[1], src: imgMatch[2] });
      continue;
    }

    // Markdown Quote
    if (trimmed.startsWith('>')) {
      blocks.push({ type: 'quote', text: trimmed.replace(/^>\s*/, '') });
      continue;
    }

    // Markdown List
    const listMatch = trimmed.match(/^([-*]|\d+\.)\s+(.*)$/);
    if (listMatch) {
      const isOrdered = /^\d+\./.test(listMatch[1]);
      blocks.push({ type: 'list', items: [listMatch[2]], ordered: isOrdered });
      continue;
    }

    // Markdown HR
    if (/^(\*{3,}|-{3,}|_{3,})$/.test(trimmed)) {
      blocks.push({ type: 'hr' });
      continue;
    }

    // Regular text paragraph
    blocks.push({ type: 'paragraph', text: trimmed });
  }

  if (inCode && codeBuffer.length > 0) {
    blocks.push({ type: 'code', code: codeBuffer.join('\n'), lang: codeLang });
  }
}

// -------------------------------------------------------------
// Article Image Component (with auto aspect ratio & error handling)
// -------------------------------------------------------------
const ArticleImage: React.FC<{ src: string; alt?: string; tokens: ThemeTokens }> = ({
  src,
  alt,
  tokens,
}) => {
  const [aspectRatio, setAspectRatio] = useState<number>(16 / 9);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!src || src.startsWith('data:')) return;
    try {
      Image.getSize(
        encodeURI(src),
        (w, h) => {
          if (w > 0 && h > 0) {
            const ratio = w / h;
            setAspectRatio(Math.min(2.5, Math.max(0.6, ratio)));
          }
        },
        () => {
          setError(true);
        }
      );
    } catch {
      setError(true);
    }
  }, [src]);

  if (error || !src) return null;

  // Filter tiny icons / badges (< 32px or shields.io)
  const isBadge = src.includes('shields.io') || src.includes('badge');

  if (isBadge) {
    return (
      <View style={styles.badgeContainer}>
        <Image source={{ uri: src }} style={styles.badgeImage} resizeMode="contain" />
      </View>
    );
  }

  const hasCaption = Boolean(alt && alt.trim().length > 0 && !alt.startsWith('http'));

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={() => {
        Linking.canOpenURL(src).then((supported) => {
          if (supported) Linking.openURL(src);
        });
      }}
      style={[
        styles.imageCard,
        {
          borderColor: tokens.borderSubtle,
          backgroundColor: tokens.bgSubtle,
        },
      ]}
    >
      <Image
        source={{ uri: src }}
        style={[styles.articleImage, { aspectRatio }]}
        resizeMode="contain"
      />
      {hasCaption ? (
        <View style={[styles.captionBox, { borderTopColor: tokens.borderSubtle }]}>
          <Text style={[styles.captionText, { color: tokens.textMuted }]}>{alt}</Text>
        </View>
      ) : null}
    </TouchableOpacity>
  );
};

// -------------------------------------------------------------
// Main RichContentRenderer Component
// -------------------------------------------------------------
export const RichContentRenderer: React.FC<RichContentRendererProps> = ({
  content,
  fontSize = 16,
  tokens,
}) => {
  const blocks = useMemo(() => {
    try {
      return parseContentToBlocks(content);
    } catch (e) {
      console.warn('Failed to parse rich content:', e);
      return [{ type: 'paragraph', text: content ? content.replace(/<[^>]+>/g, '') : '' }];
    }
  }, [content]);

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
      <Text style={{ color: tokens.textSecondary, fontSize, lineHeight: fontSize * 1.6 }}>
        {decodeHtmlEntities(content.replace(/<[^>]+>/g, ''))}
      </Text>
    );
  }

  return (
    <View style={styles.container}>
      {blocks.map((block, index) => {
        switch (block.type) {
          case 'heading': {
            const hFontSize =
              block.level === 1
                ? fontSize * 1.5
                : block.level === 2
                ? fontSize * 1.3
                : fontSize * 1.15;
            return (
              <View key={index} style={styles.headingBox}>
                <Text
                  style={[
                    styles.headingText,
                    {
                      fontSize: hFontSize,
                      lineHeight: hFontSize * 1.35,
                      color: tokens.textPrimary,
                    },
                  ]}
                >
                  {block.text}
                </Text>
              </View>
            );
          }

          case 'image':
            return <ArticleImage key={index} src={block.src} alt={block.alt} tokens={tokens} />;

          case 'quote':
            return (
              <View
                key={index}
                style={[
                  styles.quoteBox,
                  {
                    borderLeftColor: tokens.accent,
                    backgroundColor: tokens.bgSubtle,
                  },
                ]}
              >
                {renderInline(block.text, {
                  fontSize: fontSize * 0.95,
                  lineHeight: fontSize * 1.5,
                  color: tokens.textSecondary,
                  fontStyle: 'italic',
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
                      { color: tokens.textPrimary, fontSize: Math.max(12, fontSize - 2) },
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
                    <Text style={[styles.listBullet, { color: tokens.accent }]}>
                      {block.ordered ? `${i + 1}.` : '•'}
                    </Text>
                    <View style={styles.listItemContent}>
                      {renderInline(item, {
                        fontSize,
                        lineHeight: fontSize * 1.6,
                        color: tokens.textPrimary,
                      })}
                    </View>
                  </View>
                ))}
              </View>
            );

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
                  lineHeight: fontSize * 1.65,
                  color: tokens.textPrimary,
                })}
              </View>
            );
        }
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  paragraphBox: {
    marginBottom: 14,
  },
  headingBox: {
    marginTop: 18,
    marginBottom: 10,
  },
  headingText: {
    fontWeight: '700',
    letterSpacing: -0.3,
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
    borderLeftWidth: 3,
    paddingLeft: 14,
    paddingVertical: 8,
    marginVertical: 12,
    borderRadius: 6,
  },
  codeBox: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginVertical: 12,
  },
  codeText: {
    fontFamily: 'monospace',
    lineHeight: 18,
  },
  listBox: {
    marginVertical: 8,
    paddingLeft: 4,
  },
  listItemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  listBullet: {
    fontSize: 16,
    marginRight: 8,
    lineHeight: 24,
    fontWeight: '700',
  },
  listItemContent: {
    flex: 1,
  },
  hrLine: {
    height: 1,
    marginVertical: 18,
    width: '100%',
  },
  imageCard: {
    borderWidth: 1,
    borderRadius: 14,
    marginVertical: 14,
    overflow: 'hidden',
    alignItems: 'center',
  },
  articleImage: {
    width: '100%',
  },
  captionBox: {
    width: '100%',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderTopWidth: 1,
  },
  captionText: {
    fontSize: 12,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  badgeContainer: {
    marginVertical: 4,
    marginRight: 6,
  },
  badgeImage: {
    height: 20,
    width: 80,
  },
});
