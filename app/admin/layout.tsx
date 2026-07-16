"use client";

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { siteConfig } from '../../siteConfig';
import './admin.css';

const NAV_SECTIONS = [
  {
    title: '概览',
    items: [
      { name: '仪表盘', href: '/admin', icon: '📊' },
    ],
  },
  {
    title: '内容管理',
    items: [
      { name: '文章管理', href: '/admin/posts', icon: '📝' },
      { name: '分类管理', href: '/admin/categories', icon: '📂' },
      { name: '标签管理', href: '/admin/tags', icon: '🏷️' },
      { name: '说说管理', href: '/admin/moments', icon: '💭' },
    ],
  },
  {
    title: '扩展管理',
    items: [
      { name: '项目管理', href: '/admin/projects', icon: '🚀' },
      { name: '歌曲管理', href: '/admin/songs', icon: '🎵' },
      { name: '友链管理', href: '/admin/friends', icon: '🔗' },
      { name: '留言审核', href: '/admin/messages', icon: '💬' },
      { name: '评论管理', href: '/admin/comments', icon: '🗨️' },
      { name: '用户管理', href: '/admin/users', icon: '👥' },
      { name: '相册管理', href: '/admin/albums', icon: '📸' },
    ],
  },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  const handleLogout = async () => {
    await fetch('/api/admin/logout', { method: 'POST' });
    router.push('/admin/login');
  };

  const isActive = (href: string) => {
    if (href === '/admin') return pathname === '/admin';
    return pathname.startsWith(href);
  };

  // Find current page title
  const currentPage = NAV_SECTIONS.flatMap(s => s.items).find(i => isActive(i.href));

  return (
    <div className="admin-layout">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-[199] md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`admin-sidebar ${collapsed ? 'collapsed' : ''} ${mobileOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-logo">
          <img src={siteConfig.avatarUrl} alt="logo" />
          {!collapsed && <span>{siteConfig.navTitle} Admin</span>}
        </div>

        <nav className="sidebar-nav">
          {NAV_SECTIONS.map((section) => (
            <div key={section.title}>
              {!collapsed && (
                <div className="sidebar-section-title">{section.title}</div>
              )}
              {section.items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`sidebar-item ${isActive(item.href) ? 'active' : ''}`}
                  title={collapsed ? item.name : undefined}
                >
                  <span className="icon">{item.icon}</span>
                  {!collapsed && <span>{item.name}</span>}
                </Link>
              ))}
            </div>
          ))}
        </nav>
      </aside>

      {/* Main Area */}
      <div className={`admin-main-area ${collapsed ? 'sidebar-collapsed' : ''}`}>
        {/* Header */}
        <header className="admin-header">
          <div className="header-left">
            <button
              className="header-btn"
              onClick={() => setCollapsed(!collapsed)}
              title={collapsed ? '展开菜单' : '收起菜单'}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>

            {/* Back Button */}
            {pathname !== '/admin' && (
              <button
                className="admin-back-btn"
                onClick={() => {
                  if (window.history.length > 1) {
                    router.back();
                  } else {
                    router.push('/admin');
                  }
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 12H5M12 19l-7-7 7-7" />
                </svg>
                返回
              </button>
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: 'var(--admin-text-secondary)' }}>
              <span>{currentPage?.icon}</span>
              <span style={{ fontWeight: 500, color: 'var(--admin-text-primary)' }}>{currentPage?.name || '仪表盘'}</span>
            </div>
          </div>

          <div className="header-right">
            <Link href="/" target="_blank" className="header-btn" title="查看网站">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" y1="14" x2="21" y2="3" />
              </svg>
            </Link>

            <button
              onClick={handleLogout}
              className="admin-btn admin-btn-default admin-btn-sm"
              style={{ gap: 4 }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              退出
            </button>
          </div>
        </header>

        {/* Content */}
        <main className="admin-main">
          {children}
        </main>
      </div>
    </div>
  );
}
