"use client";
import '../../../admin.css';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';

export default function EditMomentPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [form, setForm] = useState({
    content: '',
    mood: '',
    weather: '',
    location: '',
    status: 'draft',
  });

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    const fetchMoment = async () => {
      try {
        const res = await fetch(`/api/admin/moments/${id}`);
        const data = await res.json();
        if (data.ok && data.data) {
          const m = data.data;
          setForm({
            content: m.content || '',
            mood: m.mood || '',
            weather: m.weather || '',
            location: m.location || '',
            status: m.status || 'draft',
          });
        } else {
          showToast('error', '说说不存在');
        }
      } catch {
        showToast('error', '加载说说失败');
      } finally {
        setFetching(false);
      }
    };
    fetchMoment();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/moments/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.ok) {
        showToast('success', '说说更新成功');
        setTimeout(() => router.push('/admin/moments'), 1000);
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
        <h1>编辑说说</h1>
        <p>修改说说内容</p>
      </div>

      <form onSubmit={handleSubmit} style={{ maxWidth: '640px' }}>
        <div className="admin-card">
          <div style={{ padding: '24px' }}>
            <div className="admin-form-group">
              <label className="admin-form-label">内容</label>
              <textarea
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
                rows={6}
                className="admin-input"
                style={{ resize: 'vertical' }}
                required
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
              <div className="admin-form-group">
                <label className="admin-form-label">心情</label>
                <input
                  type="text"
                  value={form.mood}
                  onChange={(e) => setForm({ ...form, mood: e.target.value })}
                  className="admin-input"
                />
              </div>
              <div className="admin-form-group">
                <label className="admin-form-label">天气</label>
                <input
                  type="text"
                  value={form.weather}
                  onChange={(e) => setForm({ ...form, weather: e.target.value })}
                  className="admin-input"
                />
              </div>
              <div className="admin-form-group">
                <label className="admin-form-label">位置</label>
                <input
                  type="text"
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                  className="admin-input"
                />
              </div>
            </div>

            <div className="admin-form-group">
              <label className="admin-form-label">状态</label>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, status: 'draft' })}
                  className={`admin-btn ${form.status === 'draft' ? 'admin-btn-warning' : 'admin-btn-default'}`}
                  style={{ flex: 1 }}
                >
                  草稿
                </button>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, status: 'published' })}
                  className={`admin-btn ${form.status === 'published' ? 'admin-btn-success' : 'admin-btn-default'}`}
                  style={{ flex: 1 }}
                >
                  发布
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="admin-btn admin-btn-primary"
              style={{ width: '100%', padding: '12px 24px' }}
            >
              {loading ? '更新中...' : '更新说说'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
