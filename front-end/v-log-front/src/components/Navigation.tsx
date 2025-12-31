import { SortField } from '../api/posts';

interface NavigationProps {
  sort: SortField;
  asc: boolean;
  onSortChange: (sort: SortField) => void;
  onSortDirectionChange: (asc: boolean) => void;
}

const SORT_OPTIONS: { value: SortField; label: string; icon: string }[] = [
  { value: 'CREATED_AT', label: '최신순', icon: 'schedule' },
  { value: 'LIKE', label: '좋아요순', icon: 'favorite' },
  { value: 'VIEW', label: '조회수순', icon: 'visibility' },
  { value: 'UPDATED_AT', label: '수정일순', icon: 'edit' },
];

const Navigation = ({ sort, asc, onSortChange, onSortDirectionChange }: NavigationProps) => {
  return (
    <div className="flex items-center gap-6 flex-wrap">
      {/* 정렬 옵션 버튼들 */}
      <div className="flex items-center gap-4">
        {SORT_OPTIONS.map((option) => (
          <button
            key={option.value}
            className={`flex items-center gap-2 pb-2 border-b-2 transition-colors h-auto p-0 ${
              sort === option.value
                ? 'border-foreground text-foreground'
                : 'border-transparent hover:text-foreground/80 text-muted-foreground'
            }`}
            onClick={() => onSortChange(option.value)}
          >
            <span className="material-symbols-outlined text-xl">{option.icon}</span>
            <span className="font-bold text-base">{option.label}</span>
          </button>
        ))}
      </div>

      <div className="w-24 border-b border-border flex-1"></div>

      {/* 정렬 방향 토글 */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => onSortDirectionChange(!asc)}
          className="flex items-center gap-1 px-3 py-1.5 rounded-md text-sm font-medium transition-colors bg-background text-foreground hover:bg-muted border border-border"
          title={asc ? '오름차순' : '내림차순'}
        >
          <span className="material-symbols-outlined text-lg">
            {asc ? 'arrow_upward' : 'arrow_downward'}
          </span>
          <span className="hidden sm:inline">{asc ? '오름차순' : '내림차순'}</span>
        </button>
      </div>
    </div>
  );
};

export default Navigation;

