"use client";
import '../../../admin.css';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';

export default function EditFriendPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [form, setForm] = useState({
    name: '',
    url: '',
    avatar_url: '',
    description: '',
    site_title: '',
    status: 'pending',
    sort_order: 0,
  });

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    const fetchFriend = async () => {
      try {
        const res = await fetch(`/api/admin/friends/${id}`);
        const data = await res.json();
        if (data.ok && data.data) {
          const f = data.data;
          setForm({
            name: f.name || '',
            url: f.url || '',
            avatar_url: f.avatar_url || f.avatar || '',
            description: f.description || '',
            site_title: f.site_title || '',
            status: f.status || 'pending',
            sort_order: f.sort_order || 0,
          });
        } else {
          showToast('error', '友链不存在');
        }
      } catch {
        showToast('error', '加载友链失败');
      } finally {
        setFetching(false);
      }
    };
    fetchFriend();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/friends/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.ok) {
        showToast('success', '友链更新成功');
        setTimeout(() => router.push('/admin/friends'), 1000);
      } else {
        showToast('error', data.message || '更新失败');
      }
    } catch {
      showToast('error', '更新失败');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="admin-loading">
        <div className="admin-spinner" /> 加载中...
      </div>
    );
  }

  return (
    <div>
      {toast && (
        <div className={`fixed top-20 right-6 z-50 px-5 py-3 rounded-xl shadow-lg text-sm font-bold animate-fade-in ${
          toast.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
        }`}>
          {toast.message}
        </div>
      )}

      <div className="admin-page-header">
        <h1>编辑友链</h1>
        <p>修改友链信息</p>
      </div>

      <form onSubmit={handleSubmit} className="admin-card" style={{ maxWidth: '640px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div className="admin-form-group">
            <label className="admin-form-label">名称</label>
            <input type="text" className="admin-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </div>
          <div className="admin-form-group">
            <label className="admin-form-label">网站地址</label>
            <input type="url" className="admin-input" value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} required />
          </div>
        </div>
        <div className="admin-form-group">
          <label className="admin-form-label">头像 URL</label>
          <input type="text" className="admin-input" value={form.avatar_url} onChange={(e) => setForm({ ...form, avatar_url: e.target.value })} />
        </div>
        <div className="admin-form-group">
          <label className="admin-form-label">网站标题</label>
          <input type="text" className="admin-input" value={form.site_title} onChange={(e) => setForm({ ...form, site_title: e.target.value })} />
        </div>
        <div className="admin-form-group">
          <label className="admin-form-label">描述</label>
          <textarea className="admin-input" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} style={{ resize: 'none' }} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div className="admin-form-group">
            <label className="admin-form-label">状态</label>
            <select className="admin-input" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              <option value="pending">待审核</option>
              <option value="approved">已通过</option>
              <option value="rejected">已拒绝</option>
            </select>
          </div>
          <div className="admin-form-group">
            <label className="admin-form-label">排序</label>
            <input type="number" className="admin-input" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: parseInt(e.target.value) || 0 })} />
          </div>
        </div>
        <button type="submit" disabled={loading} className="admin-btn admin-btn-primary" style={{ width: '100%', marginTop: '8px' }}>
          {loading ? '更新中...' : '更新友链'}
        </button>
      </form>
    </div>
  );
}
