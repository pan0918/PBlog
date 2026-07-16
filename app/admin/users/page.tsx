"use client";

import { FormEvent, useCallback, useEffect, useState } from 'react';
import Pagination from '../components/Pagination';
import { useAdminToast } from '../components/useAdminToast';

type AdminPublicUser = {
  id: string;
  username: string;
  email: string;
  avatar_url: string | null;
  status: 'active' | 'muted' | 'banned';
  muted_until: string | null;
  must_change_password: number;
  last_login_at: string | null;
  created_at: string;
};

const STATUS_TEXT: Record<AdminPublicUser['status'], string> = { active: '正常', muted: '禁言', banned: '封禁' };
const STATUS_BADGE: Record<AdminPublicUser['status'], string> = { active: 'badge-success', muted: 'badge-warning', banned: 'badge-danger' };

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminPublicUser[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('all');
  const [queryInput, setQueryInput] = useState('');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const { toast, showToast } = useAdminToast();
  const pageSize = 20;

  const fetchUsers = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page) });
    if (query) params.set('query', query);
    if (status !== 'all') params.set('status', status);
    try {
      const response = await fetch(`/api/admin/users?${params}`, { signal });
      const payload = await response.json();
      if (!response.ok || !payload.ok) throw new Error(payload.message || '加载失败');
      if (signal?.aborted) return;
      setUsers(payload.data.items || []);
      setTotal(payload.data.total || 0);
    } catch (requestError) {
      if (!signal?.aborted) showToast('error', requestError instanceof Error ? requestError.message : '加载用户失败');
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, [page, query, showToast, status]);

  useEffect(() => {
    const controller = new AbortController();
    void fetchUsers(controller.signal);
    return () => controller.abort();
  }, [fetchUsers]);

  async function moderate(id: string, nextStatus: AdminPublicUser['status']) {
    let mutedUntil: string | null = null;
    if (nextStatus === 'muted') {
      const value = window.prompt('禁言天数，留空表示永久禁言', '7');
      if (value === null) return;
      if (value.trim()) {
        const days = Number(value);
        if (!Number.isFinite(days) || days <= 0 || days > 3650) return showToast('error', '请输入 1–3650 之间的天数');
        mutedUntil = new Date(Date.now() + days * 86_400_000).toISOString();
      }
    }
    if (nextStatus === 'banned' && !window.confirm('封禁会立即移除该用户的全部评论，确定继续吗？')) return;
    try {
      const response = await fetch(`/api/admin/users/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: nextStatus, mutedUntil }) });
      const payload = await response.json();
      if (!response.ok || !payload.ok) throw new Error(payload.message || '操作失败');
      showToast('success', '用户状态已更新');
      await fetchUsers();
    } catch (updateError) {
      showToast('error', updateError instanceof Error ? updateError.message : '操作失败');
    }
  }

  async function setTemporaryPassword(id: string) {
    const password = window.prompt('输入 8–72 位临时密码。用户下次登录后必须修改密码。');
    if (password === null) return;
    if (password.length < 8 || password.length > 72) return showToast('error', '临时密码长度需为 8–72 位');
    try {
      const response = await fetch(`/api/admin/users/${id}/password`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password }) });
      const payload = await response.json();
      if (!response.ok || !payload.ok) throw new Error(payload.message || '设置失败');
      showToast('success', '临时密码已设置，原会话已失效');
      await fetchUsers();
    } catch (updateError) {
      showToast('error', updateError instanceof Error ? updateError.message : '设置失败');
    }
  }

  function search(event: FormEvent) {
    event.preventDefault();
    setPage(1);
    setQuery(queryInput.trim());
  }

  return (
    <div>
      {toast && <div className={`fixed top-20 right-6 z-50 rounded-xl px-5 py-3 text-sm font-bold text-white shadow-lg ${toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'}`}>{toast.message}</div>}
      <div className="admin-page-header"><h1>用户管理</h1><p>邮箱只用于人工找回核对，不会在公开页面显示</p></div>
      <div className="admin-card" style={{ marginBottom: 20 }}>
        <form onSubmit={search} style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <input className="admin-input" style={{ flex: '1 1 260px' }} value={queryInput} onChange={(event) => setQueryInput(event.target.value)} placeholder="搜索用户名或注册邮箱" aria-label="搜索用户" />
          <select className="admin-input" value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }} aria-label="用户状态">
            <option value="all">全部状态</option><option value="active">正常</option><option value="muted">禁言</option><option value="banned">封禁</option>
          </select>
          <button type="submit" className="admin-btn admin-btn-primary">搜索</button>
        </form>
      </div>
      <div className="admin-card">
        <div className="admin-card-header"><h4>注册用户</h4><span className="admin-badge badge-default">共 {total} 人</span></div>
        {loading ? <div className="admin-loading"><div className="admin-spinner" /> 加载中...</div> : (
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead><tr><th>用户</th><th>注册邮箱</th><th>状态</th><th>注册/登录</th><th style={{ textAlign: 'right' }}>操作</th></tr></thead>
              <tbody>
                {users.length === 0 ? <tr><td colSpan={5}><div className="admin-empty"><div className="icon">👥</div><p>没有符合条件的用户</p></div></td></tr> : users.map((user) => (
                  <tr key={user.id}>
                    <td><div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>{user.avatar_url ? <img src={user.avatar_url} alt="" style={{ width: 36, height: 36, borderRadius: 10, objectFit: 'cover' }} /> : <span style={{ width: 36, height: 36, borderRadius: 10, display: 'grid', placeItems: 'center', background: 'var(--admin-bg-secondary)', fontWeight: 800 }}>{Array.from(user.username).slice(0, 2).join('').toUpperCase()}</span>}<div><strong>{user.username}</strong>{Boolean(user.must_change_password) && <div style={{ color: '#d97706', fontSize: 11 }}>等待修改临时密码</div>}</div></div></td>
                    <td>{user.email}</td>
                    <td><span className={`admin-badge ${STATUS_BADGE[user.status]}`}>{STATUS_TEXT[user.status]}</span>{user.status === 'muted' && <div style={{ marginTop: 4, fontSize: 11, opacity: 0.6 }}>{user.muted_until ? `至 ${new Date(user.muted_until).toLocaleString('zh-CN')}` : '永久禁言'}</div>}</td>
                    <td style={{ fontSize: 12, lineHeight: 1.7, opacity: 0.7 }}><div>注册 {new Date(user.created_at).toLocaleDateString('zh-CN')}</div><div>{user.last_login_at ? `登录 ${new Date(user.last_login_at).toLocaleString('zh-CN')}` : '尚未登录'}</div></td>
                    <td><div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6, flexWrap: 'wrap' }}>
                      <button className="admin-btn-text" onClick={() => void setTemporaryPassword(user.id)}>临时密码</button>
                      {user.status !== 'active' && <button className="admin-btn-text" onClick={() => void moderate(user.id, 'active')}>恢复</button>}
                      {user.status !== 'muted' && <button className="admin-btn-text" onClick={() => void moderate(user.id, 'muted')}>禁言</button>}
                      {user.status !== 'banned' && <button className="admin-btn-text danger" onClick={() => void moderate(user.id, 'banned')}>封禁</button>}
                    </div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div style={{ paddingTop: 16 }}><Pagination page={page} total={total} pageSize={pageSize} onChange={setPage} /></div>
      </div>
    </div>
  );
}

