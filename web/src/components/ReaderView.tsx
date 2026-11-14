import React, { useState, useEffect } from 'react';
import {
  ExternalLink,
  Star,
  CheckCircle,
  Circle,
  ChevronLeft,
  ChevronRight,
  Share2,
  ArrowLeft,
  BookOpen,
  Volume2
} from 'lucide-react';
import { ArticleDetail, ArticleSummary, UserSettings } from '../types';
import { DataService } from '../services/dataService';

interface ReaderViewProps {
  articleSummary: ArticleSummary | null;
  settings: UserSettings;
  isRead: boolean;
  isStarred: boolean;
  onToggleRead: () => void;
  onToggleStar: () => void;
  onNextArticle: () => void;
  onPrevArticle: () => void;
  hasNext: boolean;
  hasPrev: boolean;
  onBackToList?: () => void;
}

export const ReaderView: React.FC<ReaderViewProps> = ({
  articleSummary,
  settings,
  isRead,
  isStarred,
  onToggleRead,
  onToggleStar,
  onNextArticle,
  onPrevArticle,
  hasNext,
  hasPrev,
  onBackToList,
}) => {
  const [detail, setDetail] = useState<ArticleDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fontSize, setFontSize] = useState<'sm' | 'md' | 'lg' | 'xl'>(settings.fontSize || 'md');
  const [isSerif, setIsSerif] = useState(settings.fontFamily === 'serif');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!articleSummary) {
      setDetail(null);
      return;
    }

    let isCurrent = true;
    setLoading(true);
    setError(null);

    DataService.fetchArticleDetail(articleSummary.id, settings)
      .then((data) => {
        if (isCurrent) {
          setDetail(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isCurrent) {
          console.error('Failed to load article detail:', err);
          setError(err.message || '加载文章详情失败');
          setLoading(false);
        }
      });

    return () => {
      isCurrent = false;
    };
  }, [articleSummary?.id, settings]);

  const handleCopyLink = () => {
    if (articleSummary) {
      navigator.clipboard.writeText(articleSummary.link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getFontSizeClass = () => {
    switch (fontSize) {
      case 'sm': return 'text-sm';
      case 'lg': return 'text-lg';
      case 'xl': return 'text-xl';
      default: return 'text-base';
    }
  };

  if (!articleSummary) {
    return (
      <div className="flex-1 hidden md:flex flex-col items-center justify-center p-8 text-center bg-[#f1f1f1] dark:bg-[#1b1b1b] text-[#919191] dark:text-[#6a6a6a]">
        <div className="w-16 h-16 rounded-2xl bg-white dark:bg-[#222222] border border-black/[0.08] dark:border-white/[0.1] shadow-xs flex items-center justify-center mb-4 text-[#919191] dark:text-[#6a6a6a]">
          <BookOpen className="w-7 h-7" />
        </div>
        <h3 className="text-base font-semibold text-black dark:text-white tracking-tight">
          未选择任何文章
        </h3>
        <p className="text-xs text-[#6a6a6a] dark:text-[#9e9e9e] mt-1.5 max-w-xs leading-relaxed font-sans">
          从左侧列表中选择一篇文章进行阅读，或使用快捷键 <span className="font-mono bg-black/5 dark:bg-white/10 px-1 py-0.5 rounded">J</span> / <span className="font-mono bg-black/5 dark:bg-white/10 px-1 py-0.5 rounded">K</span> 快速切换。
        </p>
      </div>
    );
  }

  const audioAttachment = detail?.attachments?.find(a =>
    a.type?.startsWith('audio/') || a.url?.endsWith('.mp3')
  );

  return (
    <div className="flex-1 h-full flex flex-col bg-[#f1f1f1] dark:bg-[#1b1b1b] overflow-hidden transition-colors duration-175 ease-astryx">
      {/* Top Reading Toolbar */}
      <div className="h-13 border-b border-black/[0.08] dark:border-white/[0.1] bg-white/80 dark:bg-[#1b1b1b]/80 backdrop-blur-md px-4 flex items-center justify-between shrink-0">
        <div className="flex items-center space-x-1">
          {onBackToList && (
            <button
              onClick={onBackToList}
              className="md:hidden p-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 text-[#474747] dark:text-[#9e9e9e] mr-1"
              title="返回文章列表"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={onPrevArticle}
            disabled={!hasPrev}
            className="p-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 text-[#474747] dark:text-[#9e9e9e] hover:text-black dark:hover:text-white disabled:opacity-20 disabled:pointer-events-none transition-all duration-175 ease-astryx"
            title="上一篇 (K)"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={onNextArticle}
            disabled={!hasNext}
            className="p-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 text-[#474747] dark:text-[#9e9e9e] hover:text-black dark:hover:text-white disabled:opacity-20 disabled:pointer-events-none transition-all duration-175 ease-astryx"
            title="下一篇 (J)"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Action Tools */}
        <div className="flex items-center space-x-1.5 sm:space-x-2">
          {/* Font Type Toggle */}
          <button
            onClick={() => setIsSerif(!isSerif)}
            className={`p-1.5 rounded-xl text-xs font-semibold px-2.5 transition-all duration-175 ease-astryx border ${
              isSerif
                ? 'bg-[#EB6E00]/10 border-[#EB6E00]/30 text-[#EB6E00] dark:text-[#FF7A1A] font-serif'
                : 'border-transparent hover:bg-black/5 dark:hover:bg-white/10 text-[#474747] dark:text-[#9e9e9e]'
            }`}
            title="衬线 / 无衬线字体切换"
          >
            Aa
          </button>

          {/* Font Size Adjuster */}
          <div className="flex items-center bg-black/[0.04] dark:bg-white/[0.06] rounded-xl p-0.5 border border-black/[0.04] dark:border-white/[0.06]">
            <button
              onClick={() => {
                const sizes: ('sm' | 'md' | 'lg' | 'xl')[] = ['sm', 'md', 'lg', 'xl'];
                const idx = sizes.indexOf(fontSize);
                if (idx > 0) setFontSize(sizes[idx - 1]);
              }}
              className="px-2 py-1 text-[#474747] dark:text-[#9e9e9e] hover:text-black dark:hover:text-white"
              title="减小字号"
            >
              <span className="text-[10px] font-bold font-mono">A-</span>
            </button>
            <button
              onClick={() => {
                const sizes: ('sm' | 'md' | 'lg' | 'xl')[] = ['sm', 'md', 'lg', 'xl'];
                const idx = sizes.indexOf(fontSize);
                if (idx < sizes.length - 1) setFontSize(sizes[idx + 1]);
              }}
              className="px-2 py-1 text-[#474747] dark:text-[#9e9e9e] hover:text-black dark:hover:text-white"
              title="增大字号"
            >
              <span className="text-xs font-bold font-mono">A+</span>
            </button>
          </div>

          <div className="w-[1px] h-4 bg-black/[0.08] dark:border-white/[0.1] my-auto mx-1" />

          {/* Toggle Read */}
          <button
            onClick={onToggleRead}
            className="p-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 text-[#474747] dark:text-[#9e9e9e] transition-all duration-175"
            title={isRead ? '标为未读 (M)' : '标为已读 (M)'}
          >
            {isRead ? (
              <CheckCircle className="w-4 h-4 text-[#0B991F]" />
            ) : (
              <Circle className="w-4 h-4 text-[#EB6E00]" />
            )}
          </button>

          {/* Toggle Star */}
          <button
            onClick={onToggleStar}
            className={`p-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 transition-all duration-175 ${
              isStarred ? 'text-amber-500' : 'text-[#474747] dark:text-[#9e9e9e] hover:text-amber-500'
            }`}
            title={isStarred ? '取消星标 (S)' : '添加星标 (S)'}
          >
            <Star className={`w-4 h-4 ${isStarred ? 'fill-current' : ''}`} />
          </button>

          {/* Copy link */}
          <button
            onClick={handleCopyLink}
            className="p-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 text-[#474747] dark:text-[#9e9e9e] transition-all duration-175 relative"
            title="复制原文链接"
          >
            <Share2 className="w-4 h-4" />
            {copied && (
              <span className="absolute -bottom-8 right-0 text-[10px] bg-black dark:bg-white text-white dark:text-black px-2 py-0.5 rounded-lg shadow-md whitespace-nowrap font-mono">
                已复制!
              </span>
            )}
          </button>

          {/* Open Original */}
          <a
            href={articleSummary.link}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 text-[#474747] dark:text-[#9e9e9e] hover:text-black dark:hover:text-white transition-all duration-175"
            title="在新标签页中打开原文 (O)"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>

      {/* Article Content Area */}
      <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6">
        <article className={`max-w-3xl mx-auto my-2 p-6 md:p-10 bg-white dark:bg-[#222222] rounded-2xl border border-black/[0.08] dark:border-white/[0.1] shadow-xs ${isSerif ? 'font-serif' : 'font-sans'}`}>
          {/* Header */}
          <div className="mb-6 border-b border-black/[0.08] dark:border-white/[0.1] pb-6">
            <div className="flex items-center space-x-2.5 mb-3">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold bg-[#EB6E00]/10 text-[#EB6E00] dark:bg-[#EB6E00]/20 dark:text-[#FF7A1A]">
                {articleSummary.feedTitle}
              </span>
              <span className="text-xs font-mono text-[#919191] dark:text-[#6a6a6a]">
                {articleSummary.readTime} 分钟阅读
              </span>
            </div>

            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-black dark:text-white leading-tight mb-4">
              {articleSummary.title}
            </h1>

            <div className="flex items-center text-xs text-[#6a6a6a] dark:text-[#9e9e9e] space-x-2">
              <span className="font-medium text-black dark:text-white">{articleSummary.author || articleSummary.feedTitle}</span>
              <span>•</span>
              <time dateTime={articleSummary.publishedAt} className="font-mono">
                {new Date(articleSummary.publishedAt).toLocaleString(undefined, {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </time>
            </div>
          </div>

          {/* Podcast / Audio enclosure player */}
          {audioAttachment && (
            <div className="mb-6 p-4 rounded-2xl bg-[#EB6E00]/5 border border-[#EB6E00]/20 flex flex-col space-y-2">
              <div className="flex items-center space-x-2 text-xs font-semibold text-[#EB6E00] dark:text-[#FF7A1A]">
                <Volume2 className="w-4 h-4" />
                <span>播客音频节目</span>
              </div>
              <audio controls className="w-full h-10" preload="metadata">
                <source src={audioAttachment.url} type={audioAttachment.type || 'audio/mpeg'} />
                您的浏览器不支持播放该音频。
              </audio>
            </div>
          )}

          {/* Loading state */}
          {loading && (
            <div className="py-12 space-y-4 animate-pulse">
              <div className="h-4 bg-black/5 dark:bg-white/5 rounded-xl w-3/4"></div>
              <div className="h-4 bg-black/5 dark:bg-white/5 rounded-xl w-full"></div>
              <div className="h-4 bg-black/5 dark:bg-white/5 rounded-xl w-5/6"></div>
              <div className="h-32 bg-black/5 dark:bg-white/5 rounded-2xl"></div>
            </div>
          )}

          {/* Error state */}
          {error && (
            <div className="p-4 my-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs">
              <p className="font-semibold mb-1">加载正文时遇到问题：</p>
              <p>{error}</p>
              <div className="mt-3">
                <a
                  href={articleSummary.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-1 underline font-medium"
                >
                  <span>直接去原网站阅读</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          )}

          {/* HTML Prose Content */}
          {!loading && detail && (
            <div
              className={`article-prose ${getFontSizeClass()} text-black dark:text-[#d4d4d4]`}
              dangerouslySetInnerHTML={{ __html: detail.content || `<p>${articleSummary.snippet}</p>` }}
            />
          )}

          {/* Bottom Navigation & Actions */}
          <div className="mt-12 pt-6 border-t border-black/[0.08] dark:border-white/[0.1] flex flex-col sm:flex-row items-center justify-between gap-4">
            <a
              href={articleSummary.link}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-2 text-xs font-semibold px-4 py-2.5 rounded-xl bg-black/5 hover:bg-black/10 dark:bg-white/10 dark:hover:bg-white/15 text-black dark:text-white transition-all duration-175 ease-astryx"
            >
              <span>在原网站打开</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>

            {hasNext && (
              <button
                onClick={onNextArticle}
                className="inline-flex items-center space-x-2 text-xs font-semibold px-4 py-2.5 rounded-xl bg-[#EB6E00] hover:bg-[#d66100] text-white shadow-sm shadow-[#EB6E00]/25 transition-all duration-175 ease-astryx"
              >
                <span>下一篇</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </article>
      </div>
    </div>
  );
};
