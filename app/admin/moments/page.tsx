"use client";
import '../admin.css';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Pagination from '../components/Pagination';
import { useAdminToast } from '../components/useAdminToast';

interface Moment {
  id: number;
  content: string;
  mood: string;
  weather: string;
  location: string;
  status: string;
  published_at: string;
}

export default function AdminMomentsPage() {
  const router = useRouter();
  const [moments, setMoments] = useState<Moment[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast, showToast } = useAdminToast();
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 5;

  const fetchMoments = useCallback(async (signal?: AbortSignal) => {
    try {
      const res = await fetch('/api/admin/moments', { signal });
      const data = await res.json();
      if (signal?.aborted) return;
      if (data.ok) { setMoments(data.data || []); setPage(1); }
    } catch {
      if (!signal?.aborted) showToast('error', '加载说说列表失败');
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    const controller = new AbortController();
    fetchMoments(controller.signal);
    return () => controller.abort();
  }, [fetchMoments]);

  const handleDelete = async (id: number) => {
    if (!confirm('确定要删除这条说说吗？')) return;
    try {
      const res = await fetch(`/api/admin/moments/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.ok) {
        showToast('success', '说说已删除');
        fetchMoments();
      } else {
        showToast('error', data.message || '删除失败');
      }
    } catch {
      showToast('error', '删除失败');
    }
  };

  const totalPages = Math.ceil(moments.length / PAGE_SIZE);
  const displayMoments = moments.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  if (loading) {
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
        <div className="flex items-center justify-between">
          <div>
            <h1>说说管理</h1>
            <p>管理你的说说内容</p>
          </div>
          <Link href="/admin/moments/new" className="admin-btn admin-btn-primary">
            + 新建说说
          </Link>
        </div>
      </div>

      {displayMoments.length === 0 ? (
        <div className="admin-empty">
          <div className="icon">📦</div>
          <p>暂无数据</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
          {displayMoments.map((moment) => (
            <div key={moment.id} className="admin-card">
              <div style={{ padding: '20px' }}>
                <p style={{
                  display: '-webkit-box',
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                  lineHeight: 1.7,
                  marginBottom: '16px',
                  color: 'var(--admin-text-primary)',
                  fontWeight: 500,
                }}>
                  {moment.content}
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
                  {moment.mood && (
                    <span className="admin-badge" style={{ background: '#fdf2f8', color: '#db2777', border: '1px solid #fbcfe8' }}>
                      {moment.mood}
                    </span>
                  )}
                  {moment.weather && (
                    <span className="admin-badge" style={{ background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe' }}>
                      {moment.weather}
                    </span>
                  )}
                  {moment.location && (
                    <span className="admin-badge" style={{ background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0' }}>
                      {moment.location}
                    </span>
                  )}
                  <span className={`admin-badge ${moment.status === 'published' ? 'badge-success' : 'badge-warning'}`}>
                    {moment.status === 'published' ? '已发布' : '草稿'}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '12px', borderTop: '1px solid var(--admin-border)' }}>
                  <span style={{ fontSize: '12px', color: 'var(--admin-text-secondary)' }}>
                    {moment.published_at ? new Date(moment.published_at).toLocaleString('zh-CN') : '未发布'}
                  </span>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button
                      onClick={() => router.push(`/admin/moments/${moment.id}/edit`)}
                      className="admin-btn-text"
                    >
                      编辑
                    </button>
                    <button
                      onClick={() => handleDelete(moment.id)}
                      className="admin-btn-text danger"
                    >
                      删除
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      <div style={{ padding: '16px 0' }}>
        <Pagination page={page} total={moments.length} pageSize={PAGE_SIZE} onChange={setPage} />
      </div>
    </div>
  );
}
