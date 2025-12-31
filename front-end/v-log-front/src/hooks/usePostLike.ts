import { useState, useCallback } from 'react';
import { likesApi } from '../api/likes';
import { LikeResponse } from '../types';
import { handleApiError } from '../api/client';

interface UsePostLikeReturn {
  likeCount: number;
  isLiked: boolean;
  likeLoading: boolean;
  handleLike: () => Promise<void>;
  setLikeCount: (count: number) => void;
  setIsLiked: (liked: boolean) => void;
}

export const usePostLike = (
  postId: number | undefined,
  initialLikeCount: number = 0,
  initialIsLiked: boolean = false,
  isAuthenticated: boolean
): UsePostLikeReturn => {
  const [likeCount, setLikeCount] = useState(initialLikeCount);
  const [isLiked, setIsLiked] = useState(initialIsLiked);
  const [likeLoading, setLikeLoading] = useState(false);

  const handleLike = useCallback(async () => {
    if (!postId || !isAuthenticated) return;

    // 낙관적 업데이트: 즉시 UI 업데이트
    const previousIsLiked = isLiked;
    const previousLikeCount = likeCount;

    if (isLiked) {
      setIsLiked(false);
      setLikeCount((prev) => Math.max(0, prev - 1));
    } else {
      setIsLiked(true);
      setLikeCount((prev) => prev + 1);
    }

    setLikeLoading(true);
    try {
      if (previousIsLiked) {
        await likesApi.removeLike(postId);
        // 언팔로우는 성공했으므로 optimistic update 유지
      } else {
        try {
          await likesApi.addLike(postId);
          // 팔로우는 성공했으므로 optimistic update 유지
        } catch (err: any) {
          // 409 Conflict는 이미 좋아요한 경우 - 정상 처리
          if (err.response?.status === 409) {
            // 이미 좋아요한 상태이므로 최신 정보 조회하여 동기화
            const likeInfo = await likesApi.getLikeInfo(postId);
            if (likeInfo && likeInfo.data) {
              const newLikeCount = Number(likeInfo.data.likeCount);
              const newCheckLike = Boolean(likeInfo.data.checkLike);
              if (!isNaN(newLikeCount) && newLikeCount >= 0) {
                setLikeCount(newLikeCount);
                setIsLiked(newCheckLike);
              }
            }
          } else {
            throw err;
          }
        }
      }
      // API 호출 성공 시 optimistic update 유지 (이미 올바른 값이 설정되어 있음)
    } catch (error: unknown) {
      // 실패 시 롤백
      setIsLiked(previousIsLiked);
      setLikeCount(previousLikeCount);
      const apiError = handleApiError(error);
      if (apiError.status !== 409) {
        console.error('좋아요 처리 실패:', apiError);
      }
    } finally {
      setLikeLoading(false);
    }
  }, [postId, isLiked, likeCount, isAuthenticated]);

  return {
    likeCount,
    isLiked,
    likeLoading,
    handleLike,
    setLikeCount,
    setIsLiked,
  };
};

