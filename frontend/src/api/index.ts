import axios, { type AxiosRequestConfig } from 'axios';
import type { Project, Post, Comment, Resource, Settings, Profile, PaginatedResponse } from '../types';

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

let globalErrorHandler: ((message: string) => void) | null = null;

export function setGlobalErrorHandler(handler: (message: string) => void) {
  globalErrorHandler = handler;
}

api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
      window.location.href = '/login';
    }
    const message = error.response?.data?.error || error.message || '请求失败';
    globalErrorHandler?.(message);
    return Promise.reject(error);
  }
);

async function typedGet<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
  return api.get(url, config) as Promise<T>;
}

async function typedPost<T>(url: string, data?: unknown): Promise<T> {
  return api.post(url, data) as Promise<T>;
}

async function typedPut<T>(url: string, data?: unknown): Promise<T> {
  return api.put(url, data) as Promise<T>;
}

async function typedDelete<T>(url: string): Promise<T> {
  return api.delete(url) as Promise<T>;
}

export const getProjects = (params?: { tag?: string; page?: number; pageSize?: number }): Promise<PaginatedResponse<Project>> =>
  typedGet('/projects', { params });
export const getMyProjects = (): Promise<Project[]> => typedGet('/projects/my');
export const createProject = (data: Partial<Project>): Promise<Project> => typedPost('/projects', data);
export const updateProject = (id: number, data: Partial<Project>): Promise<Project> => typedPut(`/projects/${id}`, data);
export const deleteProject = (id: number): Promise<void> => typedDelete(`/projects/${id}`);

export const getPosts = (params?: { tag?: string; sort?: string; search?: string; page?: number; pageSize?: number }): Promise<PaginatedResponse<Post>> =>
  typedGet('/posts', { params });
export const getPostById = (id: number): Promise<Post> => typedGet(`/posts/${id}`);
export const createPost = (data: Partial<Post>): Promise<Post> => typedPost('/posts', data);
export const likePost = (id: number): Promise<Post> => typedPost(`/posts/${id}/like`);
export const createComment = (postId: number, data: Partial<Comment>): Promise<Comment> => typedPost(`/posts/${postId}/comments`, data);
export const getComments = (postId: number): Promise<Comment[]> => typedGet(`/posts/${postId}/comments`);

export const getResources = (params?: { category?: string; page?: number; pageSize?: number }): Promise<PaginatedResponse<Resource>> =>
  typedGet('/resources', { params });
export const createResource = (data: Partial<Resource>): Promise<Resource> => typedPost('/resources', data);
export const voteResource = (id: number): Promise<Resource> => typedPost(`/resources/${id}/vote`);

export const getSettings = (): Promise<Settings> => typedGet('/settings');
export const updateSettings = (data: Settings): Promise<Settings> => typedPut('/settings', data);

export const getProfile = (): Promise<Profile> => typedGet('/profile');
export const updateProfile = (data: Partial<Profile>): Promise<Profile> => typedPut('/profile', data);

export const login = (username: string, password: string): Promise<{ token: string; user: any }> =>
  typedPost('/auth/login', { username, password });

export const register = (data: { username: string; password: string; display_name?: string; invite_code: string }): Promise<{ token: string; user: any }> =>
  typedPost('/auth/register', data);

export const getCurrentUser = (): Promise<{ user: any }> => typedGet('/auth/me');

export const generateInviteCode = (): Promise<{ code: string }> => typedPost('/auth/generate-invite-code');

export default api;
