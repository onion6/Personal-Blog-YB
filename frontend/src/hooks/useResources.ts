import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getResources, createResource, voteResource } from '../api';
import type { Resource } from '../types';

export const useResources = () => {
  return useQuery<Resource[]>({
    queryKey: ['resources'],
    queryFn: getResources,
  });
};

export const useCreateResource = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (newResource: Partial<Resource>) => createResource(newResource),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resources'] });
    },
  });
};

export const useVoteResource = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => voteResource(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resources'] });
    },
  });
};
