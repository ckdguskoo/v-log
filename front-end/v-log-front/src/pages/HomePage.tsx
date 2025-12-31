import { useState, useEffect, useCallback } from 'react';
import PostGrid from '../components/PostGrid';
import Navigation from '../components/Navigation';
import TagFilter from '../components/TagFilter';
import { postsApi, SortField } from '../api/posts';
import { PostListResponse, PageInfo } from '../types';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { ErrorMessage } from '../components/common/ErrorMessage';
import { handleApiError } from '../api/client';
import { useSearchParams } from '../hooks/useSearchParams';

// 백엔드 기본값과 일치
const DEFAULT_SORT: SortField = 'CREATED_AT';

function HomePage() {
  const [queryParams, setSearchParams, searchParams] = useSearchParams();
  const [posts, setPosts] = useState<PostListResponse[]>([]);
  const [pageInfo, setPageInfo] = useState<PageInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const fetchPosts = useCallback(async (page: number = 0) => {
    setLoading(true);
    setError(null);
    try {
      // API 파라미터 구성
      const params: any = {
        page,
        size: 12,
      };

      // 정렬 파라미터 (기본값이 아닐 때만 전달)
      if (queryParams.sort !== DEFAULT_SORT) {
        params.sort = queryParams.sort;
      }
      if (queryParams.asc) {
        params.asc = true;
      }

      // 태그 필터
      if (queryParams.tags.length > 0) {
        params.tag = queryParams.tags;
        // 태그 모드는 기본값(OR)이 아닐 때만 전달
        if (queryParams.tagMode !== 'OR') {
          params.tagMode = queryParams.tagMode;
        }
      }

      // 검색 키워드
      if (queryParams.keyword) {
        params.keyword = queryParams.keyword;
        if (queryParams.search !== 'TITLE') {
          params.search = queryParams.search;
        }
      }

      const response = await postsApi.getPosts(params);

      setPosts(response.content);
      setPageInfo(response.pageInfo);
      setCurrentPage(page);
    } catch (error: unknown) {
      const apiError = handleApiError(error);
      console.error('게시글을 불러오는데 실패했습니다:', apiError);
      setError(apiError.message);
    } finally {
      setLoading(false);
    }
  }, [queryParams]);

  // URL 파라미터 변경 시 재조회
  useEffect(() => {
    const page = queryParams.page;
    fetchPosts(page);
  }, [queryParams, fetchPosts]);

  const handleTagsChange = useCallback((tags: string[]) => {
    const newParams = new URLSearchParams(searchParams);
    // 기존 태그 파라미터 모두 제거
    newParams.delete('tag');
    // 새 태그들 추가
    tags.forEach((tag) => {
      newParams.append('tag', tag);
    });
    // 태그가 없으면 태그 모드도 제거
    if (tags.length === 0) {
      newParams.delete('tagMode');
    }
    // 태그 변경 시 첫 페이지로 리셋
    newParams.delete('page');
    setSearchParams(newParams);
  }, [searchParams, setSearchParams]);

  const handleTagModeChange = useCallback((mode: 'OR' | 'AND' | 'NAND') => {
    const newParams = new URLSearchParams(searchParams);
    if (mode === 'OR') {
      newParams.delete('tagMode');
    } else {
      newParams.set('tagMode', mode);
    }
    // 태그 모드 변경 시 첫 페이지로 리셋
    newParams.delete('page');
    setSearchParams(newParams);
  }, [searchParams, setSearchParams]);

  const handlePageChange = useCallback((newPage: number) => {
    const newParams = new URLSearchParams(searchParams);
    if (newPage === 0) {
      newParams.delete('page');
    } else {
      newParams.set('page', newPage.toString());
    }
    setSearchParams(newParams);
    // 스크롤을 맨 위로 이동
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [searchParams, setSearchParams]);

  const handleSortChange = useCallback((newSort: SortField) => {
    const newParams = new URLSearchParams(searchParams);
    if (newSort !== DEFAULT_SORT) {
      newParams.set('sort', newSort);
    } else {
      newParams.delete('sort');
    }
    setSearchParams(newParams);
  }, [searchParams, setSearchParams]);

  const handleSortDirectionChange = useCallback((newAsc: boolean) => {
    const newParams = new URLSearchParams(searchParams);
    if (newAsc) {
      newParams.set('asc', 'true');
    } else {
      newParams.delete('asc');
    }
    setSearchParams(newParams);
  }, [searchParams, setSearchParams]);

  const getSearchFieldLabel = useCallback((field: 'TITLE' | 'NICKNAME') => {
    switch (field) {
      case 'TITLE':
        return '제목';
      case 'NICKNAME':
        return '작성자';
      default:
        return '제목';
    }
  }, []);

  const handleClearSearch = useCallback(() => {
    const newParams = new URLSearchParams(searchParams);
    newParams.delete('keyword');
    newParams.delete('search');
    setSearchParams(newParams);
  }, [searchParams, setSearchParams]);

  return (
    <main className="flex-1 w-full max-w-[1440px] mx-auto px-4 md:px-8 py-8">
      <div className="mb-12 flex flex-col gap-6">
        <Navigation
          sort={queryParams.sort}
          asc={queryParams.asc}
          onSortChange={handleSortChange}
          onSortDirectionChange={handleSortDirectionChange}
        />
        <TagFilter
          selectedTags={queryParams.tags}
          tagMode={queryParams.tagMode}
          onTagsChange={handleTagsChange}
          onTagModeChange={handleTagModeChange}
        />
      </div>
      
      {/* 검색 결과 표시 */}
      {queryParams.keyword && (
        <div className="mb-6 flex items-center justify-between p-4 bg-card border border-border rounded-lg">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-muted-foreground">search</span>
            <span className="text-sm text-foreground">
              <span className="font-medium">{getSearchFieldLabel(queryParams.search)}</span>
              {' '}검색: <span className="font-semibold text-primary">{queryParams.keyword}</span>
              {pageInfo && (
                <span className="text-muted-foreground ml-2">
                  ({pageInfo.totalElements}개 결과)
                </span>
              )}
            </span>
          </div>
          <button
            onClick={handleClearSearch}
            className="px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
            title="검색 초기화"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>
      )}

      {error ? (
        <ErrorMessage message={error} onRetry={() => handlePageChange(0)} className="mt-16 pb-10" />
      ) : loading && posts.length === 0 ? (
        <LoadingSpinner className="mt-16 pb-10" />
      ) : posts.length === 0 ? (
        <div className="mt-16 pb-10 text-center">
          <span className="material-symbols-outlined text-6xl text-muted-foreground mb-4 block">search_off</span>
          <p className="text-lg text-muted-foreground mb-2">
            {queryParams.keyword ? '검색 결과가 없습니다' : '게시글이 없습니다'}
          </p>
          {queryParams.keyword && (
            <button
              onClick={handleClearSearch}
              className="text-sm text-primary hover:underline"
            >
              검색 초기화
            </button>
          )}
        </div>
      ) : (
        <>
          <PostGrid posts={posts} />
          {/* 페이지네이션 */}
          {pageInfo && pageInfo.totalPages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-2 pb-10">
              {/* 이전 페이지 버튼 */}
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={pageInfo.first || loading}
                className="px-4 py-2 bg-card border border-border text-foreground rounded-md font-medium hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-lg">chevron_left</span>
                <span>이전</span>
              </button>

              {/* 페이지 번호 */}
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, pageInfo.totalPages) }, (_, i) => {
                  let pageNum: number;
                  if (pageInfo.totalPages <= 5) {
                    // 전체 페이지가 5개 이하일 때는 모두 표시
                    pageNum = i;
                  } else if (currentPage < 2) {
                    // 처음 2페이지일 때
                    pageNum = i;
                  } else if (currentPage > pageInfo.totalPages - 3) {
                    // 마지막 2페이지일 때
                    pageNum = pageInfo.totalPages - 5 + i;
                  } else {
                    // 중간 페이지일 때
                    pageNum = currentPage - 2 + i;
                  }

                  return (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      disabled={loading}
                      className={`px-4 py-2 rounded-md font-medium transition-colors ${
                        currentPage === pageNum
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-card border border-border text-foreground hover:bg-muted'
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {pageNum + 1}
                    </button>
                  );
                })}
              </div>

              {/* 다음 페이지 버튼 */}
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={pageInfo.last || loading}
                className="px-4 py-2 bg-card border border-border text-foreground rounded-md font-medium hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
              >
                <span>다음</span>
                <span className="material-symbols-outlined text-lg">chevron_right</span>
              </button>
            </div>
          )}
        </>
      )}
    </main>
  );
}

export default HomePage;


