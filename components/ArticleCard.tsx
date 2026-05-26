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
}

export default function ArticleCard({ post }: { post: Post }) {
  return (
    <Link href={`/posts/${post.slug}`}>
      <div className="rounded-3xl bg-white/40 dark:bg-slate-800/50 backdrop-blur-md border border-white/40 dark:border-white/10 shadow-xl overflow-hidden transition-all duration-500 hover:scale-[1.01] hover:shadow-2xl group flex flex-col sm:flex-row">
        {/* Left: Text */}
        <div className="flex-1 p-5 sm:p-6 flex flex-col justify-between min-w-0">
          <div>
            <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white mb-2 line-clamp-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
              {post.title}
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 line-clamp-2 mb-3 leading-relaxed">
              {post.description || "暂无摘要"}
            </p>
          </div>
          <div className="flex items-center justify-between">
            {post.formattedDate && (
              <span className="text-[10px] sm:text-xs text-slate-400 dark:text-slate-500 font-mono">{post.formattedDate}</span>
            )}
            {post.tags && post.tags.length > 0 && (
              <div className="flex gap-1.5 flex-wrap justify-end">
                {post.tags.slice(0, 2).map((tag: string) => (
                  <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold">
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
