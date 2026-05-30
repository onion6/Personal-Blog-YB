export interface Project {
  id: number;
  user_id?: number;
  author_name?: string;
  name: string;
  description: string;
  cover_url: string;
  tech_stack: string | string[];
  github_url: string;
  demo_url: string;
  status: string;
  sort_order: number;
  created_at: string;
}

export interface Post {
  id: number;
  title: string;
  content: string;
  tags: string | string[];
  likes: number;
  comment_count?: number;
  created_at: string;
}

export interface Comment {
  id: number;
  post_id: number;
  author: string;
  content: string;
  created_at: string;
}

export interface Resource {
  id: number;
  name: string;
  description: string;
  url: string;
  category: string | string[];
  icon_url: string;
  votes: number;
  created_at: string;
}

export interface Settings {
  [key: string]: string;
}

export interface ProfileSkill {
  label: string;
  value: number;
}

export interface ProfileTimelineItem {
  date: string;
  title: string;
  desc: string;
}

export interface ProfileHobby {
  name: string;
  icon: string;
}

export interface ProfileContact {
  name: string;
  icon: string;
  url: string;
}

export interface Profile {
  id: number;
  name: string;
  title: string;
  bio: string;
  avatar_url: string;
  skills: ProfileSkill[];
  timeline: ProfileTimelineItem[];
  hobbies: ProfileHobby[];
  contacts: ProfileContact[];
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}
