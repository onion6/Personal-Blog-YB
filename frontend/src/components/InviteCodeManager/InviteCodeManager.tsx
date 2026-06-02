import { useState, useEffect } from 'react';
import { Copy, Check, Plus, RefreshCw } from 'lucide-react';
import { getInviteCodes, generateInviteCode, type InviteCodeInfo } from '../../api';
import { useToastStore } from '../../store/useToastStore';
import styles from './InviteCodeManager.module.css';

interface Props {
  open: boolean;
  onClose: () => void;
}

const InviteCodeManager = ({ open, onClose }: Props) => {
  const { addToast } = useToastStore();
  const [codes, setCodes] = useState<InviteCodeInfo[]>([]);
  const [stats, setStats] = useState({ total: 0, used: 0, unused: 0 });
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const fetchCodes = async () => {
    setLoading(true);
    try {
      const data = await getInviteCodes();
      setCodes(data.list);
      setStats({ total: data.total, used: data.used, unused: data.unused });
    } catch {
      addToast('获取邀请码失败', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) fetchCodes();
  }, [open]);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const { code } = await generateInviteCode();
      addToast(`邀请码已生成：${code}`, 'success');
      fetchCodes();
    } catch {
      addToast('生成失败，请稍后重试', 'error');
    } finally {
      setGenerating(false);
    }
  };

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    addToast('已复制到剪贴板', 'success');
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <div className={`${styles.overlay} ${open ? styles.open : ''}`} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2>邀请码管理</h2>
          <button className={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        <div className={styles.stats}>
          <div className={styles.statItem}>
            <span className={styles.statValue}>{stats.total}</span>
            <span className={styles.statLabel}>总计</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statValue}>{stats.unused}</span>
            <span className={styles.statLabel}>可用</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statValue}>{stats.used}</span>
            <span className={styles.statLabel}>已使用</span>
          </div>
        </div>

        <button
          className={styles.generateBtn}
          onClick={handleGenerate}
          disabled={generating}
        >
          {generating ? <RefreshCw size={16} className={styles.spinning} /> : <Plus size={16} />}
          {generating ? '生成中...' : '生成新邀请码'}
        </button>

        <div className={styles.list}>
          {loading ? (
            <div className={styles.empty}>加载中...</div>
          ) : codes.length === 0 ? (
            <div className={styles.empty}>暂无邀请码</div>
          ) : (
            codes.map((item) => (
              <div key={item.code} className={styles.codeItem}>
                <div className={styles.codeInfo}>
                  <span className={styles.codeText}>{item.code}</span>
                  <span className={`${styles.badge} ${item.is_used ? styles.used : styles.available}`}>
                    {item.is_used ? '已使用' : '可用'}
                  </span>
                </div>
                <button
                  className={styles.copyBtn}
                  onClick={() => handleCopy(item.code)}
                  title="复制"
                >
                  {copiedCode === item.code ? <Check size={14} /> : <Copy size={14} />}
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default InviteCodeManager;
