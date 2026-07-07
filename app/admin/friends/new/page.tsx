"use client";
import '../../admin.css';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAdminToast } from '../../components/useAdminToast';

export default function NewFriendPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const { toast, showToast } = useAdminToast();
  const redirectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [form, setForm] = useState({
    name: '',
    url: '',
    avatar_url: '',
    description: '',
    site_title: '',
    status: 'pending',
    sort_order: 0,
  });

  useEffect(() => {
    return () => {
      if (redirectTimerRef.current) clearTimeout(redirectTimerRef.current);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/admin/friends', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.ok) {
        showToast('success', '友链创建成功');
        redirectTimerRef.current = setTimeout(() => router.push('/admin/friends'), 1000);
      } else {
        showToast('error', data.message || '创建失败');
      }
    } catch {
      showToast('error', '创建失败');
    } finally {
      setLoading(false);
    }
  };

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
        <h1>新建友链</h1>
        <p>添加一个新的友链</p>
      </div>

      <form onSubmit={handleSubmit} className="admin-card" style={{ maxWidth: '640px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div className="admin-form-group">
            <label className="admin-form-label">名称</label>
            <input type="text" className="admin-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </div>
          <div className="admin-form-group">
            <label className="admin-form-label">网站地址</label>
            <input type="url" className="admin-input" value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} placeholder="https://..." required />
          </div>
        </div>

        <div className="admin-form-group">
          <label className="admin-form-label">头像 URL</label>
          <input type="text" className="admin-input" value={form.avatar_url} onChange={(e) => setForm({ ...form, avatar_url: e.target.value })} placeholder="https://..." />
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
          {loading ? '创建中...' : '创建友链'}
        </button>
      </form>
    </div>
  );
}
