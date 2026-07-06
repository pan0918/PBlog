import { db } from '../../lib/db';

interface StatCard {
  label: string;
  value: number;
  icon: string;
  color: string;
  bg: string;
}

async function getStats(): Promise<StatCard[]> {
  const queries = [
    { sql: `SELECT COUNT(*) as count FROM posts WHERE deleted_at IS NULL`, label: '文章总数', icon: '📝', color: '#5D87FF', bg: '#5D87FF1a' },
    { sql: `SELECT COUNT(*) as count FROM posts WHERE status = 'published' AND deleted_at IS NULL`, label: '已发布', icon: '✅', color: '#13deb9', bg: '#13deb91a' },
    { sql: `SELECT COUNT(*) as count FROM posts WHERE status = 'draft' AND deleted_at IS NULL`, label: '草稿', icon: '📋', color: '#ffae1f', bg: '#ffae1f1a' },
    { sql: `SELECT COUNT(*) as count FROM moments WHERE deleted_at IS NULL`, label: '说说', icon: '💭', color: '#B48DF3', bg: '#B48DF31a' },
    { sql: `SELECT COUNT(*) as count FROM projects WHERE deleted_at IS NULL`, label: '项目', icon: '🚀', color: '#60C041', bg: '#60C0411a' },
    { sql: `SELECT COUNT(*) as count FROM friends WHERE status = 'pending' AND deleted_at IS NULL`, label: '友链待审', icon: '🔗', color: '#F9901F', bg: '#F9901F1a' },
    { sql: `SELECT COUNT(*) as count FROM messages WHERE status = 'pending' AND deleted_at IS NULL`, label: '留言待审', icon: '💬', color: '#38c0fc', bg: '#38c0fc1a' },
    { sql: `SELECT COUNT(*) as count FROM albums WHERE deleted_at IS NULL`, label: '相册', icon: '📸', color: '#FF80C8', bg: '#FF80C81a' },
    { sql: `SELECT COUNT(*) as count FROM songs WHERE deleted_at IS NULL`, label: '歌曲', icon: '🎵', color: '#818cf8', bg: '#818cf81a' },
  ];

  const results: StatCard[] = [];
  for (const q of queries) {
    try {
      const r = await db.execute(q.sql);
      results.push({ label: q.label, value: Number(r.rows[0]?.count ?? 0), icon: q.icon, color: q.color, bg: q.bg });
    } catch {
      results.push({ label: q.label, value: 0, icon: q.icon, color: q.color, bg: q.bg });
    }
  }
  return results;
}

export default async function AdminDashboard() {
  const stats = await getStats();

  return (
    <div>
      <div className="admin-page-header">
        <h1>仪表盘</h1>
        <p>欢迎回来，这里是你的博客数据中心</p>
      </div>

      {/* Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16, marginBottom: 32 }}>
        {stats.map((stat) => (
          <div key={stat.label} className="stats-card">
            <div className="stats-icon" style={{ background: stat.bg }}>
              <span>{stat.icon}</span>
            </div>
            <div className="stats-info">
              <div className="stats-value">{stat.value}</div>
              <div className="stats-label">{stat.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="admin-card">
        <div className="admin-card-header">
          <div>
            <h4>快捷操作</h4>
            <p>常用的内容管理入口</p>
          </div>
        </div>
        <div className="admin-actions-grid">
          <a href="/admin/posts/new" className="admin-action-card">
            <span className="icon">✏️</span>
            <span className="label">写文章</span>
          </a>
          <a href="/admin/moments/new" className="admin-action-card">
            <span className="icon">💭</span>
            <span className="label">发说说</span>
          </a>
          <a href="/admin/projects/new" className="admin-action-card">
            <span className="icon">➕</span>
            <span className="label">加项目</span>
          </a>
          <a href="/admin/friends/new" className="admin-action-card">
            <span className="icon">🔗</span>
            <span className="label">加友链</span>
          </a>
          <a href="/admin/messages" className="admin-action-card">
            <span className="icon">💬</span>
            <span className="label">审核留言</span>
          </a>
          <a href="/admin/albums/new" className="admin-action-card">
            <span className="icon">📸</span>
            <span className="label">建相册</span>
          </a>
          <a href="/admin/songs" className="admin-action-card">
            <span className="icon">🎵</span>
            <span className="label">加歌曲</span>
          </a>
        </div>
      </div>
    </div>
  );
}
