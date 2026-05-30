import { create } from 'zustand';

interface SettingsState {
  layout: 'card' | 'list';
  fontSize: 'small' | 'medium' | 'large';
  bannerText: string;
  bannerBg: string;
  socialLinks: { name: string; url: string; icon: string }[];
  setLayout: (layout: 'card' | 'list') => void;
  setFontSize: (size: 'small' | 'medium' | 'large') => void;
  setBannerText: (text: string) => void;
  setBannerBg: (color: string) => void;
  setSocialLinks: (links: { name: string; url: string; icon: string }[]) => void;
  addSocialLink: (link: { name: string; url: string; icon: string }) => void;
  removeSocialLink: (index: number) => void;
  updateSocialLink: (index: number, link: { name: string; url: string; icon: string }) => void;
}

const loadSettings = () => {
  try {
    const stored = localStorage.getItem('settings');
    if (stored) return JSON.parse(stored);
  } catch {}
  return null;
};

const defaults = {
  layout: 'card' as const,
  fontSize: 'medium' as const,
  bannerText: 'Welcome to My Blog',
  bannerBg: '#3b82f6',
  socialLinks: [
    { name: 'GitHub', url: 'https://github.com', icon: 'github' },
    { name: 'Email', url: 'mailto:hello@example.com', icon: 'mail' },
  ],
};

const stored = loadSettings();

const saveSettings = (state: Partial<SettingsState>) => {
  const { layout, fontSize, bannerText, bannerBg, socialLinks } = state as any;
  localStorage.setItem('settings', JSON.stringify({ layout, fontSize, bannerText, bannerBg, socialLinks }));
};

export const useSettingsStore = create<SettingsState>((set, get) => ({
  layout: stored?.layout ?? defaults.layout,
  fontSize: stored?.fontSize ?? defaults.fontSize,
  bannerText: stored?.bannerText ?? defaults.bannerText,
  bannerBg: stored?.bannerBg ?? defaults.bannerBg,
  socialLinks: stored?.socialLinks ?? defaults.socialLinks,
  setLayout: (layout) => {
    set({ layout });
    saveSettings({ ...get(), layout });
  },
  setFontSize: (fontSize) => {
    set({ fontSize });
    saveSettings({ ...get(), fontSize });
  },
  setBannerText: (bannerText) => {
    set({ bannerText });
    saveSettings({ ...get(), bannerText });
  },
  setBannerBg: (bannerBg) => {
    set({ bannerBg });
    saveSettings({ ...get(), bannerBg });
  },
  setSocialLinks: (socialLinks) => {
    set({ socialLinks });
    saveSettings({ ...get(), socialLinks });
  },
  addSocialLink: (link) => {
    const links = [...get().socialLinks, link];
    set({ socialLinks: links });
    saveSettings({ ...get(), socialLinks: links });
  },
  removeSocialLink: (index) => {
    const links = get().socialLinks.filter((_, i) => i !== index);
    set({ socialLinks: links });
    saveSettings({ ...get(), socialLinks: links });
  },
  updateSocialLink: (index, link) => {
    const links = get().socialLinks.map((l, i) => (i === index ? link : l));
    set({ socialLinks: links });
    saveSettings({ ...get(), socialLinks: links });
  },
}));
