"use client";
import '../../../admin.css';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { useAdminToast } from '../../../components/useAdminToast';

export default function EditProjectPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
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

  useEffect(() => {
    return () => {
      if (redirectTimerRef.current) clearTimeout(redirectTimerRef.current);
    };
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const fetchProject = async () => {
      try {
        const res = await fetch(`/api/admin/projects/${id}`, { signal: controller.signal });
        const data = await res.json();
        if (controller.signal.aborted) return;
        if (data.ok && data.data) {
          const p = data.data;
          setForm({
            title: p.title || '',
            slug: p.slug || '',
            description: p.description || '',
            content: p.content || '',
            project_url: p.project_url || '',
            github_url: p.github_url || '',
            status: p.status || 'draft',
            sort_order: p.sort_order || 0,
          });
        } else {
          showToast('error', '项目不存在');
        }
      } catch {
        if (!controller.signal.aborted) showToast('error', '加载项目失败');
      } finally {
        if (!controller.signal.aborted) setFetching(false);
      }
    };
    fetchProject();
    return () => controller.abort();
  }, [id, showToast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/projects/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.ok) {
        showToast('success', '项目更新成功');
        redirectTimerRef.current = setTimeout(() => router.push('/admin/projects'), 1000);
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
      <div className="admin-loading"><div className="admin-spinner" /> 加载中...</div>
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
        <h1>编辑项目</h1>
        <p>修改项目信息</p>
      </div>

      <form onSubmit={handleSubmit} style={{ maxWidth: '768px' }}>
        <div className="admin-card">
          <div className="admin-card-header">
            <h4>项目信息</h4>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="admin-form-group">
              <label className="admin-form-label">标题</label>
              <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="admin-input" required />
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
              <input type="text" value={form.project_url} onChange={(e) => setForm({ ...form, project_url: e.target.value })} className="admin-input" />
            </div>
            <div className="admin-form-group">
              <label className="admin-form-label">GitHub 地址</label>
              <input type="text" value={form.github_url} onChange={(e) => setForm({ ...form, github_url: e.target.value })} className="admin-input" />
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
              {loading ? '更新中...' : '更新项目'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
