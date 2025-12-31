import { followsApi } from '../api/follows';

/**
 * 팔로우 상태를 확인합니다.
 * 백엔드에 팔로우 상태 확인 API가 없으므로 팔로우를 시도해보고 409 에러가 나오면 이미 팔로우 중인 것으로 판단합니다.
 * @param userId 확인할 사용자 ID
 * @returns 팔로우 중이면 true, 아니면 false
 */
export const checkFollowStatus = async (userId: number): Promise<boolean> => {
  try {
    await followsApi.follow(userId);
    // 성공하면 팔로우하지 않은 상태였으므로 즉시 언팔로우
    try {
      await followsApi.unfollow(userId);
    } catch {
      // 언팔로우 실패는 무시
    }
    return false;
  } catch (err: any) {
    // 409 Conflict는 이미 팔로우 중인 경우
    if (err.response?.status === 409) {
      return true;
    }
    // 다른 에러는 팔로우하지 않은 상태로 간주
    return false;
  }
};

