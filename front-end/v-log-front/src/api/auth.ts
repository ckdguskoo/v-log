import { ApiResponse, UserGetResponse } from '../types';
import { apiClient } from './client';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface SignupRequest {
  email: string;
  password: string;
  nickname: string;
}

export const authApi = {
  login: async (credentials: LoginRequest): Promise<ApiResponse<UserGetResponse>> => {
    const response = await apiClient.post<ApiResponse<UserGetResponse>>('/auth/login', credentials);
    return response.data;
  },

  signup: async (data: SignupRequest): Promise<ApiResponse<UserGetResponse>> => {
    const response = await apiClient.post<ApiResponse<UserGetResponse>>('/auth/signup', data);
    return response.data;
  },

  logout: async (): Promise<ApiResponse<string>> => {
    const response = await apiClient.post<ApiResponse<string>>('/auth/logout');
    return response.data;
  },
};
