import type { ReactNode, HTMLAttributes } from 'react';
import styles from './Tag.module.css';

interface TagProps extends HTMLAttributes<HTMLSpanElement> {
  children: ReactNode;
  variant?: 'default' | 'accent' | 'purple' | 'active';
  clickable?: boolean;
}

const Tag = ({ children, variant = 'default', clickable = false, className = '', ...props }: TagProps) => {
  const variantClass = variant === 'accent' ? styles.tagAccent
    : variant === 'purple' ? styles.tagPurple
    : variant === 'active' ? styles.tagActive
    : '';

  return (
    <span
      className={`${styles.tag} ${variantClass} ${clickable ? styles.tagClickable : ''} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
};

export default Tag;
