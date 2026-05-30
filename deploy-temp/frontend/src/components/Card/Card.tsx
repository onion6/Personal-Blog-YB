import type { ReactNode, HTMLAttributes } from 'react';
import styles from './Card.module.css';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  clickable?: boolean;
}

const Card = ({ children, clickable = false, className = '', ...props }: CardProps) => {
  return (
    <div
      className={`${styles.card} ${clickable ? styles.cardClickable : ''} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export default Card;
