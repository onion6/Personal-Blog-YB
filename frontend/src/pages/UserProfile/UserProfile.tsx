import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Heart, Mail, Code, GraduationCap } from 'lucide-react';
import Icon from '../../components/Icon/Icon';
import Avatar from '../../components/Avatar/Avatar';
import HobbyIcon from '../../components/HobbyIcon/HobbyIcon';
import { getUserProfile, getUserStats, type UserProfile as UserProfileType, type UserStats } from '../../api';
import styles from './UserProfile.module.css';

const UserProfile = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfileType | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (userId) {
      fetchProfile(Number(userId));
    }
  }, [userId]);

  const fetchProfile = async (id: number) => {
    setLoading(true);
    setError('');
    try {
      const [profileData, statsData] = await Promise.all([
        getUserProfile(id),
        getUserStats(id),
      ]);
      setProfile(profileData);
      setStats(statsData);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '加载失败';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 10000) {
      return (num / 10000).toFixed(1) + 'w';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'k';
    }
    return num.toString();
  };

  if (loading) {
    return (
      <div className={styles.profilePage}>
        <div className={styles.loading}>
          <div className={styles.spinner} />
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className={styles.profilePage}>
        <div className={styles.errorState}>
          <div className={styles.errorIcon}>😕</div>
          <h2>用户不存在</h2>
          <p>{error || '找不到该用户的信息'}</p>
          <button className={styles.backButton} onClick={() => navigate('/users')}>
            返回用户列表
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.profilePage}>
      <button className={styles.backButton} onClick={() => navigate('/users')}>
        <Icon icon={ArrowLeft} size="lg" />
        返回用户列表
      </button>

      <div className={styles.profileHeader}>
        <div className={styles.headerContent}>
          <div className={styles.avatarSection}>
            <Avatar name={profile.display_name || profile.name} avatarUrl={profile.avatar_url} size={120} />
          </div>
          <div className={styles.infoSection}>
            <h1 className={styles.profileName}>{profile.display_name || profile.name}</h1>
            {profile.title && <p className={styles.profileTitle}>{profile.title}</p>}
            {profile.bio && <p className={styles.profileBio}>{profile.bio}</p>}
          </div>
        </div>

        {stats && (
          <div className={styles.statsContainer}>
            <div className={styles.statItem}>
              <span className={styles.statValue}>{formatNumber(stats.total_likes)}</span>
              <span className={styles.statLabel}>获赞</span>
            </div>
            <div className={styles.statDivider} />
            <div className={styles.statItem}>
              <span className={styles.statValue}>{formatNumber(stats.post_count)}</span>
              <span className={styles.statLabel}>文章</span>
            </div>
            <div className={styles.statDivider} />
            <div className={styles.statItem}>
              <span className={styles.statValue}>{formatNumber(stats.project_count)}</span>
              <span className={styles.statLabel}>项目</span>
            </div>
            <div className={styles.statDivider} />
            <div className={styles.statItem}>
              <span className={styles.statValue}>{formatNumber(stats.comment_count)}</span>
              <span className={styles.statLabel}>评论</span>
            </div>
          </div>
        )}
      </div>

      {profile.skills && profile.skills.length > 0 && (
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>
            <Icon icon={Code} size="xl" className={styles.sectionIcon} />
            技能特长
          </h2>
          <div className={styles.skillsGrid}>
            {profile.skills.map((skill, index) => (
              <div key={index} className={styles.skillItem}>
                <div className={styles.skillHeader}>
                  <span className={styles.skillLabel}>{skill.label}</span>
                  <span className={styles.skillValue}>{skill.value}%</span>
                </div>
                <div className={styles.skillBar}>
                  <div
                    className={styles.skillProgress}
                    style={{ width: `${skill.value}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {profile.timeline && profile.timeline.length > 0 && (
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>
            <Icon icon={GraduationCap} size="xl" className={styles.sectionIcon} />
            成长经历
          </h2>
          <div className={styles.timeline}>
            {profile.timeline.map((item, index) => (
              <div key={index} className={styles.timelineItem}>
                <div className={styles.timelineDate}>{item.date}</div>
                <h3 className={styles.timelineTitle}>{item.title}</h3>
                <p className={styles.timelineDesc}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {profile.hobbies && profile.hobbies.length > 0 && (
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>
            <Icon icon={Heart} size="xl" className={styles.sectionIcon} />
            兴趣爱好
          </h2>
          <div className={styles.hobbiesGrid}>
            {profile.hobbies.map((hobby, index) => (
              <div key={index} className={styles.hobbyItem}>
                <HobbyIcon name={hobby.icon || hobby.name} size={32} />
                <span className={styles.hobbyName}>{hobby.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {profile.contacts && profile.contacts.length > 0 && (
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>
            <Icon icon={Mail} size="xl" className={styles.sectionIcon} />
            联系方式
          </h2>
          <div className={styles.contactsGrid}>
            {profile.contacts.map((contact, index) => (
              <a
                key={index}
                href={contact.url}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.contactItem}
              >
                <span className={styles.contactIcon}>{contact.icon}</span>
                <span className={styles.contactName}>{contact.name}</span>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default UserProfile;
