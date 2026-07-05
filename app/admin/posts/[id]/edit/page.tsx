"use client";
import '../../../admin.css';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import VditorEditor, { type VditorEditorHandle } from '../../../components/VditorEditor';

interface Category { id: string; name: string; slug: string; }
interface Tag { id: string; name: string; slug: string; }

export default function EditPostPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [newTagName, setNewTagName] = useState('');
  const [newTagSlug, setNewTagSlug] = useState('');
  const [showTagInput, setShowTagInput] = useState(false);
  const editorRef = useRef<VditorEditorHandle>(null);
  const [form, setForm] = useState({
    title: '',
    slug: '',
    summary: '',
    cover_url: '',
    category_id: '',
    status: 'draft',
    is_pinned: 0,
    content: '',
  });

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [postRes, catRes, tagRes] = await Promise.all([
          fetch(`/api/admin/posts/${id}`),
          fetch('/api/admin/categories'),
          fetch('/api/admin/tags'),
        ]);
        const postData = await postRes.json();
        const catData = await catRes.json();
        const tagData = await tagRes.json();

        if (catData.ok) setCategories(catData.data || []);
        if (tagData.ok) setTags(tagData.data || []);

        if (postData.ok && postData.data) {
          const p = postData.data;
          setForm({
            title: p.title || '',
            slug: p.slug || '',
            summary: p.summary || '',
            cover_url: p.cover_url || '',
            category_id: p.category_id || '',
            status: p.status || 'draft',
            is_pinned: p.is_pinned || 0,
            content: p.content || '',
          });
          if (p.tags && Array.isArray(p.tags)) {
            setSelectedTagIds(p.tags.map((t: { id: string }) => t.id));
          }
        } else {
          showToast('error', '文章不存在');
        }
      } catch {
        showToast('error', '加载文章失败');
      } finally {
        setFetching(false);
      }
    };
    fetchData();
  }, [id]);

  const toggleTag = (tagId: string) => {
    setSelectedTagIds((prev) => prev.includes(tagId) ? prev.filter((t) => t !== tagId) : [...prev, tagId]);
  };

  const handleAddTag = async () => {
    if (!newTagName.trim() || !newTagSlug.trim()) return;
    try {
      const res = await fetch('/api/admin/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newTagName, slug: newTagSlug }),
      });
      const data = await res.json();
      if (data.ok) {
        setTags((prev) => [...prev, data.data]);
        setSelectedTagIds((prev) => [...prev, data.data.id]);
        setNewTagName('');
        setNewTagSlug('');
        setShowTagInput(false);
      }
    } catch {}
  };

  const handleSubmit = async () => {
    setLoading(true);
    const content = editorRef.current?.getContent() || form.content;
    try {
      const res = await fetch(`/api/admin/posts/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          content,
          category_id: form.category_id || null,
          tag_ids: selectedTagIds,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        showToast('success', '文章更新成功');
        setTimeout(() => router.push('/admin/posts'), 1000);
      } else {
        showToast('error', data.message || '更新失败');
      }
    } catch {
      showToast('error', '更新失败');
    } finally {
      setLoading(false);
    }
  };

  // Stats
  const wordCount = form.content.replace(/\s/g, '').length;
  const charCount = form.content.length;
  const headingCount = (form.content.match(/^#{1,3}\s/gm) || []).length;
  const imageCount = (form.content.match(/!\[.*?\]\(.*?\)/g) || []).length;
  const linkCount = (form.content.match(/\[.*?\]\(.*?\)/g) || []).length;
  const paragraphCount = form.content.split(/\n\n+/).filter(p => p.trim()).length;

  const selectedTags = tags.filter(t => selectedTagIds.includes(t.id));

  if (fetching) {
    return <div className="admin-loading"><div className="admin-spinner" /> 加载中...</div>;
  }

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>
      {toast && (
        <div className={`fixed top-20 right-6 z-50 px-5 py-3 rounded-xl shadow-lg text-sm font-bold ${
          toast.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
        }`}>
          {toast.message}
        </div>
      )}

      {/* Top: Cover URL + Tags */}
      <div className="admin-card" style={{ marginBottom: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, alignItems: 'start' }}>
          <div className="admin-form-group" style={{ marginBottom: 0 }}>
            <label className="admin-form-label">封面图 URL</label>
            <input type="text" value={form.cover_url} onChange={(e) => setForm({ ...form, cover_url: e.target.value })} placeholder="https://..." className="admin-input" />
          </div>
          <div className="admin-form-group" style={{ marginBottom: 0 }}>
            <label className="admin-form-label">标签</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center', minHeight: 36 }}>
              {selectedTags.map((tag) => (
                <span key={tag.id} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 6, fontSize: 13, fontWeight: 500, background: '#5D87FF1a', color: '#5D87FF' }}>
                  {tag.name}
                  <button onClick={() => toggleTag(tag.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#5D87FF', padding: 0, fontSize: 14, lineHeight: 1 }}>×</button>
                </span>
              ))}
              {showTagInput ? (
                <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                  <input type="text" value={newTagName} onChange={(e) => setNewTagName(e.target.value)} placeholder="名称" className="admin-input" style={{ width: 80, height: 28, fontSize: 12 }} />
                  <input type="text" value={newTagSlug} onChange={(e) => setNewTagSlug(e.target.value)} placeholder="slug" className="admin-input" style={{ width: 80, height: 28, fontSize: 12 }} />
                  <button onClick={handleAddTag} className="admin-btn admin-btn-primary admin-btn-sm" style={{ height: 28, fontSize: 12 }}>确定</button>
                  <button onClick={() => setShowTagInput(false)} className="admin-btn admin-btn-default admin-btn-sm" style={{ height: 28, fontSize: 12 }}>取消</button>
                </div>
              ) : (
                <button onClick={() => setShowTagInput(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 6, fontSize: 13, border: '1px dashed #d0d5dd', background: 'transparent', color: 'var(--admin-text-secondary)', cursor: 'pointer' }}>
                  + 添加标签
                </button>
              )}
              {!showTagInput && tags.filter(t => !selectedTagIds.includes(t.id)).length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 4, width: '100%' }}>
                  {tags.filter(t => !selectedTagIds.includes(t.id)).map((tag) => (
                    <button key={tag.id} onClick={() => toggleTag(tag.id)} style={{ padding: '2px 8px', borderRadius: 4, fontSize: 12, border: '1px solid #e2e8ee', background: '#fff', color: 'var(--admin-text-secondary)', cursor: 'pointer' }}>
                      + {tag.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Title & Slug */}
      <div className="admin-card" style={{ marginBottom: 16, padding: '16px 24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16 }}>
          <div className="admin-form-group" style={{ marginBottom: 0 }}>
            <label className="admin-form-label">标题</label>
            <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="admin-input" required style={{ fontSize: 18, height: 44, fontWeight: 600 }} />
          </div>
          <div className="admin-form-group" style={{ marginBottom: 0 }}>
            <label className="admin-form-label">Slug</label>
            <input type="text" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} className="admin-input" required style={{ height: 44 }} />
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="admin-card" style={{ marginBottom: 16, padding: '16px 24px' }}>
        <div className="admin-form-group" style={{ marginBottom: 0 }}>
          <label className="admin-form-label">摘要</label>
          <textarea value={form.summary} onChange={(e) => setForm({ ...form, summary: e.target.value })} placeholder="文章摘要..." rows={2} className="admin-input" />
        </div>
      </div>

      {/* Main: Editor + Sidebar + Submit - all aligned */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 260px', gap: 16, alignItems: 'stretch', marginBottom: 20 }}>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <VditorEditor ref={editorRef} value={form.content} onChange={(val) => setForm({ ...form, content: val })} />
          <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 16 }}>
            <button onClick={handleSubmit} disabled={loading} className="admin-btn admin-btn-primary" style={{ height: 48, padding: '0 48px', fontSize: 15, fontWeight: 600, borderRadius: 10 }}>
              {loading ? '更新中...' : '更新文章'}
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, position: 'sticky', top: 80 }}>
          <div className="admin-card" style={{ padding: 16 }}>
            <h4 style={{ fontSize: 14, fontWeight: 600, color: 'var(--admin-text-primary)', marginBottom: 12 }}>发布设置</h4>
            <div className="admin-form-group" style={{ marginBottom: 10 }}>
              <label className="admin-form-label" style={{ fontSize: 12 }}>分类</label>
              <select value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })} className="admin-input" style={{ height: 32, fontSize: 13 }}>
                <option value="">未分类</option>
                {categories.map((cat) => (<option key={cat.id} value={cat.id}>{cat.name}</option>))}
              </select>
            </div>
            <div className="admin-form-group" style={{ marginBottom: 10 }}>
              <label className="admin-form-label" style={{ fontSize: 12 }}>状态</label>
              <div style={{ display: 'flex', gap: 6 }}>
                <button type="button" onClick={() => setForm({ ...form, status: 'draft' })} className={`admin-btn admin-btn-sm ${form.status === 'draft' ? 'admin-btn-default' : 'admin-btn-default'}`} style={{ flex: 1, borderColor: form.status === 'draft' ? '#ffae1f' : undefined, color: form.status === 'draft' ? '#d48806' : undefined }}>草稿</button>
                <button type="button" onClick={() => setForm({ ...form, status: 'published' })} className={`admin-btn admin-btn-sm ${form.status === 'published' ? 'admin-btn-success' : 'admin-btn-default'}`} style={{ flex: 1 }}>发布</button>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 13, color: 'var(--admin-text-secondary)' }}>置顶文章</span>
              <input type="checkbox" checked={form.is_pinned === 1} onChange={() => setForm({ ...form, is_pinned: form.is_pinned ? 0 : 1 })} style={{ width: 16, height: 16, accentColor: '#5D87FF' }} />
            </div>
          </div>

          <div className="admin-card" style={{ padding: 16 }}>
            <h4 style={{ fontSize: 14, fontWeight: 600, color: 'var(--admin-text-primary)', marginBottom: 10 }}>写作辅助</h4>
            <div style={{ fontSize: 12, color: 'var(--admin-text-secondary)', lineHeight: 1.6 }}>
              <p style={{ fontWeight: 600, marginBottom: 4 }}>提醒</p>
              <ul style={{ margin: 0, paddingLeft: 16 }}>
                <li>建议在发布前预览文章效果</li>
                <li>合理使用标题层级 (H1-H3) 有助于文章结构清晰</li>
              </ul>
            </div>
          </div>

          <div className="admin-card" style={{ padding: 16 }}>
            <h4 style={{ fontSize: 14, fontWeight: 600, color: 'var(--admin-text-primary)', marginBottom: 10 }}>快捷键</h4>
            <div style={{ fontSize: 12, color: 'var(--admin-text-secondary)', display: 'flex', flexDirection: 'column', gap: 6 }}>
              {[['Ctrl + B', '加粗'], ['Ctrl + I', '斜体'], ['Ctrl + K', '插入链接'], ['Ctrl + Shift + I', '插入图片'], ['Ctrl + /', '打开命令面板']].map(([key, desc]) => (
                <div key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <code style={{ padding: '2px 6px', borderRadius: 4, background: '#f2f4f5', fontSize: 11, fontFamily: 'monospace' }}>{key}</code>
                  <span>{desc}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="admin-card" style={{ padding: 16 }}>
            <h4 style={{ fontSize: 14, fontWeight: 600, color: 'var(--admin-text-primary)', marginBottom: 10 }}>字数统计</h4>
            <div style={{ fontSize: 12, color: 'var(--admin-text-secondary)', display: 'flex', flexDirection: 'column', gap: 4 }}>
              {[['字数（预估）', wordCount], ['字符数', charCount.toLocaleString()], ['段落数', paragraphCount], ['标题数', headingCount], ['图片数', imageCount], ['链接数', linkCount]].map(([label, value]) => (
                <div key={label as string} style={{ display: 'flex', justifyContent: 'space-between' }}><span>{label}</span><span style={{ fontWeight: 600, color: 'var(--admin-text-primary)' }}>{value}</span></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
