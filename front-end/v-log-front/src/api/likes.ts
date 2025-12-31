import { ApiResponse, LikeResponse } from '../types';
import { apiClient } from './client';

export const likesApi = {
  getLikeInfo: async (postId: number): Promise<ApiResponse<LikeResponse>> => {
    const response = await apiClient.get<ApiResponse<LikeResponse>>(`/posts/${postId}/like`);
    return response.data;
  },

  addLike: async (postId: number): Promise<ApiResponse<LikeResponse>> => {
    const response = await apiClient.post<ApiResponse<LikeResponse>>(`/posts/${postId}/like`);
    return response.data;
  },

  removeLike: async (postId: number): Promise<ApiResponse<LikeResponse>> => {
    const response = await apiClient.delete<ApiResponse<LikeResponse>>(`/posts/${postId}/like`);
    return response.data;
  },
};

