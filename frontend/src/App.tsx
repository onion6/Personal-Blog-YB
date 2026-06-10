import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useEffect, useRef, ReactNode, lazy, Suspense } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useThemeStore } from './store/useThemeStore';
import { useSettingsStore } from './store/useSettingsStore';
import { useAuthStore } from './store/useAuthStore';
import { useToastStore } from './store/useToastStore';
import { setGlobalErrorHandler } from './api';
import ErrorBoundary from './components/ErrorBoundary/ErrorBoundary';
import Navbar from './components/Navbar/Navbar';
import Footer from './components/Footer/Footer';
import Toast from './components/Toast/Toast';

const About = lazy(() => import('./pages/About/About'));
const Projects = lazy(() => import('./pages/Projects/Projects'));
const Discussion = lazy(() => import('./pages/Discussion/Discussion'));
const Resources = lazy(() => import('./pages/Resources/Resources'));
const Settings = lazy(() => import('./pages/Settings/Settings'));
const Login = lazy(() => import('./pages/Login/Login'));
const Register = lazy(() => import('./pages/Register/Register'));
const Users = lazy(() => import('./pages/Users/Users'));
const UserProfile = lazy(() => import('./pages/UserProfile/UserProfile'));
const NotFound = lazy(() => import('./pages/NotFound/NotFound'));

const fontSizeMap = { small: '14px', medium: '16px', large: '18px' };

function Loading() {
  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '50vh',
      fontSize: '1.2rem',
      color: 'var(--text-secondary)'
    }}>
      加载中...
    </div>
  );
}

function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}

function PublicRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuthStore();

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

const App = () => {
  const { theme } = useThemeStore();
  const { fontSize } = useSettingsStore();
  const { loadFromStorage, token, user } = useAuthStore();
  const { addToast } = useToastStore();
  const queryClient = useQueryClient();
  const prevUserIdRef = useRef<number | null | undefined>(undefined);

  useEffect(() => {
    loadFromStorage();
  }, [loadFromStorage]);

  // 用户切换时（登录/登出/换号）清空所有 React Query 缓存
  useEffect(() => {
    const currentUserId = user?.id ?? null;
    // 跳过首次渲染（首次加载时 prevUserIdRef 为 undefined）
    if (prevUserIdRef.current !== undefined && prevUserIdRef.current !== currentUserId) {
      queryClient.clear();
    }
    prevUserIdRef.current = currentUserId;
  }, [user?.id, queryClient]);

  useEffect(() => {
    setGlobalErrorHandler((message) => addToast(message, 'error'));
  }, [addToast]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    document.documentElement.style.fontSize = fontSizeMap[fontSize];
  }, [fontSize]);

  return (
    <BrowserRouter>
      <ErrorBoundary>
        <Navbar />
        <main className="layout-content">
          <Suspense fallback={<Loading />}>
            <Routes>
              <Route path="/" element={<Navigate to="/about" replace />} />
              <Route path="/about" element={<About />} />
              <Route path="/about/:userId" element={<About />} />
              <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
              <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
              <Route path="/projects" element={<Projects />} />
              <Route path="/projects/user/:userId" element={<Projects />} />
              <Route path="/discussion" element={<Discussion />} />
              <Route path="/resources" element={<Resources />} />
              <Route path="/users" element={<Users />} />
              <Route path="/users/:userId" element={<UserProfile />} />
              <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </main>
        <Footer />
        <Toast />
      </ErrorBoundary>
    </BrowserRouter>
  );
};

export default App;