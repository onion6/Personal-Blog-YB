import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getPosts, getPostById, createPost, likePost } from '../api';
import type { Post } from '../types';

export const usePosts = () => {
  return useQuery<Post[]>({
    queryKey: ['posts'],
    queryFn: getPosts,
  });
};

export const usePost = (id: number) => {
  return useQuery<Post>({
    queryKey: ['posts', id],
    queryFn: () => getPostById(id),
    enabled: !!id,
  });
};

export const useCreatePost = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (newPost: Partial<Post>) => createPost(newPost),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });
};

export const useLikePost = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => likePost(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });
};
