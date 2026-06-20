"use client";

// Root-level boundary: replaces the entire root layout, so it must render its own
// <html>/<body> and rely on inline styles (globals.css is not guaranteed here).
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="zh-CN">
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#020617',
          color: '#e2e8f0',
          fontFamily: 'system-ui, -apple-system, "Noto Serif SC", serif',
          padding: '24px',
        }}
      >
        <div style={{ textAlign: 'center', maxWidth: '420px' }}>
          <div style={{ fontSize: '56px', marginBottom: '16px' }} aria-hidden>🙀</div>
          <h1 style={{ fontSize: '22px', fontWeight: 800, margin: '0 0 12px' }}>站点出了点严重状况喵~</h1>
          <p style={{ fontSize: '14px', color: '#94a3b8', margin: '0 0 28px', wordBreak: 'break-word' }}>
            {error?.message || '发生了未知错误'}
          </p>
          <button
            onClick={reset}
            style={{
              padding: '10px 22px',
              borderRadius: '9999px',
              border: 'none',
              background: '#6366f1',
              color: '#fff',
              fontSize: '14px',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            重新加载
          </button>
        </div>
      </body>
    </html>
  );
}
