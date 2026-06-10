import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getProfile, getPublicProfile, updateProfile } from '../api';
import { useAuthStore } from '../store/useAuthStore';
import type { Profile } from '../types';

export const usePublicProfile = () => {
  return useQuery<Profile>({
    queryKey: ['publicProfile'],
    queryFn: getPublicProfile,
  });
};

export const useProfile = (enabled = true) => {
  const userId = useAuthStore((s) => s.user?.id);
  return useQuery<Profile>({
    queryKey: ['profile', userId],
    queryFn: getProfile,
    enabled: enabled && !!userId,
  });
};

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Profile>) => updateProfile(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      queryClient.invalidateQueries({ queryKey: ['publicProfile'] });
    },
  });
};
