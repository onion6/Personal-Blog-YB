import { CheckCircle, XCircle, Info, AlertTriangle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToastStore, type ToastType } from '../../store/useToastStore';
import styles from './Toast.module.css';

const icons: Record<ToastType, any> = {
  success: CheckCircle,
  error: XCircle,
  info: Info,
  warning: AlertTriangle,
};

const Toast = () => {
  const { toasts, removeToast } = useToastStore();

  return (
    <div className={styles.toastContainer}>
      <AnimatePresence>
        {toasts.map((toast) => {
          const Icon = icons[toast.type];
          return (
            <motion.div
              key={toast.id}
              layout
              initial={{ opacity: 0, y: 50, scale: 0.3 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.2 } }}
              className={`${styles.toast} ${styles[toast.type]}`}
            >
              <Icon size={18} className={styles.icon} />
              <span className={styles.message}>{toast.message}</span>
              <button className={styles.closeBtn} onClick={() => removeToast(toast.id)}>
                <X size={14} />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};

export default Toast;
