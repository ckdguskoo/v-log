import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { postsApi } from '../api/posts';
import { likesApi } from '../api/likes';
import { followsApi } from '../api/follows';
import { commentsApi } from '../api/comments';
import { PostResponse, CommentWithRepliesGetResponse } from '../types';
import { useAuth } from '../context/AuthContext';
import { formatDateKorean, formatDate } from '../utils/date';
import { checkFollowStatus } from '../utils/follow';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { handleApiError } from '../api/client';
import { usePostLike } from '../hooks/usePostLike';

const PostDetailPage = () => {
  const { postId } = useParams<{ postId: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const [post, setPost] = useState<PostResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState<boolean>(false);
  const [followLoading, setFollowLoading] = useState(false);
  
  // 좋아요 훅 사용
  const {
    likeCount,
    isLiked,
    likeLoading,
    handleLike,
    setLikeCount,
    setIsLiked,
  } = usePostLike(
    postId ? Number(postId) : undefined,
    0,
    false,
    isAuthenticated
  );
  const [comments, setComments] = useState<CommentWithRepliesGetResponse[]>([]);
  const [commentLoading, setCommentLoading] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
  const [editingReplyId, setEditingReplyId] = useState<{ commentId: number; replyId: number } | null>(null);
  const [replyInputs, setReplyInputs] = useState<{ [commentId: number]: string }>({});
  const [editingCommentContent, setEditingCommentContent] = useState<{ [commentId: number]: string }>({});
  const [editingReplyContent, setEditingReplyContent] = useState<{ [commentId: number]: { [replyId: number]: string } }>({});

  useEffect(() => {
    const fetchPost = async () => {
      if (!postId) return;

      try {
        setLoading(true);
        const postData = await postsApi.getPost(Number(postId));
        setPost(postData);

        // 좋아요 정보 API 호출 (비회원 상태에서도 최신 좋아요 수 가져오기)
        try {
          const likeData = await likesApi.getLikeInfo(Number(postId));
          setLikeCount(likeData.data.likeCount);
          // 로그인 상태일 때만 좋아요 여부 설정
          if (isAuthenticated) {
            setIsLiked(likeData.data.checkLike);
          } else {
            setIsLiked(false);
          }
        } catch (error: unknown) {
          // 좋아요 정보 조회 실패 시 게시글 정보의 likeCount 사용
          // 비회원 상태에서 500 에러가 발생할 수 있으므로 조용히 처리
          const apiError = handleApiError(error);
          if (apiError.status !== 500) {
            console.error('좋아요 정보 조회 실패:', apiError);
          }
          // 게시글 상세 정보에 likeCount가 있으면 사용, 없으면 0
          setLikeCount(postData.likeCount ?? 0);
          setIsLiked(false);
        }
      } catch (error: unknown) {
        const apiError = handleApiError(error);
        console.error('게시글을 불러오는데 실패했습니다:', apiError);
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [postId, isAuthenticated]);

  // 댓글 목록 조회
  useEffect(() => {
    const fetchComments = async () => {
      if (!postId) return;

      try {
        setCommentLoading(true);
        const response = await commentsApi.getComments(Number(postId));
        setComments(response.data);
      } catch (error: unknown) {
        const apiError = handleApiError(error);
        console.error('댓글을 불러오는데 실패했습니다:', apiError);
      } finally {
        setCommentLoading(false);
      }
    };

    fetchComments();
  }, [postId]);

  // 팔로우 상태 확인 (게시글 작성자가 본인이 아닐 때만)
  useEffect(() => {
    const checkStatus = async () => {
      if (!post || !user || !isAuthenticated) return;
      const authorId = post.author.userId;

      // 자기 자신을 팔로우할 수 없음
      if (user.userId === authorId) {
        return;
      }

      const following = await checkFollowStatus(authorId);
      setIsFollowing(following);
    };

    if (post && user && isAuthenticated) {
      checkStatus();
    }
  }, [post, user, isAuthenticated]);

  const handleLikeClick = useCallback(async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    await handleLike();
  }, [isAuthenticated, navigate, handleLike]);

  const handleFollow = useCallback(async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    if (!post || !user) return;
    const authorId = post.author.userId;

    // 자기 자신을 팔로우할 수 없음
    if (user.userId === authorId) return;

    setFollowLoading(true);
    try {
      if (isFollowing) {
        await followsApi.unfollow(authorId);
        setIsFollowing(false);
      } else {
        try {
          await followsApi.follow(authorId);
          setIsFollowing(true);
        } catch (err: any) {
          // 409 Conflict는 이미 팔로우 중인 경우
          if (err.response?.status === 409) {
            setIsFollowing(true);
          } else {
            throw err;
          }
        }
      }
    } catch (err: unknown) {
      const apiError = handleApiError(err);
      // 404 Not Found는 팔로우하지 않은 상태에서 언팔로우 시도한 경우
      if (apiError.status === 404 && isFollowing) {
        setIsFollowing(false);
      } else {
        alert(apiError.message);
      }
    } finally {
      setFollowLoading(false);
    }
  }, [isAuthenticated, navigate, post, user, isFollowing]);

  // 댓글 작성
  const handleCreateComment = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    if (!postId || !newComment.trim()) return;

    try {
      const response = await commentsApi.createComment(Number(postId), { content: newComment.trim() });
      // replies 속성이 없을 수 있으므로 빈 배열로 초기화
      // updatedAt이 없을 경우 createdAt과 동일하게 설정
      setComments((prev) => [...prev, { ...response.data, replies: [], updatedAt: response.data.createdAt }]);
      setNewComment('');
    } catch (error: unknown) {
      const apiError = handleApiError(error);
      alert(apiError.message);
    }
  };

  // 댓글 수정
  const handleUpdateComment = async (commentId: number, content: string) => {
    if (!postId || !content.trim()) return;

    try {
      const response = await commentsApi.updateComment(Number(postId), commentId, { content: content.trim() });
      // API 응답 구조: ApiResponse<CommentPutResponse>이므로 response.data가 CommentPutResponse
      const updatedComment = response.data;
      if (updatedComment && updatedComment.content) {
        setComments((prev) =>
          prev.map((comment) =>
            comment.commentId === commentId
              ? { ...comment, content: updatedComment.content, updatedAt: updatedComment.updatedAt }
              : comment
          )
        );
      } else {
        console.error('댓글 수정 응답 구조 오류:', response);
        alert('댓글 수정에 실패했습니다.');
      }
      setEditingCommentId(null);
    } catch (error: unknown) {
      const apiError = handleApiError(error);
      alert(apiError.message);
    }
  };

  // 댓글 삭제
  const handleDeleteComment = async (commentId: number) => {
    if (!postId) return;
    if (!confirm('정말 삭제하시겠습니까?')) return;

    try {
      await commentsApi.deleteComment(Number(postId), commentId);
      setComments((prev) => prev.filter((comment) => comment.commentId !== commentId));
    } catch (error: unknown) {
      const apiError = handleApiError(error);
      alert(apiError.message);
    }
  };

  // 답글 작성
  const handleCreateReply = async (commentId: number) => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    if (!postId || !replyInputs[commentId]?.trim()) return;

    try {
      const response = await commentsApi.createReply(Number(postId), commentId, {
        content: replyInputs[commentId].trim(),
      });
      setComments((prev) =>
        prev.map((comment) =>
          comment.commentId === commentId
            ? { 
                ...comment, 
                replies: [...(comment.replies || []), { ...response.data, updatedAt: response.data.createdAt }] 
              }
            : comment
        )
      );
      // 답글 입력창 닫기
      setReplyInputs((prev) => {
        const newInputs = { ...prev };
        delete newInputs[commentId];
        return newInputs;
      });
    } catch (error: unknown) {
      const apiError = handleApiError(error);
      alert(apiError.message);
    }
  };

  // 답글 수정
  const handleUpdateReply = async (commentId: number, replyId: number, content: string) => {
    if (!postId || !content.trim()) return;

    try {
      const response = await commentsApi.updateReply(Number(postId), commentId, replyId, {
        content: content.trim(),
      });
      // API 응답 구조: ApiResponse<ReplyPutResponse>이므로 response.data가 ReplyPutResponse
      const updatedReply = response.data;
      if (updatedReply && updatedReply.content) {
        setComments((prev) =>
          prev.map((comment) =>
            comment.commentId === commentId
              ? {
                  ...comment,
                  replies: (comment.replies || []).map((reply) =>
                    reply.replyId === replyId
                      ? { ...reply, content: updatedReply.content, updatedAt: updatedReply.updatedAt }
                      : reply
                  ),
                }
              : comment
          )
        );
      } else {
        console.error('답글 수정 응답 구조 오류:', response);
        alert('답글 수정에 실패했습니다.');
      }
      setEditingReplyId(null);
      // 답글 수정 완료 후 editingReplyContent 정리
      setEditingReplyContent((prev) => {
        const newContent = { ...prev };
        if (newContent[commentId]) {
          const newCommentContent = { ...newContent[commentId] };
          delete newCommentContent[replyId];
          if (Object.keys(newCommentContent).length === 0) {
            delete newContent[commentId];
          } else {
            newContent[commentId] = newCommentContent;
          }
        }
        return newContent;
      });
    } catch (error: unknown) {
      const apiError = handleApiError(error);
      alert(apiError.message);
    }
  };

  // 답글 삭제
  const handleDeleteReply = async (commentId: number, replyId: number) => {
    if (!postId) return;
    if (!confirm('정말 삭제하시겠습니까?')) return;

    try {
      await commentsApi.deleteReply(Number(postId), commentId, replyId);
      setComments((prev) =>
        prev.map((comment) =>
          comment.commentId === commentId
            ? { ...comment, replies: (comment.replies || []).filter((reply) => reply.replyId !== replyId) }
            : comment
        )
      );
    } catch (error: unknown) {
      const apiError = handleApiError(error);
      alert(apiError.message);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!post) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-light dark:bg-background-dark">
        <div className="text-slate-500 dark:text-slate-400">게시글을 찾을 수 없습니다.</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 md:px-8 py-8">
        <button
          onClick={() => navigate(-1)}
          className="mb-6 flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
        >
          <span className="material-symbols-outlined">arrow_back</span>
          <span>목록으로</span>
        </button>

        <article className="bg-card rounded-lg shadow-sm p-8 border border-border">
          <h1 className="text-3xl font-bold text-foreground mb-4">{post.title}</h1>

          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div
                className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => navigate(`/profile/${post.author.userId}`)}
              >
                <div className="size-8 rounded-full bg-gradient-to-br from-primary to-primary/80"></div>
                <span className="font-semibold text-foreground">{post.author.nickname}</span>
              </div>
              <span>·</span>
              <span>{formatDateKorean(post.createdAt)}</span>
              {post.updatedAt !== post.createdAt && (
                <>
                  <span>·</span>
                  <span>수정됨: {formatDateKorean(post.updatedAt)}</span>
                </>
              )}
            </div>
            {isAuthenticated && user && user.userId !== post.author.userId && (
              <button
                onClick={handleFollow}
                disabled={followLoading}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  isFollowing
                    ? 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                    : 'bg-primary text-primary-foreground hover:bg-primary/90'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {followLoading ? '처리 중...' : isFollowing ? '언팔로우' : '팔로우'}
              </button>
            )}
          </div>

          {/* 작성자와 본문 구분선 */}
          <div className="h-px bg-border w-full mb-6"></div>

          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-6">
              {post.tags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => navigate(`/?tag=${tag}`)}
                  className="px-3 py-1 rounded-full text-sm font-medium bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors"
                >
                  #{tag}
                </button>
              ))}
            </div>
          )}

          <div className="prose prose-slate dark:prose-invert max-w-none mb-8">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                h1: ({ node, ...props }) => (
                  <h1 className="text-4xl font-bold text-foreground mt-8 mb-4 pb-2 border-b border-border" {...props} />
                ),
                h2: ({ node, ...props }) => (
                  <h2 className="text-3xl font-bold text-foreground mt-7 mb-3 pb-2 border-b border-border" {...props} />
                ),
                h3: ({ node, ...props }) => (
                  <h3 className="text-2xl font-bold text-foreground mt-6 mb-3" {...props} />
                ),
                h4: ({ node, ...props }) => (
                  <h4 className="text-xl font-bold text-foreground mt-5 mb-2" {...props} />
                ),
                h5: ({ node, ...props }) => (
                  <h5 className="text-lg font-bold text-foreground mt-4 mb-2" {...props} />
                ),
                h6: ({ node, ...props }) => (
                  <h6 className="text-base font-bold text-foreground mt-3 mb-2" {...props} />
                ),
                p: ({ node, ...props }) => (
                  <p className="text-foreground/90 leading-relaxed mb-4" {...props} />
                ),
                code: ({ node, inline, ...props }: any) => {
                  if (inline) {
                    return (
                      <code
                        className="px-1.5 py-0.5 bg-slate-100 dark:bg-[#182b2f] text-primary rounded text-sm font-mono"
                        {...props}
                      />
                    );
                  }
                  return (
                    <code
                      className="block p-4 bg-[#0d1117] dark:bg-[#182b2f] text-gray-300 rounded-lg overflow-x-auto text-sm font-mono border border-gray-700 dark:border-[#2a4349] my-4"
                      {...props}
                    />
                  );
                },
                pre: ({ node, ...props }) => (
                  <pre className="mb-4 rounded-lg overflow-hidden" {...props} />
                ),
                blockquote: ({ node, ...props }) => (
                  <blockquote
                    className="border-l-4 border-primary pl-4 italic text-foreground/80 my-4 bg-muted py-2 rounded-r"
                    {...props}
                  />
                ),
                a: ({ node, ...props }) => (
                  <a
                    className="text-primary hover:underline font-medium"
                    target="_blank"
                    rel="noopener noreferrer"
                    {...props}
                  />
                ),
                ul: ({ node, ...props }) => (
                  <ul className="list-disc list-inside text-slate-700 dark:text-slate-300 mb-4 space-y-2 ml-4" {...props} />
                ),
                ol: ({ node, ...props }) => (
                  <ol className="list-decimal list-inside text-slate-700 dark:text-slate-300 mb-4 space-y-2 ml-4" {...props} />
                ),
                li: ({ node, ...props }) => (
                  <li className="text-slate-700 dark:text-slate-300 leading-relaxed" {...props} />
                ),
                hr: ({ node, ...props }) => (
                  <hr className="border-gray-200 dark:border-[#2a4349] my-8" {...props} />
                ),
                strong: ({ node, ...props }) => (
                  <strong className="font-bold text-slate-900 dark:text-white" {...props} />
                ),
                em: ({ node, ...props }) => (
                  <em className="italic text-slate-700 dark:text-slate-300" {...props} />
                ),
                table: ({ node, ...props }) => (
                  <div className="overflow-x-auto my-6">
                    <table className="min-w-full border-collapse border border-slate-200 dark:border-[#2a4349] rounded-lg" {...props} />
                  </div>
                ),
                thead: ({ node, ...props }) => (
                  <thead className="bg-slate-100 dark:bg-[#182b2f]" {...props} />
                ),
                th: ({ node, ...props }) => (
                  <th
                    className="border border-slate-200 dark:border-[#2a4349] px-4 py-3 font-bold text-slate-900 dark:text-white text-left"
                    {...props}
                  />
                ),
                tbody: ({ node, ...props }) => (
                  <tbody {...props} />
                ),
                td: ({ node, ...props }) => (
                  <td
                    className="border border-slate-200 dark:border-[#2a4349] px-4 py-3 text-slate-700 dark:text-slate-300"
                    {...props}
                  />
                ),
                img: ({ node, ...props }) => (
                  <img
                    className="rounded-lg my-4 max-w-full h-auto shadow-md"
                    alt=""
                    {...props}
                  />
                ),
              }}
            >
              {post.content}
            </ReactMarkdown>
          </div>

          <div className="flex items-center justify-between pt-6 border-t border-border">
            <button
              onClick={handleLikeClick}
              disabled={likeLoading}
              className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium transition-colors border border-border ${
                isLiked
                  ? 'bg-card text-foreground hover:bg-muted'
                  : 'bg-card text-foreground hover:bg-muted'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <span
                className={`material-symbols-outlined ${isLiked ? 'fill-current text-red-500 dark:text-red-400' : ''}`}
                style={isLiked ? { fontVariationSettings: "'FILL' 1" } : {}}
              >
                favorite
              </span>
              <span className="font-semibold">{likeCount}</span>
            </button>
            {isAuthenticated && user?.userId === post.author.userId && (
              <div className="flex gap-2">
                <button
                  onClick={() => navigate(`/posts/${post.postId}/edit`)}
                  className="px-4 py-2 bg-card text-foreground border border-border rounded-md font-medium hover:bg-muted transition-colors"
                >
                  수정
                </button>
                <button
                  onClick={async () => {
                    if (confirm('정말 삭제하시겠습니까?')) {
                      try {
                        await postsApi.deletePost(post.postId);
                        navigate('/');
                      } catch (error: any) {
                        alert(error.response?.data?.message || '게시글 삭제에 실패했습니다.');
                      }
                    }
                  }}
                  className="px-4 py-2 bg-red-800 dark:bg-[#4f1b0b] text-white rounded-md font-semibold hover:bg-red-700 dark:hover:bg-[#5f2b1b] transition-colors shadow-sm"
                >
                  삭제
                </button>
              </div>
            )}
          </div>
        </article>

        {/* 댓글 섹션 */}
        <div className="mt-8 bg-card rounded-lg shadow-sm p-8 border border-border">
          <h2 className="text-2xl font-bold text-foreground mb-6">댓글 {comments.length}</h2>

          {/* 댓글 작성 폼 */}
          {isAuthenticated ? (
            <div className="mb-8">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="댓글을 입력하세요..."
                className="w-full p-4 border border-border rounded-lg bg-muted text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                rows={4}
              />
              <div className="flex justify-end mt-2">
                <button
                  onClick={handleCreateComment}
                  disabled={!newComment.trim()}
                  className="px-4 py-2 bg-primary text-white rounded-md font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  댓글 작성
                </button>
              </div>
            </div>
          ) : (
            <div className="mb-8 p-4 bg-muted rounded-lg text-center text-muted-foreground border border-border">
              <button
                onClick={() => navigate('/login')}
                className="text-primary hover:underline font-medium"
              >
                로그인
              </button>
              하여 댓글을 작성하세요.
            </div>
          )}

          {/* 댓글 목록 */}
          {commentLoading ? (
            <LoadingSpinner />
          ) : comments.length === 0 ? (
            <div className="text-center py-8 text-slate-500 dark:text-slate-400">
              아직 댓글이 없습니다.
            </div>
          ) : (
            <div className="space-y-6">
              {comments.map((comment) => (
                <div key={comment.commentId} className="border-b border-slate-200 dark:border-slate-700 pb-6 last:border-0">
                  {/* 댓글 */}
                  <div className="flex gap-4">
                    <div
                      className="size-10 rounded-full bg-gradient-to-br from-primary to-blue-500 flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={() => navigate(`/profile/${comment.author.userId}`)}
                    ></div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span
                          className="font-semibold text-slate-900 dark:text-white cursor-pointer hover:opacity-80 transition-opacity"
                          onClick={() => navigate(`/profile/${comment.author.userId}`)}
                        >
                          {comment.author.nickname}
                        </span>
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          {formatDate(comment.createdAt)}
                          {comment.updatedAt !== comment.createdAt && ' (수정됨)'}
                        </span>
                      </div>
                      {editingCommentId === comment.commentId ? (
                        <div className="space-y-2">
                          <textarea
                            value={editingCommentContent[comment.commentId] ?? comment.content}
                            onChange={(e) => {
                              setEditingCommentContent((prev) => ({
                                ...prev,
                                [comment.commentId]: e.target.value,
                              }));
                            }}
                            className="w-full p-3 border border-border rounded-lg bg-muted text-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                            rows={3}
                            ref={(textarea) => textarea?.focus()}
                            onKeyDown={(e) => {
                              if (e.key === 'Escape') {
                                setEditingCommentId(null);
                                setEditingCommentContent((prev) => {
                                  const newContent = { ...prev };
                                  delete newContent[comment.commentId];
                                  return newContent;
                                });
                              }
                            }}
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                const content = editingCommentContent[comment.commentId] ?? comment.content;
                                handleUpdateComment(comment.commentId, content);
                              }}
                              className="px-3 py-1.5 bg-primary text-white rounded-md text-sm font-medium hover:bg-primary/90 transition-colors"
                            >
                              저장
                            </button>
                            <button
                              onClick={() => {
                                setEditingCommentId(null);
                                setEditingCommentContent((prev) => {
                                  const newContent = { ...prev };
                                  delete newContent[comment.commentId];
                                  return newContent;
                                });
                              }}
                              className="px-3 py-1.5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-md text-sm font-medium hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
                            >
                              취소
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <p className="text-slate-700 dark:text-slate-300 mb-3 whitespace-pre-wrap">
                            {comment.content}
                          </p>
                          <div className="flex items-center gap-3">
                            {isAuthenticated && (
                              <button
                                onClick={() => setReplyInputs((prev) => ({ ...prev, [comment.commentId]: '' }))}
                                className="text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                              >
                                답글
                              </button>
                            )}
                            {isAuthenticated && user?.userId === comment.author.userId && (
                              <>
                                <button
                                  onClick={() => {
                                    setEditingCommentId(comment.commentId);
                                    setEditingCommentContent((prev) => ({
                                      ...prev,
                                      [comment.commentId]: comment.content,
                                    }));
                                  }}
                                  className="text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                                >
                                  수정
                                </button>
                                <button
                                  onClick={() => handleDeleteComment(comment.commentId)}
                                  className="text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors"
                                >
                                  삭제
                                </button>
                              </>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* 답글 작성 폼 */}
                  {isAuthenticated && replyInputs[comment.commentId] !== undefined && (
                    <div className="mt-4 ml-14">
                      <textarea
                        value={replyInputs[comment.commentId] || ''}
                        onChange={(e) =>
                          setReplyInputs((prev) => ({ ...prev, [comment.commentId]: e.target.value }))
                        }
                        placeholder="답글을 입력하세요..."
                        className="w-full p-3 border border-border rounded-lg bg-muted text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                        rows={3}
                      />
                      <div className="flex gap-2 mt-2">
                        <button
                          onClick={() => handleCreateReply(comment.commentId)}
                          disabled={!replyInputs[comment.commentId]?.trim()}
                          className="px-3 py-1.5 bg-primary text-white rounded-md text-sm font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          답글 작성
                        </button>
                        <button
                          onClick={() =>
                            setReplyInputs((prev) => {
                              const newInputs = { ...prev };
                              delete newInputs[comment.commentId];
                              return newInputs;
                            })
                          }
                          className="px-3 py-1.5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-md text-sm font-medium hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
                        >
                          취소
                        </button>
                      </div>
                    </div>
                  )}

                  {/* 답글 목록 */}
                  {comment.replies && comment.replies.length > 0 && (
                    <div className="mt-4 ml-14 space-y-4 pl-4 border-l-2 border-slate-200 dark:border-slate-700">
                      {comment.replies.map((reply) => (
                        <div key={reply.replyId}>
                          <div className="flex gap-3">
                            <div
                              className="size-8 rounded-full bg-gradient-to-br from-primary to-blue-500 flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
                              onClick={() => navigate(`/profile/${reply.author.userId}`)}
                            ></div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span
                                  className="font-semibold text-sm text-slate-900 dark:text-white cursor-pointer hover:opacity-80 transition-opacity"
                                  onClick={() => navigate(`/profile/${reply.author.userId}`)}
                                >
                                  {reply.author.nickname}
                                </span>
                                <span className="text-xs text-slate-500 dark:text-slate-400">
                                  {formatDate(reply.createdAt)}
                                  {reply.updatedAt !== reply.createdAt && ' (수정됨)'}
                                </span>
                              </div>
                              {editingReplyId?.commentId === comment.commentId &&
                              editingReplyId?.replyId === reply.replyId ? (
                                <div className="space-y-2">
                                  <textarea
                                    value={editingReplyContent[comment.commentId]?.[reply.replyId] ?? reply.content}
                                    onChange={(e) => {
                                      setEditingReplyContent((prev) => ({
                                        ...prev,
                                        [comment.commentId]: {
                                          ...prev[comment.commentId],
                                          [reply.replyId]: e.target.value,
                                        },
                                      }));
                                    }}
                                    className="w-full p-2 border border-border rounded-lg bg-muted text-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none text-sm"
                                    rows={2}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Escape') {
                                        setEditingReplyId(null);
                                        setEditingReplyContent((prev) => {
                                          const newContent = { ...prev };
                                          if (newContent[comment.commentId]) {
                                            const newCommentContent = { ...newContent[comment.commentId] };
                                            delete newCommentContent[reply.replyId];
                                            if (Object.keys(newCommentContent).length === 0) {
                                              delete newContent[comment.commentId];
                                            } else {
                                              newContent[comment.commentId] = newCommentContent;
                                            }
                                          }
                                          return newContent;
                                        });
                                      }
                                    }}
                                  />
                                  <div className="flex gap-2">
                                    <button
                                      onClick={() => {
                                        const content = editingReplyContent[comment.commentId]?.[reply.replyId] ?? reply.content;
                                        handleUpdateReply(comment.commentId, reply.replyId, content);
                                      }}
                                      className="text-xs py-1 px-2 bg-primary text-white rounded-md font-medium hover:bg-primary/90 transition-colors"
                                    >
                                      저장
                                    </button>
                                    <button
                                      onClick={() => {
                                        setEditingReplyId(null);
                                        setEditingReplyContent((prev) => {
                                          const newContent = { ...prev };
                                          if (newContent[comment.commentId]) {
                                            const newCommentContent = { ...newContent[comment.commentId] };
                                            delete newCommentContent[reply.replyId];
                                            if (Object.keys(newCommentContent).length === 0) {
                                              delete newContent[comment.commentId];
                                            } else {
                                              newContent[comment.commentId] = newCommentContent;
                                            }
                                          }
                                          return newContent;
                                        });
                                      }}
                                      className="text-xs py-1 px-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-md font-medium hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
                                    >
                                      취소
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <>
                                  <p className="text-sm text-slate-700 dark:text-slate-300 mb-2 whitespace-pre-wrap">
                                    {reply.content}
                                  </p>
                                  {isAuthenticated && user?.userId === reply.author.userId && (
                                    <div className="flex gap-2">
                                      <button
                                        onClick={() => {
                                          setEditingReplyId({ commentId: comment.commentId, replyId: reply.replyId });
                                          setEditingReplyContent((prev) => ({
                                            ...prev,
                                            [comment.commentId]: {
                                              ...prev[comment.commentId],
                                              [reply.replyId]: reply.content,
                                            },
                                          }));
                                        }}
                                        className="text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                                      >
                                        수정
                                      </button>
                                      <button
                                        onClick={() => handleDeleteReply(comment.commentId, reply.replyId)}
                                        className="text-xs text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors"
                                      >
                                        삭제
                                      </button>
                                    </div>
                                  )}
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PostDetailPage;

