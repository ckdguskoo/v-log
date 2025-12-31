import { ApiResponse, PageResponse, FollowerGetResponse, FollowingGetResponse } from '../types';
import { apiClient } from './client';

export interface FollowPostResponse {
  followingId: number;
  followingNickname: string;
}

export interface FollowDeleteResponse {
  unfollowedId: number;
  unfollowedNickname: string;
}

export interface GetFollowersParams {
  page?: number;
  size?: number;
}

export interface GetFollowingsParams {
  page?: number;
  size?: number;
}

export const followsApi = {
  follow: async (userId: number): Promise<ApiResponse<FollowPostResponse>> => {
    const response = await apiClient.post<ApiResponse<FollowPostResponse>>(`/users/${userId}/follows`);
    return response.data;
  },

  unfollow: async (userId: number): Promise<ApiResponse<FollowDeleteResponse>> => {
    const response = await apiClient.delete<ApiResponse<FollowDeleteResponse>>(`/users/${userId}/follows`);
    return response.data;
  },

  /**
   * 팔로워 목록 조회 (GET /api/v1/users/{userId}/followers)
   */
  getFollowers: async (userId: number, params?: GetFollowersParams): Promise<ApiResponse<PageResponse<FollowerGetResponse>>> => {
    const response = await apiClient.get<ApiResponse<PageResponse<FollowerGetResponse>>>(`/users/${userId}/followers`, {
      params,
    });
    return response.data;
  },

  /**
   * 팔로잉 목록 조회 (GET /api/v1/users/{userId}/followings)
   */
  getFollowings: async (userId: number, params?: GetFollowingsParams): Promise<ApiResponse<PageResponse<FollowingGetResponse>>> => {
    const response = await apiClient.get<ApiResponse<PageResponse<FollowingGetResponse>>>(`/users/${userId}/followings`, {
      params,
    });
    return response.data;
  },
};

