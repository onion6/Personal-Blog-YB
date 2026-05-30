import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ChevronDown, ExternalLink, ThumbsUp, Wrench, BookOpen, Palette, Globe, Plus, Loader2 } from 'lucide-react';
import { getResources, voteResource, createResource } from '../../api';
import { useToastStore } from '../../store/useToastStore';
import { useAuthStore } from '../../store/useAuthStore';
import type { Resource } from '../../types';
import Card from '../../components/Card/Card';
import Modal from '../../components/Modal/Modal';
import ScrollReveal from '../../components/ScrollReveal/ScrollReveal';
import styles from './Resources.module.css';

const categories = [
  { key: '开发工具', label: '开发工具', icon: Wrench, emoji: '🔧' },
  { key: '学习资源', label: '学习资源', icon: BookOpen, emoji: '📚' },
  { key: '设计素材', label: '设计素材', icon: Palette, emoji: '🎨' },
  { key: '实用网站', label: '实用网站', icon: Globe, emoji: '🌐' },
];

const mockResources: Resource[] = [
  { id: 1, name: 'VS Code', description: '最流行的代码编辑器，支持丰富的插件生态', url: 'https://code.visualstudio.com', category: '开发工具', icon_url: '', votes: 128, created_at: '2024-01-01' },
  { id: 2, name: 'GitHub Copilot', description: 'AI 驱动的编程助手，提升编码效率', url: 'https://copilot.github.com', category: '开发工具', icon_url: '', votes: 96, created_at: '2024-01-02' },
  { id: 3, name: 'Docker Desktop', description: '容器化开发环境，一键部署应用', url: 'https://docker.com', category: '开发工具', icon_url: '', votes: 85, created_at: '2024-01-03' },
  { id: 4, name: 'MDN Web Docs', description: '最权威的 Web 技术文档', url: 'https://developer.mozilla.org', category: '学习资源', icon_url: '', votes: 200, created_at: '2024-02-01' },
  { id: 5, name: 'freeCodeCamp', description: '免费学习编程的开源社区', url: 'https://freecodecamp.org', category: '学习资源', icon_url: '', votes: 180, created_at: '2024-02-02' },
  { id: 6, name: 'Figma', description: '在线协作设计工具，支持组件化设计', url: 'https://figma.com', category: '设计素材', icon_url: '', votes: 150, created_at: '2024-03-01' },
  { id: 7, name: 'Dribbble', description: '设计师社区，获取设计灵感', url: 'https://dribbble.com', category: '设计素材', icon_url: '', votes: 120, created_at: '2024-03-02' },
  { id: 8, name: 'Can I Use', description: '浏览器兼容性查询工具', url: 'https://caniuse.com', category: '实用网站', icon_url: '', votes: 170, created_at: '2024-04-01' },
  { id: 9, name: 'Carbon', description: '代码截图美化工具', url: 'https://carbon.now.sh', category: '实用网站', icon_url: '', votes: 95, created_at: '2024-04-02' },
];

const Resources = () => {
  const { addToast } = useToastStore();
  const { isAuthenticated } = useAuthStore();
  const navigate = useNavigate();
  const [resources, setResources] = useState<Resource[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [openCategories, setOpenCategories] = useState<Set<string>>(new Set(categories.map((c) => c.key)));
  const [votedIds, setVotedIds] = useState<Set<number>>(new Set());
  
  // 新增分享资源相关的状态
  const [showShareModal, setShowShareModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<{
    name: string;
    url: string;
    description: string;
    category: string[];
    icon_url: string;
  }>({
    name: '',
    url: '',
    description: '',
    category: ['开发工具'],
    icon_url: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    getResources()
      .then((data) => setResources(data))
      .catch(() => {
        setResources(mockResources);
        addToast('使用离线数据模式', 'info');
      });
  }, []);

  const parseCategories = (cat: any): string[] => {
    if (Array.isArray(cat)) return cat;
    if (typeof cat !== 'string') return [];
    try {
      const parsed = JSON.parse(cat);
      return Array.isArray(parsed) ? parsed : [cat];
    } catch {
      return [cat];
    }
  };

  const toggleCategory = (key: string) => {
    const next = new Set(openCategories);
    if (next.has(key)) {
      next.delete(key);
    } else {
      next.add(key);
    }
    setOpenCategories(next);
  };

  const handleToggleFormCategory = (key: string) => {
    setFormData(prev => {
      const current = prev.category;
      if (current.includes(key)) {
        if (current.length === 1) return prev; // 至少保留一个分类
        return { ...prev, category: current.filter(k => k !== key) };
      }
      return { ...prev, category: [...current, key] };
    });
  };

  const handleVote = async (id: number) => {
    if (votedIds.has(id)) return;
    try {
      const updated = await voteResource(id);
      setResources(resources.map((r) => (r.id === id ? updated : r)));
      addToast('点赞成功', 'success');
    } catch {
      setResources(resources.map((r) => (r.id === id ? { ...r, votes: r.votes + 1 } : r)));
      addToast('本地模拟点赞', 'info');
    }
    setVotedIds(new Set([...votedIds, id]));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = '请输入资源名称';
    if (!formData.url.trim()) {
      newErrors.url = '请输入资源链接';
    } else if (!/^https?:\/\/.+/.test(formData.url)) {
      newErrors.url = '请输入有效的 URL (以 http:// 或 https:// 开头)';
    }
    if (!formData.description.trim()) newErrors.description = '请输入资源简介';
    if (formData.category.length === 0) newErrors.category = '请至少选择一个分类';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const newResource = await createResource({
        ...formData,
        votes: 0,
      });
      setResources(prev => [newResource, ...prev]);
      setShowShareModal(false);
      setFormData({ name: '', url: '', description: '', category: ['开发工具'], icon_url: '' });
      addToast('资源分享成功！', 'success');
      
      // 确保新添加的资源所属分类是展开的
      const resourceCategories = parseCategories(newResource.category);
      const nextOpen = new Set(openCategories);
      resourceCategories.forEach(cat => nextOpen.add(cat));
      setOpenCategories(nextOpen);
    } catch (error) {
      console.error('分享资源失败:', error);
      addToast('分享资源失败，请稍后重试', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filtered = resources.filter((r) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return r.name.toLowerCase().includes(q) || r.description.toLowerCase().includes(q);
  });

  const grouped = categories.map((cat) => ({
    ...cat,
    items: filtered.filter((r) => parseCategories(r.category).includes(cat.key)),
  }));

  return (
    <div className={styles.resourcesPage}>
      <ScrollReveal>
        <div className={styles.pageHeader}>
          <div className={styles.headerTop}>
            <div>
              <h1 className={styles.pageTitle}>资源分享</h1>
              <p className={styles.pageDesc}>精选开发资源，提升工作效率</p>
            </div>
            <button 
              className={styles.shareBtn}
              onClick={() => isAuthenticated ? setShowShareModal(true) : navigate('/login')}
            >
              <Plus size={18} />
              {isAuthenticated ? '分享资源' : '登录后分享'}
            </button>
          </div>
        </div>
      </ScrollReveal>

      <ScrollReveal delay={80}>
        <div className={styles.searchBox}>
          <Search size={16} className={styles.searchIcon} />
          <input
            className={styles.searchInput}
            placeholder="搜索资源..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </ScrollReveal>

      {grouped.map((cat, ci) => (
        <ScrollReveal key={cat.key} delay={ci * 100 + 100}>
          <div className={styles.categorySection}>
            <div className={styles.categoryHeader} onClick={() => toggleCategory(cat.key)}>
              <div className={styles.categoryTitle}>
                <span className={styles.categoryIcon}>{cat.emoji}</span>
                {cat.label}
                <span style={{ fontSize: 14, color: 'var(--text-secondary)', fontWeight: 400 }}>({cat.items.length})</span>
              </div>
              <span className={`${styles.categoryToggle} ${openCategories.has(cat.key) ? styles.categoryToggleOpen : ''}`}>
                <ChevronDown size={18} />
              </span>
            </div>
            <div className={`${styles.categoryContent} ${openCategories.has(cat.key) ? styles.categoryContentOpen : ''}`}>
              {cat.items.map((resource) => (
                <Card key={resource.id} className={styles.resourceCard}>
                  <div className={styles.resourceIcon}>
                    {resource.icon_url ? (
                      <img src={resource.icon_url} alt={resource.name} />
                    ) : (
                      <span className={styles.resourceIconPlaceholder}>{cat.emoji}</span>
                    )}
                  </div>
                  <div className={styles.resourceInfo}>
                    <div className={styles.resourceName}>{resource.name}</div>
                    <div className={styles.resourceDesc}>{resource.description}</div>
                  </div>
                  <div className={styles.resourceActions}>
                    <button
                      className={`${styles.voteBtn} ${votedIds.has(resource.id) ? styles.voteBtnVoted : ''}`}
                      onClick={() => handleVote(resource.id)}
                    >
                      <ThumbsUp size={12} />
                      {resource.votes}
                    </button>
                    <a href={resource.url} target="_blank" rel="noopener noreferrer" className={styles.resourceLink}>
                      <ExternalLink size={16} />
                    </a>
                  </div>
                </Card>
              ))}
              {cat.items.length === 0 && (
                <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '20px', color: 'var(--text-secondary)' }}>
                  暂无相关资源
                </div>
              )}
            </div>
          </div>
        </ScrollReveal>
      ))}

      <Modal
        open={showShareModal}
        onClose={() => setShowShareModal(false)}
        title="分享新资源"
      >
        <div className={styles.formContainer}>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>资源名称 *</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className={`${styles.formInput} ${errors.name ? styles.formInputError : ''}`}
              placeholder="例如：React 官方文档"
            />
            {errors.name && <span className={styles.formError}>{errors.name}</span>}
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>资源链接 *</label>
            <input
              type="text"
              name="url"
              value={formData.url}
              onChange={handleInputChange}
              className={`${styles.formInput} ${errors.url ? styles.formInputError : ''}`}
              placeholder="https://..."
            />
            {errors.url && <span className={styles.formError}>{errors.url}</span>}
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>资源简介 *</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              className={`${styles.formTextarea} ${errors.description ? styles.formInputError : ''}`}
              placeholder="简单描述一下这个资源..."
              rows={3}
            />
            {errors.description && <span className={styles.formError}>{errors.description}</span>}
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>分类 *</label>
            <div className={styles.categoryMultiSelect}>
              {categories.map(cat => (
                <button
                  key={cat.key}
                  type="button"
                  className={`${styles.categoryOption} ${formData.category.includes(cat.key) ? styles.categoryOptionActive : ''}`}
                  onClick={() => handleToggleFormCategory(cat.key)}
                >
                  <span className={styles.optionEmoji}>{cat.emoji}</span>
                  {cat.label}
                </button>
              ))}
            </div>
            {errors.category && <span className={styles.formError}>{errors.category}</span>}
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>图标 URL (可选)</label>
            <input
              type="text"
              name="icon_url"
              value={formData.icon_url}
              onChange={handleInputChange}
              className={styles.formInput}
              placeholder="https://example.com/icon.png"
            />
          </div>

          <div className={styles.formActions}>
            <button 
              className={styles.formCancelBtn}
              onClick={() => setShowShareModal(false)}
            >
              取消
            </button>
            <button 
              className={styles.formSubmitBtn}
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className={styles.spinner} />
                  分享中...
                </>
              ) : (
                '立即分享'
              )}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Resources;
