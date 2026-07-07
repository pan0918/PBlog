"use client";
import '../admin.css';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Pagination from '../components/Pagination';
import { useAdminToast } from '../components/useAdminToast';

interface Friend {
  id: number;
  name: string;
  url: string;
  avatar: string;
  description: string;
  status: string;
}

export default function AdminFriendsPage() {
  const router = useRouter();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast, showToast } = useAdminToast();
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 5;

  const fetchFriends = useCallback(async (signal?: AbortSignal) => {
    try {
      const res = await fetch('/api/admin/friends', { signal });
      const data = await res.json();
      if (signal?.aborted) return;
      if (data.ok) { setFriends(data.data || []); setPage(1); }
    } catch {
      if (!signal?.aborted) showToast('error', '加载友链列表失败');
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    const controller = new AbortController();
    fetchFriends(controller.signal);
    return () => controller.abort();
  }, [fetchFriends]);

  const handleStatus = async (id: number, status: string) => {
    try {
      const action = status === 'approved' ? 'approve' : 'reject';
      const res = await fetch(`/api/admin/friends/${id}/${action}`, {
        method: 'PATCH',
      });
      const data = await res.json();
      if (data.ok) {
        showToast('success', `友链已${status === 'approved' ? '通过' : '拒绝'}`);
        fetchFriends();
      } else {
        showToast('error', data.message || '操作失败');
      }
    } catch {
      showToast('error', '操作失败');
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`确定要删除友链「${name}」吗？`)) return;
    try {
      const res = await fetch(`/api/admin/friends/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.ok) {
        showToast('success', '友链已删除');
        fetchFriends();
      } else {
        showToast('error', data.message || '删除失败');
      }
    } catch {
      showToast('error', '删除失败');
    }
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return 'badge-success';
      case 'pending':
        return 'badge-warning';
      case 'rejected':
        return 'badge-danger';
      default:
        return 'badge-warning';
    }
  };

  const statusText = (status: string) => {
    switch (status) {
      case 'approved': return '已通过';
      case 'pending': return '待审核';
      case 'rejected': return '已拒绝';
      default: return status;
    }
  };

  const totalPages = Math.ceil(friends.length / PAGE_SIZE);
  const displayFriends = friends.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

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
        <h1>友链管理</h1>
        <p>管理博客友链的审核和编辑</p>
      </div>

      <div className="admin-card">
        <div className="admin-card-header">
          <h4>友链列表</h4>
          <button className="admin-btn admin-btn-primary" onClick={() => router.push('/admin/friends/new')}>新建友链</button>
        </div>

        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>名称</th>
                <th>链接</th>
                <th>头像</th>
                <th>描述</th>
                <th>状态</th>
                <th style={{ textAlign: 'right' }}>操作</th>
              </tr>
            </thead>
            <tbody>
              {displayFriends.length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    <div className="admin-empty">
                      <div className="icon">📦</div>
                      <p>暂无友链</p>
                    </div>
                  </td>
                </tr>
              ) : displayFriends.map((friend) => (
                <tr key={friend.id}>
                  <td style={{ fontWeight: 600 }}>{friend.name}</td>
                  <td>
                    <a href={friend.url} target="_blank" rel="noopener noreferrer" className="admin-btn-text" style={{ fontSize: '12px', maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>
                      {friend.url}
                    </a>
                  </td>
                  <td>
                    {friend.avatar ? (
                      <img src={friend.avatar} alt={friend.name} style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#e5e7eb' }} />
                    )}
                  </td>
                  <td style={{ maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{friend.description || '-'}</td>
                  <td>
                    <span className={`admin-badge ${statusBadge(friend.status)}`}>
                      {statusText(friend.status)}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
                      {friend.status === 'pending' && (
                        <>
                          <button className="admin-btn admin-btn-sm admin-btn-success" onClick={() => handleStatus(friend.id, 'approved')}>通过</button>
                          <button className="admin-btn admin-btn-sm admin-btn-danger" onClick={() => handleStatus(friend.id, 'rejected')}>拒绝</button>
                        </>
                      )}
                      <button className="admin-btn-text" onClick={() => router.push(`/admin/friends/${friend.id}/edit`)}>编辑</button>
                      <button className="admin-btn-text danger" onClick={() => handleDelete(friend.id, friend.name)}>删除</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ padding: '16px 0' }}>
          <Pagination page={page} total={friends.length} pageSize={PAGE_SIZE} onChange={setPage} />
        </div>
      </div>
    </div>
  );
}
