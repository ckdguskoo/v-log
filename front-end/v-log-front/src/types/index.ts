export interface Author {
  userId: number;
  nickname: string;
}

export interface PostListResponse {
  postId: number;
  title: string;
  content: string;
  author: Author;
  tags?: string[];
  likeCount?: number;
  commentCount?: number;
  createdAt: string;
  isLiked?: boolean;
}

export interface PostResponse {
  postId: number;
  title: string;
  content: string;
  author: Author;
  tags: string[];
  likeCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface PageInfo {
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
}

// 팔로워/팔로잉 페이지 정보 타입
export interface FollowPageInfo extends PageInfo {}

export interface PageResponse<T> {
  content: T[];
  pageInfo: PageInfo;
}

export interface User {
  userId: number;
  email: string;
  nickname: string;
}

export interface UserGetResponse {
  id: number;
  email: string;
  nickname: string;
  blogId: number;
  blogTitle: string;
}

export interface LikeResponse {
  likeCount: number;
  checkLike: boolean;
}

export interface ApiResponse<T> {
  message: string;
  data: T;
}

// 댓글 관련 타입
export interface ReplyGetResponse {
  replyId: number;
  content: string;
  author: Author;
  createdAt: string;
  updatedAt: string;
}

export interface CommentWithRepliesGetResponse {
  commentId: number;
  content: string;
  author: Author;
  createdAt: string;
  updatedAt: string;
  replies: ReplyGetResponse[];
}

export interface CommentPostResponse {
  commentId: number;
  content: string;
  author: Author;
  createdAt: string;
}

export interface CommentPutResponse {
  commentId: number;
  content: string;
  author: Author;
  updatedAt: string;
}

export interface ReplyPostResponse {
  replyId: number;
  content: string;
  author: Author;
  parentCommentId: number;
  createdAt: string;
}

export interface ReplyPutResponse {
  replyId: number;
  content: string;
  author: Author;
  parentCommentId: number;
  updatedAt: string;
}

// 팔로우 관련 타입
export interface FollowerGetResponse {
  userId: number;
  nickname: string;
  isFollowing: boolean;
}

export interface FollowingGetResponse {
  userId: number;
  nickname: string;
  isFollowing: boolean;
}