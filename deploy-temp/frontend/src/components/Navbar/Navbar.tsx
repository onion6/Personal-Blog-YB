import { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { User, FolderKanban, MessageCircle, BookOpen, Settings, Sun, Moon, Menu, X } from 'lucide-react';
import { useThemeStore } from '../../store/useThemeStore';
import styles from './Navbar.module.css';

const navItems = [
  { to: '/about', label: '个人介绍', icon: User },
  { to: '/projects', label: '项目展示', icon: FolderKanban },
  { to: '/discussion', label: '技术交流', icon: MessageCircle },
  { to: '/resources', label: '资源分享', icon: BookOpen },
];

const Navbar = () => {
  const { theme, toggleTheme } = useThemeStore();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [menuOpen]);

  return (
    <nav className={styles.navbar}>
      <NavLink to="/about" className={styles.logo} onClick={() => setMenuOpen(false)}>
        My<span className={styles.logoAccent}>Blog</span>
      </NavLink>

      <div className={styles.navLinks}>
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `${styles.navLink} ${isActive ? styles.navLinkActive : ''}`
            }
          >
            <span className={styles.navLinkIcon}>
              <item.icon size={16} />
            </span>
            {item.label}
          </NavLink>
        ))}
      </div>

      <div className={styles.navActions}>
        <button className={styles.iconBtn} onClick={toggleTheme} title="切换主题">
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>
        <NavLink to="/settings" className={styles.iconBtn}>
          <Settings size={18} />
        </NavLink>
        <button
          className={`${styles.hamburger} ${menuOpen ? styles.hamburgerOpen : ''}`}
          onClick={() => setMenuOpen(!menuOpen)}
        >
          <span className={styles.hamburgerLine}></span>
          <span className={styles.hamburgerLine}></span>
          <span className={styles.hamburgerLine}></span>
        </button>
      </div>

      <div className={`${styles.mobileOverlay} ${menuOpen ? styles.open : ''}`}>
        <div className={styles.mobileNavLinks}>
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `${styles.navLink} ${isActive ? styles.navLinkActive : ''}`
              }
              onClick={() => setMenuOpen(false)}
            >
              <span className={styles.navLinkIcon}>
                <item.icon size={18} />
              </span>
              {item.label}
            </NavLink>
          ))}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
