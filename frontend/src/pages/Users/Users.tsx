import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users as UsersIcon, Search } from 'lucide-react';
import Icon from '../../components/Icon/Icon';
import Avatar from '../../components/Avatar/Avatar';
import { getUsers, type UserListItem } from '../../api';
import styles from './Users.module.css';

const Users = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState<UserListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 12;

  useEffect(() => {
    fetchUsers();
  }, [page, searchQuery]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await getUsers({ page, pageSize, search: searchQuery || undefined });
      setUsers(res.data);
      setTotal(res.total);
    } catch {
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setPage(1);
  };

  const handleUserClick = (userId: number) => {
    navigate(`/users/${userId}`);
  };

  const totalPages = Math.ceil(total / pageSize);

  // 生成分页页码（围绕当前页显示最多5页）
  const getPageNumbers = () => {
    const maxVisible = 5;
    let start = Math.max(1, page - Math.floor(maxVisible / 2));
    let end = start + maxVisible - 1;
    if (end > totalPages) {
      end = totalPages;
      start = Math.max(1, end - maxVisible + 1);
    }
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  };

  return (
    <div className={styles.usersPage}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>
          <Icon icon={UsersIcon} size="2xl" />
          社区成员
        </h1>
        <p className={styles.pageSubtitle}>发现优秀的开发者，学习他们的经验</p>
      </div>

      <div className={styles.searchBar}>
        <input
          type="text"
          className={styles.searchInput}
          placeholder="搜索用户..."
          value={searchQuery}
          onChange={handleSearch}
        />
      </div>

      {loading ? (
        <div className={styles.loading}>
          <div className={styles.spinner} />
        </div>
      ) : users.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>
            <Icon icon={UsersIcon} size="hero" />
          </div>
          <p className={styles.emptyText}>暂无用户</p>
        </div>
      ) : (
        <>
          <div className={styles.usersGrid}>
            {users.map((user) => (
              <div
                key={user.id}
                className={styles.userCard}
                onClick={() => handleUserClick(user.id)}
              >
                <Avatar name={user.display_name || user.name} avatarUrl={user.avatar_url} size={72} />
                <h3 className={styles.userName}>{user.display_name || user.name}</h3>
                {user.title && <p className={styles.userTitle}>{user.title}</p>}
                {user.bio && <p className={styles.userBio}>{user.bio}</p>}
                <div className={styles.userStats}>
                  <div className={styles.statItem}>
                    <span className={styles.statValue}>{user.post_count}</span>
                    <span className={styles.statLabel}>文章</span>
                  </div>
                  <div className={styles.statItem}>
                    <span className={styles.statValue}>{user.project_count}</span>
                    <span className={styles.statLabel}>项目</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className={styles.pagination}>
              <button
                className={styles.pageButton}
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
              >
                上一页
              </button>
              {getPageNumbers().map((pageNum) => (
                <button
                  key={pageNum}
                  className={`${styles.pageButton} ${page === pageNum ? styles.pageButtonActive : ''}`}
                  onClick={() => setPage(pageNum)}
                >
                  {pageNum}
                </button>
              ))}
              <button
                className={styles.pageButton}
                disabled={page === totalPages}
                onClick={() => setPage(p => p + 1)}
              >
                下一页
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Users;
