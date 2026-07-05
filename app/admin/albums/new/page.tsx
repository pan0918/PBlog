"use client";
import '../../admin.css';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function NewAlbumPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [form, setForm] = useState({
    title: '',
    slug: '',
    description: '',
    cover_url: '',
    location: '',
    status: 'draft',
    sort_order: 0,
  });

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  const generateSlug = (title: string) => {
    return title.toLowerCase().replace(/[^a-z0-9一-龥]+/g, '-').replace(/^-+|-+$/g, '');
  };

  const handleTitleChange = (value: string) => {
    setForm((prev) => ({
      ...prev,
      title: value,
      slug: prev.slug === generateSlug(prev.title) || prev.slug === '' ? generateSlug(value) : prev.slug,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/admin/albums', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.ok) {
        showToast('success', '相册创建成功');
        setTimeout(() => router.push('/admin/albums'), 1000);
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
        <h1>新建相册</h1>
      </div>

      <form onSubmit={handleSubmit} style={{ maxWidth: '640px' }}>
        <div className="admin-card">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="admin-form-group">
              <label className="admin-form-label">标题</label>
              <input type="text" value={form.title} onChange={(e) => handleTitleChange(e.target.value)} className="admin-input" required />
            </div>
            <div className="admin-form-group">
              <label className="admin-form-label">Slug</label>
              <input type="text" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} className="admin-input" required />
            </div>
          </div>

          <div className="admin-form-group">
            <label className="admin-form-label">描述</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} className="admin-input" />
          </div>

          <div className="admin-form-group">
            <label className="admin-form-label">封面图片 URL</label>
            <input type="text" value={form.cover_url} onChange={(e) => setForm({ ...form, cover_url: e.target.value })} placeholder="https://..." className="admin-input" />
          </div>

          <div className="admin-form-group">
            <label className="admin-form-label">拍摄地点</label>
            <input type="text" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="北京、上海..." className="admin-input" />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="admin-form-group">
              <label className="admin-form-label">状态</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button type="button" onClick={() => setForm({ ...form, status: 'draft' })} className={`admin-btn ${form.status === 'draft' ? 'admin-btn-success' : 'admin-btn-default'}`} style={{ flex: 1 }}>
                  草稿
                </button>
                <button type="button" onClick={() => setForm({ ...form, status: 'published' })} className={`admin-btn ${form.status === 'published' ? 'admin-btn-success' : 'admin-btn-default'}`} style={{ flex: 1 }}>
                  发布
                </button>
              </div>
            </div>
            <div className="admin-form-group">
              <label className="admin-form-label">排序</label>
              <input type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: parseInt(e.target.value) || 0 })} className="admin-input" />
            </div>
          </div>

          <button type="submit" disabled={loading} className="admin-btn admin-btn-primary" style={{ width: '100%', height: '42px', marginTop: '8px' }}>
            {loading ? '创建中...' : '创建相册'}
          </button>
        </div>
      </form>
    </div>
  );
}
