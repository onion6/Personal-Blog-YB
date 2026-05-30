import { useState, useMemo } from 'react';
import { BarChart3, Briefcase, Heart, Mail, Github, Globe, Pencil, Plus, Trash2, Save, Loader2 } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useTypewriter } from '../../hooks/useTypewriter';
import { useProfile, useUpdateProfile } from '../../hooks/useProfile';
import ScrollReveal from '../../components/ScrollReveal/ScrollReveal';
import Modal from '../../components/Modal/Modal';
import { useToastStore } from '../../store/useToastStore';
import type { Profile, ProfileSkill, ProfileTimelineItem, ProfileHobby, ProfileContact } from '../../types';
import styles from './About.module.css';

const iconMap: Record<string, LucideIcon> = { Github, Mail, Globe };

const RadarChart = ({ skills }: { skills: ProfileSkill[] }) => {
  const cx = 200, cy = 200, r = 150;
  const sides = skills.length;
  const angleStep = (2 * Math.PI) / sides;
  const levels = 5;

  const getPoint = (index: number, radius: number) => {
    const angle = angleStep * index - Math.PI / 2;
    return { x: cx + radius * Math.cos(angle), y: cy + radius * Math.sin(angle) };
  };

  const levelPaths = Array.from({ length: levels }, (_, i) => {
    const radius = (r / levels) * (i + 1);
    return Array.from({ length: sides }, (_, j) => getPoint(j, radius)).map((p) => `${p.x},${p.y}`).join(' ');
  });

  const dataPoints = skills.map((s, i) => getPoint(i, (s.value / 100) * r));
  const dataPath = dataPoints.map((p) => `${p.x},${p.y}`).join(' ');
  const labelPoints = skills.map((s, i) => getPoint(i, r + 28));

  return (
    <svg viewBox="0 0 400 400" className={styles.radarSvg}>
      {levelPaths.map((path, i) => (
        <polygon key={i} points={path} fill="none" stroke="var(--border-color)" strokeWidth="1" />
      ))}
      {Array.from({ length: sides }, (_, i) => {
        const p = getPoint(i, r);
        return <line key={i} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke="var(--border-color)" strokeWidth="1" />;
      })}
      <motion.polygon
        initial={{ scale: 0, opacity: 0 }}
        whileInView={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        points={dataPath}
        fill="rgba(59, 130, 246, 0.15)"
        stroke="var(--accent)"
        strokeWidth="2"
        className={styles.radarPolygon}
      />
      {dataPoints.map((p, i) => (
        <motion.circle key={i} cx={p.x} cy={p.y} r="4" fill="var(--accent)"
          initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} transition={{ delay: 0.5 + i * 0.1 }}
        />
      ))}
      {labelPoints.map((p, i) => (
        <text key={i} x={p.x} y={p.y} textAnchor="middle" dominantBaseline="middle" className={styles.radarLabel}>
          {skills[i].label}
        </text>
      ))}
    </svg>
  );
};

const About = () => {
  const { data: profile } = useProfile();
  const updateMutation = useUpdateProfile();
  const addToast = useToastStore((s) => s.addToast);

  const [editSection, setEditSection] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [basicForm, setBasicForm] = useState({ name: '', title: '', bio: '', avatar_url: '' });
  const [skillsForm, setSkillsForm] = useState<ProfileSkill[]>([]);
  const [timelineForm, setTimelineForm] = useState<ProfileTimelineItem[]>([]);
  const [hobbiesForm, setHobbiesForm] = useState<ProfileHobby[]>([]);
  const [contactsForm, setContactsForm] = useState<ProfileContact[]>([]);

  const p = profile!;

  const { displayText, isComplete } = useTypewriter(p.bio, 80, 800);
  const { scrollYProgress } = useScroll();
  const avatarY = useTransform(scrollYProgress, [0, 1], [0, -100]);
  const opacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);

  const initial = useMemo(() => p.name?.charAt(0)?.toUpperCase() || 'M', [p.name]);

  const openEdit = (section: string) => {
    setEditSection(section);
    switch (section) {
      case 'basic':
        setBasicForm({ name: p.name, title: p.title, bio: p.bio, avatar_url: p.avatar_url });
        break;
      case 'skills':
        setSkillsForm([...p.skills]);
        break;
      case 'timeline':
        setTimelineForm([...p.timeline]);
        break;
      case 'hobbies':
        setHobbiesForm([...p.hobbies]);
        break;
      case 'contacts':
        setContactsForm([...p.contacts]);
        break;
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      let payload: Partial<Profile> = {};
      switch (editSection) {
        case 'basic':
          payload = basicForm;
          break;
        case 'skills':
          payload = { skills: skillsForm };
          break;
        case 'timeline':
          payload = { timeline: timelineForm };
          break;
        case 'hobbies':
          payload = { hobbies: hobbiesForm };
          break;
        case 'contacts':
          payload = { contacts: contactsForm };
          break;
      }
      await updateMutation.mutateAsync(payload);
      addToast('保存成功');
      setEditSection(null);
    } catch {
      addToast('保存失败，请重试', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.aboutPage}>
      <ScrollReveal>
        <motion.section className={styles.heroSection} style={{ y: avatarY, opacity }}>
          <motion.div className={styles.avatarWrap} whileHover={{ rotate: 5, scale: 1.05 }}>
            {p.avatar_url ? (
              <img src={p.avatar_url} alt={p.name} className={styles.avatarImg} />
            ) : (
              <div className={styles.avatar}><span>{initial}</span></div>
            )}
          </motion.div>
          <h1 className={styles.nickname}>{p.name}</h1>
          <p className={styles.signature}>
            {displayText}
            {!isComplete && <span className={styles.cursor}></span>}
          </p>
          <button className={styles.editBtnInline} onClick={() => openEdit('basic')} title="编辑基本信息">
            <Pencil size={14} /> 编辑资料
          </button>
        </motion.section>
      </ScrollReveal>

      <ScrollReveal delay={100}>
        <section>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>
              <BarChart3 size={24} className={styles.sectionTitleIcon} />
              技能雷达
            </h2>
            <button className={styles.editBtn} onClick={() => openEdit('skills')}><Pencil size={14} /></button>
          </div>
          <div className={styles.radarContainer}>
            {p.skills.length > 0 ? <RadarChart skills={p.skills} /> : <p className={styles.emptyHint}>暂无技能数据，点击编辑添加</p>}
          </div>
        </section>
      </ScrollReveal>

      <ScrollReveal delay={200}>
        <section>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>
              <Briefcase size={24} className={styles.sectionTitleIcon} />
              经历
            </h2>
            <button className={styles.editBtn} onClick={() => openEdit('timeline')}><Pencil size={14} /></button>
          </div>
          {p.timeline.length > 0 ? (
            <div className={styles.timeline}>
              {p.timeline.map((item, i) => (
                <motion.div key={i} className={styles.timelineItem}
                  initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.15 }} viewport={{ once: true }}
                >
                  <div className={styles.timelineDot}></div>
                  <div className={styles.timelineDate}>{item.date}</div>
                  <div className={styles.timelineTitle}>{item.title}</div>
                  <div className={styles.timelineDesc}>{item.desc}</div>
                </motion.div>
              ))}
            </div>
          ) : (
            <p className={styles.emptyHint}>暂无经历数据，点击编辑添加</p>
          )}
        </section>
      </ScrollReveal>

      <ScrollReveal delay={300}>
        <section>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>
              <Heart size={24} className={styles.sectionTitleIcon} />
              兴趣爱好
            </h2>
            <button className={styles.editBtn} onClick={() => openEdit('hobbies')}><Pencil size={14} /></button>
          </div>
          {p.hobbies.length > 0 ? (
            <div className={styles.hobbyGrid}>
              {p.hobbies.map((hobby, i) => (
                <motion.div key={hobby.name + i} className={styles.hobbyCard}
                  whileHover={{ y: -5, backgroundColor: 'rgba(59, 130, 246, 0.05)' }}
                  initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <span className={styles.hobbyIcon} style={{ fontSize: 32 }}>{hobby.icon}</span>
                  <span className={styles.hobbyName}>{hobby.name}</span>
                </motion.div>
              ))}
            </div>
          ) : (
            <p className={styles.emptyHint}>暂无兴趣数据，点击编辑添加</p>
          )}
        </section>
      </ScrollReveal>

      <ScrollReveal delay={400}>
        <section>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>
              <Mail size={24} className={styles.sectionTitleIcon} />
              联系方式
            </h2>
            <button className={styles.editBtn} onClick={() => openEdit('contacts')}><Pencil size={14} /></button>
          </div>
          {p.contacts.length > 0 ? (
            <div className={styles.contactGrid}>
              {p.contacts.map((c) => {
                const IconComp = iconMap[c.icon] || Globe;
                return (
                  <motion.a key={c.name} href={c.url} target="_blank" rel="noopener noreferrer"
                    className={styles.contactLink} whileHover={{ x: 5 }}
                  >
                    <IconComp size={18} />
                    {c.name}
                  </motion.a>
                );
              })}
            </div>
          ) : (
            <p className={styles.emptyHint}>暂无联系方式，点击编辑添加</p>
          )}
        </section>
      </ScrollReveal>

      <Modal open={editSection === 'basic'} onClose={() => setEditSection(null)} title="编辑基本信息">
        <div className={styles.formGroup}>
          <label>昵称</label>
          <input value={basicForm.name} onChange={(e) => setBasicForm({ ...basicForm, name: e.target.value })} placeholder="你的昵称" />
        </div>
        <div className={styles.formGroup}>
          <label>头衔</label>
          <input value={basicForm.title} onChange={(e) => setBasicForm({ ...basicForm, title: e.target.value })} placeholder="例如：全栈开发工程师" />
        </div>
        <div className={styles.formGroup}>
          <label>个人简介</label>
          <textarea value={basicForm.bio} onChange={(e) => setBasicForm({ ...basicForm, bio: e.target.value })} rows={3} placeholder="一句话介绍自己" />
        </div>
        <div className={styles.formGroup}>
          <label>头像 URL</label>
          <input value={basicForm.avatar_url} onChange={(e) => setBasicForm({ ...basicForm, avatar_url: e.target.value })} placeholder="https://example.com/avatar.png" />
          {basicForm.avatar_url && (
            <div className={styles.avatarPreview}>
              <img src={basicForm.avatar_url} alt="预览" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
            </div>
          )}
        </div>
        <div className={styles.formActions}>
          <button className={styles.cancelBtn} onClick={() => setEditSection(null)}>取消</button>
          <button className={styles.saveBtn} onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 size={16} className={styles.spin} /> : <Save size={16} />}
            保存
          </button>
        </div>
      </Modal>

      <Modal open={editSection === 'skills'} onClose={() => setEditSection(null)} title="编辑技能">
        {skillsForm.map((skill, i) => (
          <div key={i} className={styles.formRow}>
            <input className={styles.formRowInput} value={skill.label} onChange={(e) => {
              const next = [...skillsForm]; next[i] = { ...next[i], label: e.target.value }; setSkillsForm(next);
            }} placeholder="技能名称" />
            <input className={styles.formRowSmall} type="number" min={0} max={100} value={skill.value} onChange={(e) => {
              const next = [...skillsForm]; next[i] = { ...next[i], value: Number(e.target.value) }; setSkillsForm(next);
            }} />
            <button className={styles.removeBtn} onClick={() => setSkillsForm(skillsForm.filter((_, j) => j !== i))}>
              <Trash2 size={14} />
            </button>
          </div>
        ))}
        <button className={styles.addBtn} onClick={() => setSkillsForm([...skillsForm, { label: '', value: 50 }])}>
          <Plus size={14} /> 添加技能
        </button>
        <div className={styles.formActions}>
          <button className={styles.cancelBtn} onClick={() => setEditSection(null)}>取消</button>
          <button className={styles.saveBtn} onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 size={16} className={styles.spin} /> : <Save size={16} />}
            保存
          </button>
        </div>
      </Modal>

      <Modal open={editSection === 'timeline'} onClose={() => setEditSection(null)} title="编辑经历">
        {timelineForm.map((item, i) => (
          <div key={i} className={styles.formCard}>
            <div className={styles.formCardHeader}>
              <span>经历 {i + 1}</span>
              <button className={styles.removeBtn} onClick={() => setTimelineForm(timelineForm.filter((_, j) => j !== i))}>
                <Trash2 size={14} />
              </button>
            </div>
            <div className={styles.formGroup}>
              <label>时间</label>
              <input value={item.date} onChange={(e) => {
                const next = [...timelineForm]; next[i] = { ...next[i], date: e.target.value }; setTimelineForm(next);
              }} placeholder="例如：2022 - 至今" />
            </div>
            <div className={styles.formGroup}>
              <label>职位/头衔</label>
              <input value={item.title} onChange={(e) => {
                const next = [...timelineForm]; next[i] = { ...next[i], title: e.target.value }; setTimelineForm(next);
              }} placeholder="例如：高级前端工程师" />
            </div>
            <div className={styles.formGroup}>
              <label>描述</label>
              <textarea value={item.desc} onChange={(e) => {
                const next = [...timelineForm]; next[i] = { ...next[i], desc: e.target.value }; setTimelineForm(next);
              }} rows={2} placeholder="工作内容或学习经历描述" />
            </div>
          </div>
        ))}
        <button className={styles.addBtn} onClick={() => setTimelineForm([...timelineForm, { date: '', title: '', desc: '' }])}>
          <Plus size={14} /> 添加经历
        </button>
        <div className={styles.formActions}>
          <button className={styles.cancelBtn} onClick={() => setEditSection(null)}>取消</button>
          <button className={styles.saveBtn} onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 size={16} className={styles.spin} /> : <Save size={16} />}
            保存
          </button>
        </div>
      </Modal>

      <Modal open={editSection === 'hobbies'} onClose={() => setEditSection(null)} title="编辑兴趣爱好">
        {hobbiesForm.map((hobby, i) => (
          <div key={i} className={styles.formRow}>
            <input className={styles.formRowEmoji} value={hobby.icon} onChange={(e) => {
              const next = [...hobbiesForm]; next[i] = { ...next[i], icon: e.target.value }; setHobbiesForm(next);
            }} placeholder="图标" />
            <input className={styles.formRowInput} value={hobby.name} onChange={(e) => {
              const next = [...hobbiesForm]; next[i] = { ...next[i], name: e.target.value }; setHobbiesForm(next);
            }} placeholder="爱好名称" />
            <button className={styles.removeBtn} onClick={() => setHobbiesForm(hobbiesForm.filter((_, j) => j !== i))}>
              <Trash2 size={14} />
            </button>
          </div>
        ))}
        <button className={styles.addBtn} onClick={() => setHobbiesForm([...hobbiesForm, { name: '', icon: '⭐' }])}>
          <Plus size={14} /> 添加爱好
        </button>
        <div className={styles.formActions}>
          <button className={styles.cancelBtn} onClick={() => setEditSection(null)}>取消</button>
          <button className={styles.saveBtn} onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 size={16} className={styles.spin} /> : <Save size={16} />}
            保存
          </button>
        </div>
      </Modal>

      <Modal open={editSection === 'contacts'} onClose={() => setEditSection(null)} title="编辑联系方式">
        {contactsForm.map((contact, i) => (
          <div key={i} className={styles.formCard}>
            <div className={styles.formCardHeader}>
              <span>联系方式 {i + 1}</span>
              <button className={styles.removeBtn} onClick={() => setContactsForm(contactsForm.filter((_, j) => j !== i))}>
                <Trash2 size={14} />
              </button>
            </div>
            <div className={styles.formGroup}>
              <label>名称</label>
              <input value={contact.name} onChange={(e) => {
                const next = [...contactsForm]; next[i] = { ...next[i], name: e.target.value }; setContactsForm(next);
              }} placeholder="例如：GitHub" />
            </div>
            <div className={styles.formGroup}>
              <label>图标</label>
              <select value={contact.icon} onChange={(e) => {
                const next = [...contactsForm]; next[i] = { ...next[i], icon: e.target.value }; setContactsForm(next);
              }}>
                <option value="Github">GitHub</option>
                <option value="Mail">Email</option>
                <option value="Globe">网站</option>
              </select>
            </div>
            <div className={styles.formGroup}>
              <label>链接</label>
              <input value={contact.url} onChange={(e) => {
                const next = [...contactsForm]; next[i] = { ...next[i], url: e.target.value }; setContactsForm(next);
              }} placeholder="https://..." />
            </div>
          </div>
        ))}
        <button className={styles.addBtn} onClick={() => setContactsForm([...contactsForm, { name: '', icon: 'Globe', url: '' }])}>
          <Plus size={14} /> 添加联系方式
        </button>
        <div className={styles.formActions}>
          <button className={styles.cancelBtn} onClick={() => setEditSection(null)}>取消</button>
          <button className={styles.saveBtn} onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 size={16} className={styles.spin} /> : <Save size={16} />}
            保存
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default About;
