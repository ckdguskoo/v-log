import { memo } from 'react';
import { PostListResponse } from '../types';
import PostCard from './PostCard';

interface PostGridProps {
  posts: PostListResponse[];
}

const PostGrid = memo(({ posts }: PostGridProps) => {
  if (posts.length === 0) {
    return (
      <div className="mt-16 flex justify-center pb-10">
        <div className="text-slate-500 dark:text-slate-400">게시글이 없습니다.</div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {posts.map((post) => (
        <PostCard key={post.postId} post={post} />
      ))}
    </div>
  );
});

PostGrid.displayName = 'PostGrid';

export default PostGrid;

