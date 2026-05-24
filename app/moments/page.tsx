import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import Navbar from '../../components/Navbar';
import PageTransition from '../../components/PageTransition';
import MomentList from './MomentList';

export default function MomentsPage() {
  const momentsDir = path.join(process.cwd(), 'moments');
  let moments: any[] = [];
  try {
    if (fs.existsSync(momentsDir)) {
      const files = fs.readdirSync(momentsDir).filter(f => f.endsWith('.md'));
      moments = files.map(f => {
        const content = fs.readFileSync(path.join(momentsDir, f), 'utf8');
        const { data, content: body } = matter(content);
        return { id: f.replace(/\.md$/, ''), title: data.title || '', date: data.date || '', mood: data.mood || '', weather: data.weather || '', content: body };
      }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }
  } catch (e) {}

  return (
    <div className="min-h-screen relative pb-20">
      <Navbar />
      <PageTransition>
        <main className="w-[95%] md:w-[90%] max-w-4xl mx-auto mt-24 md:mt-28 relative z-10">
          <h1 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white mb-8 tracking-tight">说说 / 碎碎念</h1>
          <MomentList moments={moments} />
        </main>
      </PageTransition>
    </div>
  );
}
