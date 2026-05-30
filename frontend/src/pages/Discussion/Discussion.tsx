import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark, prism } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Search, Heart, MessageCircle, ArrowLeft, Clock, Flame, Pencil, BookOpen, Copy, Check } from 'lucide-react';
import { getPosts, getPostById, createPost, likePost, getComments, createComment } from '../../api';
import { useToastStore } from '../../store/useToastStore';
import { useThemeStore } from '../../store/useThemeStore';
import { useAuthStore } from '../../store/useAuthStore';
import type { Post, Comment } from '../../types';
import Card from '../../components/Card/Card';
import Tag from '../../components/Tag/Tag';
import ScrollReveal from '../../components/ScrollReveal/ScrollReveal';
import styles from './Discussion.module.css';

const filterTags = ['全部', '前端', '后端', '工具', '面试', 'Bug 排查'];

const mockPosts: Post[] = [
  { id: 1, title: 'React 18 新特性详解', content: '# React 18 新特性\n\nReact 18 引入了许多激动人心的新特性：\n\n## Automatic Batching\n\n自动批处理让多次 state 更新合并为一次渲染。\n\n## Suspense 改进\n\n服务端 Suspense 支持流式渲染。\n\n## useTransition\n\n```tsx\nconst [isPending, startTransition] = useTransition();\n```\n\n这些特性让 React 应用更加高效。', tags: '["前端","React"]', likes: 42, comment_count: 5, created_at: '2024-06-15' },
  { id: 2, title: 'TypeScript 高级类型技巧', content: '# TypeScript 高级类型\n\n掌握这些类型技巧，让你的代码更安全。\n\n## 条件类型\n\n```typescript\ntype IsString<T> = T extends string ? true : false;\n```\n\n## 模板字面量类型\n\n```typescript\ntype EventName = `on${Capitalize<string>}`;\n```', tags: '["前端","TypeScript"]', likes: 38, comment_count: 3, created_at: '2024-06-10' },
  { id: 3, title: 'Node.js 性能优化实践', content: '# Node.js 性能优化\n\n## 1. 使用 Cluster 模式\n\n## 2. 合理使用缓存\n\n## 3. 数据库查询优化\n\n## 4. 使用流处理大数据', tags: '["后端","Node"]', likes: 29, comment_count: 7, created_at: '2024-06-08' },
  { id: 4, title: '前端工程化工具对比 2024', content: '# 前端工程化工具对比\n\n对比 Vite、Webpack、Turbopack、Rspack 等工具的优劣。', tags: '["工具","前端"]', likes: 56, comment_count: 12, created_at: '2024-06-05' },
  { id: 5, title: '前端面试高频题解析', content: '# 前端面试题解析\n\n## 闭包原理\n\n## 事件循环机制\n\n## 虚拟 DOM diff 算法', tags: '["面试","前端"]', likes: 88, comment_count: 20, created_at: '2024-06-01' },
];

const mockComments: Comment[] = [
  { id: 1, post_id: 1, author: 'Alice', content: '写得很好，学到了！', created_at: '2024-06-16' },
  { id: 2, post_id: 1, author: 'Bob', content: 'useTransition 确实很实用，能显著提升用户体验。', created_at: '2024-06-17' },
  { id: 3, post_id: 1, author: 'Charlie', content: '期待更多关于 React 18 的深入分析。', created_at: '2024-06-18' },
];

type SortMode = 'latest' | 'hottest';

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
        {copied ? <Check size={14} /> : <Copy size={14} />}
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

const Discussion = () => {
  const { theme } = useThemeStore();
  const { addToast } = useToastStore();
  const { isAuthenticated, user } = useAuthStore();
  const navigate = useNavigate();
  const [posts, setPosts] = useState<Post[]>([]);
  const [activeFilter, setActiveFilter] = useState('全部');
  const [sortMode, setSortMode] = useState<SortMode>('latest');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentAuthor, setCommentAuthor] = useState('');
  const [commentContent, setCommentContent] = useState('');
  const [showEditor, setShowEditor] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newTags, setNewTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');

  useEffect(() => {
    getPosts()
      .then((data) => setPosts(data))
      .catch(() => {
        setPosts(mockPosts);
        addToast('使用离线数据模式', 'info');
      });
  }, []);

  const parseTags = (tags: any): string[] => {
    if (Array.isArray(tags)) return tags;
    if (typeof tags !== 'string') return [];
    try {
      const parsed = JSON.parse(tags);
      if (Array.isArray(parsed)) return parsed;
      if (typeof parsed === 'string') return parseTags(parsed); // 处理可能的双重序列化
      return [];
    } catch {
      return [];
    }
  };

  const readingTime = useMemo(() => {
    if (!selectedPost) return 0;
    const wordsPerMinute = 200;
    const textLength = selectedPost.content.split(/\s+/).length;
    return Math.ceil(textLength / wordsPerMinute);
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
      setComments(mockComments.filter((c) => c.post_id === post.id));
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
      const post = await createPost({
        title: newTitle,
        content: newContent,
        tags: newTags, // 直接发送数组
      });
      setPosts([post, ...posts]);
      addToast('发布成功！', 'success');
    } catch {
      const mockPost: Post = {
        id: Date.now(),
        title: newTitle,
        content: newContent,
        tags: newTags, // 直接使用数组
        likes: 0,
        comment_count: 0,
        created_at: new Date().toISOString().split('T')[0],
      };
      setPosts([mockPost, ...posts]);
      addToast('本地模拟发布成功', 'info');
    }
    setNewTitle('');
    setNewContent('');
    setNewTags([]);
    setShowEditor(false);
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !newTags.includes(tagInput.trim())) {
      setNewTags([...newTags, tagInput.trim()]);
      setTagInput('');
    }
  };

  if (selectedPost) {
    return (
      <div className={styles.discussionPage}>
        <button className={styles.backBtn} onClick={() => setSelectedPost(null)}>
          <ArrowLeft size={16} />
          返回列表
        </button>

        <ScrollReveal>
          <h1 className={styles.detailTitle}>{selectedPost.title}</h1>
          <div className={styles.detailMeta}>
            <span className={styles.postMetaItem}>
              <Clock size={14} />
              {selectedPost.created_at}
            </span>
            <span className={styles.postMetaItem}>
              <BookOpen size={14} />
              预计阅读时间: {readingTime} 分钟
            </span>
            <button className={styles.likeBtn} onClick={handleLike}>
              <Heart size={14} />
              {selectedPost.likes}
            </button>
          </div>
          
          <div className={styles.detailContainer}>
            <div className={styles.detailContent}>
              <ReactMarkdown 
                remarkPlugins={[remarkGfm]}
                components={{
                  code: CodeBlock
                }}
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
                  <div className={styles.commentAvatar}>{c.author[0]}</div>
                  <span className={styles.commentAuthor}>{c.author}</span>
                  <span className={styles.commentDate}>{c.created_at}</span>
                </div>
                <div className={styles.commentBody}>{c.content}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.discussionPage}>
      <ScrollReveal>
        <div className={styles.pageHeader}>
          <h1 className={styles.pageTitle}>技术交流</h1>
          <p className={styles.pageDesc}>分享技术心得，交流开发经验</p>
        </div>
      </ScrollReveal>

      <ScrollReveal delay={50}>
        <button className={styles.toggleEditorBtn} onClick={() => isAuthenticated ? setShowEditor(!showEditor) : navigate('/login')}>
          <Pencil size={14} style={{ marginRight: 6, display: 'inline', verticalAlign: 'middle' }} />
          {!isAuthenticated ? '登录后发帖' : showEditor ? '收起编辑器' : '发帖'}
        </button>
      </ScrollReveal>

      {showEditor && (
        <ScrollReveal>
          <Card className={styles.editorContainer}>
            <h3 className={styles.editorTitle}>发布新帖</h3>
            <input
              className={styles.editorInput}
              placeholder="帖子标题"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
            />
            <div className={styles.tagInput}>
              {newTags.map((t, i) => (
                <Tag key={i} variant="accent" clickable onClick={() => setNewTags(newTags.filter((_, j) => j !== i))}>
                  {t} x
                </Tag>
              ))}
              <input
                className={styles.tagInputField}
                placeholder="添加标签"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddTag(); } }}
              />
            </div>
            <div className={styles.editorBody}>
              <textarea
                className={styles.editorTextarea}
                placeholder="Markdown 内容..."
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
              />
              <div className={styles.previewPane}>
                <div className={styles.previewLabel}>预览</div>
                <div className={styles.detailContent}>
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {newContent || '*开始输入内容...*'}
                  </ReactMarkdown>
                </div>
              </div>
            </div>
            <button className={styles.createPostBtn} onClick={handleCreatePost}>发布</button>
          </Card>
        </ScrollReveal>
      )}

      <ScrollReveal delay={100}>
        <div className={styles.toolbar}>
          <div className={styles.searchBox}>
            <Search size={16} className={styles.searchIcon} />
            <input
              className={styles.searchInput}
              placeholder="搜索帖子..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className={styles.sortBtns}>
            <button
              className={`${styles.sortBtn} ${sortMode === 'latest' ? styles.sortBtnActive : ''}`}
              onClick={() => setSortMode('latest')}
            >
              <Clock size={14} style={{ marginRight: 4, display: 'inline', verticalAlign: 'middle' }} />
              最新
            </button>
            <button
              className={`${styles.sortBtn} ${sortMode === 'hottest' ? styles.sortBtnActive : ''}`}
              onClick={() => setSortMode('hottest')}
            >
              <Flame size={14} style={{ marginRight: 4, display: 'inline', verticalAlign: 'middle' }} />
              最热
            </button>
          </div>
        </div>
      </ScrollReveal>

      <ScrollReveal delay={150}>
        <div className={styles.filterBar}>
          {filterTags.map((tag) => (
            <Tag
              key={tag}
              variant={activeFilter === tag ? 'active' : 'default'}
              clickable
              onClick={() => setActiveFilter(tag)}
            >
              {tag}
            </Tag>
          ))}
        </div>
      </ScrollReveal>

      <div className={styles.postList}>
        {filtered.map((post, i) => (
          <ScrollReveal key={post.id} delay={i * 60}>
            <Card clickable className={styles.postCard} onClick={() => handleSelectPost(post)}>
              <h3 className={styles.postTitle}>{post.title}</h3>
              <p className={styles.postSummary}>{post.content.replace(/[#*`\[\]]/g, '').slice(0, 120)}</p>
              <div className={styles.postTags}>
                {parseTags(post.tags).map((t) => (
                  <Tag key={t}>{t}</Tag>
                ))}
              </div>
              <div className={styles.postMeta}>
                <span className={styles.postMetaItem}>
                  <Heart size={14} />
                  {post.likes}
                </span>
                <span className={styles.postMetaItem}>
                  <MessageCircle size={14} />
                  {post.comment_count ?? 0}
                </span>
                <span className={styles.postMetaItem}>
                  <Clock size={14} />
                  {post.created_at}
                </span>
              </div>
            </Card>
          </ScrollReveal>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className={styles.emptyState}>暂无相关帖子</div>
      )}
    </div>
  );
};

export default Discussion;
