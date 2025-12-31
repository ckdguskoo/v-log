/**
 * 게시글 썸네일용 그라데이션 색상 목록
 */
export const POST_GRADIENTS = [
  'from-purple-600 to-blue-500',
  'from-emerald-500 to-teal-900',
  'from-orange-400 to-pink-600',
  'from-blue-500 to-indigo-600',
  'from-green-500 to-emerald-600',
  'from-red-500 to-pink-500',
  'from-yellow-500 to-orange-500',
  'from-cyan-500 to-blue-500',
] as const;

/**
 * postId 기반 그라데이션 색상 가져오기
 */
export const getPostGradient = (postId: number): string => {
  return POST_GRADIENTS[postId % POST_GRADIENTS.length];
};

