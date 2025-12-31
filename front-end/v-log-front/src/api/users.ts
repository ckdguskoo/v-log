import { ApiResponse, User } from '../types';
import { apiClient } from './client';

export interface UserGetResponse {
  id: number;
  email: string;
  nickname: string;
  blogId: number;
  blogTitle: string;
}

export interface UserUpdateRequest {
  nickname?: string;
  password?: string;
}

export const usersApi = {
  getUser: async (userId: number): Promise<ApiResponse<UserGetResponse>> => {
    const response = await apiClient.get<ApiResponse<UserGetResponse>>(`/users/${userId}`);
    return response.data;
  },

  updateUser: async (userId: number, data: UserUpdateRequest): Promise<ApiResponse<UserGetResponse>> => {
    const response = await apiClient.put<ApiResponse<UserGetResponse>>(`/users/${userId}`, data);
    return response.data;
  },

  deleteUser: async (userId: number, password: string): Promise<ApiResponse<string>> => {
    const response = await apiClient.delete<ApiResponse<string>>(`/users/${userId}`, {
      data: { password },
    });
    return response.data;
  },
};

