import { ApiResponse } from '../types';
import { apiClient } from './client';

export interface TagGetResponse {
  tagId: number;
  title: string;
}

export const tagsApi = {
  getTag: async (title: string): Promise<ApiResponse<TagGetResponse>> => {
    const response = await apiClient.get<ApiResponse<TagGetResponse>>(`/tags/${encodeURIComponent(title)}`);
    return response.data;
  },
};

