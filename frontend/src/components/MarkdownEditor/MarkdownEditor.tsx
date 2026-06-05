/**
 * MarkdownEditor - 类似掘金的 Markdown 编辑器
 *
 * 特性：
 * 1. 格式化工具栏：标题、加粗、斜体、代码块、列表、引用等
 * 2. 编辑/预览标签页切换
 * 3. 代码块插入时可选择编程语言
 * 4. 键盘快捷键支持（Ctrl+B/I/K 等）
 * 5. 字数统计和预计阅读时间
 * 6. 响应式布局
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark, prism } from 'react-syntax-highlighter/dist/esm/styles/prism';
import {
  Bold, Italic, Strikethrough, Code, Code2, Heading1, Heading2, Heading3,
  Link, Image, Quote, List, ListOrdered, Table, Minus, Undo2, Redo2,
  Eye, Pencil, Copy, Check, ChevronDown, X, Type
} from 'lucide-react';
import { useThemeStore } from '../../store/useThemeStore';
import Icon from '../Icon/Icon';
import styles from './MarkdownEditor.module.css';

/* ────────────── 类型定义 ────────────── */

interface MarkdownEditorProps {
  title?: string;
  content?: string;
  onTitleChange?: (title: string) => void;
  onContentChange?: (content: string) => void;
  tags?: string[];
  onTagsChange?: (tags: string[]) => void;
  onSubmit?: () => void;
  submitLabel?: string;
  placeholder?: string;
  minRows?: number;
}

interface HistoryEntry {
  content: string;
  cursor: number;
}

/* ────────────── 代码语言列表 ────────────── */

const CODE_LANGUAGES = [
  { value: 'javascript', label: 'JavaScript' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'python', label: 'Python' },
  { value: 'java', label: 'Java' },
  { value: 'go', label: 'Go' },
  { value: 'rust', label: 'Rust' },
  { value: 'cpp', label: 'C++' },
  { value: 'c', label: 'C' },
  { value: 'csharp', label: 'C#' },
  { value: 'php', label: 'PHP' },
  { value: 'ruby', label: 'Ruby' },
  { value: 'swift', label: 'Swift' },
  { value: 'kotlin', label: 'Kotlin' },
  { value: 'sql', label: 'SQL' },
  { value: 'html', label: 'HTML' },
  { value: 'css', label: 'CSS' },
  { value: 'scss', label: 'SCSS' },
  { value: 'bash', label: 'Bash' },
  { value: 'shell', label: 'Shell' },
  { value: 'yaml', label: 'YAML' },
  { value: 'json', label: 'JSON' },
  { value: 'xml', label: 'XML' },
  { value: 'markdown', label: 'Markdown' },
  { value: 'dockerfile', label: 'Dockerfile' },
  { value: 'text', label: '纯文本' },
];

/* ────────────── 代码高亮组件 ────────────── */

const PreviewCodeBlock = ({ node, inline, className, children, ...props }: any) => {
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
    <div className={styles.previewCodeBlock}>
      <div className={styles.previewCodeHeader}>
        <span className={styles.previewCodeLang}>{match ? match[1] : 'text'}</span>
        <button className={styles.previewCopyBtn} onClick={handleCopy}>
          {copied ? '已复制' : '复制'}
        </button>
      </div>
      <SyntaxHighlighter
        style={theme === 'dark' ? atomDark : prism}
        language={match ? match[1] : 'text'}
        PreTag="div"
        customStyle={{ margin: 0, borderRadius: 0, background: 'transparent' }}
        {...props}
      >
        {content}
      </SyntaxHighlighter>
    </div>
  );
};

/* ────────────── 工具栏按钮定义 ────────────── */

type ToolbarAction =
  | { type: 'button'; icon: any; title: string; shortcut?: string; action: () => void }
  | { type: 'separator' }
  | { type: 'dropdown'; icon: any; title: string; options: { label: string; value: string }[]; onSelect: (v: string) => void };

/* ────────────── 主组件 ────────────── */

const MarkdownEditor = ({
  title = '',
  content = '',
  onTitleChange,
  onContentChange,
  tags = [],
  onTagsChange,
  onSubmit,
  submitLabel = '发布',
  placeholder = '开始撰写你的文章内容...\n\n支持 Markdown 语法：\n# 一级标题\n## 二级标题\n**加粗** *斜体*\n`行内代码`\n```javascript\n// 代码块\n```',
}: MarkdownEditorProps) => {
  const { theme } = useThemeStore();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit');
  const [tagInput, setTagInput] = useState('');
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [showHeadingMenu, setShowHeadingMenu] = useState(false);
  const langMenuRef = useRef<HTMLDivElement>(null);
  const headingMenuRef = useRef<HTMLDivElement>(null);

  // 历史记录（撤销/重做）
  const [history, setHistory] = useState<HistoryEntry[]>([{ content: '', cursor: 0 }]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const historyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 字数统计
  const wordCount = content.replace(/\s/g, '').length;
  const readingTime = Math.max(1, Math.ceil(content.split(/\s+/).filter(Boolean).length / 200));

  // 关闭下拉菜单
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (langMenuRef.current && !langMenuRef.current.contains(e.target as Node)) {
        setShowLangMenu(false);
      }
      if (headingMenuRef.current && !headingMenuRef.current.contains(e.target as Node)) {
        setShowHeadingMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  /* ────── 文本操作核心 ────── */

  const pushHistory = useCallback((newContent: string, cursor: number) => {
    if (historyTimerRef.current) clearTimeout(historyTimerRef.current);
    historyTimerRef.current = setTimeout(() => {
      setHistory(prev => {
        const newHistory = prev.slice(0, historyIndex + 1);
        newHistory.push({ content: newContent, cursor });
        // 限制历史长度为50
        if (newHistory.length > 50) newHistory.shift();
        return newHistory;
      });
      setHistoryIndex(prev => Math.min(prev + 1, 49));
    }, 300);
  }, [historyIndex]);

  const updateContent = useCallback((newContent: string, cursorPos?: number) => {
    onContentChange?.(newContent);
    if (cursorPos !== undefined && textareaRef.current) {
      requestAnimationFrame(() => {
        textareaRef.current!.selectionStart = cursorPos;
        textareaRef.current!.selectionEnd = cursorPos;
      });
    }
    pushHistory(newContent, cursorPos ?? newContent.length);
  }, [onContentChange, pushHistory]);

  // 在光标处插入文本
  const insertAtCursor = useCallback((before: string, after: string = '', defaultText: string = '') => {
    const ta = textareaRef.current;
    if (!ta) return;

    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const selected = content.substring(start, end);
    const insert = selected || defaultText;
    const newContent = content.substring(0, start) + before + insert + after + content.substring(end);

    updateContent(newContent, start + before.length + insert.length);
    ta.focus();
  }, [content, updateContent]);

  // 在行首插入标记
  const insertLinePrefix = useCallback((prefix: string) => {
    const ta = textareaRef.current;
    if (!ta) return;

    const start = ta.selectionStart;
    const lineStart = content.lastIndexOf('\n', start - 1) + 1;
    const lineEnd = content.indexOf('\n', start);
    const end = lineEnd === -1 ? content.length : lineEnd;
    const currentLine = content.substring(lineStart, end);

    // 如果当前行已有该前缀，则移除
    if (currentLine.startsWith(prefix)) {
      const newContent = content.substring(0, lineStart) + currentLine.substring(prefix.length) + content.substring(end);
      updateContent(newContent, start - prefix.length);
    } else {
      const newContent = content.substring(0, lineStart) + prefix + currentLine + content.substring(end);
      updateContent(newContent, start + prefix.length);
    }
    ta.focus();
  }, [content, updateContent]);

  // 插入多行文本块
  const insertBlock = useCallback((block: string) => {
    const ta = textareaRef.current;
    if (!ta) return;

    const start = ta.selectionStart;
    // 确保前后有空行
    const needBefore = start > 0 && content[start - 1] !== '\n' ? '\n\n' : (start > 1 && content[start - 2] !== '\n' ? '\n' : '');
    const needAfter = '\n';
    const newContent = content.substring(0, start) + needBefore + block + needAfter + content.substring(start);

    updateContent(newContent, start + needBefore.length + block.length + needAfter.length);
    ta.focus();
  }, [content, updateContent]);

  /* ────── 格式化操作 ────── */

  const handleBold = () => insertAtCursor('**', '**', '加粗文本');
  const handleItalic = () => insertAtCursor('*', '*', '斜体文本');
  const handleStrikethrough = () => insertAtCursor('~~', '~~', '删除线文本');
  const handleInlineCode = () => insertAtCursor('`', '`', 'code');
  const handleLink = () => insertAtCursor('[', '](https://)', '链接文本');
  const handleImage = () => insertAtCursor('![', '](https://image-url)', '图片描述');
  const handleQuote = () => insertLinePrefix('> ');
  const handleOrderedList = () => insertLinePrefix('1. ');
  const handleUnorderedList = () => insertLinePrefix('- ');
  const handleHeading = (level: number) => {
    const prefix = '#'.repeat(level) + ' ';
    insertLinePrefix(prefix);
    setShowHeadingMenu(false);
  };
  const handleHorizontalRule = () => insertBlock('---');

  const handleCodeBlock = (lang: string) => {
    insertBlock(`\`\`\`${lang}\n// 在此输入代码\n\`\`\``);
    setShowLangMenu(false);
  };

  const handleTable = () => {
    insertBlock('| 列1 | 列2 | 列3 |\n| --- | --- | --- |\n| 内容 | 内容 | 内容 |');
  };

  const handleUndo = () => {
    if (historyIndex <= 0) return;
    const newIndex = historyIndex - 1;
    const entry = history[newIndex];
    if (entry) {
      onContentChange?.(entry.content);
      setHistoryIndex(newIndex);
      if (textareaRef.current) {
        textareaRef.current.selectionStart = entry.cursor;
        textareaRef.current.selectionEnd = entry.cursor;
      }
    }
  };

  const handleRedo = () => {
    if (historyIndex >= history.length - 1) return;
    const newIndex = historyIndex + 1;
    const entry = history[newIndex];
    if (entry) {
      onContentChange?.(entry.content);
      setHistoryIndex(newIndex);
      if (textareaRef.current) {
        textareaRef.current.selectionStart = entry.cursor;
        textareaRef.current.selectionEnd = entry.cursor;
      }
    }
  };

  /* ────── 键盘快捷键 ────── */

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const mod = e.ctrlKey || e.metaKey;

    if (mod && e.key === 'b') {
      e.preventDefault();
      handleBold();
    } else if (mod && e.key === 'i') {
      e.preventDefault();
      handleItalic();
    } else if (mod && e.key === 'k') {
      e.preventDefault();
      handleLink();
    } else if (mod && e.key === 'z' && !e.shiftKey) {
      e.preventDefault();
      handleUndo();
    } else if (mod && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
      e.preventDefault();
      handleRedo();
    } else if (e.key === 'Tab') {
      e.preventDefault();
      insertAtCursor('  ', '', '');
    }
  };

  /* ────── 工具栏配置 ────── */

  const toolbarItems: ToolbarAction[] = [
    {
      type: 'dropdown',
      icon: Type,
      title: '标题',
      options: [
        { label: '一级标题', value: '1' },
        { label: '二级标题', value: '2' },
        { label: '三级标题', value: '3' },
      ],
      onSelect: (v) => handleHeading(Number(v)),
    },
    { type: 'separator' },
    { type: 'button', icon: Bold, title: '加粗', shortcut: 'Ctrl+B', action: handleBold },
    { type: 'button', icon: Italic, title: '斜体', shortcut: 'Ctrl+I', action: handleItalic },
    { type: 'button', icon: Strikethrough, title: '删除线', action: handleStrikethrough },
    { type: 'separator' },
    { type: 'button', icon: Code, title: '行内代码', action: handleInlineCode },
    {
      type: 'dropdown',
      icon: Code2,
      title: '代码块',
      options: CODE_LANGUAGES.map(l => ({ label: l.label, value: l.value })),
      onSelect: handleCodeBlock,
    },
    { type: 'separator' },
    { type: 'button', icon: Link, title: '链接', shortcut: 'Ctrl+K', action: handleLink },
    { type: 'button', icon: Image, title: '图片', action: handleImage },
    { type: 'separator' },
    { type: 'button', icon: Quote, title: '引用', action: handleQuote },
    { type: 'button', icon: ListOrdered, title: '有序列表', action: handleOrderedList },
    { type: 'button', icon: List, title: '无序列表', action: handleUnorderedList },
    { type: 'separator' },
    { type: 'button', icon: Table, title: '表格', action: handleTable },
    { type: 'button', icon: Minus, title: '分割线', action: handleHorizontalRule },
  ];

  /* ────── 标签操作 ────── */

  const handleAddTag = () => {
    const tag = tagInput.trim();
    if (tag && !tags.includes(tag)) {
      onTagsChange?.([...tags, tag]);
    }
    setTagInput('');
  };

  const handleRemoveTag = (index: number) => {
    onTagsChange?.(tags.filter((_, i) => i !== index));
  };

  /* ────── 渲染 ────── */

  return (
    <div className={styles.editor}>
      {/* 标题输入 */}
      {onTitleChange && (
        <input
          className={styles.titleInput}
          placeholder="请输入文章标题..."
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          maxLength={100}
        />
      )}

      {/* 标签输入 */}
      {onTagsChange && (
        <div className={styles.tagBar}>
          <span className={styles.tagBarLabel}>标签：</span>
          {tags.map((tag, i) => (
            <span key={i} className={styles.tagItem}>
              {tag}
              <button className={styles.tagRemove} onClick={() => handleRemoveTag(i)}>
                <Icon icon={X} size="xs" />
              </button>
            </span>
          ))}
          <input
            className={styles.tagInput}
            placeholder="输入标签后回车"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddTag(); } }}
            maxLength={20}
          />
        </div>
      )}

      {/* 标签页切换 + 工具栏 */}
      <div className={styles.editorHeader}>
        <div className={styles.tabBar}>
          <button
            className={`${styles.tab} ${activeTab === 'edit' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('edit')}
          >
            <Icon icon={Pencil} size="sm" />
            编辑
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'preview' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('preview')}
          >
            <Icon icon={Eye} size="sm" />
            预览
          </button>
        </div>

        {activeTab === 'edit' && (
          <div className={styles.toolbar}>
            {toolbarItems.map((item, i) => {
              if (item.type === 'separator') {
                return <span key={i} className={styles.toolbarSeparator} />;
              }

              if (item.type === 'dropdown') {
                const isLangMenu = item.title === '代码块';
                const menuOpen = isLangMenu ? showLangMenu : showHeadingMenu;
                const menuRef = isLangMenu ? langMenuRef : headingMenuRef;
                const toggleMenu = () => {
                  if (isLangMenu) {
                    setShowLangMenu(!showLangMenu);
                    setShowHeadingMenu(false);
                  } else {
                    setShowHeadingMenu(!showHeadingMenu);
                    setShowLangMenu(false);
                  }
                };

                return (
                  <div key={i} className={styles.dropdownWrap} ref={menuRef}>
                    <button
                      className={styles.toolbarBtn}
                      title={item.title}
                      onClick={toggleMenu}
                    >
                      <Icon icon={item.icon} size="sm" />
                      <Icon icon={ChevronDown} size="xs" />
                    </button>
                    {menuOpen && (
                      <div className={`${styles.dropdownMenu} ${isLangMenu ? styles.langMenu : ''}`}>
                        {item.options.map((opt) => (
                          <button
                            key={opt.value}
                            className={styles.dropdownItem}
                            onClick={() => item.onSelect(opt.value)}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              }

              return (
                <button
                  key={i}
                  className={styles.toolbarBtn}
                  title={item.shortcut ? `${item.title} (${item.shortcut})` : item.title}
                  onClick={item.action}
                >
                  <Icon icon={item.icon} size="sm" />
                </button>
              );
            })}

            <span className={styles.toolbarSeparator} />

            <button
              className={styles.toolbarBtn}
              title="撤销 (Ctrl+Z)"
              onClick={handleUndo}
              disabled={historyIndex <= 0}
            >
              <Icon icon={Undo2} size="sm" />
            </button>
            <button
              className={styles.toolbarBtn}
              title="重做 (Ctrl+Y)"
              onClick={handleRedo}
              disabled={historyIndex >= history.length - 1}
            >
              <Icon icon={Redo2} size="sm" />
            </button>
          </div>
        )}
      </div>

      {/* 编辑区域 / 预览区域 */}
      <div className={styles.editorBody}>
        {activeTab === 'edit' ? (
          <textarea
            ref={textareaRef}
            className={styles.textarea}
            placeholder={placeholder}
            value={content}
            onChange={(e) => updateContent(e.target.value)}
            onKeyDown={handleKeyDown}
            spellCheck={false}
          />
        ) : (
          <div className={styles.preview}>
            {content ? (
              <div className={styles.previewContent}>
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{ code: PreviewCodeBlock }}
                >
                  {content}
                </ReactMarkdown>
              </div>
            ) : (
              <div className={styles.previewEmpty}>
                <Icon icon={Pencil} size="hero" />
                <p>切换到编辑模式开始撰写内容</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 底部信息栏 */}
      <div className={styles.editorFooter}>
        <div className={styles.footerInfo}>
          <span className={styles.wordCount}>{wordCount} 字</span>
          <span className={styles.footerDot}>·</span>
          <span className={styles.readingTime}>约 {readingTime} 分钟阅读</span>
          <span className={styles.footerDot}>·</span>
          <span className={styles.formatHint}>Markdown</span>
        </div>
        {onSubmit && (
          <button
            className={styles.submitBtn}
            onClick={onSubmit}
            disabled={!title?.trim() || !content.trim()}
          >
            {submitLabel}
          </button>
        )}
      </div>
    </div>
  );
};

export default MarkdownEditor;
