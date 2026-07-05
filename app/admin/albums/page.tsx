"use client";
import '../admin.css';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Pagination from '../components/Pagination';

interface Album {
  id: number;
  title: string;
  slug: string;
  description: string;
  cover_url: string;
  status: string;
  photo_count: number;
}

export default function AdminAlbumsPage() {
  const router = useRouter();
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 5;

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchAlbums = async () => {
    try {
      const res = await fetch('/api/admin/albums');
      const data = await res.json();
      if (data.ok) { setAlbums(data.data || []); setPage(1); }
    } catch {
      showToast('error', '加载相册列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAlbums(); }, []);

  const handleDelete = async (id: number, title: string) => {
    if (!confirm(`确定要删除相册「${title}」吗？相册中的照片也将被删除。`)) return;
    try {
      const res = await fetch(`/api/admin/albums/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.ok) {
        showToast('success', '相册已删除');
        fetchAlbums();
      } else {
        showToast('error', data.message || '删除失败');
      }
    } catch {
      showToast('error', '删除失败');
    }
  };

  const totalPages = Math.ceil(albums.length / PAGE_SIZE);
  const displayAlbums = albums.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

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

      <div className="admin-page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1>相册管理</h1>
        </div>
        <Link href="/admin/albums/new" className="admin-btn admin-btn-primary">
          新建相册
        </Link>
      </div>

      {displayAlbums.length === 0 ? (
        <div className="admin-card">
          <div className="admin-empty">
            <div className="icon">📦</div>
            <p>暂无相册</p>
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
          {displayAlbums.map((album) => (
            <div key={album.id} className="admin-card" style={{ padding: 0, overflow: 'hidden' }}>
              {/* Cover */}
              <div style={{ position: 'relative', height: '200px', background: '#f0f0f0', overflow: 'hidden' }}>
                {album.cover_url ? (
                  <img src={album.cover_url} alt={album.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#949eb7', fontSize: '40px' }}>📸</div>
                )}
                <div style={{ position: 'absolute', top: '12px', right: '12px' }}>
                  <span className={`admin-badge ${album.status === 'published' ? 'badge-success' : 'badge-warning'}`}>
                    {album.status === 'published' ? '已发布' : '草稿'}
                  </span>
                </div>
                <div style={{ position: 'absolute', bottom: '12px', left: '12px' }}>
                  <span className="admin-badge badge-default" style={{ background: 'rgba(0,0,0,0.5)', color: '#fff', backdropFilter: 'blur(4px)' }}>
                    {album.photo_count || 0} 张照片
                  </span>
                </div>
              </div>

              {/* Info */}
              <div style={{ padding: '16px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--admin-text-primary)', marginBottom: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{album.title}</h3>
                <p style={{ fontSize: '13px', color: 'var(--admin-text-muted)', marginBottom: '16px', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{album.description || '暂无描述'}</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    onClick={() => router.push(`/admin/albums/${album.id}/photos`)}
                    className="admin-btn admin-btn-primary admin-btn-sm"
                    style={{ flex: 1 }}
                  >
                    管理照片
                  </button>
                  <button
                    onClick={() => router.push(`/admin/albums/${album.id}/edit`)}
                    className="admin-btn admin-btn-default admin-btn-sm"
                  >
                    编辑
                  </button>
                  <button
                    onClick={() => handleDelete(album.id, album.title)}
                    className="admin-btn admin-btn-danger admin-btn-sm"
                  >
                    删除
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      <div style={{ padding: '16px 0' }}>
        <Pagination page={page} total={albums.length} pageSize={PAGE_SIZE} onChange={setPage} />
      </div>
    </div>
  );
}
