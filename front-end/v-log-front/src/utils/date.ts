import { format } from 'date-fns';

/**
 * 날짜를 포맷팅합니다.
 * @param dateString ISO 날짜 문자열
 * @param formatStr 포맷 문자열 (기본값: 'yyyy.MM.dd')
 */
export const formatDate = (dateString: string, formatStr: string = 'yyyy.MM.dd'): string => {
  try {
    return format(new Date(dateString), formatStr);
  } catch (error) {
    console.error('날짜 포맷팅 실패:', error);
    return dateString;
  }
};

/**
 * 한국어 형식의 날짜를 포맷팅합니다.
 */
export const formatDateKorean = (dateString: string): string => {
  return formatDate(dateString, 'yyyy년 MM월 dd일');
};

