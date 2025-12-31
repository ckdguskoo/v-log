import { useState, useEffect, useCallback, useMemo } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const Header = () => {
  const [searchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get('keyword') || '');
  const [searchField, setSearchField] = useState<'TITLE' | 'NICKNAME'>(
    (searchParams.get('search') as 'TITLE' | 'NICKNAME') || 'TITLE'
  );
  const [showSearchOptions, setShowSearchOptions] = useState(false);
  const { user, logout, isAuthenticated } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();
  const navigate = useNavigate();

  // URL 파라미터 변경 시 검색어와 검색 필드 동기화
  useEffect(() => {
    const keyword = searchParams.get('keyword') || '';
    const search = (searchParams.get('search') as 'TITLE' | 'NICKNAME') || 'TITLE';
    setSearchQuery(keyword);
    setSearchField(search);
  }, [searchParams]);

  const handleSearch = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    const newParams = new URLSearchParams(searchParams);
    
    if (searchQuery.trim()) {
      newParams.set('keyword', searchQuery.trim());
      if (searchField !== 'TITLE') {
        newParams.set('search', searchField);
      } else {
        newParams.delete('search');
      }
      // 검색 시 첫 페이지로 리셋
      newParams.delete('page');
    } else {
      newParams.delete('keyword');
      newParams.delete('search');
    }
    
    navigate(`/?${newParams.toString()}`);
  }, [searchQuery, searchField, searchParams, navigate]);

  const handleLogout = useCallback(async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      // 로그아웃은 항상 로컬 상태를 정리하므로 에러가 발생해도 홈으로 이동
      navigate('/');
    }
  }, [logout, navigate]);

  const searchFieldLabel = useMemo(() => {
    return searchField === 'TITLE' ? '제목' : '작성자';
  }, [searchField]);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/90 backdrop-blur-md">
      <div className="max-w-[1440px] mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link to="/" className="flex items-center gap-2 group">
            <h1 className="text-2xl font-serif font-bold tracking-tight text-foreground">vlog.</h1>
          </Link>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-2 relative">
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowSearchOptions(!showSearchOptions)}
                className="px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground border border-border rounded-md bg-background hover:bg-muted transition-colors"
                title="검색 필드 선택"
              >
                {searchFieldLabel}
                <span className="material-symbols-outlined text-sm ml-1 align-middle">arrow_drop_down</span>
              </button>
              {showSearchOptions && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowSearchOptions(false)}
                  />
                  <div className="absolute left-0 top-full mt-1 w-32 bg-card border border-border rounded-lg shadow-lg z-20">
                    <button
                      type="button"
                      onClick={() => {
                        setSearchField('TITLE');
                        setShowSearchOptions(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-sm hover:bg-muted transition-colors ${
                        searchField === 'TITLE' ? 'text-primary font-medium' : 'text-foreground'
                      }`}
                    >
                      제목
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSearchField('NICKNAME');
                        setShowSearchOptions(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-sm hover:bg-muted transition-colors ${
                        searchField === 'NICKNAME' ? 'text-primary font-medium' : 'text-foreground'
                      }`}
                    >
                      작성자
                    </button>
                  </div>
                </>
              )}
            </div>
            <form onSubmit={handleSearch} className="flex items-center rounded-full bg-background-light dark:bg-surface-dark border border-border px-3 py-1.5 w-64">
              <span className="material-symbols-outlined text-muted-foreground text-xl">search</span>
              <input
                className="bg-transparent border-none text-sm w-full focus:ring-0 focus:outline-none text-foreground placeholder-muted-foreground"
                placeholder="게시글 검색..."
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </form>
          </div>
          <button
            className="md:hidden p-2 text-foreground/70 hover:text-foreground"
            onClick={() => {
              // 모바일에서는 검색 입력 필드를 표시하는 로직 추가 가능
            }}
          >
            <span className="material-symbols-outlined">search</span>
          </button>
          <button
            onClick={toggleTheme}
            className="p-2 text-foreground/70 hover:text-foreground"
            aria-label={isDarkMode ? '라이트 모드로 전환' : '다크 모드로 전환'}
          >
            {isDarkMode ? (
              <span className="material-symbols-outlined">light_mode</span>
            ) : (
              <span className="material-symbols-outlined">dark_mode</span>
            )}
          </button>
          {isAuthenticated ? (
            <>
              <button
                onClick={() => navigate('/posts/new')}
                className="hidden sm:flex px-4 py-2 bg-primary text-primary-foreground rounded-full text-sm font-medium hover:bg-primary/90 transition-colors"
              >
                New Post
              </button>
              <div className="relative group cursor-pointer">
                <div className="size-9 rounded-full bg-gradient-to-br from-primary to-primary/80 border border-border flex items-center justify-center">
                  <span className="text-primary-foreground text-sm font-bold">{user?.nickname?.[0]?.toUpperCase() || 'U'}</span>
                </div>
                <div className="absolute right-0 top-full mt-2 w-48 bg-background-light dark:bg-surface-dark border border-border rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform origin-top-right">
                  <ul className="py-1 text-sm text-foreground">
                    <li>
                      <Link
                        to={`/profile/${user?.userId}`}
                        className="block px-4 py-2 hover:bg-muted"
                      >
                        My Profile
                      </Link>
                    </li>
                    <li className="border-t border-border">
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2 text-red-600 dark:text-red-400 hover:bg-amber-100/80 dark:hover:bg-amber-900/20 transition-colors"
                      >
                        Logout
                      </button>
                    </li>
                  </ul>
                </div>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate('/login')}
                className="px-3 py-1.5 text-foreground/80 hover:text-foreground text-sm font-medium transition-colors"
              >
                로그인
              </button>
              <button
                onClick={() => navigate('/signup')}
                className="px-3 py-1.5 text-foreground/80 hover:text-foreground text-sm font-medium transition-colors"
              >
                회원가입
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;

