"use client";
import '../../../admin.css';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { useAdminToast } from '../../../components/useAdminToast';

export default function EditAlbumPage() {
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
    cover_url: '',
    location: '',
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
    const fetchAlbum = async () => {
      try {
        const res = await fetch(`/api/admin/albums/${id}`, { signal: controller.signal });
        const data = await res.json();
        if (controller.signal.aborted) return;
        if (data.ok && data.data) {
          const a = data.data;
          setForm({
            title: a.title || '',
            slug: a.slug || '',
            description: a.description || '',
            cover_url: a.cover_url || '',
            location: a.location || '',
            status: a.status || 'draft',
            sort_order: a.sort_order || 0,
          });
        } else {
          showToast('error', '相册不存在');
        }
      } catch {
        if (!controller.signal.aborted) showToast('error', '加载相册失败');
      } finally {
        if (!controller.signal.aborted) setFetching(false);
      }
    };
    fetchAlbum();
    return () => controller.abort();
  }, [id, showToast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/albums/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.ok) {
        showToast('success', '相册更新成功');
        redirectTimerRef.current = setTimeout(() => router.push('/admin/albums'), 1000);
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
        <h1>编辑相册</h1>
      </div>

      <form onSubmit={handleSubmit} style={{ maxWidth: '640px' }}>
        <div className="admin-card">
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
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} className="admin-input" />
          </div>

          <div className="admin-form-group">
            <label className="admin-form-label">封面图片 URL</label>
            <input type="text" value={form.cover_url} onChange={(e) => setForm({ ...form, cover_url: e.target.value })} className="admin-input" />
          </div>

          <div className="admin-form-group">
            <label className="admin-form-label">拍摄地点</label>
            <input type="text" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} className="admin-input" />
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
            {loading ? '更新中...' : '更新相册'}
          </button>
        </div>
      </form>
    </div>
  );
}
