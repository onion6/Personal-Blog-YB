import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getProfile, updateProfile } from '../api';
import type { Profile } from '../types';

const fallbackProfile: Profile = {
  id: 1,
  name: 'MyBlog',
  title: '全栈开发工程师 & 开源爱好者',
  bio: '热爱技术，追求极致，用代码构建美好的数字世界。',
  avatar_url: '',
  skills: [
    { label: '前端', value: 90 },
    { label: '后端', value: 75 },
    { label: '设计', value: 65 },
    { label: 'DevOps', value: 60 },
    { label: '移动端', value: 55 },
    { label: '其他', value: 70 },
  ],
  timeline: [
    { date: '2022 - 至今', title: '高级前端工程师', desc: '负责公司核心产品的前端架构设计与开发，推动技术栈升级和团队建设。' },
    { date: '2020 - 2022', title: '前端开发工程师', desc: '参与多个 To B 产品的设计与开发，积累了丰富的 React 和 TypeScript 实战经验。' },
    { date: '2016 - 2020', title: '计算机科学与技术 - 本科', desc: '在校期间参与多个开源项目，获得优秀毕业生称号。' },
  ],
  hobbies: [
    { name: '编程', icon: '💻' },
    { name: '阅读', icon: '📚' },
    { name: '音乐', icon: '🎵' },
    { name: '摄影', icon: '📷' },
    { name: '旅行', icon: '✈️' },
    { name: '游戏', icon: '🎮' },
    { name: '健身', icon: '💪' },
    { name: '咖啡', icon: '☕' },
  ],
  contacts: [
    { name: 'GitHub', icon: 'Github', url: 'https://github.com' },
    { name: 'Email', icon: 'Mail', url: 'mailto:hello@example.com' },
    { name: 'Blog', icon: 'Globe', url: '/' },
  ],
};

export const useProfile = () => {
  return useQuery<Profile>({
    queryKey: ['profile'],
    queryFn: getProfile,
    placeholderData: fallbackProfile,
  });
};

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Profile>) => updateProfile(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });
};
