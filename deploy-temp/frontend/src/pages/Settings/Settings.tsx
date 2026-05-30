import { useState } from 'react';
import { Sun, Moon, LayoutGrid, List, Type, Plus, Trash2, Check } from 'lucide-react';
import { useThemeStore } from '../../store/useThemeStore';
import { useSettingsStore } from '../../store/useSettingsStore';
import { useToastStore } from '../../store/useToastStore';
import Card from '../../components/Card/Card';
import ScrollReveal from '../../components/ScrollReveal/ScrollReveal';
import styles from './Settings.module.css';

const Settings = () => {
  const { theme, setTheme } = useThemeStore();
  const { addToast } = useToastStore();
  const {
    layout, fontSize, bannerText, bannerBg, socialLinks,
    setLayout, setFontSize, setBannerText, setBannerBg,
    addSocialLink, removeSocialLink, updateSocialLink,
  } = useSettingsStore();

  const handleSave = () => {
    addToast('所有设置已保存', 'success');
  };

  return (
    <div className={styles.settingsPage}>
      <ScrollReveal>
        <div className={styles.pageHeader}>
          <h1 className={styles.pageTitle}>博客设置</h1>
          <p className={styles.pageDesc}>自定义你的博客体验</p>
        </div>
      </ScrollReveal>

      <ScrollReveal delay={80}>
        <Card className={styles.settingSection}>
          <div className={styles.settingLabel}>主题</div>
          <div className={styles.settingDesc}>选择你喜欢的界面主题</div>
          <div className={styles.optionGroup}>
            <button
              className={`${styles.optionBtn} ${theme === 'dark' ? styles.optionBtnActive : ''}`}
              onClick={() => setTheme('dark')}
            >
              <Moon size={14} style={{ marginRight: 6, display: 'inline', verticalAlign: 'middle' }} />
              暗色
            </button>
            <button
              className={`${styles.optionBtn} ${theme === 'light' ? styles.optionBtnActive : ''}`}
              onClick={() => setTheme('light')}
            >
              <Sun size={14} style={{ marginRight: 6, display: 'inline', verticalAlign: 'middle' }} />
              亮色
            </button>
          </div>
        </Card>
      </ScrollReveal>

      <ScrollReveal delay={120}>
        <Card className={styles.settingSection}>
          <div className={styles.settingLabel}>布局偏好</div>
          <div className={styles.settingDesc}>选择内容展示方式</div>
          <div className={styles.optionGroup}>
            <button
              className={`${styles.optionBtn} ${layout === 'card' ? styles.optionBtnActive : ''}`}
              onClick={() => setLayout('card')}
            >
              <LayoutGrid size={14} style={{ marginRight: 6, display: 'inline', verticalAlign: 'middle' }} />
              卡片式
            </button>
            <button
              className={`${styles.optionBtn} ${layout === 'list' ? styles.optionBtnActive : ''}`}
              onClick={() => setLayout('list')}
            >
              <List size={14} style={{ marginRight: 6, display: 'inline', verticalAlign: 'middle' }} />
              列表式
            </button>
          </div>
        </Card>
      </ScrollReveal>

      <ScrollReveal delay={160}>
        <Card className={styles.settingSection}>
          <div className={styles.settingLabel}>字体大小</div>
          <div className={styles.settingDesc}>调整全局文字大小</div>
          <div className={styles.optionGroup}>
            {(['small', 'medium', 'large'] as const).map((size) => (
              <button
                key={size}
                className={`${styles.optionBtn} ${fontSize === size ? styles.optionBtnActive : ''}`}
                onClick={() => setFontSize(size)}
              >
                <Type size={14} style={{ marginRight: 6, display: 'inline', verticalAlign: 'middle' }} />
                {size === 'small' ? '小' : size === 'medium' ? '中' : '大'}
              </button>
            ))}
          </div>
        </Card>
      </ScrollReveal>

      <ScrollReveal delay={200}>
        <Card className={styles.settingSection}>
          <div className={styles.settingLabel}>首页 Banner</div>
          <div className={styles.settingDesc}>自定义首页横幅文字和背景色</div>
          <input
            className={styles.bannerInput}
            placeholder="Banner 文字"
            value={bannerText}
            onChange={(e) => setBannerText(e.target.value)}
          />
          <div className={styles.colorInput}>
            <input
              type="color"
              className={styles.colorPicker}
              value={bannerBg}
              onChange={(e) => setBannerBg(e.target.value)}
            />
            <span className={styles.colorValue}>{bannerBg}</span>
          </div>
          <div className={styles.bannerPreview} style={{ background: bannerBg }}>
            {bannerText || '预览文字'}
          </div>
        </Card>
      </ScrollReveal>

      <ScrollReveal delay={240}>
        <Card className={styles.settingSection}>
          <div className={styles.settingLabel}>社交链接管理</div>
          <div className={styles.settingDesc}>添加或编辑你的社交平台链接</div>
          <div className={styles.socialLinksList}>
            {socialLinks.map((link, index) => (
              <div key={index} className={styles.socialLinkItem}>
                <input
                  className={styles.socialLinkInput}
                  placeholder="名称"
                  value={link.name}
                  onChange={(e) => updateSocialLink(index, { ...link, name: e.target.value })}
                />
                <span className={styles.socialLinkDivider}></span>
                <input
                  className={styles.socialLinkInput}
                  placeholder="URL"
                  value={link.url}
                  onChange={(e) => updateSocialLink(index, { ...link, url: e.target.value })}
                />
                <button className={styles.socialLinkDelete} onClick={() => removeSocialLink(index)}>
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
          <button
            className={styles.addLinkBtn}
            onClick={() => addSocialLink({ name: '', url: '', icon: 'link' })}
          >
            <Plus size={14} style={{ marginRight: 6, display: 'inline', verticalAlign: 'middle' }} />
            添加链接
          </button>
        </Card>
      </ScrollReveal>

      <ScrollReveal delay={280}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <button className={styles.saveBtn} onClick={handleSave}>
            保存设置
          </button>
        </div>
      </ScrollReveal>
    </div>
  );
};

export default Settings;
