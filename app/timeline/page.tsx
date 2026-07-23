import PageTransition from '../../components/PageTransition';
import TimelineClient from '../../components/TimelineClient';
import { getAllPosts } from '../../lib/posts';

export default async function TimelinePage() {
  const posts = await getAllPosts();

  return (
    <div className="min-h-screen relative pb-20">
      <PageTransition>
        <main className="w-[95%] md:w-[90%] max-w-4xl mx-auto mt-24 md:mt-28 relative z-10">
          <h1 className="text-3xl md:text-4xl font-black text-stone-900 dark:text-stone-100 mb-8 tracking-tight">归档</h1>
          <TimelineClient posts={posts} />
        </main>
      </PageTransition>
    </div>
  );
}
