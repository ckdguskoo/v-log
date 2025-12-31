import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usersApi } from '../api/users';
import { useAuth } from '../context/AuthContext';
import { LoadingSpinner } from '../components/common/LoadingSpinner';

const ProfileEditPage = () => {
  const navigate = useNavigate();
  const { user, userDetail, refreshUser, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [nickname, setNickname] = useState('');
  const [password, setPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (userDetail) {
      setNickname(userDetail.nickname);
      setLoading(false);
    } else if (user) {
      // userDetail이 없으면 사용자 정보 조회
      const fetchUser = async () => {
        try {
          const response = await usersApi.getUser(user.userId);
          setNickname(response.data.nickname);
        } catch (err) {
          console.error('사용자 정보 조회 실패:', err);
        } finally {
          setLoading(false);
        }
      };
      fetchUser();
    } else {
      setLoading(false);
    }
  }, [user, userDetail]);

  const handleUpdate = async () => {
    if (!user?.userId) return;

    setError('');
    setSaving(true);

    try {
      const updateData: { nickname?: string; password?: string } = {};
      if (nickname !== userDetail?.nickname) {
        updateData.nickname = nickname;
      }
      if (password.trim()) {
        updateData.password = password;
      }

      if (Object.keys(updateData).length === 0) {
        navigate(`/profile/${user.userId}`);
        return;
      }

      await usersApi.updateUser(user.userId, updateData);
      setPassword('');
      await refreshUser();
      navigate(`/profile/${user.userId}`);
    } catch (err: any) {
      setError(err.response?.data?.message || '프로필 수정에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!user?.userId || !deletePassword.trim()) {
      setDeleteError('비밀번호를 입력해주세요.');
      return;
    }

    setDeleting(true);
    setDeleteError('');

    try {
      await usersApi.deleteUser(user.userId, deletePassword);
      await logout();
      navigate('/');
      alert('회원 탈퇴가 완료되었습니다.');
    } catch (err: any) {
      if (err.response?.status === 400) {
        setDeleteError('비밀번호가 일치하지 않습니다.');
      } else {
        setDeleteError(err.response?.data?.message || '회원 탈퇴에 실패했습니다.');
      }
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-muted-foreground">로그인이 필요합니다.</div>
      </div>
    );
  }

  return (
    <main className="flex-1 flex justify-center py-8 px-4 md:px-8">
      <div className="w-full max-w-2xl">
        <div className="bg-card rounded-lg p-8 border border-border">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-foreground">프로필 수정</h1>
            <button
              onClick={() => navigate(`/profile/${user.userId}`)}
              className="text-muted-foreground hover:text-foreground"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-400 rounded text-sm">
              {error}
            </div>
          )}

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">닉네임</label>
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="닉네임을 입력하세요"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                새 비밀번호 (변경하지 않으려면 비워두세요)
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="새 비밀번호를 입력하세요"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <button
                onClick={handleUpdate}
                disabled={saving}
                className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-md font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {saving ? '저장 중...' : '저장'}
              </button>
              <button
                onClick={() => navigate(`/profile/${user.userId}`)}
                className="flex-1 px-4 py-2 bg-secondary text-secondary-foreground rounded-md font-medium hover:bg-secondary/80 transition-colors"
              >
                취소
              </button>
            </div>

            <div className="pt-6 border-t border-border">
              <button
                onClick={() => {
                  setShowDeleteModal(true);
                  setDeletePassword('');
                  setDeleteError('');
                }}
                className="w-full px-4 py-2 bg-red-500 text-white rounded-md font-medium hover:bg-red-600 transition-colors"
              >
                회원 탈퇴
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 회원 탈퇴 모달 */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-lg shadow-xl max-w-md w-full p-6 border border-border">
            <h2 className="text-xl font-bold text-foreground mb-4">회원 탈퇴</h2>
            <p className="text-muted-foreground mb-6">
              정말로 회원 탈퇴를 하시겠습니까?<br />
              탈퇴하시면 모든 데이터가 삭제되며 복구할 수 없습니다.
            </p>
            {deleteError && (
              <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-400 rounded text-sm">
                {deleteError}
              </div>
            )}
            <div className="mb-6">
              <label className="block text-sm font-medium text-foreground mb-2">
                비밀번호 확인
              </label>
              <input
                type="password"
                value={deletePassword}
                onChange={(e) => {
                  setDeletePassword(e.target.value);
                  setDeleteError('');
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !deleting) {
                    handleDeleteAccount();
                  }
                }}
                className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder="비밀번호를 입력하세요"
                autoFocus
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleDeleteAccount}
                disabled={deleting || !deletePassword.trim()}
                className="flex-1 px-4 py-2 bg-red-500 text-white rounded-md font-medium hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {deleting ? '처리 중...' : '탈퇴하기'}
              </button>
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeletePassword('');
                  setDeleteError('');
                }}
                disabled={deleting}
                className="flex-1 px-4 py-2 bg-secondary text-secondary-foreground rounded-md font-medium hover:bg-secondary/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};

export default ProfileEditPage;

