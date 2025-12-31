import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, UserGetResponse } from '../types';
import { authApi } from '../api/auth';
import { usersApi } from '../api/users';
import { saveUserToStorage, loadUserFromStorage, removeUserFromStorage } from '../utils/storage';

interface AuthContextType {
  user: User | null;
  userDetail: UserGetResponse | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, nickname: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [userDetail, setUserDetail] = useState<UserGetResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = async () => {
    if (!user?.userId) return;
    try {
      const response = await usersApi.getUser(user.userId);
      setUserDetail(response.data);
      // localStorage 업데이트
      if (user) {
        saveUserToStorage(user, response.data);
      }
    } catch (error: any) {
      console.error('사용자 정보 조회 실패:', error);
      // 에러가 발생해도 기존 userDetail은 유지
    }
  };

  useEffect(() => {
    // 새로고침 시 localStorage에서 사용자 정보 복원
    const restoreSession = async () => {
      try {
        const saved = loadUserFromStorage();
        
        if (saved) {
          // 세션 유효성 확인을 위해 사용자 정보 조회 시도
          try {
            const response = await usersApi.getUser(saved.user.userId);
            // 세션이 유효하면 사용자 정보 복원
            setUser(saved.user);
            setUserDetail(response.data);
            saveUserToStorage(saved.user, response.data);
          } catch (error: any) {
            // 세션이 만료되었거나 유효하지 않으면 localStorage 정리
            if (error.response?.status === 401 || error.response?.status === 403) {
              removeUserFromStorage();
            }
          }
        }
      } catch (error) {
        console.error('세션 복원 실패:', error);
        removeUserFromStorage();
      } finally {
        setLoading(false);
      }
    };

    restoreSession();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await authApi.login({ email, password });
      const userData = response.data;
      const user = {
        userId: userData.id,
        email: userData.email,
        nickname: userData.nickname,
      };
      setUser(user);
      // 로그인 응답에 이미 UserGetResponse가 포함되어 있으므로 그대로 사용
      setUserDetail(userData);
      
      // localStorage에 사용자 정보 저장
      saveUserToStorage(user, userData);
    } catch (error: any) {
      throw error;
    }
  };

  const signup = async (email: string, password: string, nickname: string) => {
    try {
      // 회원가입만 수행하고 로그인은 하지 않음
      await authApi.signup({ email, password, nickname });
      // 사용자 정보를 저장하지 않고 성공만 반환
    } catch (error: any) {
      throw error;
    }
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch (error: any) {
      // 401 에러는 세션이 이미 만료된 경우이므로 조용히 처리
      // 다른 에러도 로컬 상태는 정리해야 함
      if (error.response?.status !== 401) {
        console.error('로그아웃 API 호출 실패:', error);
      }
    } finally {
      // API 호출 성공/실패와 관계없이 항상 로컬 상태 정리
      setUser(null);
      setUserDetail(null);
      removeUserFromStorage();
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        userDetail,
        loading,
        login,
        signup,
        logout,
        refreshUser,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

