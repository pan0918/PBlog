import PageTransition from '../../components/PageTransition';
import MomentList from './MomentList';
import { getPublishedMoments } from '../../lib/db/moments';

export default async function MomentsPage() {
  const dbMoments = await getPublishedMoments();

  const moments = dbMoments.map(m => ({
    id: m.id,
    title: '',
    date: m.published_at || m.created_at,
    mood: m.mood || '',
    weather: m.weather || '',
    content: m.content,
  }));

  return (
    <div className="min-h-screen relative pb-20">
      <PageTransition>
        <main className="w-[95%] md:w-[90%] max-w-4xl mx-auto mt-24 md:mt-28 relative z-10">
          <h1 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white mb-8 tracking-tight">说说 / 碎碎念</h1>
          <MomentList moments={moments} />
        </main>
      </PageTransition>
    </div>
  );
}
