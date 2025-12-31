import { useMemo } from 'react';
import { useSearchParams as useReactRouterSearchParams } from 'react-router-dom';
import { SortField } from '../api/posts';

interface SearchParams {
  sort: SortField;
  asc: boolean;
  keyword?: string;
  search: 'TITLE' | 'NICKNAME';
  tags: string[];
  tagMode: 'OR' | 'AND' | 'NAND';
  page: number;
}

const DEFAULT_SORT: SortField = 'CREATED_AT';

export const useSearchParams = (): [SearchParams, ReturnType<typeof useReactRouterSearchParams>[1], URLSearchParams] => {
  const [searchParams, setSearchParams] = useReactRouterSearchParams();

  const params = useMemo<SearchParams>(() => {
    const sort = (searchParams.get('sort') as SortField) || DEFAULT_SORT;
    const asc = searchParams.get('asc') === 'true';
    const keyword = searchParams.get('keyword')?.trim() || undefined;
    const search = (searchParams.get('search') as 'TITLE' | 'NICKNAME') || 'TITLE';
    const tags = searchParams.getAll('tag').filter((t) => t.trim());
    const tagMode = (searchParams.get('tagMode') as 'OR' | 'AND' | 'NAND') || 'OR';
    const page = parseInt(searchParams.get('page') || '0', 10);

    return { sort, asc, keyword, search, tags, tagMode, page };
  }, [searchParams]);

  return [params, setSearchParams, searchParams];
};

