import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { postsApi } from '../api/posts';
import { useAuth } from '../context/AuthContext';
import ProtectedRoute from '../components/ProtectedRoute';

const PostEditPage = () => {
  const { postId } = useParams<{ postId: string }>();
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const { isAuthenticated } = useAuth();
  const titleTextareaRef = useRef<HTMLTextAreaElement>(null);
  const contentTextareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const fetchPost = async () => {
      if (!postId) return;

      try {
        setLoading(true);
        const post = await postsApi.getPost(Number(postId));
        setTitle(post.title);
        setContent(post.content);
        setTags(post.tags || []);
      } catch (err: any) {
        setError('게시글을 불러오는데 실패했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [postId]);

  // 제목 textarea 자동 높이 조절
  useEffect(() => {
    if (titleTextareaRef.current) {
      titleTextareaRef.current.style.height = '';
      titleTextareaRef.current.style.height = titleTextareaRef.current.scrollHeight + 'px';
    }
  }, [title]);

  const insertTextAtCursor = (before: string, after: string = '') => {
    const textarea = contentTextareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);
    const newText = content.substring(0, start) + before + selectedText + after + content.substring(end);
    setContent(newText);

    // 커서 위치 조정
    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + before.length + selectedText.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  const insertMarkdown = (markdown: string) => {
    const textarea = contentTextareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const newText = content.substring(0, start) + markdown + content.substring(start);
    setContent(newText);

    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + markdown.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  // 키보드 단축키
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // textarea에 포커스가 있을 때만 작동
      if (document.activeElement !== contentTextareaRef.current) return;

      // Ctrl/Cmd + B: Bold
      if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
        e.preventDefault();
        insertTextAtCursor('**', '**');
      }
      // Ctrl/Cmd + I: Italic
      if ((e.ctrlKey || e.metaKey) && e.key === 'i') {
        e.preventDefault();
        insertTextAtCursor('*', '*');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [content]);

  const handleAddTag = () => {
    const trimmedTag = tagInput.trim().toUpperCase();
    if (trimmedTag && !tags.includes(trimmedTag)) {
      setTags([...tags, trimmedTag]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  const handleTagInputKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      handleAddTag();
    }
  };

  const handleSave = async () => {
    if (!postId) return;

    setError('');
    setSaving(true);

    try {
      const response = await postsApi.updatePost(Number(postId), {
        title: title.trim(),
        content: content.trim(),
        tags: tags.length > 0 ? tags : undefined,
      });
      navigate(`/posts/${response.postId}`);
    } catch (err: any) {
      setError(err.response?.data?.message || '게시글 수정에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-muted-foreground">로딩 중...</div>
      </div>
    );
  }

  return (
    <ProtectedRoute>
      <div className="bg-background text-foreground font-display min-h-screen flex flex-col">
        {/* Top Navigation Bar */}
        <nav className="w-full h-16 border-b border-border bg-card flex items-center justify-between px-6 shrink-0 z-50">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
            >
              <span className="material-symbols-outlined">
                arrow_back
              </span>
            </button>
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400 hidden sm:block">Exit</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleSave}
              disabled={saving || !title.trim() || !content.trim()}
              className="px-4 py-2 bg-primary text-white rounded-md font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-[0_0_15px_rgba(13,204,242,0.3)]"
            >
              {saving ? '수정 중...' : '수정하기'}
            </button>
          </div>
        </nav>

        {/* Main Content Area */}
        <main className="flex-1 flex w-full relative">
          {/* Editor Canvas */}
          <div className="flex-1 overflow-y-auto h-[calc(100vh-4rem)] bg-background scroll-smooth">
            <div className="max-w-[900px] mx-auto px-6 py-12 flex flex-col gap-6">
              {error && (
                <div className="p-3 bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-400 rounded text-sm">
                  {error}
                </div>
              )}

              {/* Title Input */}
              <div className="group relative">
                <textarea
                  ref={titleTextareaRef}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-transparent border-none text-4xl sm:text-5xl font-extrabold text-slate-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-[#55757d] focus:ring-0 resize-none overflow-hidden leading-tight p-0"
                  placeholder="Title"
                  rows={1}
                  style={{ height: '64px' }}
                />
                <div className="h-1 w-20 bg-gray-300 dark:bg-[#182b2f] mt-6 mb-2"></div>
              </div>

              {/* Tags Input Area */}
              <div className="flex flex-col gap-2">
                <div className="flex flex-wrap items-center gap-2 min-h-[48px] p-3 rounded-lg border border-input bg-card focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all">
                  {tags.length > 0 && (
                    <>
                      {tags.map((tag) => (
                        <div
                          key={tag}
                          className="animate-fade-in flex h-8 items-center gap-x-2 rounded-full bg-primary/10 dark:bg-primary/20 pl-3 pr-2 text-primary ring-1 ring-primary/30 hover:ring-primary/50 transition-all group"
                        >
                          <span className="text-xs font-bold tracking-wide">{tag}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveTag(tag)}
                            className="text-primary/70 hover:text-primary transition-colors"
                            aria-label={`Remove ${tag} tag`}
                          >
                            <span className="material-symbols-outlined text-[16px]">close</span>
                          </button>
                        </div>
                      ))}
                      <div className="h-6 w-px bg-gray-300 dark:bg-[#2a4349]"></div>
                    </>
                  )}
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyPress={handleTagInputKeyPress}
                    onKeyDown={(e) => {
                      if (e.key === 'Backspace' && tagInput === '' && tags.length > 0) {
                        handleRemoveTag(tags[tags.length - 1]);
                      }
                    }}
                    className="flex-1 bg-transparent border-none focus:ring-0 text-base text-slate-700 dark:text-gray-300 placeholder:text-gray-400 dark:placeholder:text-[#55757d] min-w-[120px] p-0 h-8 outline-none"
                    placeholder={tags.length === 0 ? "태그를 입력하고 Enter 또는 쉼표(,)를 누르세요" : "태그 추가..."}
                  />
                </div>
                <p className="text-xs text-gray-500 dark:text-[#90c1cb] px-1">
                  💡 팁: Enter 또는 쉼표(,)로 태그를 추가하고, Backspace로 마지막 태그를 삭제할 수 있습니다.
                </p>
              </div>

              {/* Toolbar */}
              <div className="sticky top-0 z-40 py-4 bg-background/95 backdrop-blur-sm transition-all">
                <div className="flex items-center gap-1 sm:gap-2 border-b border-border pb-2 overflow-x-auto no-scrollbar">
                  <div className="flex items-center gap-1 border-r border-border pr-2 sm:pr-4 shrink-0">
                    <button
                      type="button"
                      className="p-2 rounded hover:bg-muted text-muted-foreground hover:text-primary transition-colors"
                      title="Heading 1"
                      onClick={() => insertMarkdown('# ')}
                    >
                      <span className="text-lg font-bold">H1</span>
                    </button>
                    <button
                      type="button"
                      className="p-2 rounded hover:bg-muted text-muted-foreground hover:text-primary transition-colors"
                      title="Heading 2"
                      onClick={() => insertMarkdown('## ')}
                    >
                      <span className="text-lg font-bold">H2</span>
                    </button>
                    <button
                      type="button"
                      className="p-2 rounded hover:bg-muted text-muted-foreground hover:text-primary transition-colors"
                      title="Heading 3"
                      onClick={() => insertMarkdown('### ')}
                    >
                      <span className="text-lg font-bold">H3</span>
                    </button>
                    <button
                      type="button"
                      className="p-2 rounded hover:bg-muted text-muted-foreground hover:text-primary transition-colors"
                      title="Heading 4"
                      onClick={() => insertMarkdown('#### ')}
                    >
                      <span className="text-lg font-bold">H4</span>
                    </button>
                  </div>
                  <div className="flex items-center gap-1 border-r border-border pr-2 sm:pr-4 shrink-0">
                    <button
                      type="button"
                      className="p-2 rounded hover:bg-muted text-muted-foreground hover:text-primary transition-colors"
                      title="Bold (Ctrl+B)"
                      onClick={() => insertTextAtCursor('**', '**')}
                    >
                      <span className="material-symbols-outlined text-[20px]">format_bold</span>
                    </button>
                    <button
                      type="button"
                      className="p-2 rounded hover:bg-muted text-muted-foreground hover:text-primary transition-colors"
                      title="Italic (Ctrl+I)"
                      onClick={() => insertTextAtCursor('*', '*')}
                    >
                      <span className="material-symbols-outlined text-[20px]">format_italic</span>
                    </button>
                    <button
                      type="button"
                      className="p-2 rounded hover:bg-muted text-muted-foreground hover:text-primary transition-colors"
                      title="Strikethrough"
                      onClick={() => insertTextAtCursor('~~', '~~')}
                    >
                      <span className="material-symbols-outlined text-[20px]">format_strikethrough</span>
                    </button>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      className="p-2 rounded hover:bg-muted text-muted-foreground hover:text-primary transition-colors"
                      title="Quote"
                      onClick={() => insertMarkdown('\n> ')}
                    >
                      <span className="material-symbols-outlined text-[20px]">format_quote</span>
                    </button>
                    <button
                      type="button"
                      className="p-2 rounded hover:bg-muted text-muted-foreground hover:text-primary transition-colors"
                      title="Code Block"
                      onClick={() => insertMarkdown('\n```\n코드\n```\n')}
                    >
                      <span className="material-symbols-outlined text-[20px]">code_blocks</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Rich Text Content Area */}
              <div className="flex flex-col gap-4">
                <div className="relative">
                  <div className="absolute top-4 left-4 text-xs text-muted-foreground font-mono pointer-events-none z-10">
                    {content.split('\n').length} lines
                  </div>
                  <textarea
                    ref={contentTextareaRef}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="w-full bg-card border border-input rounded-lg p-4 pl-16 focus:ring-2 focus:ring-ring focus:border-primary resize-none text-base leading-relaxed text-foreground placeholder:text-muted-foreground min-h-[500px] font-mono transition-all"
                    placeholder={`# 마크다운으로 작성하세요

## 제목 사용법
- # 큰 제목
- ## 중간 제목
- ### 작은 제목

**굵은 글씨**는 **로 감싸세요
*기울임*은 *로 감싸세요

\`\`\`코드
코드 블록은 이렇게
\`\`\`

> 인용구는 > 로 시작하세요

- 리스트는 - 또는 * 로 시작
1. 번호 리스트는 숫자로

[링크 텍스트](URL)로 링크를 추가하세요`}
                    style={{ tabSize: 2 }}
                  />
                </div>
                <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                  <span className="material-symbols-outlined text-blue-500 dark:text-blue-400 text-[20px] mt-0.5">lightbulb</span>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-blue-900 dark:text-blue-300 mb-1">마크다운 작성 팁</p>
                    <ul className="text-xs text-blue-700 dark:text-blue-400 space-y-1">
                      <li>• <code className="bg-blue-100 dark:bg-blue-900/30 px-1 rounded">**텍스트**</code> = 굵은 글씨</li>
                      <li>• <code className="bg-blue-100 dark:bg-blue-900/30 px-1 rounded">*텍스트*</code> = 기울임</li>
                      <li>• <code className="bg-blue-100 dark:bg-blue-900/30 px-1 rounded"># 제목</code> = 제목 (1~6개 #)</li>
                      <li>• <code className="bg-blue-100 dark:bg-blue-900/30 px-1 rounded">```코드```</code> = 코드 블록</li>
                      <li>• <code className="bg-blue-100 dark:bg-blue-900/30 px-1 rounded">{'>'} 인용</code> = 인용구</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Bottom spacing */}
              <div className="h-32"></div>
            </div>
          </div>

          {/* Right Side - Markdown Preview (Hidden on small screens, shown on XL) */}
          <aside className="hidden xl:flex w-[400px] border-l border-border flex-col bg-card overflow-y-auto h-[calc(100vh-4rem)]">
            <div className="sticky top-0 z-40 bg-card border-b border-border px-6 py-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Preview</h3>
            </div>
            <div className="flex-1 p-6 prose prose-slate dark:prose-invert max-w-none">
              {content.trim() ? (
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    h1: ({ node, ...props }) => (
                      <h1 className="text-3xl font-bold text-slate-900 dark:text-white mt-6 mb-4" {...props} />
                    ),
                    h2: ({ node, ...props }) => (
                      <h2 className="text-2xl font-bold text-slate-900 dark:text-white mt-5 mb-3" {...props} />
                    ),
                    h3: ({ node, ...props }) => (
                      <h3 className="text-xl font-bold text-slate-900 dark:text-white mt-4 mb-2" {...props} />
                    ),
                    h4: ({ node, ...props }) => (
                      <h4 className="text-lg font-bold text-slate-900 dark:text-white mt-3 mb-2" {...props} />
                    ),
                    p: ({ node, ...props }) => (
                      <p className="text-slate-700 dark:text-slate-300 leading-relaxed mb-4" {...props} />
                    ),
                    code: ({ node, inline, ...props }: any) => {
                      if (inline) {
                        return (
                          <code
                            className="px-1.5 py-0.5 bg-gray-100 dark:bg-[#182b2f] text-primary rounded text-sm font-mono"
                            {...props}
                          />
                        );
                      }
                      return (
                        <code
                          className="block p-4 bg-[#0d1117] dark:bg-[#182b2f] text-gray-300 rounded-lg overflow-x-auto text-sm font-mono border border-gray-700 dark:border-[#2a4349]"
                          {...props}
                        />
                      );
                    },
                    pre: ({ node, ...props }) => (
                      <pre className="mb-4 rounded-lg overflow-hidden" {...props} />
                    ),
                    blockquote: ({ node, ...props }) => (
                      <blockquote
                        className="border-l-4 border-primary pl-4 italic text-slate-600 dark:text-slate-400 my-4"
                        {...props}
                      />
                    ),
                    a: ({ node, ...props }) => (
                      <a className="text-primary hover:underline" target="_blank" rel="noopener noreferrer" {...props} />
                    ),
                    ul: ({ node, ...props }) => (
                      <ul className="list-disc list-inside text-slate-700 dark:text-slate-300 mb-4 space-y-2" {...props} />
                    ),
                    ol: ({ node, ...props }) => (
                      <ol className="list-decimal list-inside text-slate-700 dark:text-slate-300 mb-4 space-y-2" {...props} />
                    ),
                    li: ({ node, ...props }) => <li className="text-slate-700 dark:text-slate-300" {...props} />,
                    hr: ({ node, ...props }) => (
                      <hr className="border-gray-200 dark:border-[#2a4349] my-6" {...props} />
                    ),
                    table: ({ node, ...props }) => (
                      <div className="overflow-x-auto my-4">
                        <table className="min-w-full border-collapse border border-gray-200 dark:border-[#2a4349]" {...props} />
                      </div>
                    ),
                    th: ({ node, ...props }) => (
                      <th
                        className="border border-gray-200 dark:border-[#2a4349] px-4 py-2 bg-gray-100 dark:bg-[#182b2f] font-bold text-slate-900 dark:text-white"
                        {...props}
                      />
                    ),
                    td: ({ node, ...props }) => (
                      <td
                        className="border border-gray-200 dark:border-[#2a4349] px-4 py-2 text-slate-700 dark:text-slate-300"
                        {...props}
                      />
                    ),
                  }}
                >
                  {content}
                </ReactMarkdown>
              ) : (
                <div className="text-center text-gray-400 dark:text-[#55757d] mt-12">
                  <span className="material-symbols-outlined text-6xl mb-4 block">description</span>
                  <p>마크다운을 작성하면 미리보기가 여기에 표시됩니다.</p>
                </div>
              )}
            </div>
          </aside>
        </main>

      </div>
    </ProtectedRoute>
  );
};

export default PostEditPage;
