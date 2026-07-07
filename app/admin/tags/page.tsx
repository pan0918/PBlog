"use client";
import '../admin.css';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import Pagination from '../components/Pagination';
import { useAdminToast } from '../components/useAdminToast';

interface Tag {
  id: number;
  name: string;
  slug: string;
}

export default function AdminTagsPage() {
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast, showToast } = useAdminToast();
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 5;
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({ name: '', slug: '' });

  const fetchTags = useCallback(async (signal?: AbortSignal) => {
    try {
      const res = await fetch('/api/admin/tags', { signal });
      const data = await res.json();
      if (signal?.aborted) return;
      if (data.ok) { setTags(data.data || []); setPage(1); }
    } catch {
      if (!signal?.aborted) showToast('error', '加载标签列表失败');
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    const controller = new AbortController();
    fetchTags(controller.signal);
    return () => controller.abort();
  }, [fetchTags]);

  const resetForm = () => {
    setForm({ name: '', slug: '' });
    setShowForm(false);
    setEditingId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingId ? `/api/admin/tags/${editingId}` : '/api/admin/tags';
      const method = editingId ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.ok) {
        showToast('success', editingId ? '标签已更新' : '标签已创建');
        resetForm();
        fetchTags();
      } else {
        showToast('error', data.message || '操作失败');
      }
    } catch {
      showToast('error', '操作失败');
    }
  };

  const handleEdit = (tag: Tag) => {
    setForm({ name: tag.name, slug: tag.slug });
    setEditingId(tag.id);
    setShowForm(true);
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`确定要删除标签「${name}」吗？`)) return;
    try {
      const res = await fetch(`/api/admin/tags/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.ok) {
        showToast('success', '标签已删除');
        fetchTags();
      } else {
        showToast('error', data.message || '删除失败');
      }
    } catch {
      showToast('error', '删除失败');
    }
  };

  const totalPages = Math.ceil(tags.length / PAGE_SIZE);
  const displayTags = tags.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  if (loading) {
    return (
      <div className="admin-loading">
        <div className="admin-spinner" /> 加载中...
      </div>
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
        <h1>标签管理</h1>
        <p>管理博客文章标签</p>
      </div>

      {/* Inline Add/Edit Form */}
      {showForm && (
        <div className="admin-card" style={{ marginBottom: '24px' }}>
          <div className="admin-card-header">
            <h4>{editingId ? '编辑标签' : '新建标签'}</h4>
          </div>
          <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', padding: '24px' }}>
            <div className="admin-form-group">
              <label className="admin-form-label">名称</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="admin-input"
                required
              />
            </div>
            <div className="admin-form-group">
              <label className="admin-form-label">Slug</label>
              <input
                type="text"
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value })}
                className="admin-input"
                required
              />
            </div>
            <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', gap: '12px', paddingTop: '8px' }}>
              <button
                type="button"
                onClick={resetForm}
                className="admin-btn admin-btn-default"
              >
                取消
              </button>
              <button
                type="submit"
                className="admin-btn admin-btn-primary"
              >
                {editingId ? '更新' : '创建'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="admin-card">
        <div className="admin-card-header">
          <h4>标签列表</h4>
          <button
            onClick={() => { resetForm(); setShowForm(true); }}
            className="admin-btn admin-btn-primary admin-btn-sm"
          >
            + 新建标签
          </button>
        </div>
        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>名称</th>
                <th>Slug</th>
                <th style={{ textAlign: 'right' }}>操作</th>
              </tr>
            </thead>
            <tbody>
              {displayTags.length === 0 ? (
                <tr>
                  <td colSpan={3}>
                    <div className="admin-empty">
                      <div className="icon">📦</div>
                      <p>暂无标签</p>
                    </div>
                  </td>
                </tr>
              ) : displayTags.map((tag) => (
                <tr key={tag.id}>
                  <td>
                    <span className="admin-badge badge-info">{tag.name}</span>
                  </td>
                  <td style={{ fontFamily: 'monospace', fontSize: '12px' }}>{tag.slug}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
                      <button
                        onClick={() => handleEdit(tag)}
                        className="admin-btn-text"
                      >
                        编辑
                      </button>
                      <button
                        onClick={() => handleDelete(tag.id, tag.name)}
                        className="admin-btn-text danger"
                      >
                        删除
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ padding: '16px 0' }}>
          <Pagination page={page} total={tags.length} pageSize={PAGE_SIZE} onChange={setPage} />
        </div>
      </div>
    </div>
  );
}
