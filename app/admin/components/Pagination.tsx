"use client";

interface PaginationProps {
  page: number;
  total: number;
  pageSize: number;
  onChange: (page: number) => void;
}

export default function Pagination({ page, total, pageSize, onChange }: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const pages: (number | string)[] = [];
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= page - 1 && i <= page + 1)) {
      pages.push(i);
    } else if (pages[pages.length - 1] !== '...') {
      pages.push('...');
    }
  }

  return (
    <div className="admin-pagination">
      <span style={{ fontSize: 13, color: 'var(--admin-text-muted)', marginRight: 12 }}>
        共 {total} 条
      </span>
      <button disabled={page <= 1} onClick={() => onChange(page - 1)}>上一页</button>
      {pages.map((p, i) =>
        typeof p === 'string' ? (
          <span key={`ellipsis-${i}`} style={{ padding: '0 6px', color: 'var(--admin-text-muted)' }}>...</span>
        ) : (
          <button
            key={p}
            className={p === page ? 'active' : ''}
            onClick={() => onChange(p)}
          >
            {p}
          </button>
        )
      )}
      <button disabled={page >= totalPages} onClick={() => onChange(page + 1)}>下一页</button>
    </div>
  );
}
