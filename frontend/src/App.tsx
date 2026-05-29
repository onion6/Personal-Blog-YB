import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useThemeStore } from './store/useThemeStore';
import { useSettingsStore } from './store/useSettingsStore';
import Navbar from './components/Navbar/Navbar';
import Footer from './components/Footer/Footer';
import Toast from './components/Toast/Toast';
import About from './pages/About/About';
import Projects from './pages/Projects/Projects';
import Discussion from './pages/Discussion/Discussion';
import Resources from './pages/Resources/Resources';
import Settings from './pages/Settings/Settings';

const fontSizeMap = { small: '14px', medium: '16px', large: '18px' };

const App = () => {
  const { theme } = useThemeStore();
  const { fontSize } = useSettingsStore();

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    document.documentElement.style.fontSize = fontSizeMap[fontSize];
  }, [fontSize]);

  return (
    <BrowserRouter>
      <Navbar />
      <main className="layout-content">
        <Routes>
          <Route path="/" element={<Navigate to="/about" replace />} />
          <Route path="/about" element={<About />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/discussion" element={<Discussion />} />
          <Route path="/resources" element={<Resources />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </main>
      <Footer />
      <Toast />
    </BrowserRouter>
  );
};

export default App;
