import { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { usersApi } from '../api/users';
import { postsApi } from '../api/posts';
import { followsApi } from '../api/follows';
import { likesApi } from '../api/likes';
import { authApi } from '../api/auth';
import { UserGetResponse } from '../api/users';
import { PostListResponse, FollowerGetResponse, FollowingGetResponse, PageResponse, LikeResponse, FollowPageInfo } from '../types';
import { useAuth } from '../context/AuthContext';
import { formatDate } from '../utils/date';
import { truncateText } from '../utils/text';
import { checkFollowStatus } from '../utils/follow';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { handleApiError } from '../api/client';

const ProfilePage = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { user, userDetail, refreshUser, isAuthenticated, logout } = useAuth();
  const [profile, setProfile] = useState<UserGetResponse | null>(null);
  const [posts, setPosts] = useState<PostListResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'articles' | 'about'>('articles');
  const [showFollowersModal, setShowFollowersModal] = useState(false);
  const [showFollowingsModal, setShowFollowingsModal] = useState(false);
  const [followersCount, setFollowersCount] = useState<number | null>(null);
  const [followingsCount, setFollowingsCount] = useState<number | null>(null);
  const [isFollowing, setIsFollowing] = useState<boolean | null>(null);
  const [followLoading, setFollowLoading] = useState(false);
  const [followers, setFollowers] = useState<FollowerGetResponse[]>([]);
  const [followings, setFollowings] = useState<FollowingGetResponse[]>([]);
  const [followersPageInfo, setFollowersPageInfo] = useState<FollowPageInfo | null>(null);
  const [followingsPageInfo, setFollowingsPageInfo] = useState<FollowPageInfo | null>(null);
  const [followersLoading, setFollowersLoading] = useState(false);
  const [followingsLoading, setFollowingsLoading] = useState(false);
  const [followersPage, setFollowersPage] = useState(0);
  const [followingsPage, setFollowingsPage] = useState(0);
  const [error, setError] = useState('');
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);

  const targetUserId = userId ? Number(userId) : user?.userId;
  const isOwnProfile = targetUserId === user?.userId;

  // Top Tags 계산 (게시글의 태그들을 수집하여 빈도수로 정렬)
  const topTags = useMemo(() => {
    const tagCount: Record<string, number> = {};
    posts.forEach((post) => {
      if (post.tags) {
        post.tags.forEach((tag) => {
          tagCount[tag] = (tagCount[tag] || 0) + 1;
        });
      }
    });
    return Object.entries(tagCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([tag]) => tag);
  }, [posts]);


  // 게시글 썸네일 이미지 생성 (postId 기반)
  const getPostThumbnailUrl = (postId: number) => {
    const gradients = [
      'AB6AXuCVzZaH8JKAjSpIyRXn9yW2tUEEZDb86oUlHrbgxVrp_5w_gzswn6hXEWMxd7IDPNT5KaZAiPE7PKn-EOl3QNp-G7mW8jra2simK7mITQQ3K4U1pznszs48ts0knqwxm0lvOCBjVQV1fGHokOCryIDGd3IQ0xIUusS-KqUgSbrgG8ahuBRhxZlspDXGYLVzpvmaC3gxroCbH5ssnXi6WsuVCw92Q8neDDXxRs10l-FCHZBIMpSCuXyFYKOGfiUDFj2cfUjAk0Q4rsmq',
      'AB6AXuAEu7PSFtYRusGLvZxVrMrKCwuzeOLxqv5gORva3ylaSobMrtQLdeBmIbIZBsjFDQdc9OHDpbMaanz9b2mvFZ8kMBvi2Nuzv2R5O2Pbho7PTZO5rWyfxeAVhfH-uyrG_gXFY4098khbZN_5tNa0aLiUrf05-vHisJwqcYEP2mvXCXfB1KcYwTpxrAk2UsOeikeGCcnxt2ibr2HT8hqE4jt4cCEM0FKhPBnZqwg-RplyoKoYPnFhBneZIZREUZiP2vDTw4aWaTSAak49',
    ];
    return `https://lh3.googleusercontent.com/aida-public/${gradients[postId % gradients.length]}`;
  };

  useEffect(() => {
    const fetchProfile = async () => {
      if (!targetUserId) return;

      try {
        setLoading(true);
        setError('');

        // 본인 프로필이고 userDetail이 있으면 그것을 사용
        if (isOwnProfile && userDetail) {
          setProfile(userDetail);

          // 사용자의 게시글 목록 조회
          try {
            const postsResponse = await postsApi.getPosts({ blogId: userDetail.blogId, size: 20 });
            // 각 게시글의 좋아요 상태 조회
            const postsWithLikeStatus = await Promise.all(
              postsResponse.content.map(async (post) => {
                if (!isAuthenticated) {
                  return { ...post, isLiked: false };
                }
                try {
                  const likeInfo = await likesApi.getLikeInfo(post.postId);
                  return { ...post, isLiked: likeInfo.data.checkLike };
                } catch {
                  return { ...post, isLiked: false };
                }
              })
            );
            setPosts(postsWithLikeStatus);
          } catch (err) {
            console.error('게시글 목록 조회 실패:', err);
          }
        } else if (isOwnProfile && !userDetail) {
          // 본인 프로필이지만 userDetail이 없는 경우 (로그인 직후 등)
          setError('사용자 정보를 불러올 수 없습니다. 다시 로그인해주세요.');
        } else {
          // 다른 사용자 프로필 조회 시도
          try {
            const response = await usersApi.getUser(targetUserId);
            setProfile(response.data);

            // 사용자의 게시글 목록 조회
            const postsResponse = await postsApi.getPosts({ blogId: response.data.blogId, size: 20 });
            // 각 게시글의 좋아요 상태 조회
            const postsWithLikeStatus = await Promise.all(
              postsResponse.content.map(async (post) => {
                if (!isAuthenticated) {
                  return { ...post, isLiked: false };
                }
                try {
                  const likeInfo = await likesApi.getLikeInfo(post.postId);
                  return { ...post, isLiked: likeInfo.data.checkLike };
                } catch {
                  return { ...post, isLiked: false };
                }
              })
            );
            setPosts(postsWithLikeStatus);
          } catch (err: any) {
            if (err.response?.status === 403) {
              setError('다른 사용자의 프로필을 조회할 수 없습니다.');
            } else if (err.response?.status === 404) {
              setError('사용자를 찾을 수 없습니다.');
            } else {
              setError('프로필을 불러오는데 실패했습니다.');
            }
          }
        }
      } catch (err: any) {
        setError('프로필을 불러오는데 실패했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [targetUserId, isOwnProfile, userDetail, isAuthenticated]);

  // 팔로우 상태 확인 (다른 사용자 프로필일 때만)
  useEffect(() => {
    const checkStatus = async () => {
      if (!isOwnProfile && targetUserId && isAuthenticated) {
        const following = await checkFollowStatus(targetUserId);
        setIsFollowing(following);
      } else if (isOwnProfile) {
        setIsFollowing(null);
      }
    };

    checkStatus();
  }, [targetUserId, isOwnProfile, isAuthenticated]);

  // 팔로워/팔로잉 수 조회
  useEffect(() => {
    const fetchFollowCounts = async () => {
      if (!targetUserId) return;

      try {
        const [followersResponse, followingsResponse] = await Promise.all([
          followsApi.getFollowers(targetUserId, { page: 0, size: 1 }),
          followsApi.getFollowings(targetUserId, { page: 0, size: 1 }),
        ]);
        setFollowersCount(followersResponse.data.pageInfo.totalElements);
        setFollowingsCount(followingsResponse.data.pageInfo.totalElements);
      } catch (error: unknown) {
        console.error('팔로워/팔로잉 수 조회 실패:', error);
      }
    };

    fetchFollowCounts();
  }, [targetUserId]);

  // 팔로워 목록 조회 (모달용)
  useEffect(() => {
    const fetchFollowers = async () => {
      if (!targetUserId || !showFollowersModal) return;

      try {
        setFollowersLoading(true);
        const response = await followsApi.getFollowers(targetUserId, { page: followersPage, size: 20 });
        let followers = response.data.content;
        
        // 현재 로그인한 사용자가 각 팔로워를 팔로우하고 있는지 확인
        if (isAuthenticated && user) {
          const followersWithStatus = await Promise.all(
            followers.map(async (follower) => {
              // 본인은 확인 불필요
              if (follower.userId === user.userId) {
                return follower;
              }
              // 현재 로그인한 사용자가 팔로우하고 있는지 확인
              const isFollowing = await checkFollowStatus(follower.userId);
              return { ...follower, isFollowing };
            })
          );
          followers = followersWithStatus;
        } else {
          // 비로그인 상태면 모두 false
          followers = followers.map((f) => ({ ...f, isFollowing: false }));
        }
        
        if (followersPage === 0) {
          setFollowers(followers);
        } else {
          setFollowers((prev) => [...prev, ...followers]);
        }
        setFollowersPageInfo(response.data.pageInfo);
      } catch (error: unknown) {
        console.error('팔로워 목록 조회 실패:', error);
      } finally {
        setFollowersLoading(false);
      }
    };

    fetchFollowers();
  }, [targetUserId, showFollowersModal, followersPage, isAuthenticated, user]);

  // 팔로잉 목록 조회 (모달용)
  useEffect(() => {
    const fetchFollowings = async () => {
      if (!targetUserId || !showFollowingsModal) return;

      try {
        setFollowingsLoading(true);
        const response = await followsApi.getFollowings(targetUserId, { page: followingsPage, size: 20 });
        let followings = response.data.content;
        
        // 현재 로그인한 사용자가 각 팔로잉을 팔로우하고 있는지 확인
        if (isAuthenticated && user) {
          const followingsWithStatus = await Promise.all(
            followings.map(async (following) => {
              // 본인은 확인 불필요
              if (following.userId === user.userId) {
                return following;
              }
              // 현재 로그인한 사용자가 팔로우하고 있는지 확인
              const isFollowing = await checkFollowStatus(following.userId);
              return { ...following, isFollowing };
            })
          );
          followings = followingsWithStatus;
        } else {
          // 비로그인 상태면 모두 false
          followings = followings.map((f) => ({ ...f, isFollowing: false }));
        }
        
        if (followingsPage === 0) {
          setFollowings(followings);
        } else {
          setFollowings((prev) => [...prev, ...followings]);
        }
        setFollowingsPageInfo(response.data.pageInfo);
      } catch (error: unknown) {
        console.error('팔로잉 목록 조회 실패:', error);
      } finally {
        setFollowingsLoading(false);
      }
    };

    fetchFollowings();
  }, [targetUserId, showFollowingsModal, followingsPage, isAuthenticated, user]);

  const handlePasswordVerify = useCallback(async () => {
    if (!user?.email || !password.trim()) {
      setPasswordError('비밀번호를 입력해주세요.');
      return;
    }

    setVerifying(true);
    setPasswordError('');

    try {
      // 로그인 API를 사용하여 비밀번호 확인
      await authApi.login({
        email: user.email,
        password: password,
      });
      
      // 비밀번호 확인 성공 시 프로필 수정 페이지로 이동
      setShowPasswordModal(false);
      setPassword('');
      navigate('/profile/edit');
    } catch (err: any) {
      if (err.response?.status === 401 || err.response?.status === 400) {
        setPasswordError('비밀번호가 일치하지 않습니다.');
      } else {
        setPasswordError(err.response?.data?.message || '비밀번호 확인에 실패했습니다.');
      }
    } finally {
      setVerifying(false);
    }
  }, [user?.email, password, navigate]);

  const handleDeleteAccount = useCallback(async () => {
    if (!user?.userId || !deletePassword.trim()) {
      setDeleteError('비밀번호를 입력해주세요.');
      return;
    }

    setDeleteLoading(true);
    setDeleteError('');

    try {
      await usersApi.deleteUser(user.userId, deletePassword);
      // 회원 탈퇴 성공 시 로그아웃하고 홈으로 이동
      await logout();
      navigate('/');
    } catch (err: any) {
      if (err.response?.status === 400 || err.response?.status === 401) {
        setDeleteError(err.response?.data?.message || '비밀번호가 일치하지 않습니다.');
      } else if (err.response?.status === 403) {
        setDeleteError('회원 탈퇴 권한이 없습니다.');
      } else {
        setDeleteError(err.response?.data?.message || '회원 탈퇴에 실패했습니다.');
      }
    } finally {
      setDeleteLoading(false);
    }
  }, [user?.userId, deletePassword, logout, navigate]);

  const handleFollow = useCallback(async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    if (!targetUserId || isOwnProfile) return;

    setFollowLoading(true);
    try {
      if (isFollowing) {
        await followsApi.unfollow(targetUserId);
        setIsFollowing(false);
        // 팔로워 수 감소
        if (followersCount !== null) {
          setFollowersCount(Math.max(0, followersCount - 1));
        }
      } else {
        try {
          await followsApi.follow(targetUserId);
          setIsFollowing(true);
          // 팔로워 수 증가
          if (followersCount !== null) {
            setFollowersCount(followersCount + 1);
          }
        } catch (err: any) {
          // 409 Conflict는 이미 팔로우 중인 경우
          if (err.response?.status === 409) {
            setIsFollowing(true);
            // 이미 팔로우 중이므로 팔로워 수는 변하지 않음
          } else {
            throw err;
          }
        }
      }
    } catch (err: any) {
      // 404 Not Found는 팔로우하지 않은 상태에서 언팔로우 시도한 경우
      if (err.response?.status === 404 && isFollowing) {
        setIsFollowing(false);
        // 팔로워 수 감소
        if (followersCount !== null) {
          setFollowersCount(Math.max(0, followersCount - 1));
        }
      } else {
        alert(err.response?.data?.message || '팔로우 처리에 실패했습니다.');
      }
    } finally {
      setFollowLoading(false);
    }
  }, [isAuthenticated, navigate, targetUserId, isOwnProfile, isFollowing, followersCount]);

  const handlePostLike = useCallback(async (postId: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    // 현재 게시글의 좋아요 상태 확인
    const post = posts.find((p) => p.postId === postId);
    if (!post) return;

    const previousLikeCount = post.likeCount || 0;
    const isCurrentlyLiked = post.isLiked || false;

    // 낙관적 업데이트: 즉시 UI 업데이트
    setPosts((prevPosts) =>
      prevPosts.map((p) =>
        p.postId === postId
          ? {
              ...p,
              likeCount: isCurrentlyLiked ? Math.max(0, previousLikeCount - 1) : previousLikeCount + 1,
              isLiked: !isCurrentlyLiked,
            }
          : p
      )
    );

    try {
      let likeData: LikeResponse;
      if (isCurrentlyLiked) {
        const response = await likesApi.removeLike(postId);
        likeData = response.data;
      } else {
        try {
          const response = await likesApi.addLike(postId);
          likeData = response.data;
        } catch (err: any) {
          // 409 Conflict는 이미 좋아요한 경우 - 정상 처리
          if (err.response?.status === 409) {
            // 이미 좋아요한 상태이므로 최신 정보 조회
            const likeInfo = await likesApi.getLikeInfo(postId);
            likeData = likeInfo.data;
          } else {
            throw err;
          }
        }
      }

      // API 응답으로 최신 상태 업데이트
      if (likeData) {
        setPosts((prevPosts) =>
          prevPosts.map((p) =>
            p.postId === postId
              ? {
                  ...p,
                  likeCount: likeData.likeCount,
                  isLiked: likeData.checkLike,
                }
              : p
          )
        );
      }
    } catch (error: unknown) {
      // 실패 시 롤백
      setPosts((prevPosts) =>
        prevPosts.map((p) =>
          p.postId === postId
            ? {
                ...p,
                likeCount: previousLikeCount,
                isLiked: isCurrentlyLiked,
              }
            : p
        )
      );
      const apiError = handleApiError(error);
      if (apiError.status !== 409) {
        console.error('좋아요 처리 실패:', apiError);
      }
    }
  }, [isAuthenticated, navigate, posts]);



  if (loading) {
    return <LoadingSpinner />;
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-slate-500 dark:text-slate-400">프로필을 찾을 수 없습니다.</div>
      </div>
    );
  }

  return (
    <main className="flex-1 flex justify-center py-8 px-4 md:px-8">
      <div className="w-full max-w-[900px]">
        {/* Profile Header Section */}
        <div className="bg-card rounded-lg p-8 border border-border mb-6">
          {/* Profile Image and Name */}
          <div className="flex items-start gap-6 mb-6">
            <div className="bg-gradient-to-br from-primary to-primary/80 aspect-square rounded-full size-24 flex items-center justify-center flex-shrink-0">
              <span className="text-3xl font-bold text-primary-foreground">
                {profile.nickname.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1">
              <h1 className="text-foreground text-2xl font-bold mb-1">
                {profile.nickname}
              </h1>
              <p className="text-muted-foreground text-base">
                {profile.blogTitle || 'Frontend Engineer'}
              </p>
            </div>
          </div>

          {/* Divider */}
          <div className="h-px bg-border w-full mb-6"></div>

          {/* Icons and Follow Info */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* Social Icons - 현재는 비어있음 */}
            </div>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => {
                    setShowFollowersModal(true);
                    setFollowersPage(0);
                  }}
                  className="text-foreground hover:text-primary transition-colors cursor-pointer"
                >
                  <span className="font-medium">{followersCount ?? 0}</span>
                  <span className="text-muted-foreground ml-1">팔로워</span>
                </button>
                <button
                  onClick={() => {
                    setShowFollowingsModal(true);
                    setFollowingsPage(0);
                  }}
                  className="text-foreground hover:text-primary transition-colors cursor-pointer"
                >
                  <span className="font-medium">{followingsCount ?? 0}</span>
                  <span className="text-muted-foreground ml-1">팔로잉</span>
                </button>
              </div>
              {!isOwnProfile && isAuthenticated && (
                <button
                  onClick={handleFollow}
                  disabled={followLoading}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    isFollowing
                      ? 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                      : 'bg-primary text-primary-foreground hover:bg-primary/90'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {followLoading ? '처리 중...' : isFollowing ? '언팔로우' : '팔로우'}
                </button>
              )}
              {isOwnProfile && (
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setShowPasswordModal(true);
                      setPassword('');
                      setPasswordError('');
                    }}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-full text-sm font-medium hover:bg-primary/90 transition-colors"
                  >
                    프로필 수정
                  </button>
                  <button
                    onClick={() => {
                      setShowDeleteModal(true);
                      setDeletePassword('');
                      setDeleteError('');
                    }}
                    className="px-4 py-2 bg-red-600 text-white rounded-full text-sm font-medium hover:bg-red-700 transition-colors"
                  >
                    회원 탈퇴
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-border mb-6">
          <div className="flex gap-8 justify-center">
            <button
              onClick={() => setActiveTab('articles')}
              className="relative flex flex-col items-center justify-center pb-3 pt-2 group"
            >
              <p
                className={`text-base font-medium leading-normal transition-colors ${
                  activeTab === 'articles'
                    ? 'text-foreground'
                    : 'text-muted-foreground group-hover:text-foreground'
                }`}
              >
                글
              </p>
              {activeTab === 'articles' && (
                <span className="absolute bottom-0 h-[3px] w-full bg-primary rounded-t-sm"></span>
              )}
              {activeTab !== 'articles' && (
                <span className="absolute bottom-0 h-[3px] w-full bg-transparent group-hover:bg-muted transition-colors rounded-t-sm"></span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('about')}
              className="relative flex flex-col items-center justify-center pb-3 pt-2 group"
            >
              <p
                className={`text-base font-medium leading-normal transition-colors ${
                  activeTab === 'about'
                    ? 'text-foreground'
                    : 'text-muted-foreground group-hover:text-foreground'
                }`}
              >
                소개
              </p>
              {activeTab === 'about' && (
                <span className="absolute bottom-0 h-[3px] w-full bg-primary rounded-t-sm"></span>
              )}
              {activeTab !== 'about' && (
                <span className="absolute bottom-0 h-[3px] w-full bg-transparent group-hover:bg-muted transition-colors rounded-t-sm"></span>
              )}
            </button>
          </div>
        </div>

        {/* Content Section */}
        <section className="flex-1 min-w-0">

          {/* Tab Content */}
          {activeTab === 'articles' && (
            <div className="flex flex-col gap-8 pb-12">
              {posts.length === 0 ? (
                <p className="text-muted-foreground">작성한 게시글이 없습니다.</p>
              ) : (
                posts.map((post, index) => (
                  <div key={post.postId}>
                    <article className="flex flex-col gap-4 group">
                      {/* Post Thumbnail */}
                      {index % 3 !== 2 && (
                        <Link
                          to={`/posts/${post.postId}`}
                          className="block overflow-hidden rounded-xl aspect-video md:aspect-[2.5/1] relative w-full"
                        >
                          <div
                            className="absolute inset-0 bg-cover bg-center transform group-hover:scale-105 transition-transform duration-500 ease-out"
                            style={{
                              backgroundImage: `url("${getPostThumbnailUrl(post.postId)}")`,
                            }}
                          ></div>
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors"></div>
                        </Link>
                      )}

                      {/* Post Content */}
                      <div className="flex flex-col gap-2">
                        <Link to={`/posts/${post.postId}`} className="block">
                          <h2 className="text-xl md:text-2xl font-bold text-foreground group-hover:text-primary transition-colors leading-tight">
                            {post.title}
                          </h2>
                        </Link>
                        <p className="text-foreground/80 text-base line-clamp-2 md:line-clamp-3 leading-relaxed">
                          {truncateText(post.content, 200)}
                        </p>
                        <div className="flex flex-wrap items-center gap-3 mt-1 text-sm text-slate-500 dark:text-[#90c1cb]">
                          <span>{formatDate(post.createdAt, 'MMM dd, yyyy')}</span>
                          {post.commentCount !== undefined && (
                            <>
                              <span className="size-1 rounded-full bg-slate-300 dark:bg-[#315f68]"></span>
                              <span className="flex items-center gap-1">
                                <span className="material-symbols-outlined text-[16px]">chat_bubble</span>
                                {post.commentCount} comments
                              </span>
                            </>
                          )}
                          {post.likeCount !== undefined && (
                            <>
                              <span className="size-1 rounded-full bg-slate-300 dark:bg-[#315f68]"></span>
                              <span
                                onClick={(e) => handlePostLike(post.postId, e)}
                                className={`flex items-center gap-1 transition-colors cursor-pointer ${
                                  post.isLiked
                                    ? 'text-red-500 dark:text-red-400'
                                    : 'text-slate-500 dark:text-[#90c1cb] hover:text-red-400'
                                }`}
                              >
                                <span
                                  className={`material-symbols-outlined text-[16px] ${
                                    post.isLiked ? 'fill-current' : ''
                                  }`}
                                  style={post.isLiked ? { fontVariationSettings: "'FILL' 1" } : {}}
                                >
                                  favorite
                                </span>
                                {post.likeCount} likes
                              </span>
                            </>
                          )}
                        </div>
                        {/* Tags */}
                        {post.tags && post.tags.length > 0 && (
                          <div className="flex gap-2 mt-1">
                            {post.tags.slice(0, 5).map((tag) => (
                              <Link
                                key={tag}
                                to={`/?tag=${encodeURIComponent(tag)}`}
                                className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-[#224249] text-primary hover:bg-primary/20 transition-colors"
                              >
                                #{tag}
                              </Link>
                            ))}
                          </div>
                        )}
                      </div>
                    </article>
                    {index < posts.length - 1 && <div className="h-px w-full bg-slate-200 dark:bg-[#224249] mt-8"></div>}
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'about' && (
            <div className="flex flex-col gap-8 pb-12">
              <div className="prose prose-slate dark:prose-invert max-w-none">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">About</h2>
                <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                  {profile.blogTitle || 'Full-stack engineer passionate about React, Node.js, and Cloud Architecture. Building things for the web and sharing what I learn along the way.'}
                </p>
              </div>
            </div>
          )}
        </section>
      </div>

      {/* 팔로워 모달 */}
      {showFollowersModal && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-lg shadow-xl max-w-md w-full max-h-[80vh] flex flex-col border border-border">
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h2 className="text-xl font-bold text-foreground">팔로워</h2>
              <button
                onClick={() => {
                  setShowFollowersModal(false);
                  setFollowersPage(0);
                }}
                className="text-muted-foreground hover:text-foreground"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="overflow-y-auto flex-1 p-4">
              {followersLoading && followers.length === 0 ? (
                <LoadingSpinner />
              ) : followers.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">팔로워가 없습니다.</p>
              ) : (
                <div className="space-y-3">
                  {followers.map((follower) => (
                    <div
                      key={follower.userId}
                      className="flex items-center justify-between p-3 rounded-lg hover:bg-muted transition-colors"
                    >
                      <div
                        className="flex items-center gap-3 cursor-pointer flex-1"
                        onClick={() => {
                          navigate(`/profile/${follower.userId}`);
                          setShowFollowersModal(false);
                        }}
                      >
                        <div className="size-10 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center">
                          <span className="text-sm font-bold text-primary-foreground">
                            {follower.nickname.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="font-semibold text-foreground">{follower.nickname}</p>
                          {follower.isFollowing && (
                            <span className="text-xs text-muted-foreground">팔로우 중</span>
                          )}
                        </div>
                      </div>
                      {isAuthenticated && user?.userId !== follower.userId && (
                        <button
                          onClick={async (e) => {
                            e.stopPropagation();
                            try {
                              if (follower.isFollowing) {
                                await followsApi.unfollow(follower.userId);
                                // 팔로워 목록에서는 isFollowing만 false로 변경 (팔로워는 여전히 나를 팔로우하므로 목록에 남음)
                                setFollowers((prev) =>
                                  prev.map((f) =>
                                    f.userId === follower.userId ? { ...f, isFollowing: false } : f
                                  )
                                );
                                // 팔로잉 수 감소
                                if (followingsCount !== null) {
                                  setFollowingsCount(Math.max(0, followingsCount - 1));
                                }
                              } else {
                                await followsApi.follow(follower.userId);
                                setFollowers((prev) =>
                                  prev.map((f) =>
                                    f.userId === follower.userId ? { ...f, isFollowing: true } : f
                                  )
                                );
                                // 팔로잉 수 증가
                                if (followingsCount !== null) {
                                  setFollowingsCount(followingsCount + 1);
                                }
                              }
                            } catch (error: any) {
                              // 409 Conflict는 이미 팔로우 중인 경우 - 정상 처리
                              if (error.response?.status === 409) {
                                setFollowers((prev) =>
                                  prev.map((f) =>
                                    f.userId === follower.userId ? { ...f, isFollowing: true } : f
                                  )
                                );
                              } else {
                                console.error('팔로우 처리 실패:', error);
                              }
                            }
                          }}
                          className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                            follower.isFollowing
                              ? 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                              : 'bg-primary text-primary-foreground hover:bg-primary/90'
                          }`}
                        >
                          {follower.isFollowing ? '언팔로우' : '팔로우'}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
            {followersPageInfo && !followersPageInfo.last && (
              <div className="p-4 border-t border-border">
                <button
                  onClick={() => setFollowersPage((prev) => prev + 1)}
                  disabled={followersLoading}
                  className="w-full px-4 py-2 bg-muted text-foreground rounded-md font-medium hover:bg-muted/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {followersLoading ? '로딩 중...' : '더 보기'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 팔로잉 모달 */}
      {showFollowingsModal && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-lg shadow-xl max-w-md w-full max-h-[80vh] flex flex-col border border-border">
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h2 className="text-xl font-bold text-foreground">팔로잉</h2>
              <button
                onClick={() => {
                  setShowFollowingsModal(false);
                  setFollowingsPage(0);
                }}
                className="text-muted-foreground hover:text-foreground"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="overflow-y-auto flex-1 p-4">
              {followingsLoading && followings.length === 0 ? (
                <LoadingSpinner />
              ) : followings.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">팔로잉이 없습니다.</p>
              ) : (
                <div className="space-y-3">
                  {followings.map((following) => (
                    <div
                      key={following.userId}
                      className="flex items-center justify-between p-3 rounded-lg hover:bg-muted transition-colors"
                    >
                      <div
                        className="flex items-center gap-3 cursor-pointer flex-1"
                        onClick={() => {
                          navigate(`/profile/${following.userId}`);
                          setShowFollowingsModal(false);
                        }}
                      >
                        <div className="size-10 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center">
                          <span className="text-sm font-bold text-primary-foreground">
                            {following.nickname.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="font-semibold text-foreground">{following.nickname}</p>
                        </div>
                      </div>
                      {isAuthenticated && user?.userId !== following.userId && (
                        <button
                          onClick={async (e) => {
                            e.stopPropagation();
                            try {
                              if (following.isFollowing) {
                                await followsApi.unfollow(following.userId);
                                // 팔로잉 목록에서 언팔로우하면 목록에서 제거 (내가 팔로우하지 않으므로)
                                setFollowings((prev) =>
                                  prev.filter((f) => f.userId !== following.userId)
                                );
                                // 팔로잉 수 감소
                                if (followingsCount !== null) {
                                  setFollowingsCount(Math.max(0, followingsCount - 1));
                                }
                              } else {
                                await followsApi.follow(following.userId);
                                setFollowings((prev) =>
                                  prev.map((f) =>
                                    f.userId === following.userId ? { ...f, isFollowing: true } : f
                                  )
                                );
                                // 팔로잉 수 증가
                                if (followingsCount !== null) {
                                  setFollowingsCount(followingsCount + 1);
                                }
                              }
                            } catch (error: any) {
                              // 409 Conflict는 이미 팔로우 중인 경우 - 정상 처리
                              if (error.response?.status === 409) {
                                setFollowings((prev) =>
                                  prev.map((f) =>
                                    f.userId === following.userId ? { ...f, isFollowing: true } : f
                                  )
                                );
                              } else {
                                console.error('팔로우 처리 실패:', error);
                              }
                            }
                          }}
                          className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                            following.isFollowing
                              ? 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                              : 'bg-primary text-primary-foreground hover:bg-primary/90'
                          }`}
                        >
                          {following.isFollowing ? '언팔로우' : '팔로우'}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
            {followingsPageInfo && !followingsPageInfo.last && (
              <div className="p-4 border-t border-border">
                <button
                  onClick={() => setFollowingsPage((prev) => prev + 1)}
                  disabled={followingsLoading}
                  className="w-full px-4 py-2 bg-muted text-foreground rounded-md font-medium hover:bg-muted/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {followingsLoading ? '로딩 중...' : '더 보기'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 비밀번호 확인 모달 */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-lg shadow-xl max-w-md w-full p-6 border border-border">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-foreground">비밀번호 확인</h2>
              <button
                onClick={() => {
                  setShowPasswordModal(false);
                  setPassword('');
                  setPasswordError('');
                }}
                className="text-muted-foreground hover:text-foreground"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <p className="text-muted-foreground mb-6">
              프로필 수정을 위해 비밀번호를 입력해주세요.
            </p>
            {passwordError && (
              <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-400 rounded text-sm">
                {passwordError}
              </div>
            )}
            <div className="mb-6">
              <label className="block text-sm font-medium text-foreground mb-2">
                비밀번호
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setPasswordError('');
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !verifying) {
                    handlePasswordVerify();
                  }
                }}
                className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="비밀번호를 입력하세요"
                autoFocus
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={handlePasswordVerify}
                disabled={verifying || !password.trim()}
                className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-md font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {verifying ? '확인 중...' : '확인'}
              </button>
              <button
                onClick={() => {
                  setShowPasswordModal(false);
                  setPassword('');
                  setPasswordError('');
                }}
                disabled={verifying}
                className="flex-1 px-4 py-2 bg-secondary text-secondary-foreground rounded-md font-medium hover:bg-secondary/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 회원 탈퇴 모달 */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-lg shadow-xl max-w-md w-full p-6 border border-border">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-foreground">회원 탈퇴</h2>
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeletePassword('');
                  setDeleteError('');
                }}
                className="text-muted-foreground hover:text-foreground"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <p className="text-muted-foreground mb-6">
              정말 회원 탈퇴를 하시겠습니까? 모든 데이터가 삭제되며 되돌릴 수 없습니다.
              비밀번호를 입력하여 확인해주세요.
            </p>
            {deleteError && (
              <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-400 rounded text-sm">
                {deleteError}
              </div>
            )}
            <div className="mb-6">
              <label className="block text-sm font-medium text-foreground mb-2">
                비밀번호
              </label>
              <input
                type="password"
                value={deletePassword}
                onChange={(e) => {
                  setDeletePassword(e.target.value);
                  setDeleteError('');
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !deleteLoading) {
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
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeletePassword('');
                  setDeleteError('');
                }}
                disabled={deleteLoading}
                className="flex-1 px-4 py-2 bg-secondary text-secondary-foreground rounded-md font-medium hover:bg-secondary/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleteLoading || !deletePassword.trim()}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {deleteLoading ? '탈퇴 중...' : '탈퇴하기'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};

export default ProfilePage;

