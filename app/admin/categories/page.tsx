"use client";
import '../admin.css';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import Pagination from '../components/Pagination';
import { useAdminToast } from '../components/useAdminToast';

interface Category {
  id: number;
  name: string;
  slug: string;
  description: string;
  sort_order: number;
}

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast, showToast } = useAdminToast();
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 5;
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({ name: '', slug: '', description: '', sort_order: 0 });

  const fetchCategories = useCallback(async (signal?: AbortSignal) => {
    try {
      const res = await fetch('/api/admin/categories', { signal });
      const data = await res.json();
      if (signal?.aborted) return;
      if (data.ok) { setCategories(data.data || []); setPage(1); }
    } catch {
      if (!signal?.aborted) showToast('error', '加载分类列表失败');
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    const controller = new AbortController();
    fetchCategories(controller.signal);
    return () => controller.abort();
  }, [fetchCategories]);

  const resetForm = () => {
    setForm({ name: '', slug: '', description: '', sort_order: 0 });
    setShowForm(false);
    setEditingId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingId ? `/api/admin/categories/${editingId}` : '/api/admin/categories';
      const method = editingId ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.ok) {
        showToast('success', editingId ? '分类已更新' : '分类已创建');
        resetForm();
        fetchCategories();
      } else {
        showToast('error', data.message || '操作失败');
      }
    } catch {
      showToast('error', '操作失败');
    }
  };

  const handleEdit = (cat: Category) => {
    setForm({ name: cat.name, slug: cat.slug, description: cat.description || '', sort_order: cat.sort_order });
    setEditingId(cat.id);
    setShowForm(true);
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`确定要删除分类「${name}」吗？`)) return;
    try {
      const res = await fetch(`/api/admin/categories/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.ok) {
        showToast('success', '分类已删除');
        fetchCategories();
      } else {
        showToast('error', data.message || '删除失败');
      }
    } catch {
      showToast('error', '删除失败');
    }
  };

  const totalPages = Math.ceil(categories.length / PAGE_SIZE);
  const displayCategories = categories.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

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
        <h1>分类管理</h1>
        <p>管理博客文章分类</p>
      </div>

      {/* Inline Add/Edit Form */}
      {showForm && (
        <div className="admin-card" style={{ marginBottom: '24px' }}>
          <div className="admin-card-header">
            <h4>{editingId ? '编辑分类' : '新建分类'}</h4>
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
            <div className="admin-form-group">
              <label className="admin-form-label">描述</label>
              <input
                type="text"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="admin-input"
              />
            </div>
            <div className="admin-form-group">
              <label className="admin-form-label">排序</label>
              <input
                type="number"
                value={form.sort_order}
                onChange={(e) => setForm({ ...form, sort_order: parseInt(e.target.value) || 0 })}
                className="admin-input"
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
          <h4>分类列表</h4>
          <button
            onClick={() => { resetForm(); setShowForm(true); }}
            className="admin-btn admin-btn-primary admin-btn-sm"
          >
            + 新建分类
          </button>
        </div>
        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>名称</th>
                <th>Slug</th>
                <th>描述</th>
                <th>排序</th>
                <th style={{ textAlign: 'right' }}>操作</th>
              </tr>
            </thead>
            <tbody>
              {displayCategories.length === 0 ? (
                <tr>
                  <td colSpan={5}>
                    <div className="admin-empty">
                      <div className="icon">📦</div>
                      <p>暂无分类</p>
                    </div>
                  </td>
                </tr>
              ) : displayCategories.map((cat) => (
                <tr key={cat.id}>
                  <td><strong>{cat.name}</strong></td>
                  <td style={{ fontFamily: 'monospace', fontSize: '12px' }}>{cat.slug}</td>
                  <td style={{ opacity: 0.6 }}>{cat.description || '-'}</td>
                  <td>{cat.sort_order}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
                      <button
                        onClick={() => handleEdit(cat)}
                        className="admin-btn-text"
                      >
                        编辑
                      </button>
                      <button
                        onClick={() => handleDelete(cat.id, cat.name)}
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
          <Pagination page={page} total={categories.length} pageSize={PAGE_SIZE} onChange={setPage} />
        </div>
      </div>
    </div>
  );
}
