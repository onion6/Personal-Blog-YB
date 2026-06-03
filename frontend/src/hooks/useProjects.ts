import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getProjects, getUserProjects, getMyProjects, createProject, updateProject, deleteProject } from '../api';
import type { Project } from '../types';

export const useProjects = () => {
  return useQuery<Project[]>({
    queryKey: ['projects'],
    queryFn: async () => {
      const res = await getProjects();
      return res.data;
    },
  });
};

export const useUserProjects = (userId: number | undefined, enabled = true) => {
  return useQuery<Project[]>({
    queryKey: ['userProjects', userId],
    queryFn: async () => {
      const res = await getUserProjects(userId!);
      return res.data;
    },
    enabled: enabled && !!userId,
  });
};

export const useMyProjects = (enabled = true) => {
  return useQuery<Project[]>({
    queryKey: ['myProjects'],
    queryFn: getMyProjects,
    enabled,
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

export const useUpdateProject = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Project> }) => updateProject(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });
};

export const useDeleteProject = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteProject(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });
};
