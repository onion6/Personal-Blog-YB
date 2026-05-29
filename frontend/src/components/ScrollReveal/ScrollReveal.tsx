import type { ReactNode } from 'react';
import { useScrollReveal } from '../../hooks/useScrollReveal';
import styles from './ScrollReveal.module.css';

interface ScrollRevealProps {
  children: ReactNode;
  delay?: number;
}

const ScrollReveal = ({ children, delay = 0 }: ScrollRevealProps) => {
  const { ref, isVisible } = useScrollReveal(0.1);

  return (
    <div
      ref={ref}
      className={`${styles.wrapper} ${isVisible ? styles.wrapperVisible : ''}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
};

export default ScrollReveal;
