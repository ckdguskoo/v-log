import { useRef, useEffect, useCallback } from 'react';

interface UseMarkdownEditorReturn {
  contentTextareaRef: React.RefObject<HTMLTextAreaElement>;
  titleTextareaRef: React.RefObject<HTMLTextAreaElement>;
  insertTextAtCursor: (before: string, after?: string) => void;
  insertMarkdown: (markdown: string) => void;
}

export const useMarkdownEditor = (
  content: string,
  title: string,
  setContent: (content: string) => void
): UseMarkdownEditorReturn => {
  const contentTextareaRef = useRef<HTMLTextAreaElement>(null);
  const titleTextareaRef = useRef<HTMLTextAreaElement>(null);

  // 제목 textarea 자동 높이 조절
  useEffect(() => {
    if (titleTextareaRef.current) {
      titleTextareaRef.current.style.height = '';
      titleTextareaRef.current.style.height = titleTextareaRef.current.scrollHeight + 'px';
    }
  }, [title]);

  const insertTextAtCursor = useCallback((before: string, after: string = '') => {
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
  }, [content, setContent]);

  const insertMarkdown = useCallback((markdown: string) => {
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
  }, [content, setContent]);

  return {
    contentTextareaRef,
    titleTextareaRef,
    insertTextAtCursor,
    insertMarkdown,
  };
};

