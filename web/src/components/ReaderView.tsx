import React, { useState, useEffect } from 'react';
import {
  ExternalLink,
  Star,
  CheckCircle,
  Circle,
  ChevronLeft,
  ChevronRight,
  Share2,
  Type,
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
      <div className="flex-1 hidden md:flex flex-col items-center justify-center p-8 text-center bg-slate-50 dark:bg-slate-950 text-slate-400">
        <div className="w-16 h-16 rounded-full bg-slate-200 dark:bg-slate-900 flex items-center justify-center mb-4 text-slate-400">
          <BookOpen className="w-8 h-8" />
        </div>
        <h3 className="text-base font-semibold text-slate-700 dark:text-slate-300">
          未选择任何文章
        </h3>
        <p className="text-xs text-slate-400 mt-1 max-w-xs">
          从左侧列表中选择一篇文章进行阅读，或使用快捷键 J / K 进行快速浏览。
        </p>
      </div>
    );
  }

  const audioAttachment = detail?.attachments?.find(a =>
    a.type?.startsWith('audio/') || a.url?.endsWith('.mp3')
  );

  return (
    <div className="flex-1 h-full flex flex-col bg-slate-50 dark:bg-slate-950 overflow-hidden">
      {/* Top Reading Toolbar */}
      <div className="h-12 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur px-4 flex items-center justify-between shrink-0">
        <div className="flex items-center space-x-1">
          {onBackToList && (
            <button
              onClick={onBackToList}
              className="md:hidden p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 mr-1"
              title="返回文章列表"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={onPrevArticle}
            disabled={!hasPrev}
            className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 disabled:opacity-30 disabled:pointer-events-none transition-colors"
            title="上一篇 (K)"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={onNextArticle}
            disabled={!hasNext}
            className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 disabled:opacity-30 disabled:pointer-events-none transition-colors"
            title="下一篇 (J)"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Action Tools */}
        <div className="flex items-center space-x-1 sm:space-x-2">
          {/* Font Type Toggle */}
          <button
            onClick={() => setIsSerif(!isSerif)}
            className={`p-1.5 rounded-md text-xs font-semibold px-2 transition-colors ${
              isSerif
                ? 'bg-orange-500/10 text-orange-600 dark:text-orange-400 font-serif'
                : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300'
            }`}
            title="衬线 / 无衬线字体切换"
          >
            Aa
          </button>

          {/* Font Size Adjuster */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-md p-0.5">
            <button
              onClick={() => {
                const sizes: ('sm' | 'md' | 'lg' | 'xl')[] = ['sm', 'md', 'lg', 'xl'];
                const idx = sizes.indexOf(fontSize);
                if (idx > 0) setFontSize(sizes[idx - 1]);
              }}
              className="p-1 text-slate-600 dark:text-slate-300 hover:text-black dark:hover:text-white"
              title="减小字号"
            >
              <span className="text-[10px] font-bold">A-</span>
            </button>
            <button
              onClick={() => {
                const sizes: ('sm' | 'md' | 'lg' | 'xl')[] = ['sm', 'md', 'lg', 'xl'];
                const idx = sizes.indexOf(fontSize);
                if (idx < sizes.length - 1) setFontSize(sizes[idx + 1]);
              }}
              className="p-1 text-slate-600 dark:text-slate-300 hover:text-black dark:hover:text-white"
              title="增大字号"
            >
              <span className="text-xs font-bold">A+</span>
            </button>
          </div>

          <div className="w-[1px] h-4 bg-slate-200 dark:bg-slate-800 my-auto" />

          {/* Toggle Read */}
          <button
            onClick={onToggleRead}
            className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
            title={isRead ? '标为未读 (M)' : '标为已读 (M)'}
          >
            {isRead ? (
              <CheckCircle className="w-4 h-4 text-emerald-500" />
            ) : (
              <Circle className="w-4 h-4 text-orange-500" />
            )}
          </button>

          {/* Toggle Star */}
          <button
            onClick={onToggleStar}
            className={`p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ${
              isStarred ? 'text-amber-500' : 'text-slate-600 dark:text-slate-300 hover:text-amber-500'
            }`}
            title={isStarred ? '取消星标 (S)' : '添加星标 (S)'}
          >
            <Star className={`w-4 h-4 ${isStarred ? 'fill-current' : ''}`} />
          </button>

          {/* Copy link */}
          <button
            onClick={handleCopyLink}
            className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors relative"
            title="复制原文链接"
          >
            <Share2 className="w-4 h-4" />
            {copied && (
              <span className="absolute -bottom-7 right-0 text-[10px] bg-slate-900 text-white px-2 py-0.5 rounded shadow whitespace-nowrap">
                已复制!
              </span>
            )}
          </button>

          {/* Open Original */}
          <a
            href={articleSummary.link}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
            title="在新标签页中打开原文 (O)"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>

      {/* Article Content Area */}
      <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6">
        <article className={`max-w-3xl mx-auto ${isSerif ? 'font-serif' : 'font-sans'}`}>
          {/* Header */}
          <div className="mb-6 border-b border-slate-200 dark:border-slate-800 pb-5">
            <div className="flex items-center space-x-2 mb-2">
              <span className="px-2 py-0.5 rounded-md text-xs font-semibold bg-orange-500/10 text-orange-600 dark:text-orange-400">
                {articleSummary.feedTitle}
              </span>
              <span className="text-xs text-slate-400">
                {articleSummary.readTime} 分钟阅读
              </span>
            </div>

            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100 leading-tight mb-3">
              {articleSummary.title}
            </h1>

            <div className="flex items-center text-xs text-slate-500 dark:text-slate-400 space-x-2">
              <span>{articleSummary.author || articleSummary.feedTitle}</span>
              <span>•</span>
              <time dateTime={articleSummary.publishedAt}>
                {new Date(articleSummary.publishedAt).toLocaleString(undefined, {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </time>
            </div>
          </div>

          {/* Podcast / Audio enclosure player */}
          {audioAttachment && (
            <div className="mb-6 p-4 rounded-xl bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-900/40 flex flex-col space-y-2">
              <div className="flex items-center space-x-2 text-xs font-semibold text-orange-700 dark:text-orange-400">
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
              <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-3/4"></div>
              <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-full"></div>
              <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-5/6"></div>
              <div className="h-32 bg-slate-200 dark:bg-slate-800 rounded"></div>
            </div>
          )}

          {/* Error state */}
          {error && (
            <div className="p-4 my-4 rounded-lg bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 text-xs">
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
              className={`article-prose ${getFontSizeClass()} text-slate-800 dark:text-slate-200`}
              dangerouslySetInnerHTML={{ __html: detail.content || `<p>${articleSummary.snippet}</p>` }}
            />
          )}

          {/* Bottom Navigation & Actions */}
          <div className="mt-12 pt-6 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <a
              href={articleSummary.link}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-2 text-xs font-semibold px-4 py-2 rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 transition-colors"
            >
              <span>在原网站打开</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>

            {hasNext && (
              <button
                onClick={onNextArticle}
                className="inline-flex items-center space-x-2 text-xs font-semibold px-4 py-2 rounded-lg bg-orange-500 hover:bg-orange-600 text-white shadow-sm transition-colors"
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
