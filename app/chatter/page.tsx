import PageTransition from '../../components/PageTransition';
import MessageWall from './MessageWall';
import { siteConfig } from '../../siteConfig';
import { getApprovedMessages } from '../../lib/db/messages';

export default async function ChatterPage() {
  const dbMessages = await getApprovedMessages();

  const messages = dbMessages.map(m => ({
    id: m.id,
    content: m.content,
    author: m.author?.trim() || '匿名',
    colorIndex: Math.abs(hashCode(m.id)) % 10,
    createdAt: m.created_at,
  }));

  return (
    <div className="min-h-screen relative pb-20">
      <PageTransition>
        <main className="w-[95%] md:w-[90%] max-w-6xl mx-auto mt-24 md:mt-28 relative z-10">
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white mb-2 tracking-tight drop-shadow-sm">{siteConfig.chatterTitle}</h1>
            <p className="text-sm text-slate-500 dark:text-slate-200/80 font-medium drop-shadow-sm">{siteConfig.chatterDescription}</p>
          </div>
          <MessageWall initialMessages={messages} />
        </main>
      </PageTransition>
    </div>
  );
}

function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return hash;
}
