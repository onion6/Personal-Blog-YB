import styles from './Skeleton.module.css';

interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  circle?: boolean;
  className?: string;
}

const Skeleton = ({ width, height, circle, className = '' }: SkeletonProps) => {
  const style = {
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height,
    borderRadius: circle ? '50%' : 'var(--radius-sm)',
  };

  return (
    <div 
      className={`${styles.skeleton} ${className}`} 
      style={style}
    />
  );
};

export default Skeleton;
