import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Home, Search, FileQuestion } from 'lucide-react';
import Icon from '../../components/Icon/Icon';
import styles from './NotFound.module.css';

const NotFound = () => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div className={styles.notFoundPage}>
      <div className={styles.gridBg} />
      <div className={styles.content}>
        <div className={styles.errorCode}>
          <span className={styles.four}>4</span>
          <span className={styles.zero}>0</span>
          <span className={styles.four}>4</span>
        </div>

        <div className={styles.iconWrap}>
          <Icon icon={FileQuestion} size="hero" />
        </div>

        <h1 className={styles.title}>页面走丢了</h1>
        <p className={styles.desc}>
          你访问的路径 <code className={styles.path}>{location.pathname}</code> 不存在
        </p>

        <div className={styles.actions}>
          <button className={styles.primaryBtn} onClick={() => navigate(-1)}>
            <Icon icon={ArrowLeft} size="md" />
            返回上一页
          </button>
          <button className={styles.secondaryBtn} onClick={() => navigate('/')}>
            <Icon icon={Home} size="md" />
            回到首页
          </button>
        </div>

        <div className={styles.suggestions}>
          <p className={styles.suggestionsTitle}>
            <Icon icon={Search} size="sm" />
            你可能想去
          </p>
          <div className={styles.suggestionLinks}>
            <button className={styles.suggestionLink} onClick={() => navigate('/about')}>
              关于我
            </button>
            <button className={styles.suggestionLink} onClick={() => navigate('/projects')}>
              项目展示
            </button>
            <button className={styles.suggestionLink} onClick={() => navigate('/discussion')}>
              技术交流
            </button>
            <button className={styles.suggestionLink} onClick={() => navigate('/resources')}>
              资源分享
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
