"use client";
import { motion } from 'framer-motion';

interface Project { id: string; name: string; description: string; icon: string; githubUrl: string; tags: string[]; stars?: string; }

export default function ProjectsBoard({ projects }: { projects: Project[] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {projects.map((project, i) => (
        <motion.a
          key={project.id}
          href={project.githubUrl}
          target="_blank"
          rel="noopener noreferrer"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1 }}
          className="rounded-3xl bg-white/40 dark:bg-slate-800/50 backdrop-blur-md border border-white/40 dark:border-white/10 shadow-xl p-6 transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl group block"
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-2xl shadow-lg flex-shrink-0">{project.icon}</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{project.name}</h3>
                {project.stars && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400 font-bold flex items-center gap-0.5">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                    {project.stars}
                  </span>
                )}
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-300 line-clamp-3 mb-3 leading-relaxed">{project.description}</p>
              <div className="flex flex-wrap gap-1">
                {project.tags.map(tag => (
                  <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 font-bold">{tag}</span>
                ))}
              </div>
            </div>
          </div>
        </motion.a>
      ))}
    </div>
  );
}
