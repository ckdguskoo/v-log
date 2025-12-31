import { useState, useCallback } from 'react';
import { followsApi } from '../api/follows';
import { handleApiError } from '../api/client';

interface UseFollowReturn {
  isFollowing: boolean | null;
  followLoading: boolean;
  handleFollow: () => Promise<void>;
  setIsFollowing: (following: boolean | null) => void;
}

export const useFollow = (
  targetUserId: number | undefined,
  isOwnProfile: boolean,
  isAuthenticated: boolean,
  onFollowChange?: (isFollowing: boolean) => void
): UseFollowReturn => {
  const [isFollowing, setIsFollowing] = useState<boolean | null>(null);
  const [followLoading, setFollowLoading] = useState(false);

  const handleFollow = useCallback(async () => {
    if (!targetUserId || isOwnProfile || !isAuthenticated) return;

    setFollowLoading(true);
    try {
      if (isFollowing) {
        await followsApi.unfollow(targetUserId);
        setIsFollowing(false);
        onFollowChange?.(false);
      } else {
        try {
          await followsApi.follow(targetUserId);
          setIsFollowing(true);
          onFollowChange?.(true);
        } catch (err: any) {
          // 409 Conflict는 이미 팔로우 중인 경우
          if (err.response?.status === 409) {
            setIsFollowing(true);
            onFollowChange?.(true);
          } else {
            throw err;
          }
        }
      }
    } catch (err: any) {
      // 404 Not Found는 팔로우하지 않은 상태에서 언팔로우 시도한 경우
      if (err.response?.status === 404 && isFollowing) {
        setIsFollowing(false);
        onFollowChange?.(false);
      } else {
        const apiError = handleApiError(err);
        alert(apiError.message || '팔로우 처리에 실패했습니다.');
      }
    } finally {
      setFollowLoading(false);
    }
  }, [targetUserId, isOwnProfile, isAuthenticated, isFollowing, onFollowChange]);

  return {
    isFollowing,
    followLoading,
    handleFollow,
    setIsFollowing,
  };
};

