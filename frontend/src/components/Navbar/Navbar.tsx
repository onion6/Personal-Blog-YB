import { useState, useEffect, useMemo } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { User, FolderKanban, MessageCircle, BookOpen, Settings, Sun, Moon, Menu, X, LogIn, LogOut, Key, Users } from 'lucide-react';
import { useThemeStore } from '../../store/useThemeStore';
import { useAuthStore } from '../../store/useAuthStore';
import { getCurrentUser } from '../../api';
import InviteCodeManager from '../InviteCodeManager/InviteCodeManager';
import styles from './Navbar.module.css';

const Navbar = () => {
  const { theme, toggleTheme } = useThemeStore();
  const { isAuthenticated, user, logout, updateUser } = useAuthStore();
  const [menuOpen, setMenuOpen] = useState(false);
  const [showInviteManager, setShowInviteManager] = useState(false);
  const navigate = useNavigate();

  // 根据登录状态动态生成导航链接
  // 已登录用户：个人介绍和项目展示指向自己的主页
  // 未登录用户：指向公共页面
  const navItems = useMemo(() => [
    { to: isAuthenticated && user ? `/about/${user.id}` : '/about', label: '个人介绍', icon: User },
    { to: isAuthenticated && user ? `/projects/user/${user.id}` : '/projects', label: '项目展示', icon: FolderKanban },
    { to: '/discussion', label: '技术交流', icon: MessageCircle },
    { to: '/resources', label: '资源分享', icon: BookOpen },
    { to: '/users', label: '社区成员', icon: Users },
  ], [isAuthenticated, user]);

  useEffect(() => {
    if (isAuthenticated) {
      getCurrentUser()
        .then((data) => {
          if (data?.user) {
            updateUser(data.user);
          }
        })
        .catch(() => {});
    }
  }, [isAuthenticated, updateUser]);

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
    <>
      <nav className={styles.navbar}>
        <NavLink to={isAuthenticated && user ? `/about/${user.id}` : '/about'} className={styles.logo} onClick={() => setMenuOpen(false)}>
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
              {user?.role === 'admin' && (
                <button className={styles.iconBtn} onClick={() => setShowInviteManager(true)} title="邀请码管理">
                  <Key size={18} />
                </button>
              )}
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
      </nav>

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
      <InviteCodeManager open={showInviteManager} onClose={() => setShowInviteManager(false)} />
    </>
  );
};

export default Navbar;
