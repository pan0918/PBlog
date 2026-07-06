"use client";
import '../../../admin.css';

import { memo, useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import { toBrowserSafeUrl } from '../../../../../lib/utils';

interface Album {
  id: string;
  title: string;
  slug: string;
}

interface Photo {
  id: string;
  image_url: string;
  thumbnail_url: string | null;
  title: string | null;
  description: string | null;
  sort_order: number;
}

interface PhotoDraft {
  title: string;
  description: string;
  sort_order: number;
}

interface PhotoCardProps {
  photo: Photo;
  index: number;
  isEditing: boolean;
  isSaving: boolean;
  onStartEdit: (photoId: string) => void;
  onCancelEdit: () => void;
  onSave: (photoId: string, draft: PhotoDraft) => Promise<void>;
  onDelete: (photoId: string) => Promise<void>;
}

const PhotoCard = memo(function PhotoCard({
  photo,
  index,
  isEditing,
  isSaving,
  onStartEdit,
  onCancelEdit,
  onSave,
  onDelete,
}: PhotoCardProps) {
  const [draft, setDraft] = useState<PhotoDraft>({
    title: photo.title || '',
    description: photo.description || '',
    sort_order: photo.sort_order,
  });

  const beginEdit = () => {
    setDraft({
      title: photo.title || '',
      description: photo.description || '',
      sort_order: photo.sort_order,
    });
    onStartEdit(photo.id);
  };

  return (
    <div
      className="admin-card"
      style={{
        padding: 0,
        overflow: 'hidden',
        contentVisibility: 'auto',
        containIntrinsicSize: '360px',
      }}
    >
      <div style={{ aspectRatio: '4/3', background: '#f0f0f0', overflow: 'hidden', position: 'relative' }}>
        <Image
          src={toBrowserSafeUrl(photo.thumbnail_url || photo.image_url)}
          alt={photo.title || ''}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 33vw, 280px"
          quality={75}
          unoptimized
          loading={index < 4 ? 'eager' : 'lazy'}
          decoding="async"
          style={{ objectFit: 'cover' }}
        />
      </div>

      {isEditing ? (
        <div style={{ padding: 12 }}>
          <div className="admin-form-group" style={{ marginBottom: 8 }}>
            <label className="admin-form-label" style={{ fontSize: 12 }}>标题</label>
            <input
              type="text"
              value={draft.title}
              onChange={(event) => setDraft(current => ({ ...current, title: event.target.value }))}
              className="admin-input"
              style={{ height: 32, fontSize: 13 }}
            />
          </div>
          <div className="admin-form-group" style={{ marginBottom: 8 }}>
            <label className="admin-form-label" style={{ fontSize: 12 }}>描述</label>
            <input
              type="text"
              value={draft.description}
              onChange={(event) => setDraft(current => ({ ...current, description: event.target.value }))}
              className="admin-input"
              style={{ height: 32, fontSize: 13 }}
            />
          </div>
          <div className="admin-form-group" style={{ marginBottom: 8 }}>
            <label className="admin-form-label" style={{ fontSize: 12 }}>排序</label>
            <input
              type="number"
              value={draft.sort_order}
              onChange={(event) => setDraft(current => ({
                ...current,
                sort_order: Number.parseInt(event.target.value, 10) || 0,
              }))}
              className="admin-input"
              style={{ height: 32, fontSize: 13 }}
            />
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={onCancelEdit} className="admin-btn admin-btn-default admin-btn-sm" style={{ flex: 1 }}>
              取消
            </button>
            <button
              onClick={() => onSave(photo.id, draft)}
              disabled={isSaving}
              className="admin-btn admin-btn-primary admin-btn-sm"
              style={{ flex: 1 }}
            >
              {isSaving ? '保存中...' : '保存'}
            </button>
          </div>
        </div>
      ) : (
        <div style={{ padding: 12 }}>
          <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--admin-text-primary)', marginBottom: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {photo.title || '(无标题)'}
          </p>
          <p style={{ fontSize: 12, color: 'var(--admin-text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {photo.description || '(无描述)'}
          </p>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
            <span style={{ fontSize: 12, color: 'var(--admin-text-muted)' }}>排序: {photo.sort_order}</span>
            <div style={{ display: 'flex', gap: 4 }}>
              <button onClick={beginEdit} className="admin-btn-text" style={{ fontSize: 12, padding: '0 6px' }}>编辑</button>
              <button onClick={() => onDelete(photo.id)} className="admin-btn-text danger" style={{ fontSize: 12, padding: '0 6px' }}>删除</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

export default function AlbumPhotosPage() {
  const params = useParams();
  const albumId = params.id as string;
  const [album, setAlbum] = useState<Album | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [addLoading, setAddLoading] = useState(false);
  const [form, setForm] = useState({ image_url: '', title: '', description: '', sort_order: 0 });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);

  const showToast = useCallback((type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    window.setTimeout(() => setToast(null), 3000);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function fetchData() {
      try {
        const [albumRes, photosRes] = await Promise.all([
          fetch(`/api/admin/albums/${albumId}`),
          fetch(`/api/admin/albums/${albumId}/photos`),
        ]);
        const [albumData, photosData] = await Promise.all([
          albumRes.json(),
          photosRes.json(),
        ]);
        if (cancelled) return;
        if (albumData.ok) setAlbum(albumData.data);
        if (photosData.ok) setPhotos(photosData.data || []);
      } catch {
        if (!cancelled) showToast('error', '加载数据失败');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchData();
    return () => {
      cancelled = true;
    };
  }, [albumId, showToast]);

  const handleAdd = async (event: React.FormEvent) => {
    event.preventDefault();
    setAddLoading(true);
    try {
      const response = await fetch(`/api/admin/albums/${albumId}/photos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await response.json();
      if (data.ok) {
        setPhotos(current => [...current, data.data]);
        showToast('success', '照片添加成功');
        setForm({ image_url: '', title: '', description: '', sort_order: 0 });
        setShowAdd(false);
      } else {
        showToast('error', data.message || '添加失败');
      }
    } catch {
      showToast('error', '添加失败');
    } finally {
      setAddLoading(false);
    }
  };

  const handleSaveEdit = useCallback(async (photoId: string, draft: PhotoDraft) => {
    setSavingId(photoId);
    try {
      const response = await fetch(`/api/admin/photos/${photoId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(draft),
      });
      const data = await response.json();
      if (data.ok) {
        setPhotos(current => current.map(photo => photo.id === photoId ? data.data : photo));
        setEditingId(null);
        showToast('success', '照片已更新');
      } else {
        showToast('error', data.message || '更新失败');
      }
    } catch {
      showToast('error', '更新失败');
    } finally {
      setSavingId(null);
    }
  }, [showToast]);

  const handleDelete = useCallback(async (photoId: string) => {
    if (!window.confirm('确定要删除这张照片吗？')) return;
    try {
      const response = await fetch(`/api/admin/photos/${photoId}`, { method: 'DELETE' });
      const data = await response.json();
      if (data.ok) {
        setPhotos(current => current.filter(photo => photo.id !== photoId));
        setEditingId(current => current === photoId ? null : current);
        showToast('success', '照片已删除');
      } else {
        showToast('error', data.message || '删除失败');
      }
    } catch {
      showToast('error', '删除失败');
    }
  }, [showToast]);

  const handleStartEdit = useCallback((photoId: string) => setEditingId(photoId), []);
  const handleCancelEdit = useCallback(() => setEditingId(null), []);

  if (loading) {
    return <div className="admin-loading"><div className="admin-spinner" /> 加载中...</div>;
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
          <h1>照片管理</h1>
          {album && <p>相册: {album.title}</p>}
        </div>
        <button onClick={() => setShowAdd(current => !current)} className="admin-btn admin-btn-primary">
          {showAdd ? '取消' : '添加照片'}
        </button>
      </div>

      {showAdd && (
        <div className="admin-card" style={{ marginBottom: 16 }}>
          <div className="admin-card-header"><h4>添加照片</h4></div>
          <form onSubmit={handleAdd}>
            <div className="admin-form-group">
              <label className="admin-form-label">图片 URL</label>
              <input type="url" value={form.image_url} onChange={(event) => setForm(current => ({ ...current, image_url: event.target.value }))} placeholder="https://..." className="admin-input" required />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 }}>
              <div className="admin-form-group">
                <label className="admin-form-label">标题</label>
                <input type="text" value={form.title} onChange={(event) => setForm(current => ({ ...current, title: event.target.value }))} className="admin-input" />
              </div>
              <div className="admin-form-group">
                <label className="admin-form-label">描述</label>
                <input type="text" value={form.description} onChange={(event) => setForm(current => ({ ...current, description: event.target.value }))} className="admin-input" />
              </div>
              <div className="admin-form-group">
                <label className="admin-form-label">排序</label>
                <input type="number" value={form.sort_order} onChange={(event) => setForm(current => ({ ...current, sort_order: Number.parseInt(event.target.value, 10) || 0 }))} className="admin-input" />
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
              <button type="button" onClick={() => setShowAdd(false)} className="admin-btn admin-btn-default">取消</button>
              <button type="submit" disabled={addLoading} className="admin-btn admin-btn-primary">{addLoading ? '添加中...' : '添加'}</button>
            </div>
          </form>
        </div>
      )}

      {photos.length === 0 ? (
        <div className="admin-card">
          <div className="admin-empty"><div className="icon">📦</div><p>暂无照片，点击上方按钮添加</p></div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16 }}>
          {photos.map((photo, index) => (
            <PhotoCard
              key={photo.id}
              photo={photo}
              index={index}
              isEditing={editingId === photo.id}
              isSaving={savingId === photo.id}
              onStartEdit={handleStartEdit}
              onCancelEdit={handleCancelEdit}
              onSave={handleSaveEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}
