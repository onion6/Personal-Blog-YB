import { useState, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Lock, Loader2, LogIn, Eye, EyeOff } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { login as apiLogin } from '../../api';
import Icon from '../../components/Icon/Icon';
import styles from '../../styles/auth.module.css';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await apiLogin(username, password);
      login(data.token, data.user);
      navigate('/');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '登录失败';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.authPage}>
      <div className={styles.gridBg} />
      <div className={styles.authCard}>
        <div className={styles.accentBar} />
        <div className={styles.authBody}>
          <div className={styles.authHeader}>
            <div className={styles.authIcon}>
              <Icon icon={LogIn} size="lg" />
            </div>
            <h1 className={styles.authTitle}>欢迎回来</h1>
            <p className={styles.authSubtitle}>登录以管理您的内容</p>
          </div>

          {error && (
            <div className={styles.errorMessage}>
              <Icon icon={Lock} size="xs" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>用户名</label>
              <div className={styles.inputWrap}>
                <span className={styles.inputIcon}>
                  <Icon icon={User} size="sm" />
                </span>
                <input
                  type="text"
                  className={styles.formInput}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="请输入用户名"
                  required
                  autoComplete="username"
                />
              </div>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>密码</label>
              <div className={styles.inputWrap}>
                <span className={styles.inputIcon}>
                  <Icon icon={Lock} size="sm" />
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  className={styles.formInput}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="请输入密码"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className={styles.togglePassword}
                  onClick={() => setShowPassword(v => !v)}
                  tabIndex={-1}
                  aria-label={showPassword ? '隐藏密码' : '显示密码'}
                >
                  <Icon icon={showPassword ? EyeOff : Eye} size="sm" />
                </button>
              </div>
            </div>

            <button
              type="submit"
              className={styles.submitButton}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Icon icon={Loader2} size="md" className={styles.spinner} />
                  登录中...
                </>
              ) : (
                '登录'
              )}
            </button>
          </form>

          <div className={styles.authFooter}>
            还没有账号？<Link to="/register">立即注册</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
