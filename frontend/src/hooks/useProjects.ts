import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getProjects, createProject } from '../api';
import type { Project } from '../types';

const mockProjects: Project[] = [
  { id: 1, name: '个人博客系统', description: '基于 React + Node.js 的全栈博客项目', cover_url: '', tech_stack: '["React","TypeScript","Node.js","SQLite"]', github_url: '', demo_url: '', status: '进行中', sort_order: 1, created_at: '2024-01-15' },
  { id: 2, name: 'Vue 管理后台', description: '企业级管理后台模板', cover_url: '', tech_stack: '["Vue 3","Element Plus","Vite"]', github_url: '', demo_url: '', status: '已完成', sort_order: 2, created_at: '2023-11-20' },
];

export const useProjects = () => {
  return useQuery<Project[]>({
    queryKey: ['projects'],
    queryFn: getProjects,
    placeholderData: mockProjects,
  });
};

export const useCreateProject = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (newProject: Partial<Project>) => createProject(newProject),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });
};
