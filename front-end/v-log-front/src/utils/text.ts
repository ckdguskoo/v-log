/**
 * 텍스트를 지정된 길이로 자르고 말줄임표를 추가합니다.
 * @param text 원본 텍스트
 * @param maxLength 최대 길이 (기본값: 150)
 */
export const truncateText = (text: string, maxLength: number = 150): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

