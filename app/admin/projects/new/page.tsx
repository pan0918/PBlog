"use client";
import '../../admin.css';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAdminToast } from '../../components/useAdminToast';

export default function NewProjectPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const { toast, showToast } = useAdminToast();
  const redirectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [form, setForm] = useState({
    title: '',
    slug: '',
    description: '',
    content: '',
    project_url: '',
    github_url: '',
    status: 'draft',
    sort_order: 0,
  });

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

  useEffect(() => {
    return () => {
      if (redirectTimerRef.current) clearTimeout(redirectTimerRef.current);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/admin/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.ok) {
        showToast('success', '项目创建成功');
        redirectTimerRef.current = setTimeout(() => router.push('/admin/projects'), 1000);
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
        <h1>新建项目</h1>
        <p>创建一个新的项目</p>
      </div>

      <form onSubmit={handleSubmit} style={{ maxWidth: '768px' }}>
        <div className="admin-card">
          <div className="admin-card-header">
            <h4>项目信息</h4>
          </div>

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
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} className="admin-input" style={{ resize: 'none' }} />
          </div>

          <div className="admin-form-group">
            <label className="admin-form-label">详细内容 (Markdown)</label>
            <textarea value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} rows={10} className="admin-input" style={{ resize: 'vertical' }} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="admin-form-group">
              <label className="admin-form-label">项目地址</label>
              <input type="text" value={form.project_url} onChange={(e) => setForm({ ...form, project_url: e.target.value })} placeholder="https://..." className="admin-input" />
            </div>
            <div className="admin-form-group">
              <label className="admin-form-label">GitHub 地址</label>
              <input type="text" value={form.github_url} onChange={(e) => setForm({ ...form, github_url: e.target.value })} placeholder="https://github.com/..." className="admin-input" />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="admin-form-group">
              <label className="admin-form-label">状态</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button type="button" onClick={() => setForm({ ...form, status: 'draft' })} className={`admin-btn ${form.status === 'draft' ? 'admin-btn-primary' : 'admin-btn-default'}`} style={{ flex: 1 }}>草稿</button>
                <button type="button" onClick={() => setForm({ ...form, status: 'published' })} className={`admin-btn ${form.status === 'published' ? 'admin-btn-success' : 'admin-btn-default'}`} style={{ flex: 1 }}>发布</button>
              </div>
            </div>
            <div className="admin-form-group">
              <label className="admin-form-label">排序</label>
              <input type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: parseInt(e.target.value) || 0 })} className="admin-input" />
            </div>
          </div>

          <div className="admin-form-group" style={{ marginTop: '8px' }}>
            <button type="submit" disabled={loading} className="admin-btn admin-btn-primary" style={{ width: '100%', padding: '12px' }}>
              {loading ? '创建中...' : '创建项目'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
