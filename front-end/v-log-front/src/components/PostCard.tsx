import { memo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { PostListResponse } from '../types';
import { formatDate } from '../utils/date';
import { truncateText } from '../utils/text';
import { getPostGradient } from '../utils/constants';

interface PostCardProps {
  post: PostListResponse;
}

const PostCard = memo(({ post }: PostCardProps) => {
  const navigate = useNavigate();

  const handleClick = useCallback(() => {
    navigate(`/posts/${post.postId}`);
  }, [navigate, post.postId]);

  const gradient = getPostGradient(post.postId);

  return (
    <article
      onClick={handleClick}
      className="flex flex-col bg-card rounded-lg overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group cursor-pointer border border-border"
    >
      <div className="aspect-video w-full overflow-hidden relative">
        <div
          className="absolute inset-0 bg-gradient-to-br from-stone-100 via-stone-50 to-stone-100 dark:from-stone-900/30 dark:via-stone-800/30 dark:to-stone-800/30 transition-transform duration-500 group-hover:scale-105 flex items-center justify-center"
        >
          <span className="material-symbols-outlined text-stone-400/30 dark:text-stone-500/30 text-6xl">article</span>
        </div>
      </div>
      <div className="p-4 flex flex-col flex-1">
        <h3 className="text-lg font-bold text-foreground mb-2 leading-snug line-clamp-2 group-hover:text-primary transition-colors">
          {post.title}
        </h3>
        <p className="text-sm text-muted-foreground mb-6 line-clamp-3 flex-1">
          {truncateText(post.content)}
        </p>
        <div className="text-xs text-muted-foreground mb-3 font-medium">
          {formatDate(post.createdAt)}
          {post.commentCount !== undefined && ` · ${post.commentCount} Comments`}
        </div>
        <div className="flex items-center justify-between border-t border-border pt-3 mt-auto bg-muted dark:bg-secondary rounded-b-lg -mx-4 -mb-4 px-4 pb-3">
          <div className="flex items-center gap-2">
            <div className="size-6 rounded-full bg-gradient-to-br from-primary to-primary/80"></div>
            <span className="text-xs font-semibold text-foreground/70">
              <span>by</span> <span className="text-foreground">{post.author.nickname}</span>
            </span>
          </div>
          <div className="flex items-center gap-1 text-foreground/70">
            <span className="material-symbols-outlined text-[16px]">favorite</span>
            <span className="text-xs font-bold">{post.likeCount ?? 0}</span>
          </div>
        </div>
      </div>
    </article>
  );
});

PostCard.displayName = 'PostCard';

export default PostCard;

