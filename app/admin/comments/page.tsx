"use client";

import { FormEvent, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import Pagination from '../components/Pagination';
import { useAdminToast } from '../components/useAdminToast';

type AdminComment = {
  id: string;
  post_id: string;
  parent_id: string | null;
  content: string;
  status: 'visible' | 'hidden' | 'spam' | 'deleted';
  created_at: string;
  edited_at: string | null;
  author_name: string;
  is_author: number;
  post_title: string | null;
  post_slug: string | null;
};

const STATUS_TEXT: Record<AdminComment['status'], string> = { visible: '显示中', hidden: '已隐藏', spam: '垃圾', deleted: '已删除' };
const STATUS_BADGE: Record<AdminComment['status'], string> = { visible: 'badge-success', hidden: 'badge-warning', spam: 'badge-default', deleted: 'badge-danger' };

export default function AdminCommentsPage() {
  const [comments, setComments] = useState<AdminComment[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('all');
  const [queryInput, setQueryInput] = useState('');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const { toast, showToast } = useAdminToast();
  const pageSize = 20;

  const fetchComments = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page) });
    if (query) params.set('query', query);
    if (status !== 'all') params.set('status', status);
    try {
      const response = await fetch(`/api/admin/comments?${params}`, { signal });
      const payload = await response.json();
      if (!response.ok || !payload.ok) throw new Error(payload.message || '加载失败');
      if (signal?.aborted) return;
      setComments(payload.data.items || []);
      setTotal(payload.data.total || 0);
    } catch (requestError) {
      if (!signal?.aborted) showToast('error', requestError instanceof Error ? requestError.message : '加载评论失败');
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, [page, query, showToast, status]);

  useEffect(() => {
    const controller = new AbortController();
    void fetchComments(controller.signal);
    return () => controller.abort();
  }, [fetchComments]);

  async function updateStatus(id: string, nextStatus: AdminComment['status']) {
    if (nextStatus === 'deleted' && !window.confirm('确定删除这条评论吗？删除后仍可在筛选器中恢复。')) return;
    try {
      const response = await fetch(`/api/admin/comments/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: nextStatus }) });
      const payload = await response.json();
      if (!response.ok || !payload.ok) throw new Error(payload.message || '操作失败');
      showToast('success', '评论状态已更新');
      await fetchComments();
    } catch (updateError) {
      showToast('error', updateError instanceof Error ? updateError.message : '操作失败');
    }
  }

  function search(event: FormEvent) {
    event.preventDefault();
    setPage(1);
    setQuery(queryInput.trim());
  }

  return (
    <div>
      {toast && <div className={`fixed top-20 right-6 z-50 rounded-xl px-5 py-3 text-sm font-bold text-white shadow-lg ${toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'}`}>{toast.message}</div>}
      <div className="admin-page-header"><h1>评论管理</h1><p>搜索文章评论，并管理公开显示状态</p></div>
      <div className="admin-card" style={{ marginBottom: 20 }}>
        <form onSubmit={search} style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <input className="admin-input" style={{ flex: '1 1 260px' }} value={queryInput} onChange={(event) => setQueryInput(event.target.value)} placeholder="搜索评论、用户或文章" aria-label="搜索评论" />
          <select className="admin-input" value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }} aria-label="评论状态">
            <option value="all">全部状态</option><option value="visible">显示中</option><option value="hidden">已隐藏</option><option value="spam">垃圾</option><option value="deleted">已删除</option>
          </select>
          <button type="submit" className="admin-btn admin-btn-primary">搜索</button>
        </form>
      </div>
      <div className="admin-card">
        <div className="admin-card-header"><h4>评论列表</h4><span className="admin-badge badge-default">共 {total} 条</span></div>
        {loading ? <div className="admin-loading"><div className="admin-spinner" /> 加载中...</div> : (
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead><tr><th>评论者</th><th>文章</th><th>内容</th><th>状态</th><th>时间</th><th style={{ textAlign: 'right' }}>操作</th></tr></thead>
              <tbody>
                {comments.length === 0 ? <tr><td colSpan={6}><div className="admin-empty"><div className="icon">🗨️</div><p>没有符合条件的评论</p></div></td></tr> : comments.map((comment) => (
                  <tr key={comment.id}>
                    <td><strong>{comment.author_name}</strong>{Boolean(comment.is_author) && <span className="admin-badge badge-default" style={{ marginLeft: 6 }}>作者</span>}<div style={{ fontSize: 11, opacity: 0.55 }}>{comment.parent_id ? '回复' : '主评论'}</div></td>
                    <td style={{ maxWidth: 180 }}>{comment.post_slug ? <Link href={`/posts/${comment.post_slug}`} target="_blank" className="admin-btn-text">{comment.post_title || '查看文章'}</Link> : '文章已删除'}</td>
                    <td style={{ maxWidth: 360 }}><span style={{ display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden', whiteSpace: 'pre-wrap' }}>{comment.content}</span></td>
                    <td><span className={`admin-badge ${STATUS_BADGE[comment.status]}`}>{STATUS_TEXT[comment.status]}</span></td>
                    <td style={{ fontSize: 12, opacity: 0.65 }}>{new Date(comment.created_at).toLocaleString('zh-CN')}</td>
                    <td><div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6, flexWrap: 'wrap' }}>
                      {comment.status !== 'visible' && <button className="admin-btn-text" onClick={() => void updateStatus(comment.id, 'visible')}>恢复</button>}
                      {comment.status !== 'hidden' && <button className="admin-btn-text" onClick={() => void updateStatus(comment.id, 'hidden')}>隐藏</button>}
                      {comment.status !== 'spam' && <button className="admin-btn-text" onClick={() => void updateStatus(comment.id, 'spam')}>垃圾</button>}
                      {comment.status !== 'deleted' && <button className="admin-btn-text danger" onClick={() => void updateStatus(comment.id, 'deleted')}>删除</button>}
                    </div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div style={{ paddingTop: 16 }}><Pagination page={page} total={total} pageSize={pageSize} onChange={setPage} /></div>
      </div>
    </div>
  );
}

