import { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { User, FolderKanban, MessageCircle, BookOpen, Settings, Sun, Moon, Menu, X, LogIn, LogOut } from 'lucide-react';
import { useThemeStore } from '../../store/useThemeStore';
import { useAuthStore } from '../../store/useAuthStore';
import styles from './Navbar.module.css';

const navItems = [
  { to: '/about', label: '个人介绍', icon: User },
  { to: '/projects', label: '项目展示', icon: FolderKanban },
  { to: '/discussion', label: '技术交流', icon: MessageCircle },
  { to: '/resources', label: '资源分享', icon: BookOpen },
];

const Navbar = () => {
  const { theme, toggleTheme } = useThemeStore();
  const { isAuthenticated, user, logout } = useAuthStore();
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

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

  const handleLogout = () => {
    logout();
    navigate('/login');
    setMenuOpen(false);
  };

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
        
        {isAuthenticated ? (
          <>
            <NavLink to="/settings" className={styles.iconBtn} title="设置">
              <Settings size={18} />
            </NavLink>
            <div className={styles.userInfo}>
              <span className={styles.userName}>{user?.display_name || user?.username}</span>
              <button className={styles.iconBtn} onClick={handleLogout} title="退出登录">
                <LogOut size={18} />
              </button>
            </div>
          </>
        ) : (
          <NavLink to="/login" className={styles.loginBtn}>
            <LogIn size={16} />
            <span>登录</span>
          </NavLink>
        )}

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
          
          {isAuthenticated ? (
            <>
              <NavLink 
                to="/settings" 
                className={({ isActive }) =>
                  `${styles.navLink} ${isActive ? styles.navLinkActive : ''}`
                }
                onClick={() => setMenuOpen(false)}
              >
                <span className={styles.navLinkIcon}>
                  <Settings size={18} />
                </span>
                设置
              </NavLink>
              <div className={styles.mobileUserInfo}>
                <span className={styles.userName}>{user?.display_name || user?.username}</span>
                <button className={styles.mobileLogoutBtn} onClick={handleLogout}>
                  <LogOut size={16} />
                  <span>退出登录</span>
                </button>
              </div>
            </>
          ) : (
            <NavLink 
              to="/login" 
              className={styles.navLink}
              onClick={() => setMenuOpen(false)}
            >
              <span className={styles.navLinkIcon}>
                <LogIn size={18} />
              </span>
              登录
            </NavLink>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
