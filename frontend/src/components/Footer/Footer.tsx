import { Github, Mail, Twitter, Linkedin, Globe, Heart, Rss, MessageCircle, Send, Link as LinkIcon } from 'lucide-react';
import { useSettingsStore } from '../../store/useSettingsStore';
import Icon from '../Icon/Icon';
import styles from './Footer.module.css';

const iconMap: Record<string, typeof Github> = {
  github: Github,
  mail: Mail,
  email: Mail,
  twitter: Twitter,
  linkedin: Linkedin,
  globe: Globe,
  website: Globe,
  rss: Rss,
  wechat: MessageCircle,
  telegram: Send,
};

const getIcon = (iconName: string) => {
  return iconMap[iconName.toLowerCase()] || LinkIcon;
};

const Footer = () => {
  const { socialLinks } = useSettingsStore();

  return (
    <footer className={styles.footer}>
      <div className={styles.footerContent}>
        {socialLinks.length > 0 && (
          <div className={styles.footerLinks}>
            {socialLinks.map((link, i) => {
              const IconComp = getIcon(link.icon);
              return (
                <a
                  key={i}
                  href={link.url}
                  target={link.url.startsWith('mailto:') ? undefined : '_blank'}
                  rel={link.url.startsWith('mailto:') ? undefined : 'noopener noreferrer'}
                  className={styles.footerLink}
                >
                  <Icon icon={IconComp} size="md" />
                  {link.name}
                </a>
              );
            })}
          </div>
        )}
        <div className={styles.footerCopy}>
          Made with <Icon icon={Heart} size="xs" className={styles.heartIcon} /> &copy; {new Date().getFullYear()} MyBlog
        </div>
      </div>
    </footer>
  );
};

export default Footer;
