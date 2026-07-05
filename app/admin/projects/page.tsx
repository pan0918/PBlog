"use client";
import '../admin.css';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Pagination from '../components/Pagination';

interface Project {
  id: number;
  title: string;
  slug: string;
  description: string;
  status: string;
  sort_order: number;
  github_url: string;
}

export default function AdminProjectsPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 5;

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchProjects = async () => {
    try {
      const res = await fetch('/api/admin/projects');
      const data = await res.json();
      if (data.ok) { setProjects(data.data || []); setPage(1); }
    } catch {
      showToast('error', '加载项目列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProjects(); }, []);

  const handleDelete = async (id: number, title: string) => {
    if (!confirm(`确定要删除项目「${title}」吗？`)) return;
    try {
      const res = await fetch(`/api/admin/projects/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.ok) {
        showToast('success', '项目已删除');
        fetchProjects();
      } else {
        showToast('error', data.message || '删除失败');
      }
    } catch {
      showToast('error', '删除失败');
    }
  };

  const totalPages = Math.ceil(projects.length / PAGE_SIZE);
  const displayProjects = projects.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

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
        <h1>项目管理</h1>
        <p>管理所有项目信息</p>
      </div>

      <div className="admin-card">
        <div className="admin-card-header">
          <h4>项目列表</h4>
          <button className="admin-btn admin-btn-primary" onClick={() => router.push('/admin/projects/new')}>
            + 新建项目
          </button>
        </div>

        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>标题</th>
                <th>Slug</th>
                <th>描述</th>
                <th>状态</th>
                <th>排序</th>
                <th>GitHub</th>
                <th style={{ textAlign: 'right' }}>操作</th>
              </tr>
            </thead>
            <tbody>
              {displayProjects.length === 0 ? (
                <tr>
                  <td colSpan={7}>
                    <div className="admin-empty"><div className="icon">📦</div><p>暂无项目</p></div>
                  </td>
                </tr>
              ) : displayProjects.map((project) => (
                <tr key={project.id}>
                  <td style={{ fontWeight: 'bold' }}>{project.title}</td>
                  <td style={{ fontFamily: 'monospace', fontSize: '0.85em' }}>{project.slug}</td>
                  <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{project.description || '-'}</td>
                  <td>
                    <span className={`admin-badge ${project.status === 'published' ? 'badge-success' : 'badge-warning'}`}>
                      {project.status === 'published' ? '已发布' : '草稿'}
                    </span>
                  </td>
                  <td>{project.sort_order}</td>
                  <td>
                    {project.github_url ? (
                      <a href={project.github_url} target="_blank" rel="noopener noreferrer" className="admin-btn-text" style={{ fontSize: '0.85em' }}>
                        查看
                      </a>
                    ) : (
                      <span style={{ color: '#999' }}>-</span>
                    )}
                  </td>
                  <td>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                      <button onClick={() => router.push(`/admin/projects/${project.id}/edit`)} className="admin-btn-text">编辑</button>
                      <button onClick={() => handleDelete(project.id, project.title)} className="admin-btn-text danger">删除</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ padding: '16px 0' }}>
          <Pagination page={page} total={projects.length} pageSize={PAGE_SIZE} onChange={setPage} />
        </div>
      </div>
    </div>
  );
}
