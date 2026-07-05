"use client";
import '../admin.css';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Pagination from '../components/Pagination';

interface Post {
  id: number;
  title: string;
  slug: string;
  category_name: string;
  status: string;
  is_pinned: number;
  published_at: string;
}

export default function AdminPostsPage() {
  const router = useRouter();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 5;

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchPosts = async () => {
    try {
      const res = await fetch('/api/admin/posts');
      const data = await res.json();
      if (data.ok) { setPosts(data.data || []); setPage(1); }
    } catch {
      showToast('error', '加载文章列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPosts(); }, []);

  const handleDelete = async (id: number, title: string) => {
    if (!confirm(`确定要删除文章「${title}」吗？`)) return;
    try {
      const res = await fetch(`/api/admin/posts/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.ok) {
        showToast('success', '文章已删除');
        fetchPosts();
      } else {
        showToast('error', data.message || '删除失败');
      }
    } catch {
      showToast('error', '删除失败');
    }
  };

  const totalPages = Math.ceil(posts.length / PAGE_SIZE);
  const displayPosts = posts.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

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
        <div
          className="fixed top-20 right-6 z-50 px-5 py-3 rounded-xl shadow-lg text-sm font-bold"
          style={{
            backgroundColor: toast.type === 'success' ? '#13deb9' : '#ff4d4f',
            color: '#fff',
          }}
        >
          {toast.message}
        </div>
      )}

      <div className="admin-page-header">
        <h1>文章管理</h1>
      </div>

      <div className="admin-card">
        <div className="admin-card-header">
          <h4>全部文章</h4>
          <Link href="/admin/posts/new" className="admin-btn admin-btn-primary">
            + 新建文章
          </Link>
        </div>

        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>标题</th>
                <th>分类</th>
                <th>状态</th>
                <th>置顶</th>
                <th>发布时间</th>
                <th style={{ textAlign: 'right' }}>操作</th>
              </tr>
            </thead>
            <tbody>
              {displayPosts.length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    <div className="admin-empty">
                      <div className="icon">📦</div>
                      <p>暂无文章</p>
                    </div>
                  </td>
                </tr>
              ) : displayPosts.map((post) => (
                <tr key={post.id}>
                  <td>
                    <span style={{ fontWeight: 600 }}>{post.title}</span>
                  </td>
                  <td>{post.category_name || '-'}</td>
                  <td>
                    <span className={`admin-badge ${post.status === 'published' ? 'badge-success' : 'badge-warning'}`}>
                      {post.status === 'published' ? '已发布' : '草稿'}
                    </span>
                  </td>
                  <td>
                    {post.is_pinned ? (
                      <span className="admin-badge badge-info">置顶</span>
                    ) : (
                      <span>-</span>
                    )}
                  </td>
                  <td>
                    {post.published_at ? new Date(post.published_at).toLocaleDateString('zh-CN') : '-'}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button
                      onClick={() => router.push(`/admin/posts/${post.id}/edit`)}
                      className="admin-btn-text"
                    >
                      编辑
                    </button>
                    <button
                      onClick={() => handleDelete(post.id, post.title)}
                      className="admin-btn-text danger"
                    >
                      删除
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ padding: '16px 0' }}>
          <Pagination page={page} total={posts.length} pageSize={PAGE_SIZE} onChange={setPage} />
        </div>
      </div>
    </div>
  );
}
