import { useState, useRef } from 'react';
import { TagMode } from '../api/posts';

// 실제 데이터베이스에 있는 태그들 (data.sql 기준)
const POPULAR_TAGS = [
  'Java',
  'Spring',
  'React',
  'Vue.js',
  'JavaScript',
  'TypeScript',
  'Node.js',
  'Python',
  'Django',
  'Docker',
  'Kubernetes',
  'AWS',
  'DevOps',
  'MySQL',
  'PostgreSQL',
  'MongoDB',
  'Redis',
  'JPA',
  'Security',
  'GraphQL',
  'REST API',
  'Microservices',
  'CI/CD',
  'TDD',
  'Clean Code',
  'Design Pattern',
  'Algorithm',
  'Data Structure',
  'Git',
  'Linux',
];

interface TagFilterProps {
  selectedTags: string[];
  tagMode: TagMode;
  onTagsChange: (tags: string[]) => void;
  onTagModeChange: (mode: TagMode) => void;
}

const TagFilter = ({ selectedTags, tagMode, onTagsChange, onTagModeChange }: TagFilterProps) => {
  const [searchTag, setSearchTag] = useState('');
  const searchRef = useRef<HTMLDivElement>(null);

  const filteredTags = POPULAR_TAGS.filter(
    (tag) =>
      tag.toLowerCase().includes(searchTag.toLowerCase()) && !selectedTags.includes(tag)
  );

  const handleTagToggle = (tag: string) => {
    if (selectedTags.includes(tag)) {
      onTagsChange(selectedTags.filter((t) => t !== tag));
    } else {
      onTagsChange([...selectedTags, tag]);
    }
  };

  const handleTagSelect = (tag: string) => {
    if (!selectedTags.includes(tag)) {
      onTagsChange([...selectedTags, tag]);
    }
    setSearchTag('');
  };

  const handleRemoveTag = (tag: string) => {
    onTagsChange(selectedTags.filter((t) => t !== tag));
  };

  const handleClearAll = () => {
    onTagsChange([]);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const trimmedSearch = searchTag.trim();
      
      if (trimmedSearch) {
        // 1. 입력한 텍스트가 이미 선택된 태그인지 확인
        const alreadySelected = selectedTags.find(
          (tag) => tag.toLowerCase() === trimmedSearch.toLowerCase()
        );
        
        if (alreadySelected) {
          // 이미 선택된 태그이므로 검색어만 초기화
          setSearchTag('');
          return;
        }
        
        // 2. 정확히 일치하는 태그가 있는 경우 (POPULAR_TAGS에 있는 경우)
        const exactMatch = POPULAR_TAGS.find(
          (tag) => tag.toLowerCase() === trimmedSearch.toLowerCase()
        );
        
        if (exactMatch) {
          handleTagSelect(exactMatch);
          return;
        }
        
        // 3. 필터링된 태그 중 첫 번째 태그가 있으면 선택
        if (filteredTags.length > 0) {
          handleTagSelect(filteredTags[0]);
          return;
        }
        
        // 4. 입력한 텍스트를 그대로 태그로 추가 (새로운 태그)
        if (!selectedTags.includes(trimmedSearch)) {
          onTagsChange([...selectedTags, trimmedSearch]);
          setSearchTag('');
        }
      }
    }
  };

  return (
    <div className="flex flex-col gap-3">
      {/* 선택된 태그 표시 */}
      {selectedTags.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-foreground/80">선택된 태그:</span>
          {selectedTags.map((tag) => (
            <div
              key={tag}
              className="flex items-center gap-1 px-3 py-1 bg-primary/20 dark:bg-primary/30 rounded-full text-sm font-medium text-primary dark:text-primary"
            >
              <span>{tag}</span>
              <button
                onClick={() => handleRemoveTag(tag)}
                className="ml-1 hover:bg-primary/30 rounded-full p-0.5 transition-colors"
              >
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>
          ))}
          <button
            onClick={handleClearAll}
            className="text-xs text-muted-foreground hover:text-foreground h-auto p-0"
          >
            모두 제거
          </button>
        </div>
      )}

      {/* 태그 모드 선택 */}
      {selectedTags.length > 0 && (
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-foreground/80">태그 모드:</span>
          <div className="flex gap-2">
            {(['OR', 'AND'] as TagMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => onTagModeChange(mode)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  tagMode === mode
                    ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                    : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                }`}
              >
                {mode === 'OR' && '또는 (OR)'}
                {mode === 'AND' && '모두 (AND)'}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 태그 검색 창 - 상시 표시 */}
      <div ref={searchRef} className="relative">
        <div className="flex items-center rounded-lg bg-background-light dark:bg-surface-dark border border-border px-3 py-2">
          <span className="material-symbols-outlined text-muted-foreground text-xl mr-2">search</span>
          <input
            type="text"
            value={searchTag}
            onChange={(e) => setSearchTag(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="태그 검색..."
            className="bg-transparent border-none text-sm w-full focus:ring-0 focus:outline-none text-foreground placeholder-muted-foreground"
          />
          {searchTag && (
            <button
              onClick={() => setSearchTag('')}
              className="ml-2 text-muted-foreground hover:text-foreground"
            >
              <span className="material-symbols-outlined text-xl">close</span>
            </button>
          )}
        </div>
        {searchTag && filteredTags.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-background-light dark:bg-surface-dark border border-border rounded-lg shadow-lg max-h-60 overflow-y-auto z-10">
            {filteredTags.map((tag) => (
              <button
                key={tag}
                onClick={() => handleTagSelect(tag)}
                className="w-full text-left px-4 py-2 hover:bg-muted text-foreground text-sm transition-colors"
              >
                {tag}
              </button>
            ))}
          </div>
        )}
        {searchTag && filteredTags.length === 0 && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-background-light dark:bg-surface-dark border border-border rounded-lg shadow-lg p-4 z-10">
            <p className="text-sm text-muted-foreground text-center">
              검색 결과가 없습니다
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TagFilter;

