import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Github, ExternalLink, Rocket, Plus, Loader2, Pencil, Trash2, Save, ArrowUpRight, Code2, FolderOpen } from 'lucide-react';
import { useProjects, useUserProjects, useMyProjects, useCreateProject, useUpdateProject, useDeleteProject } from '../../hooks/useProjects';
import { useSettingsStore } from '../../store/useSettingsStore';
import { useToastStore } from '../../store/useToastStore';
import { useAuthStore } from '../../store/useAuthStore';
import type { Project } from '../../types';
import Card from '../../components/Card/Card';
import Tag from '../../components/Tag/Tag';
import Modal from '../../components/Modal/Modal';
import ConfirmModal from '../../components/ConfirmModal/ConfirmModal';
import Skeleton from '../../components/Skeleton/Skeleton';
import ScrollReveal from '../../components/ScrollReveal/ScrollReveal';
import Icon from '../../components/Icon/Icon';
import styles from './Projects.module.css';

const filterTags = ['全部', 'React', 'Vue', 'Node', 'Python', '全栈'];

// 技术栈对应的渐变色
const techColors: Record<string, string> = {
  react: '#61dafb',
  vue: '#42b883',
  node: '#68a063',
  typescript: '#3178c6',
  javascript: '#f7df1e',
  python: '#3776ab',
  next: '#ffffff',
  tailwind: '#38bdf8',
  docker: '#2496ed',
  redis: '#dc382d',
  mysql: '#4479a1',
  mongodb: '#4db33d',
  go: '#00add8',
  rust: '#ce422b',
  java: '#ed8b00',
  spring: '#6db33f',
  angular: '#dd0031',
  svelte: '#ff3e00',
  default: '#8b5cf6',
};

const getTechColor = (tech: string): string => {
  const key = tech.toLowerCase();
  for (const [k, v] of Object.entries(techColors)) {
    if (key.includes(k)) return v;
  }
  return techColors.default;
};

// 根据项目名称生成唯一的渐变种子
const hashStr = (s: string) => {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) & 0xffff;
  return h;
};

const Projects = () => {
  const { userId } = useParams<{ userId: string }>();
  const { layout } = useSettingsStore();
  const { addToast } = useToastStore();
  const { isAuthenticated, user } = useAuthStore();
  const navigate = useNavigate();

  const isViewingSelf = !userId && isAuthenticated;
  const isViewingUser = !!userId;

  const allProjects = useProjects();
  const userProjects = useUserProjects(userId ? Number(userId) : undefined, isViewingUser);
  const myProjects = useMyProjects(isViewingSelf);

  const { data: projects = [], isLoading } = isViewingUser
    ? userProjects
    : isViewingSelf
      ? myProjects
      : allProjects;

  const isOwner = isViewingSelf || (!!userId && !!user && Number(userId) === user.id);

  const createProjectMutation = useCreateProject();
  const updateProjectMutation = useUpdateProject();
  const deleteProjectMutation = useDeleteProject();
  const [activeFilter, setActiveFilter] = useState('全部');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    cover_url: '',
    tech_stack: '',
    github_url: '',
    demo_url: '',
    status: '进行中',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);

  const parseTech = (tech: any): string[] => {
    if (Array.isArray(tech)) return tech;
    if (typeof tech !== 'string') return [];
    try {
      const parsed = JSON.parse(tech);
      if (Array.isArray(parsed)) return parsed;
      if (typeof parsed === 'string') return parseTech(parsed);
      return [];
    } catch {
      return [];
    }
  };

  const matchesFilter = (project: Project, filter: string) => {
    if (filter === '全部') return true;
    const techs = parseTech(project.tech_stack);
    return techs.some((t) => t.toLowerCase().includes(filter.toLowerCase()));
  };

  const filtered = projects.filter((p) => matchesFilter(p, activeFilter));

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) {
      newErrors.name = '请输入项目名称';
    }
    if (!formData.description.trim()) {
      newErrors.description = '请输入项目描述';
    }
    if (!formData.tech_stack.trim()) {
      newErrors.tech_stack = '请输入技术栈';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const techArray = formData.tech_stack.split(/[,，、\s]+/).filter(t => t.trim());
      const projectData: Partial<Project> = {
        ...formData,
        tech_stack: techArray,
        sort_order: projects.length + 1,
      };
      
      await createProjectMutation.mutateAsync(projectData);
      setShowCreateModal(false);
      setFormData({ name: '', description: '', cover_url: '', tech_stack: '', github_url: '', demo_url: '', status: '进行中' });
      addToast('项目发布成功！', 'success');
    } catch (error) {
      console.error('创建项目失败:', error);
      addToast('创建项目失败，请稍后重试', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseModal = () => {
    setShowCreateModal(false);
    setErrors({});
  };

  const isProjectOwner = (project: Project) => {
    return isOwner && user && project.user_id === user.id;
  };

  const handleEdit = (project: Project, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingProject(project);
    setFormData({
      name: project.name,
      description: project.description,
      cover_url: project.cover_url || '',
      tech_stack: parseTech(project.tech_stack).join(', '),
      github_url: project.github_url || '',
      demo_url: project.demo_url || '',
      status: project.status || '进行中',
    });
    setErrors({});
  };

  const handleDelete = (project: Project, e: React.MouseEvent) => {
    e.stopPropagation();
    setProjectToDelete(project);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!projectToDelete) return;
    try {
      await deleteProjectMutation.mutateAsync(projectToDelete.id);
      addToast('项目已删除', 'success');
    } catch {
      addToast('删除失败，请稍后重试', 'error');
    } finally {
      setProjectToDelete(null);
    }
  };

  const handleUpdate = async () => {
    if (!editingProject || !validateForm()) return;
    setIsSubmitting(true);
    try {
      const techArray = formData.tech_stack.split(/[,，、\s]+/).filter(t => t.trim());
      await updateProjectMutation.mutateAsync({
        id: editingProject.id,
        data: { ...formData, tech_stack: techArray },
      });
      setEditingProject(null);
      setFormData({ name: '', description: '', cover_url: '', tech_stack: '', github_url: '', demo_url: '', status: '进行中' });
      addToast('项目已更新', 'success');
    } catch {
      addToast('更新失败，请稍后重试', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseEditModal = () => {
    setEditingProject(null);
    setErrors({});
  };

  // 为项目卡片生成封面渐变
  const getCoverGradient = (name: string) => {
    const h = hashStr(name);
    const hue1 = h % 360;
    const hue2 = (hue1 + 45) % 360;
    const hue3 = (hue1 + 120) % 360;
    return `linear-gradient(135deg, hsla(${hue1}, 60%, 20%, 1) 0%, hsla(${hue2}, 50%, 15%, 1) 50%, hsla(${hue3}, 55%, 18%, 1) 100%)`;
  };

  return (
    <div className={styles.projectsPage}>
      {/* 页面头部 */}
      <ScrollReveal>
        <div className={styles.pageHeader}>
          <div className={styles.headerGridBg} />
          <div className={styles.headerContent}>
            <div className={styles.headerLeft}>
              <div className={styles.headerLabel}>
                <Icon icon={FolderOpen} size="sm" />
                <span>Portfolio</span>
              </div>
              <h1 className={styles.pageTitle}>项目展示</h1>
              <p className={styles.pageDesc}>我参与开发的一些开源和个人项目</p>
              <div className={styles.headerStats}>
                <div className={styles.statItem}>
                  <span className={styles.statNumber}>{projects.length}</span>
                  <span className={styles.statLabel}>个项目</span>
                </div>
                <div className={styles.statDivider} />
                <div className={styles.statItem}>
                  <span className={styles.statNumber}>
                    {projects.filter(p => p.status === '进行中').length}
                  </span>
                  <span className={styles.statLabel}>进行中</span>
                </div>
                <div className={styles.statDivider} />
                <div className={styles.statItem}>
                  <span className={styles.statNumber}>
                    {projects.filter(p => p.status === '已完成').length}
                  </span>
                  <span className={styles.statLabel}>已完成</span>
                </div>
              </div>
            </div>
            <button 
              className={styles.createBtn}
              onClick={() => isOwner ? setShowCreateModal(true) : navigate('/login')}
            >
              <Icon icon={Plus} size="md" />
              <span>{isOwner ? '新建项目' : '登录后新建'}</span>
              <Icon icon={ArrowUpRight} size="sm" />
            </button>
          </div>
        </div>
      </ScrollReveal>

      {/* 筛选栏 */}
      <ScrollReveal delay={100}>
        <div className={styles.filterBar}>
          <div className={styles.filterIcon}>
            <Icon icon={Code2} size="sm" />
          </div>
          {filterTags.map((tag) => (
            <button
              key={tag}
              className={`${styles.filterChip} ${activeFilter === tag ? styles.filterChipActive : ''}`}
              onClick={() => setActiveFilter(tag)}
            >
              {tag}
              {tag === '全部' && activeFilter === tag && (
                <span className={styles.filterCount}>{projects.length}</span>
              )}
            </button>
          ))}
        </div>
      </ScrollReveal>

      {/* 项目网格 */}
      <div className={`${styles.projectGrid} ${layout === 'list' ? styles.projectList : ''}`}>
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className={styles.projectCard}>
              <Skeleton height={200} />
              <div className={styles.projectInfo}>
                <Skeleton height={24} width="60%" />
                <Skeleton height={16} width="90%" />
                <Skeleton height={16} width="40%" />
                <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                  <Skeleton height={20} width={50} />
                  <Skeleton height={20} width={50} />
                </div>
              </div>
            </Card>
          ))
        ) : (
          filtered.map((project, i) => {
            const techList = parseTech(project.tech_stack);
            return (
              <ScrollReveal key={project.id} delay={i * 80}>
                <div
                  className={styles.projectCard}
                  onClick={() => setSelectedProject(project)}
                >
                  {/* 封面区域 */}
                  <div 
                    className={styles.projectCover}
                    style={!project.cover_url ? { background: getCoverGradient(project.name) } : undefined}
                  >
                    {/* 蓝图网格纹理 */}
                    <div className={styles.coverGrid} />
                    
                    {/* 状态徽章 */}
                    {project.status && (
                      <div className={`${styles.statusBadge} ${project.status === '进行中' ? styles.statusActive : ''} ${project.status === '已完成' ? styles.statusDone : ''} ${project.status === '已归档' ? styles.statusArchived : ''} ${project.status === '长期维护' ? styles.statusMaintained : ''}`}>
                        {project.status === '进行中' && <span className={styles.statusDot} />}
                        {project.status}
                      </div>
                    )}

                    {/* 封面内容 */}
                    {project.cover_url ? (
                      <img src={project.cover_url} alt={project.name} className={styles.coverImage} loading="lazy" />
                    ) : (
                      <div className={styles.coverIconWrap}>
                        <span className={styles.coverIndex}>
                          {String(i + 1).padStart(2, '0')}
                        </span>
                        <Icon icon={Rocket} size="hero" />
                      </div>
                    )}

                    {/* 底部渐变遮罩 */}
                    <div className={styles.coverFade} />

                    {/* 操作按钮 */}
                    {isProjectOwner(project) && (
                      <div className={styles.cardActions}>
                        <button className={styles.cardActionBtn} onClick={(e) => handleEdit(project, e)} title="编辑">
                          <Icon icon={Pencil} size="sm" />
                        </button>
                        <button className={`${styles.cardActionBtn} ${styles.cardActionBtnDanger}`} onClick={(e) => handleDelete(project, e)} title="删除">
                          <Icon icon={Trash2} size="sm" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* 信息区域 */}
                  <div className={styles.projectInfo}>
                    <h3 className={styles.projectName}>{project.name}</h3>
                    <p className={styles.projectDesc}>{project.description}</p>
                    
                    {/* 技术栈 */}
                    {techList.length > 0 && (
                      <div className={styles.techRow}>
                        <div className={styles.techDots}>
                          {techList.slice(0, 5).map((t) => (
                            <span 
                              key={t} 
                              className={styles.techDot}
                              style={{ '--dot-color': getTechColor(t) } as React.CSSProperties}
                              title={t}
                            />
                          ))}
                        </div>
                        <div className={styles.techLabels}>
                          {techList.slice(0, 3).map((t) => (
                            <span key={t} className={styles.techLabel}>{t}</span>
                          ))}
                          {techList.length > 3 && (
                            <span className={styles.techLabelMore}>+{techList.length - 3}</span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* 链接行 */}
                    {(project.github_url || project.demo_url) && (
                      <div className={styles.projectLinks}>
                        {project.github_url && (
                          <a
                            href={project.github_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={styles.projectLink}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Icon icon={Github} size="sm" />
                            <span>Source</span>
                            <Icon icon={ArrowUpRight} size="sm" />
                          </a>
                        )}
                        {project.demo_url && (
                          <a
                            href={project.demo_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`${styles.projectLink} ${styles.projectLinkPrimary}`}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Icon icon={ExternalLink} size="sm" />
                            <span>Demo</span>
                            <Icon icon={ArrowUpRight} size="sm" />
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </ScrollReveal>
            );
          })
        )}
      </div>

      {!isLoading && filtered.length === 0 && (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>
            <Icon icon={FolderOpen} size="hero" />
          </div>
          <p className={styles.emptyText}>暂无相关项目</p>
          <p className={styles.emptyHint}>试试切换其他筛选条件</p>
        </div>
      )}

      {/* 项目详情弹窗 */}
      <Modal
        open={!!selectedProject}
        onClose={() => setSelectedProject(null)}
        title={selectedProject?.name}
      >
        {selectedProject && (
          <div className={styles.modalContent}>
            <p className={styles.modalDesc}>{selectedProject.description}</p>
            <div className={styles.modalTechSection}>
              <span className={styles.modalTechLabel}>技术栈</span>
              <div className={styles.modalTechList}>
                {parseTech(selectedProject.tech_stack).map((t) => (
                  <span key={t} className={styles.modalTechTag}>
                    <span 
                      className={styles.modalTechDot}
                      style={{ background: getTechColor(t) }}
                    />
                    {t}
                  </span>
                ))}
              </div>
            </div>
            <div className={styles.modalLinks}>
              {selectedProject.github_url && (
                <a href={selectedProject.github_url} target="_blank" rel="noopener noreferrer" className={styles.modalLinkBtn}>
                  <Icon icon={Github} size="md" />
                  GitHub
                  <Icon icon={ArrowUpRight} size="sm" />
                </a>
              )}
              {selectedProject.demo_url && (
                <a href={selectedProject.demo_url} target="_blank" rel="noopener noreferrer" className={`${styles.modalLinkBtn} ${styles.modalLinkBtnPrimary}`}>
                  <Icon icon={ExternalLink} size="md" />
                  Live Demo
                  <Icon icon={ArrowUpRight} size="sm" />
                </a>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* 新建项目弹窗 */}
      <Modal
        open={showCreateModal}
        onClose={handleCloseModal}
        title="新建项目"
      >
        <div className={styles.formContainer}>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>项目名称 *</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className={`${styles.formInput} ${errors.name ? styles.formInputError : ''}`}
              placeholder="输入项目名称"
            />
            {errors.name && <span className={styles.formError}>{errors.name}</span>}
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>项目描述 *</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              className={`${styles.formTextarea} ${errors.description ? styles.formInputError : ''}`}
              placeholder="描述你的项目..."
              rows={4}
            />
            {errors.description && <span className={styles.formError}>{errors.description}</span>}
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>技术栈 *</label>
            <input
              type="text"
              name="tech_stack"
              value={formData.tech_stack}
              onChange={handleInputChange}
              className={`${styles.formInput} ${errors.tech_stack ? styles.formInputError : ''}`}
              placeholder="例如：React, TypeScript, Node.js"
            />
            {errors.tech_stack && <span className={styles.formError}>{errors.tech_stack}</span>}
            <span className={styles.formHint}>多个技术用逗号分隔</span>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>项目状态</label>
            <select
              name="status"
              value={formData.status}
              onChange={handleInputChange}
              className={styles.formSelect}
            >
              <option value="进行中">进行中</option>
              <option value="已完成">已完成</option>
              <option value="已归档">已归档</option>
              <option value="长期维护">长期维护</option>
            </select>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>封面图片 URL</label>
            <input
              type="text"
              name="cover_url"
              value={formData.cover_url}
              onChange={handleInputChange}
              className={styles.formInput}
              placeholder="https://example.com/cover.jpg"
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>GitHub 地址</label>
            <input
              type="text"
              name="github_url"
              value={formData.github_url}
              onChange={handleInputChange}
              className={styles.formInput}
              placeholder="https://github.com/..."
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>演示地址</label>
            <input
              type="text"
              name="demo_url"
              value={formData.demo_url}
              onChange={handleInputChange}
              className={styles.formInput}
              placeholder="https://..."
            />
          </div>

          <div className={styles.formActions}>
            <button 
              className={styles.formCancelBtn}
              onClick={handleCloseModal}
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
                  <Icon icon={Loader2} size="md" className={styles.spinner} />
                  创建中...
                </>
              ) : (
                '创建项目'
              )}
            </button>
          </div>
        </div>
      </Modal>

      {/* 编辑项目弹窗 */}
      <Modal
        open={!!editingProject}
        onClose={handleCloseEditModal}
        title="编辑项目"
      >
        <div className={styles.formContainer}>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>项目名称 *</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className={`${styles.formInput} ${errors.name ? styles.formInputError : ''}`}
              placeholder="输入项目名称"
            />
            {errors.name && <span className={styles.formError}>{errors.name}</span>}
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>项目描述 *</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              className={`${styles.formTextarea} ${errors.description ? styles.formInputError : ''}`}
              placeholder="描述你的项目..."
              rows={4}
            />
            {errors.description && <span className={styles.formError}>{errors.description}</span>}
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>技术栈 *</label>
            <input
              type="text"
              name="tech_stack"
              value={formData.tech_stack}
              onChange={handleInputChange}
              className={`${styles.formInput} ${errors.tech_stack ? styles.formInputError : ''}`}
              placeholder="例如：React, TypeScript, Node.js"
            />
            {errors.tech_stack && <span className={styles.formError}>{errors.tech_stack}</span>}
            <span className={styles.formHint}>多个技术用逗号分隔</span>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>项目状态</label>
            <select
              name="status"
              value={formData.status}
              onChange={handleInputChange}
              className={styles.formSelect}
            >
              <option value="进行中">进行中</option>
              <option value="已完成">已完成</option>
              <option value="已归档">已归档</option>
              <option value="长期维护">长期维护</option>
            </select>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>封面图片 URL</label>
            <input
              type="text"
              name="cover_url"
              value={formData.cover_url}
              onChange={handleInputChange}
              className={styles.formInput}
              placeholder="https://example.com/cover.jpg"
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>GitHub 地址</label>
            <input
              type="text"
              name="github_url"
              value={formData.github_url}
              onChange={handleInputChange}
              className={styles.formInput}
              placeholder="https://github.com/..."
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>演示地址</label>
            <input
              type="text"
              name="demo_url"
              value={formData.demo_url}
              onChange={handleInputChange}
              className={styles.formInput}
              placeholder="https://..."
            />
          </div>

          <div className={styles.formActions}>
            <button 
              className={styles.formCancelBtn}
              onClick={handleCloseEditModal}
            >
              取消
            </button>
            <button 
              className={styles.formSubmitBtn}
              onClick={handleUpdate}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Icon icon={Loader2} size="md" className={styles.spinner} />
                  保存中...
                </>
              ) : (
                <>
                  <Icon icon={Save} size="md" />
                  保存修改
                </>
              )}
            </button>
          </div>
        </div>
      </Modal>

      <ConfirmModal
        open={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false);
          setProjectToDelete(null);
        }}
        onConfirm={confirmDelete}
        title="确认删除"
        message={`确定要删除项目"${projectToDelete?.name}"吗？此操作不可撤销。`}
        confirmText="删除"
        cancelText="取消"
      />
    </div>
  );
};

export default Projects;
