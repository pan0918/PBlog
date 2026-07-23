import PageTransition from '../../components/PageTransition';
import ProjectsBoard from './ProjectsBoard';
import { getPublishedProjects } from '../../lib/db/projects';

export default async function ProjectsPage() {
  const dbProjects = await getPublishedProjects();

  const projects = dbProjects.map(p => ({
    id: p.id,
    name: p.title,
    description: p.description || '',
    icon: '📁',
    githubUrl: p.github_url || '',
    tags: [],
    stars: '',
  }));

  return (
    <div className="min-h-screen relative pb-20">
      <PageTransition>
        <main className="w-[95%] md:w-[90%] max-w-4xl mx-auto mt-24 md:mt-28 relative z-10">
          <h1 className="text-3xl md:text-4xl font-black text-stone-900 dark:text-stone-100 mb-8 tracking-tight">优质开源项目</h1>
          <ProjectsBoard projects={projects} />
        </main>
      </PageTransition>
    </div>
  );
}
