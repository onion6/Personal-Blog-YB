import { useState } from 'react';
import { Github, ExternalLink, FolderKanban, Plus, Loader2 } from 'lucide-react';
import { useProjects, useCreateProject } from '../../hooks/useProjects';
import { useSettingsStore } from '../../store/useSettingsStore';
import { useToastStore } from '../../store/useToastStore';
import type { Project } from '../../types';
import Card from '../../components/Card/Card';
import Tag from '../../components/Tag/Tag';
import Modal from '../../components/Modal/Modal';
import Skeleton from '../../components/Skeleton/Skeleton';
import ScrollReveal from '../../components/ScrollReveal/ScrollReveal';
import styles from './Projects.module.css';

const filterTags = ['全部', 'React', 'Vue', 'Node', 'Python', '全栈'];

const Projects = () => {
  const { layout } = useSettingsStore();
  const { addToast } = useToastStore();
  const { data: projects = [], isLoading } = useProjects();
  const createProjectMutation = useCreateProject();
  const [activeFilter, setActiveFilter] = useState('全部');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
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

  return (
    <div className={styles.projectsPage}>
      <ScrollReveal>
        <div className={styles.pageHeader}>
          <div className={styles.headerTop}>
            <div>
              <h1 className={styles.pageTitle}>项目展示</h1>
              <p className={styles.pageDesc}>我参与开发的一些开源和个人项目</p>
            </div>
            <button 
              className={styles.createBtn}
              onClick={() => setShowCreateModal(true)}
            >
              <Plus size={18} />
              新建项目
            </button>
          </div>
        </div>
      </ScrollReveal>

      <ScrollReveal delay={100}>
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

      <div className={`${styles.projectGrid} ${layout === 'list' ? styles.projectList : ''}`}>
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className={styles.projectCard}>
              <Skeleton height={180} />
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
          filtered.map((project, i) => (
            <ScrollReveal key={project.id} delay={i * 80}>
              <Card
                clickable
                className={styles.projectCard}
                onClick={() => setSelectedProject(project)}
              >
                <div className={styles.projectCover}>
                  {project.status && (
                    <div className={`${styles.statusBadge} ${styles[`status${project.status}`]}`}>
                      {project.status}
                    </div>
                  )}
                  {project.cover_url ? (
                    <img src={project.cover_url} alt={project.name} />
                  ) : (
                    <FolderKanban size={40} />
                  )}
                </div>
                <div className={styles.projectInfo}>
                  <h3 className={styles.projectName}>{project.name}</h3>
                  <p className={styles.projectDesc}>{project.description}</p>
                  <div className={styles.projectTags}>
                    {parseTech(project.tech_stack).map((t) => (
                      <Tag key={t} variant="accent">{t}</Tag>
                    ))}
                  </div>
                  <div className={styles.projectLinks}>
                    {project.github_url && (
                      <a
                        href={project.github_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.projectLink}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Github size={14} />
                        GitHub
                      </a>
                    )}
                    {project.demo_url && (
                      <a
                        href={project.demo_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.projectLink}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <ExternalLink size={14} />
                        Demo
                      </a>
                    )}
                  </div>
                </div>
              </Card>
            </ScrollReveal>
          ))
        )}
      </div>

      {!isLoading && filtered.length === 0 && (
        <div className={styles.emptyState}>暂无相关项目</div>
      )}

      <Modal
        open={!!selectedProject}
        onClose={() => setSelectedProject(null)}
        title={selectedProject?.name}
      >
        {selectedProject && (
          <div className={styles.modalContent}>
            <p className={styles.modalDesc}>{selectedProject.description}</p>
            <div className={styles.modalTags}>
              {parseTech(selectedProject.tech_stack).map((t) => (
                <Tag key={t} variant="accent">{t}</Tag>
              ))}
            </div>
            <div className={styles.modalLinks}>
              {selectedProject.github_url && (
                <a href={selectedProject.github_url} target="_blank" rel="noopener noreferrer" className={styles.modalLinkBtn}>
                  <Github size={16} />
                  GitHub
                </a>
              )}
              {selectedProject.demo_url && (
                <a href={selectedProject.demo_url} target="_blank" rel="noopener noreferrer" className={styles.modalLinkBtn}>
                  <ExternalLink size={16} />
                  Live Demo
                </a>
              )}
            </div>
          </div>
        )}
      </Modal>

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
                  <Loader2 size={16} className={styles.spinner} />
                  创建中...
                </>
              ) : (
                '创建项目'
              )}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Projects;
