/**
 * localStorage에 사용자 정보를 저장합니다.
 */
export const saveUserToStorage = (user: any, userDetail: any): void => {
  try {
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('userDetail', JSON.stringify(userDetail));
  } catch (error) {
    console.error('사용자 정보 저장 실패:', error);
  }
};

/**
 * localStorage에서 사용자 정보를 불러옵니다.
 */
export const loadUserFromStorage = (): { user: any; userDetail: any } | null => {
  try {
    const savedUser = localStorage.getItem('user');
    const savedUserDetail = localStorage.getItem('userDetail');
    
    if (savedUser && savedUserDetail) {
      return {
        user: JSON.parse(savedUser),
        userDetail: JSON.parse(savedUserDetail),
      };
    }
  } catch (error) {
    console.error('사용자 정보 불러오기 실패:', error);
  }
  return null;
};

/**
 * localStorage에서 사용자 정보를 제거합니다.
 */
export const removeUserFromStorage = (): void => {
  try {
    localStorage.removeItem('user');
    localStorage.removeItem('userDetail');
  } catch (error) {
    console.error('사용자 정보 제거 실패:', error);
  }
};

