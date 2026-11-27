import { db } from '../../lib/db';
import { getMonthlyAiUsage, type MonthlyAiUsage } from '../../lib/ai/budget';
import { isAiConfigured } from '../../lib/ai/deepseek';

export const dynamic = 'force-dynamic';

interface StatCard {
  label: string;
  value: number;
  icon: string;
  color: string;
  bg: string;
}

async function getStats(): Promise<StatCard[]> {
  const definitions = [
    { key: 'post_count', label: '文章总数', icon: '📝', color: '#5D87FF', bg: '#5D87FF1a' },
    { key: 'published_post_count', label: '已发布', icon: '✅', color: '#13deb9', bg: '#13deb91a' },
    { key: 'draft_post_count', label: '草稿', icon: '📋', color: '#ffae1f', bg: '#ffae1f1a' },
    { key: 'moment_count', label: '说说', icon: '💭', color: '#B48DF3', bg: '#B48DF31a' },
    { key: 'project_count', label: '项目', icon: '🚀', color: '#60C041', bg: '#60C0411a' },
    { key: 'friend_count', label: '友链总数', icon: '🔗', color: '#F9901F', bg: '#F9901F1a' },
    { key: 'pending_message_count', label: '留言待审', icon: '💬', color: '#38c0fc', bg: '#38c0fc1a' },
    { key: 'album_count', label: '相册', icon: '📸', color: '#FF80C8', bg: '#FF80C81a' },
    { key: 'song_count', label: '歌曲', icon: '🎵', color: '#818cf8', bg: '#818cf81a' },
  ] as const;

  try {
    const result = await db.execute(`
      SELECT
        (SELECT COUNT(*) FROM posts WHERE deleted_at IS NULL) AS post_count,
        (SELECT COUNT(*) FROM posts WHERE status = 'published' AND deleted_at IS NULL) AS published_post_count,
        (SELECT COUNT(*) FROM posts WHERE status = 'draft' AND deleted_at IS NULL) AS draft_post_count,
        (SELECT COUNT(*) FROM moments WHERE deleted_at IS NULL) AS moment_count,
        (SELECT COUNT(*) FROM projects WHERE deleted_at IS NULL) AS project_count,
        (SELECT COUNT(*) FROM friends WHERE deleted_at IS NULL) AS friend_count,
        (SELECT COUNT(*) FROM messages WHERE status = 'pending' AND deleted_at IS NULL) AS pending_message_count,
        (SELECT COUNT(*) FROM albums WHERE deleted_at IS NULL) AS album_count,
        (SELECT COUNT(*) FROM songs WHERE deleted_at IS NULL) AS song_count
    `);
    const row = result.rows[0] as Record<string, unknown> | undefined;
    return definitions.map((definition) => ({
      ...definition,
      value: Number(row?.[definition.key] ?? 0),
    }));
  } catch {
    return definitions.map((definition) => ({ ...definition, value: 0 }));
  }
}

async function getAiUsage(): Promise<MonthlyAiUsage | null> {
  try {
    return await getMonthlyAiUsage();
  } catch (error) {
    console.error('Failed to load AI usage', error);
    return null;
  }
}

function formatUsd(value: number) {
  return `$${value.toFixed(value < 1 ? 4 : 2)}`;
}

function AiUsageCard({ usage, configured }: { usage: MonthlyAiUsage | null; configured: boolean }) {
  const percent = usage ? Math.min(100, (usage.visitor.costUsd / usage.budgetUsd) * 100) : 0;
  const barColor = percent >= 100 ? '#fa896b' : percent >= 80 ? '#ffae1f' : '#13deb9';

  return (
    <div className="admin-card" style={{ marginBottom: 32 }}>
      <div className="admin-card-header">
        <div>
          <h4>AI 用量（本月）</h4>
          <p>按 DeepSeek 官方价格估算，实际扣费以 DeepSeek 后台为准</p>
        </div>
      </div>
      {!configured ? (
        <p style={{ margin: 0, fontSize: 14, color: 'var(--admin-text-secondary)' }}>
          还没有配置 DEEPSEEK_API_KEY 环境变量，AI 功能未启用。
        </p>
      ) : !usage ? (
        <p style={{ margin: 0, fontSize: 14, color: 'var(--admin-text-secondary)' }}>用量数据暂时读取失败。</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 24 }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, marginBottom: 8 }}>
              <span style={{ color: 'var(--admin-text-secondary)' }}>访客聊天 · {usage.visitor.calls} 次</span>
              <span style={{ fontWeight: 600, color: 'var(--admin-text-primary)' }}>
                {formatUsd(usage.visitor.costUsd)} / {`$${usage.budgetUsd}`}
              </span>
            </div>
            <div style={{ height: 8, borderRadius: 4, background: '#f2f4f5', overflow: 'hidden' }}>
              <div style={{ width: `${percent}%`, height: '100%', background: barColor }} />
            </div>
            <p style={{ margin: '8px 0 0', fontSize: 12, color: 'var(--admin-text-secondary)' }}>
              {usage.exhausted ? '本月额度已用完，煤球暂停聊天，下个月自动恢复。' : '用完后煤球会暂停聊天，下个月自动恢复。'}
            </p>
          </div>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, marginBottom: 8 }}>
              <span style={{ color: 'var(--admin-text-secondary)' }}>后台写作辅助 · {usage.admin.calls} 次</span>
              <span style={{ fontWeight: 600, color: 'var(--admin-text-primary)' }}>{formatUsd(usage.admin.costUsd)}</span>
            </div>
            <p style={{ margin: 0, fontSize: 12, color: 'var(--admin-text-secondary)' }}>不计入上面的额度。</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default async function AdminDashboard() {
  const configured = isAiConfigured();
  const [stats, aiUsage] = await Promise.all([getStats(), configured ? getAiUsage() : null]);

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

      <AiUsageCard usage={aiUsage} configured={configured} />

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
