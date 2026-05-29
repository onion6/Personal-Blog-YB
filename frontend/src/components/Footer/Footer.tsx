import { Github, Mail, Heart } from 'lucide-react';
import styles from './Footer.module.css';

const Footer = () => {
  return (
    <footer className={styles.footer}>
      <div className={styles.footerContent}>
        <div className={styles.footerLinks}>
          <a href="https://github.com" target="_blank" rel="noopener noreferrer" className={styles.footerLink}>
            <Github size={16} />
            GitHub
          </a>
          <a href="mailto:hello@example.com" className={styles.footerLink}>
            <Mail size={16} />
            Email
          </a>
        </div>
        <div className={styles.footerCopy}>
          Made with <Heart size={12} style={{ display: 'inline', verticalAlign: 'middle', color: 'var(--accent)' }} /> &copy; {new Date().getFullYear()} MyBlog
        </div>
      </div>
    </footer>
  );
};

export default Footer;
