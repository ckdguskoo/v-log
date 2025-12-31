import { ApiResponse, CommentWithRepliesGetResponse, CommentPostResponse, CommentPutResponse, ReplyPostResponse, ReplyPutResponse } from '../types';
import { apiClient } from './client';

export interface CommentCreateRequest {
  content: string;
}

export interface CommentUpdateRequest {
  content: string;
}

export interface ReplyCreateRequest {
  content: string;
}

export interface ReplyUpdateRequest {
  content: string;
}

export const commentsApi = {
  /**
   * 댓글 목록 조회 (GET /api/v1/posts/{postId}/comments)
   * - 대댓글 포함
   */
  getComments: async (postId: number): Promise<ApiResponse<CommentWithRepliesGetResponse[]>> => {
    const response = await apiClient.get<ApiResponse<CommentWithRepliesGetResponse[]>>(`/posts/${postId}/comments`);
    return response.data;
  },

  /**
   * 댓글 작성 (POST /api/v1/posts/{postId}/comments)
   */
  createComment: async (postId: number, data: CommentCreateRequest): Promise<ApiResponse<CommentPostResponse>> => {
    const response = await apiClient.post<ApiResponse<CommentPostResponse>>(`/posts/${postId}/comments`, data);
    return response.data;
  },

  /**
   * 댓글 수정 (PUT /api/v1/posts/{postId}/comments/{commentId})
   */
  updateComment: async (
    postId: number,
    commentId: number,
    data: CommentUpdateRequest
  ): Promise<ApiResponse<CommentPutResponse>> => {
    const response = await apiClient.put<ApiResponse<CommentPutResponse>>(`/posts/${postId}/comments/${commentId}`, data);
    return response.data;
  },

  /**
   * 댓글 삭제 (DELETE /api/v1/posts/{postId}/comments/{commentId})
   */
  deleteComment: async (postId: number, commentId: number): Promise<ApiResponse<void>> => {
    const response = await apiClient.delete<ApiResponse<void>>(`/posts/${postId}/comments/${commentId}`);
    return response.data;
  },

  /**
   * 답글 작성 (POST /api/v1/posts/{postId}/comments/{commentId}/replies)
   */
  createReply: async (
    postId: number,
    commentId: number,
    data: ReplyCreateRequest
  ): Promise<ApiResponse<ReplyPostResponse>> => {
    const response = await apiClient.post<ApiResponse<ReplyPostResponse>>(
      `/posts/${postId}/comments/${commentId}/replies`,
      data
    );
    return response.data;
  },

  /**
   * 답글 수정 (PUT /api/v1/posts/{postId}/comments/{commentId}/replies/{replyId})
   */
  updateReply: async (
    postId: number,
    commentId: number,
    replyId: number,
    data: ReplyUpdateRequest
  ): Promise<ApiResponse<ReplyPutResponse>> => {
    const response = await apiClient.put<ApiResponse<ReplyPutResponse>>(
      `/posts/${postId}/comments/${commentId}/replies/${replyId}`,
      data
    );
    return response.data;
  },

  /**
   * 답글 삭제 (DELETE /api/v1/posts/{postId}/comments/{commentId}/replies/{replyId})
   */
  deleteReply: async (postId: number, commentId: number, replyId: number): Promise<ApiResponse<void>> => {
    const response = await apiClient.delete<ApiResponse<void>>(
      `/posts/${postId}/comments/${commentId}/replies/${replyId}`
    );
    return response.data;
  },
};

