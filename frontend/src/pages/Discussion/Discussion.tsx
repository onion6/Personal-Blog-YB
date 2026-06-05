import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark, prism } from 'react-syntax-highlighter/dist/esm/styles/prism';
import {
  Search, Heart, MessageCircle, ArrowLeft, Clock, Flame, Pencil, BookOpen,
  Copy, Check, TrendingUp, Hash
} from 'lucide-react';
import Icon from '../../components/Icon/Icon';
import Avatar from '../../components/Avatar/Avatar';
import MarkdownEditor from '../../components/MarkdownEditor/MarkdownEditor';
import { getPosts, getPostById, createPost, likePost, getComments, createComment } from '../../api';
import { useToastStore } from '../../store/useToastStore';
import { useThemeStore } from '../../store/useThemeStore';
import { useAuthStore } from '../../store/useAuthStore';
import type { Post, Comment } from '../../types';
import Tag from '../../components/Tag/Tag';
import ScrollReveal from '../../components/ScrollReveal/ScrollReveal';
import Skeleton from '../../components/Skeleton/Skeleton';
import styles from './Discussion.module.css';

const filterTags = ['全部', '前端', '后端', '工具', '面试', 'Bug 排查'];

type SortMode = 'latest' | 'hottest';

/* ────── 日期格式化 ────── */

function formatDate(isoStr: string): string {
  const date = new Date(isoStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMs / 3600000);
  const diffDay = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return '刚刚';
  if (diffMin < 60) return `${diffMin} 分钟前`;
  if (diffHr < 24) return `${diffHr} 小时前`;
  if (diffDay < 7) return `${diffDay} 天前`;
  if (diffDay < 30) return `${Math.floor(diffDay / 7)} 周前`;

  // 同年只显示月日，跨年加年份
  const sameYear = date.getFullYear() === now.getFullYear();
  if (sameYear) {
    return `${date.getMonth() + 1}月${date.getDate()}日`;
  }
  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
}

function getPostReadingTime(content: string): number {
  const chars = content.replace(/\s/g, '').length;
  return Math.max(1, Math.ceil(chars / 400));
}

function stripMarkdown(content: string): string {
  return content
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`[^`]*`/g, '')
    .replace(/[#*_~>\[\]()!|\\-]/g, '')
    .replace(/\n+/g, ' ')
    .trim();
}

/* ────── 代码高亮组件 ────── */

const CodeBlock = ({ node, inline, className, children, ...props }: any) => {
  const [copied, setCopied] = useState(false);
  const { theme } = useThemeStore();
  const match = /language-(\w+)/.exec(className || '');
  const content = String(children).replace(/\n$/, '');

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (inline) {
    return <code className={className} {...props}>{children}</code>;
  }

  return (
    <div className={styles.codeBlockWrapper}>
      <button className={styles.copyBtn} onClick={handleCopy}>
        {copied ? <Icon icon={Check} size="sm" /> : <Icon icon={Copy} size="sm" />}
      </button>
      <SyntaxHighlighter
        style={theme === 'dark' ? atomDark : prism}
        language={match ? match[1] : 'text'}
        PreTag="div"
        {...props}
      >
        {content}
      </SyntaxHighlighter>
    </div>
  );
};

/* ══════════════════════════════════════════════════
   Discussion 页面
   ══════════════════════════════════════════════════ */

const Discussion = () => {
  const { theme } = useThemeStore();
  const { addToast } = useToastStore();
  const { isAuthenticated, user } = useAuthStore();
  const navigate = useNavigate();
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('全部');
  const [sortMode, setSortMode] = useState<SortMode>('latest');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentContent, setCommentContent] = useState('');
  const [showEditor, setShowEditor] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newTags, setNewTags] = useState<string[]>([]);

  useEffect(() => {
    setIsLoading(true);
    getPosts()
      .then((res) => setPosts(res.data))
      .catch(() => setPosts([]))
      .finally(() => setIsLoading(false));
  }, []);

  const parseTags = (tags: any): string[] => {
    if (Array.isArray(tags)) return tags;
    if (typeof tags !== 'string') return [];
    try {
      const parsed = JSON.parse(tags);
      if (Array.isArray(parsed)) return parsed;
      if (typeof parsed === 'string') return parseTags(parsed);
      return [];
    } catch {
      return [];
    }
  };

  const readingTime = useMemo(() => {
    if (!selectedPost) return 0;
    return getPostReadingTime(selectedPost.content);
  }, [selectedPost]);

  const toc = useMemo(() => {
    if (!selectedPost) return [];
    const lines = selectedPost.content.split('\n');
    return lines
      .filter(line => line.startsWith('## '))
      .map(line => line.replace('## ', '').trim());
  }, [selectedPost]);

  const filtered = posts
    .filter((p) => {
      if (activeFilter !== '全部') {
        const tags = parseTags(p.tags);
        if (!tags.includes(activeFilter)) return false;
      }
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return p.title.toLowerCase().includes(q) || p.content.toLowerCase().includes(q);
      }
      return true;
    })
    .sort((a, b) => {
      if (sortMode === 'hottest') return b.likes - a.likes;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

  // 精选帖子：点赞最多的一篇
  const featuredPost = useMemo(() => {
    if (filtered.length === 0) return null;
    return filtered.reduce((best, p) => (p.likes > best.likes ? p : best), filtered[0]);
  }, [filtered]);

  const regularPosts = filtered.filter(p => p.id !== featuredPost?.id);

  /* ────── 操作函数 ────── */

  const handleSelectPost = async (post: Post) => {
    try {
      const full = await getPostById(post.id);
      setSelectedPost(full);
    } catch {
      setSelectedPost(post);
    }
    try {
      const cmts = await getComments(post.id);
      setComments(cmts);
    } catch {
      setComments([]);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLike = async () => {
    if (!selectedPost) return;
    try {
      const updated = await likePost(selectedPost.id);
      setSelectedPost(updated);
      addToast('点赞成功', 'success');
    } catch {
      setSelectedPost({ ...selectedPost, likes: selectedPost.likes + 1 });
      addToast('本地模拟点赞', 'info');
    }
  };

  const handleSubmitComment = async () => {
    if (!selectedPost || !commentContent.trim()) return;
    const authorName = user?.display_name || user?.username || '匿名';
    try {
      const cmt = await createComment(selectedPost.id, { author: authorName, content: commentContent });
      setComments([...comments, cmt]);
      addToast('评论发表成功', 'success');
    } catch {
      const newCmt: Comment = {
        id: Date.now(),
        post_id: selectedPost.id,
        author: authorName,
        content: commentContent,
        created_at: new Date().toISOString().split('T')[0],
      };
      setComments([...comments, newCmt]);
      addToast('本地模拟评论发表', 'info');
    }
    setCommentContent('');
  };

  const handleCreatePost = async () => {
    if (!newTitle.trim() || !newContent.trim()) return;
    try {
      const post = await createPost({ title: newTitle, content: newContent, tags: newTags });
      setPosts([post, ...posts]);
      addToast('发布成功！', 'success');
    } catch {
      const mockPost: Post = {
        id: Date.now(), title: newTitle, content: newContent, tags: newTags,
        likes: 0, comment_count: 0, created_at: new Date().toISOString().split('T')[0],
      };
      setPosts([mockPost, ...posts]);
      addToast('本地模拟发布成功', 'info');
    }
    setNewTitle('');
    setNewContent('');
    setNewTags([]);
    setShowEditor(false);
  };

  /* ══════════════════════════════════════════════════
     文章详情页
     ══════════════════════════════════════════════════ */

  if (selectedPost) {
    return (
      <div className={styles.discussionPage}>
        <button className={styles.backBtn} onClick={() => setSelectedPost(null)}>
          <Icon icon={ArrowLeft} size="md" />
          返回列表
        </button>

        <ScrollReveal>
          <h1 className={styles.detailTitle}>{selectedPost.title}</h1>
          <div className={styles.detailMeta}>
            <div className={styles.detailAuthor}>
              <Avatar
                name={selectedPost.author_display_name || selectedPost.author_name || '匿名'}
                avatarUrl={selectedPost.author_avatar}
                size={40}
                showRing={false}
              />
              <div className={styles.detailAuthorInfo}>
                <span className={styles.detailAuthorName}>
                  {selectedPost.author_display_name || selectedPost.author_name || '匿名'}
                </span>
                <span className={styles.detailAuthorDate}>
                  {formatDate(selectedPost.created_at)} · 阅读 {readingTime} 分钟
                </span>
              </div>
            </div>
            <button className={styles.likeBtn} onClick={handleLike}>
              <Icon icon={Heart} size="sm" />
              {selectedPost.likes}
            </button>
          </div>

          <div className={styles.detailContainer}>
            <div className={styles.detailContent}>
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{ code: CodeBlock }}
              >
                {selectedPost.content}
              </ReactMarkdown>
            </div>

            {toc.length > 0 && (
              <aside className={styles.tocContainer}>
                <h3 className={styles.tocTitle}>目录</h3>
                <ul className={styles.tocList}>
                  {toc.map((item, i) => (
                    <li
                      key={i}
                      className={styles.tocItem}
                      onClick={() => {
                        const el = document.getElementById(item.toLowerCase().replace(/\s+/g, '-'));
                        if (el) el.scrollIntoView({ behavior: 'smooth' });
                      }}
                    >
                      {item}
                    </li>
                  ))}
                </ul>
              </aside>
            )}
          </div>
        </ScrollReveal>

        <div className={styles.commentSection}>
          <h2 className={styles.commentSectionTitle}>评论 ({comments.length})</h2>
          <div className={styles.commentForm}>
            {isAuthenticated ? (
              <>
                <div className={styles.commentInputRow}>
                  <Avatar name={user?.display_name || user?.username || ''} size={28} showRing={false} />
                  <span className={styles.commentAuthorDisplay}>{user?.display_name || user?.username}</span>
                </div>
                <textarea
                  className={styles.commentTextarea}
                  placeholder="写下你的评论..."
                  value={commentContent}
                  onChange={(e) => setCommentContent(e.target.value)}
                />
                <button className={styles.submitBtn} onClick={handleSubmitComment}>发表评论</button>
              </>
            ) : (
              <div className={styles.commentLoginPrompt}>
                <span>请先登录后再发表评论</span>
                <button className={styles.loginLinkBtn} onClick={() => navigate('/login')}>去登录</button>
              </div>
            )}
          </div>
          <div className={styles.commentList}>
            {comments.map((c) => (
              <div key={c.id} className={styles.commentItem}>
                <div className={styles.commentHeader}>
                  <Avatar name={c.author} size={28} showRing={false} />
                  <span className={styles.commentAuthor}>{c.author}</span>
                  <span className={styles.commentDate}>{formatDate(c.created_at)}</span>
                </div>
                <div className={styles.commentBody}>{c.content}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  /* ══════════════════════════════════════════════════
     文章列表页
     ══════════════════════════════════════════════════ */

  return (
    <div className={styles.discussionPage}>
      {/* ── 页面头部 ── */}
      <ScrollReveal>
        <div className={styles.pageHeader}>
          <div className={styles.headerRow}>
            <div>
              <h1 className={styles.pageTitle}>技术交流</h1>
              <p className={styles.pageDesc}>分享技术心得，交流开发经验</p>
            </div>
            <button
              className={styles.writePostBtn}
              onClick={() => isAuthenticated ? setShowEditor(!showEditor) : navigate('/login')}
            >
              <Icon icon={Pencil} size="sm" />
              {!isAuthenticated ? '登录后发帖' : showEditor ? '收起编辑器' : '写文章'}
            </button>
          </div>
        </div>
      </ScrollReveal>

      {/* ── 编辑器 ── */}
      {showEditor && (
        <ScrollReveal>
          <MarkdownEditor
            title={newTitle}
            content={newContent}
            onTitleChange={setNewTitle}
            onContentChange={setNewContent}
            tags={newTags}
            onTagsChange={setNewTags}
            onSubmit={handleCreatePost}
            submitLabel="发布帖子"
          />
        </ScrollReveal>
      )}

      {/* ── 搜索 + 排序 + 标签（合一栏）── */}
      <ScrollReveal delay={80}>
        <div className={styles.controlBar}>
          <div className={styles.searchBox}>
            <Icon icon={Search} size="sm" className={styles.searchIcon} />
            <input
              className={styles.searchInput}
              placeholder="搜索文章..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className={styles.controlRight}>
            <div className={styles.sortBtns}>
              <button
                className={`${styles.sortBtn} ${sortMode === 'latest' ? styles.sortBtnActive : ''}`}
                onClick={() => setSortMode('latest')}
              >
                <Icon icon={Clock} size="xs" />
                最新
              </button>
              <button
                className={`${styles.sortBtn} ${sortMode === 'hottest' ? styles.sortBtnActive : ''}`}
                onClick={() => setSortMode('hottest')}
              >
                <Icon icon={Flame} size="xs" />
                最热
              </button>
            </div>
          </div>
        </div>

        <div className={styles.filterBar}>
          {filterTags.map((tag) => (
            <button
              key={tag}
              className={`${styles.filterChip} ${activeFilter === tag ? styles.filterChipActive : ''}`}
              onClick={() => setActiveFilter(tag)}
            >
              {tag !== '全部' && <Hash size={10} style={{ opacity: 0.5 }} />}
              {tag}
            </button>
          ))}
        </div>
      </ScrollReveal>

      {/* ── 加载状态 ── */}
      {isLoading && (
        <div className={styles.postList}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className={styles.postCard} style={{ pointerEvents: 'none' }}>
              <div className={styles.postAccent} />
              <div className={styles.postContent}>
                <div className={styles.postAuthorRow} style={{ gap: 8 }}>
                  <Skeleton height={24} width={24} circle />
                  <Skeleton height={14} width={80} />
                  <Skeleton height={14} width={60} />
                </div>
                <Skeleton height={20} width="70%" />
                <Skeleton height={14} width="90%" />
                <div style={{ display: 'flex', gap: 16, marginTop: 4 }}>
                  <Skeleton height={14} width={40} />
                  <Skeleton height={14} width={40} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── 精选帖子 ── */}
      {!isLoading && featuredPost && featuredPost.likes > 0 && !searchQuery && activeFilter === '全部' && (
        <ScrollReveal delay={120}>
          <div className={styles.featuredSection}>
            <div className={styles.featuredLabel}>
              <Icon icon={TrendingUp} size="xs" />
              精选文章
            </div>
            <div
              className={styles.featuredCard}
              onClick={() => handleSelectPost(featuredPost)}
            >
              <div className={styles.featuredAccent} />
              <div className={styles.featuredBody}>
                <div className={styles.featuredTop}>
                  <Avatar
                    name={featuredPost.author_display_name || featuredPost.author_name || '匿名'}
                    avatarUrl={featuredPost.author_avatar}
                    size={40}
                    showRing={false}
                  />
                  <div className={styles.featuredAuthorCol}>
                    <span className={styles.featuredAuthorName}>
                      {featuredPost.author_display_name || featuredPost.author_name || '匿名'}
                    </span>
                    <span className={styles.featuredMeta}>
                      {formatDate(featuredPost.created_at)} · 阅读 {getPostReadingTime(featuredPost.content)} 分钟
                    </span>
                  </div>
                </div>
                <h2 className={styles.featuredTitle}>{featuredPost.title}</h2>
                <p className={styles.featuredExcerpt}>
                  {stripMarkdown(featuredPost.content).slice(0, 180)}
                </p>
                <div className={styles.featuredFooter}>
                  <div className={styles.featuredTags}>
                    {parseTags(featuredPost.tags).map((t) => (
                      <span key={t} className={styles.featuredTag}>{t}</span>
                    ))}
                  </div>
                  <div className={styles.featuredStats}>
                    <span className={styles.featuredStat}>
                      <Icon icon={Heart} size="xs" />
                      {featuredPost.likes}
                    </span>
                    <span className={styles.featuredStat}>
                      <Icon icon={MessageCircle} size="xs" />
                      {featuredPost.comment_count ?? 0}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </ScrollReveal>
      )}

      {/* ── 文章列表 ── */}
      {!isLoading && <div className={styles.postList}>
        {regularPosts.map((post, i) => {
          const postTags = parseTags(post.tags);
          const excerpt = stripMarkdown(post.content).slice(0, 140);
          const readMin = getPostReadingTime(post.content);

          return (
            <ScrollReveal key={post.id} delay={i * 40}>
              <div
                className={styles.postCard}
                onClick={() => handleSelectPost(post)}
              >
                {/* 左侧装饰条（hover 显示） */}
                <div className={styles.postAccent} />

                <div className={styles.postContent}>
                  {/* 作者行 */}
                  <div className={styles.postAuthorRow}>
                    <Avatar
                      name={post.author_display_name || post.author_name || '匿名'}
                      avatarUrl={post.author_avatar}
                      size={24}
                      showRing={false}
                    />
                    <span className={styles.postAuthorName}>
                      {post.author_display_name || post.author_name || '匿名'}
                    </span>
                    <span className={styles.postDateDot}>·</span>
                    <span className={styles.postDate}>{formatDate(post.created_at)}</span>
                    {postTags.length > 0 && (
                      <>
                        <span className={styles.postDateDot}>·</span>
                        <div className={styles.postInlineTags}>
                          {postTags.slice(0, 3).map(t => (
                            <span key={t} className={styles.postInlineTag}>{t}</span>
                          ))}
                        </div>
                      </>
                    )}
                  </div>

                  {/* 标题 */}
                  <h3 className={styles.postTitle}>{post.title}</h3>

                  {/* 摘要 */}
                  {excerpt && (
                    <p className={styles.postSummary}>{excerpt}</p>
                  )}

                  {/* 底部：统计 */}
                  <div className={styles.postBottom}>
                    <span className={styles.postStat}>
                      <Icon icon={Heart} size="xs" />
                      {post.likes}
                    </span>
                    <span className={styles.postStat}>
                      <Icon icon={MessageCircle} size="xs" />
                      {post.comment_count ?? 0}
                    </span>
                    <span className={styles.postStat}>
                      <Icon icon={BookOpen} size="xs" />
                      {readMin} 分钟
                    </span>
                  </div>
                </div>
              </div>
            </ScrollReveal>
          );
        })}
      </div>}

      {!isLoading && filtered.length === 0 && (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>
            <Icon icon={BookOpen} size="hero" />
          </div>
          <p className={styles.emptyText}>暂无相关帖子</p>
          <p className={styles.emptyHint}>成为第一个发帖的人吧</p>
        </div>
      )}
    </div>
  );
};

export default Discussion;
