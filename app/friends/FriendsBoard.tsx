"use client";
import { motion } from 'framer-motion';

interface Friend { id: string; name: string; url: string; description: string; avatar: string; themeColor: string; }

export default function FriendsBoard({ friends }: { friends: Friend[] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {friends.map((friend, i) => (
        <motion.a
          key={friend.id}
          href={friend.url}
          target="_blank"
          rel="noopener noreferrer"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1 }}
          className="rounded-3xl bg-white/40 dark:bg-slate-800/50 backdrop-blur-md border border-white/40 dark:border-white/10 shadow-xl p-6 transition-all duration-500 hover:scale-[1.02] group block text-center"
          style={{ borderColor: friend.themeColor }}
        >
          <div className="w-16 h-16 mx-auto rounded-full overflow-hidden mb-4 shadow-lg border-2 transition-transform duration-500 group-hover:scale-110" style={{ borderColor: friend.themeColor }}>
            <img src={friend.avatar} alt={friend.name} className="w-full h-full object-cover" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{friend.name}</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">{friend.description}</p>
        </motion.a>
      ))}
    </div>
  );
}
