import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getProfile, getPublicProfile, updateProfile } from '../api';
import type { Profile } from '../types';

export const usePublicProfile = () => {
  return useQuery<Profile>({
    queryKey: ['publicProfile'],
    queryFn: getPublicProfile,
  });
};

export const useProfile = () => {
  return useQuery<Profile>({
    queryKey: ['profile'],
    queryFn: getProfile,
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
