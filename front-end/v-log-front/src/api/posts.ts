import { PageResponse, PostListResponse, PostResponse, ApiResponse } from '../types';
import { apiClient } from './client';

export type SearchField = 'TITLE' | 'BLOG' | 'NICKNAME';
export type TagMode = 'OR' | 'AND' | 'NAND';
export type SortField = 'CREATED_AT' | 'UPDATED_AT' | 'LIKE' | 'VIEW';

export interface GetPostsParams {
  page?: number;
  size?: number;
  blogId?: number;
  keyword?: string;
  tag?: string[];
  search?: SearchField;
  tagMode?: TagMode;
  sort?: SortField;
  asc?: boolean;
}

export interface PostCreateRequest {
  title: string;
  content: string;
  tags?: string[];
}

export interface PostUpdateRequest {
  title: string;
  content: string;
  tags?: string[];
}

export const postsApi = {
  getPosts: async (params?: GetPostsParams): Promise<PageResponse<PostListResponse>> => {
    try {
      const response = await apiClient.get<PageResponse<PostListResponse>>('/posts', {
        params,
      });
      return response.data;
    } catch (error: any) {
      // 에러를 상위로 전달
      throw error;
    }
  },

  getPost: async (postId: number): Promise<PostResponse> => {
    const response = await apiClient.get<ApiResponse<PostResponse>>(`/posts/${postId}`);
    return response.data.data;
  },

  createPost: async (data: PostCreateRequest): Promise<PostResponse> => {
    const response = await apiClient.post<ApiResponse<PostResponse>>('/posts', data);
    return response.data.data;
  },

  updatePost: async (postId: number, data: PostUpdateRequest): Promise<PostResponse> => {
    const response = await apiClient.put<ApiResponse<PostResponse>>(`/posts/${postId}`, data);
    return response.data.data;
  },

  deletePost: async (postId: number): Promise<void> => {
    await apiClient.delete(`/posts/${postId}`);
  },
};

