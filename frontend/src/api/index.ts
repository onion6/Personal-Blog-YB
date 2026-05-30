import axios from 'axios';
import type { Project, Post, Comment, Resource, Settings, Profile } from '../types';

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
      window.location.href = '/login';
    }
    console.error('API Error:', error);
    return Promise.reject(error);
  }
);

export const getProjects = (): Promise<Project[]> => api.get('/projects');
export const getMyProjects = (): Promise<Project[]> => api.get('/projects/my');
export const createProject = (data: Partial<Project>): Promise<Project> => api.post('/projects', data);
export const updateProject = (id: number, data: Partial<Project>): Promise<Project> => api.put(`/projects/${id}`, data);
export const deleteProject = (id: number): Promise<void> => api.delete(`/projects/${id}`);

export const getPosts = (): Promise<Post[]> => api.get('/posts');
export const getPostById = (id: number): Promise<Post> => api.get(`/posts/${id}`);
export const createPost = (data: Partial<Post>): Promise<Post> => api.post('/posts', data);
export const likePost = (id: number): Promise<Post> => api.post(`/posts/${id}/like`);
export const createComment = (postId: number, data: Partial<Comment>): Promise<Comment> => api.post(`/posts/${postId}/comments`, data);
export const getComments = (postId: number): Promise<Comment[]> => api.get(`/posts/${postId}/comments`);

export const getResources = (): Promise<Resource[]> => api.get('/resources');
export const createResource = (data: Partial<Resource>): Promise<Resource> => api.post('/resources', data);
export const voteResource = (id: number): Promise<Resource> => api.post(`/resources/${id}/vote`);

export const getSettings = (): Promise<Settings> => api.get('/settings');
export const updateSettings = (data: Settings): Promise<Settings> => api.put('/settings', data);

export const getProfile = (): Promise<Profile> => api.get('/profile');
export const updateProfile = (data: Partial<Profile>): Promise<Profile> => api.put('/profile', data);

export const login = (username: string, password: string): Promise<{ token: string; user: any }> => 
  api.post('/auth/login', { username, password });

export const register = (data: { username: string; password: string; display_name?: string; invite_code: string }): Promise<{ token: string; user: any }> => 
  api.post('/auth/register', data);

export const getCurrentUser = (): Promise<{ user: any }> => api.get('/auth/me');

export const generateInviteCode = (): Promise<{ code: string }> => api.post('/auth/generate-invite-code');

export default api;
