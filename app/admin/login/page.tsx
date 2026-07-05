"use client";

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { siteConfig } from '../../../siteConfig';

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (data.ok) {
        router.push('/admin');
      } else {
        setError(data.message || '登录失败');
      }
    } catch {
      setError('网络错误，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#fafbfc',
      padding: 24,
    }}>
      <div style={{ width: '100%', maxWidth: 400 }}>
        {/* Card */}
        <div style={{
          background: '#fff',
          borderRadius: 16,
          boxShadow: '0 8px 32px rgba(0,0,0,0.06)',
          border: '1px solid rgba(0,0,0,0.04)',
          padding: '48px 40px',
        }}>
          {/* Logo & Title */}
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <div style={{
              width: 56,
              height: 56,
              borderRadius: 14,
              overflow: 'hidden',
              margin: '0 auto 16px',
              boxShadow: '0 4px 12px rgba(93,135,255,0.15)',
            }}>
              <img
                src={siteConfig.avatarUrl}
                alt="avatar"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>
            <h1 style={{
              fontSize: 22,
              fontWeight: 700,
              color: '#383853',
              margin: 0,
              letterSpacing: '-0.02em',
            }}>
              {siteConfig.navTitle}
              <span style={{ color: '#5D87FF' }}> Admin</span>
            </h1>
            <p style={{
              fontSize: 14,
              color: '#949eb7',
              marginTop: 8,
            }}>
              博客后台管理系统
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 20 }}>
              <label style={{
                display: 'block',
                fontSize: 14,
                fontWeight: 500,
                color: '#383853',
                marginBottom: 8,
              }}>
                用户名
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="请输入用户名"
                style={{
                  width: '100%',
                  height: 40,
                  padding: '0 14px',
                  border: '1px solid #e2e8ee',
                  borderRadius: 8,
                  fontSize: 14,
                  color: '#383853',
                  outline: 'none',
                  transition: 'all 0.2s',
                  boxSizing: 'border-box',
                }}
                required
                autoComplete="username"
                onFocus={(e) => {
                  e.target.style.borderColor = '#5D87FF';
                  e.target.style.boxShadow = '0 0 0 3px #5D87FF1a';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#e2e8ee';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>

            <div style={{ marginBottom: 24 }}>
              <label style={{
                display: 'block',
                fontSize: 14,
                fontWeight: 500,
                color: '#383853',
                marginBottom: 8,
              }}>
                密码
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="请输入密码"
                style={{
                  width: '100%',
                  height: 40,
                  padding: '0 14px',
                  border: '1px solid #e2e8ee',
                  borderRadius: 8,
                  fontSize: 14,
                  color: '#383853',
                  outline: 'none',
                  transition: 'all 0.2s',
                  boxSizing: 'border-box',
                }}
                required
                autoComplete="current-password"
                onFocus={(e) => {
                  e.target.style.borderColor = '#5D87FF';
                  e.target.style.boxShadow = '0 0 0 3px #5D87FF1a';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#e2e8ee';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>

            {error && (
              <div style={{
                padding: '10px 14px',
                borderRadius: 8,
                background: '#ff4d4f1a',
                border: '1px solid #ff4d4f33',
                color: '#ff4d4f',
                fontSize: 13,
                marginBottom: 20,
                fontWeight: 500,
              }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                height: 44,
                borderRadius: 8,
                background: '#5D87FF',
                color: '#fff',
                fontSize: 15,
                fontWeight: 600,
                border: 'none',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.6 : 1,
                transition: 'all 0.2s',
                letterSpacing: '0.02em',
              }}
            >
              {loading ? '登录中...' : '登 录'}
            </button>
          </form>
        </div>

        {/* Footer */}
        <p style={{
          textAlign: 'center',
          fontSize: 13,
          color: '#949eb7',
          marginTop: 24,
        }}>
          <Link href="/" style={{ color: '#5D87FF', textDecoration: 'none' }}>← 返回首页</Link>
        </p>
      </div>
    </div>
  );
}
