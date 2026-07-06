"use client";
import '../admin.css';

import { useState, useEffect } from 'react';
import Pagination from '../components/Pagination';

interface Song {
  id: string;
  title: string;
  artist: string;
  album: string;
  pic: string;
  url: string;
  lrc: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export default function AdminSongsPage() {
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ title: '', artist: '', album: '', pic: '', url: '', lrc: '', sort_order: 0 });
  const PAGE_SIZE = 10;

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchSongs = async () => {
    try {
      const res = await fetch('/api/admin/songs');
      const data = await res.json();
      if (data.ok) { setSongs(data.data || []); setPage(1); }
    } catch {
      showToast('error', '加载歌曲列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSongs(); }, []);

  const resetForm = () => {
    setForm({ title: '', artist: '', album: '', pic: '', url: '', lrc: '', sort_order: 0 });
    setEditingId(null);
    setShowForm(false);
  };

  const handleEdit = (song: Song) => {
    setForm({
      title: song.title,
      artist: song.artist,
      album: song.album || '',
      pic: song.pic || '',
      url: song.url,
      lrc: song.lrc || '',
      sort_order: song.sort_order,
    });
    setEditingId(song.id);
    setShowForm(true);
  };

  const handleSubmit = async () => {
    if (!form.title.trim() || !form.artist.trim() || !form.url.trim()) {
      showToast('error', '歌名、歌手、音频地址不能为空');
      return;
    }
    try {
      const method = editingId ? 'PUT' : 'POST';
      const url = editingId ? `/api/admin/songs/${editingId}` : '/api/admin/songs';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.ok) {
        showToast('success', editingId ? '歌曲已更新' : '歌曲已创建');
        resetForm();
        fetchSongs();
      } else {
        showToast('error', data.message || '操作失败');
      }
    } catch {
      showToast('error', '操作失败');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这首歌曲吗？')) return;
    try {
      const res = await fetch(`/api/admin/songs/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.ok) {
        showToast('success', '歌曲已删除');
        fetchSongs();
      } else {
        showToast('error', data.message || '删除失败');
      }
    } catch {
      showToast('error', '删除失败');
    }
  };

  const totalPages = Math.ceil(songs.length / PAGE_SIZE);
  const displaySongs = songs.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

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
            <h1>歌曲管理</h1>
            <p>管理音乐播放器的歌曲列表</p>
          </div>
          <button
            onClick={() => { resetForm(); setShowForm(!showForm); }}
            className="admin-btn admin-btn-primary"
          >
            {showForm ? '取消' : '+ 添加歌曲'}
          </button>
        </div>
      </div>

      {showForm && (
        <div className="admin-card" style={{ padding: '24px', marginBottom: '24px' }}>
          <h3 style={{ marginBottom: '16px', fontWeight: 700, color: 'var(--admin-text-primary)' }}>
            {editingId ? '编辑歌曲' : '添加歌曲'}
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '4px', color: 'var(--admin-text-secondary)' }}>歌名 *</label>
              <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
                className="admin-input" placeholder="歌名" />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '4px', color: 'var(--admin-text-secondary)' }}>歌手 *</label>
              <input value={form.artist} onChange={e => setForm({ ...form, artist: e.target.value })}
                className="admin-input" placeholder="歌手" />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '4px', color: 'var(--admin-text-secondary)' }}>专辑</label>
              <input value={form.album} onChange={e => setForm({ ...form, album: e.target.value })}
                className="admin-input" placeholder="专辑名" />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '4px', color: 'var(--admin-text-secondary)' }}>排序</label>
              <input type="number" value={form.sort_order} onChange={e => setForm({ ...form, sort_order: Number(e.target.value) })}
                className="admin-input" placeholder="0" />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '4px', color: 'var(--admin-text-secondary)' }}>封面图 URL</label>
              <input value={form.pic} onChange={e => setForm({ ...form, pic: e.target.value })}
                className="admin-input" placeholder="https://..." />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '4px', color: 'var(--admin-text-secondary)' }}>音频地址 *</label>
              <input value={form.url} onChange={e => setForm({ ...form, url: e.target.value })}
                className="admin-input" placeholder="https://..." />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '4px', color: 'var(--admin-text-secondary)' }}>LRC 歌词</label>
              <textarea value={form.lrc} onChange={e => setForm({ ...form, lrc: e.target.value })}
                className="admin-input" rows={6} placeholder="[00:00.00] 歌词内容..." style={{ resize: 'vertical' }} />
            </div>
          </div>
          <div style={{ marginTop: '16px', display: 'flex', gap: '8px' }}>
            <button onClick={handleSubmit} className="admin-btn admin-btn-primary">
              {editingId ? '保存修改' : '添加歌曲'}
            </button>
            <button onClick={resetForm} className="admin-btn">取消</button>
          </div>
        </div>
      )}

      {displaySongs.length === 0 ? (
        <div className="admin-empty">
          <div className="icon">🎵</div>
          <p>暂无歌曲</p>
        </div>
      ) : (
        <table className="admin-table">
          <thead>
            <tr>
              <th>排序</th>
              <th>歌名</th>
              <th>歌手</th>
              <th>专辑</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {displaySongs.map((song) => (
              <tr key={song.id}>
                <td>{song.sort_order}</td>
                <td style={{ fontWeight: 600 }}>{song.title}</td>
                <td>{song.artist}</td>
                <td>{song.album || '-'}</td>
                <td>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button onClick={() => handleEdit(song)} className="admin-btn-text">编辑</button>
                    <button onClick={() => handleDelete(song.id)} className="admin-btn-text danger">删除</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <div style={{ padding: '16px 0' }}>
        <Pagination page={page} total={songs.length} pageSize={PAGE_SIZE} onChange={setPage} />
      </div>
    </div>
  );
}
