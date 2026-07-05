"use client";
import '../admin.css';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Pagination from '../components/Pagination';

interface Message {
  id: number;
  author: string;
  content: string;
  status: string;
  created_at: string;
}

export default function AdminMessagesPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 5;
  const [filter, setFilter] = useState('all');

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchMessages = async () => {
    try {
      const res = await fetch('/api/admin/messages');
      const data = await res.json();
      if (data.ok) { setMessages(data.data || []); setPage(1); }
    } catch {
      showToast('error', '加载留言列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchMessages(); }, []);

  const handleStatus = async (id: number, status: string) => {
    try {
      const res = await fetch(`/api/admin/messages/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (data.ok) {
        showToast('success', '状态已更新');
        fetchMessages();
      } else {
        showToast('error', data.message || '操作失败');
      }
    } catch {
      showToast('error', '操作失败');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('确定要删除这条留言吗？')) return;
    try {
      const res = await fetch(`/api/admin/messages/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.ok) {
        showToast('success', '留言已删除');
        fetchMessages();
      } else {
        showToast('error', data.message || '删除失败');
      }
    } catch {
      showToast('error', '删除失败');
    }
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case 'approved': return 'badge-success';
      case 'pending': return 'badge-warning';
      case 'rejected': return 'badge-danger';
      case 'spam': return 'badge-default';
      default: return 'badge-default';
    }
  };

  const statusText = (status: string) => {
    switch (status) {
      case 'approved': return '已通过';
      case 'pending': return '待审核';
      case 'rejected': return '已拒绝';
      case 'spam': return '垃圾';
      default: return status;
    }
  };

  const filtered = filter === 'all' ? messages : messages.filter((m) => m.status === filter);
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const displayMessages = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => { setPage(1); }, [filter]);

  const tabs = [
    { key: 'all', label: '全部' },
    { key: 'pending', label: '待审核' },
    { key: 'approved', label: '已通过' },
    { key: 'rejected', label: '已拒绝' },
    { key: 'spam', label: '垃圾' },
  ];

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
        <h1>留言审核</h1>
        <p>审核和管理用户留言</p>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`admin-btn ${filter === tab.key ? 'admin-btn-primary' : 'admin-btn-default'}`}
          >
            {tab.label}
            {tab.key !== 'all' && (
              <span style={{ marginLeft: '6px', opacity: 0.7, fontSize: '12px' }}>
                ({messages.filter((m) => tab.key === 'all' || m.status === tab.key).length})
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="admin-card">
        <div className="admin-card-header">
          <h4>留言列表</h4>
        </div>
        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>作者</th>
                <th>内容</th>
                <th>状态</th>
                <th>时间</th>
                <th style={{ textAlign: 'right' }}>操作</th>
              </tr>
            </thead>
            <tbody>
              {displayMessages.length === 0 ? (
                <tr>
                  <td colSpan={5}>
                    <div className="admin-empty">
                      <div className="icon">📦</div>
                      <p>暂无留言</p>
                    </div>
                  </td>
                </tr>
              ) : displayMessages.map((msg) => (
                <tr key={msg.id}>
                  <td><strong>{msg.author}</strong></td>
                  <td style={{ maxWidth: '300px' }}><span style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{msg.content}</span></td>
                  <td>
                    <span className={`admin-badge ${statusBadge(msg.status)}`}>
                      {statusText(msg.status)}
                    </span>
                  </td>
                  <td style={{ fontSize: '12px', opacity: 0.6 }}>
                    {new Date(msg.created_at).toLocaleString('zh-CN')}
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
                      {msg.status !== 'approved' && (
                        <button onClick={() => handleStatus(msg.id, 'approved')} className="admin-btn-text">通过</button>
                      )}
                      {msg.status !== 'rejected' && (
                        <button onClick={() => handleStatus(msg.id, 'rejected')} className="admin-btn-text danger">拒绝</button>
                      )}
                      {msg.status !== 'spam' && (
                        <button onClick={() => handleStatus(msg.id, 'spam')} className="admin-btn-text">垃圾</button>
                      )}
                      <button onClick={() => handleDelete(msg.id)} className="admin-btn-text danger">删除</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ padding: '16px 0' }}>
          <Pagination page={page} total={filtered.length} pageSize={PAGE_SIZE} onChange={setPage} />
        </div>
      </div>
    </div>
  );
}
