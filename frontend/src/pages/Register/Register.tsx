import { useState, useMemo, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Lock, KeyRound, Loader2, UserPlus, Eye, EyeOff, Smile } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { register as apiRegister } from '../../api';
import Icon from '../../components/Icon/Icon';
import styles from '../../styles/auth.module.css';

export default function Register() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuthStore();
  const navigate = useNavigate();

  const passwordStrength = useMemo(() => {
    if (!password) return { level: 0, text: '' };
    let score = 0;
    if (password.length >= 6) score++;
    if (password.length >= 10) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    if (score <= 2) return { level: 1, text: '弱' };
    if (score <= 3) return { level: 2, text: '中' };
    return { level: 3, text: '强' };
  }, [password]);

  const strengthClass = passwordStrength.level === 1
    ? styles.strengthWeak
    : passwordStrength.level === 2
      ? styles.strengthMedium
      : styles.strengthStrong;

  const strengthTextClass = passwordStrength.level === 1
    ? styles.strengthTextWeak
    : passwordStrength.level === 2
      ? styles.strengthTextMedium
      : styles.strengthTextStrong;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('两次输入的密码不一致');
      return;
    }

    if (password.length < 6) {
      setError('密码长度至少为6位');
      return;
    }

    setLoading(true);

    try {
      const data = await apiRegister({
        username,
        password,
        display_name: displayName || username,
        invite_code: inviteCode,
      });
      login(data.token, data.user);
      navigate('/');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '注册失败';
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
              <Icon icon={UserPlus} size="lg" />
            </div>
            <h1 className={styles.authTitle}>创建账号</h1>
            <p className={styles.authSubtitle}>使用邀请码注册新账号</p>
          </div>

          {error && (
            <div className={styles.errorMessage}>
              <Icon icon={Lock} size="xs" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>邀请码</label>
              <div className={styles.inputWrap}>
                <span className={styles.inputIcon}>
                  <Icon icon={KeyRound} size="sm" />
                </span>
                <input
                  type="text"
                  className={styles.formInput}
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                  placeholder="请输入邀请码"
                  required
                />
              </div>
              <p className={styles.formHint}>需要邀请码才能注册，请联系管理员获取</p>
            </div>

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
              <label className={styles.formLabel}>显示名称</label>
              <div className={styles.inputWrap}>
                <span className={styles.inputIcon}>
                  <Icon icon={Smile} size="sm" />
                </span>
                <input
                  type="text"
                  className={styles.formInput}
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="显示名称（可选）"
                  autoComplete="nickname"
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
                  placeholder="请输入密码（至少6位）"
                  required
                  autoComplete="new-password"
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
              {password && (
                <>
                  <div className={styles.strengthBar}>
                    {[1, 2, 3].map((seg) => (
                      <div
                        key={seg}
                        className={`${styles.strengthSegment} ${seg <= passwordStrength.level ? strengthClass : ''}`}
                      />
                    ))}
                  </div>
                  <div className={`${styles.strengthText} ${strengthTextClass}`}>
                    密码强度：{passwordStrength.text}
                  </div>
                </>
              )}
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>确认密码</label>
              <div className={styles.inputWrap}>
                <span className={styles.inputIcon}>
                  <Icon icon={Lock} size="sm" />
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  className={styles.formInput}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="请再次输入密码"
                  required
                  autoComplete="new-password"
                />
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
                  注册中...
                </>
              ) : (
                '注册'
              )}
            </button>
          </form>

          <div className={styles.authFooter}>
            已有账号？<Link to="/login">立即登录</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
