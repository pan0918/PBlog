"use client";
import Link from 'next/link';

interface Post {
  slug: string;
  title: string;
  description?: string;
  cover?: string;
  date?: string;
  formattedDate?: string;
  tags?: string[];
  viewCount?: number;
}

export default function ArticleCard({ post }: { post: Post }) {
  return (
    <Link href={`/posts/${post.slug}`}>
      <div className="soft-glass-panel group flex flex-col overflow-hidden rounded-3xl transition-all duration-500 hover:scale-[1.01] hover:shadow-[0_26px_80px_rgba(126,91,64,0.18)] sm:flex-row">
        {/* Left: Text */}
        <div className="flex-1 p-5 sm:p-6 flex flex-col justify-between min-w-0">
          <div>
            <h3 className="text-base sm:text-lg font-black text-stone-800 dark:text-stone-100 mb-2 line-clamp-2 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
              {post.title}
            </h3>
            <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 line-clamp-2 mb-3 leading-relaxed">
              {post.description || "暂无摘要"}
            </p>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {post.formattedDate && (
                <span className="text-[10px] sm:text-xs text-stone-400 dark:text-stone-500 font-mono">{post.formattedDate}</span>
              )}
              {post.viewCount !== undefined && (
                <span className="text-[10px] sm:text-xs text-stone-400 dark:text-stone-500 flex items-center gap-1">
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                  {post.viewCount}
                </span>
              )}
            </div>
            {post.tags && post.tags.length > 0 && (
              <div className="flex gap-1.5 flex-wrap justify-end">
                {post.tags.slice(0, 2).map((tag: string) => (
                  <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold">
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
        {/* Right: Cover */}
        <div className="w-full sm:w-40 md:w-48 h-36 sm:h-auto flex-shrink-0 overflow-hidden">
          <img
            src={post.cover || "https://images.unsplash.com/photo-1499750310107-5fef28a66643?q=80&w=400&auto=format&fit=crop"}
            alt={post.title}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          />
        </div>
      </div>
    </Link>
  );
}
