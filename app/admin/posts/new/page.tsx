"use client";
import '../../admin.css';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import VditorEditor, { type VditorEditorHandle } from '../../components/VditorEditor';

interface Category { id: string; name: string; slug: string; }
interface Tag { id: string; name: string; slug: string; }

export default function NewPostPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
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
        const [catRes, tagRes] = await Promise.all([
          fetch('/api/admin/categories'),
          fetch('/api/admin/tags'),
        ]);
        const catData = await catRes.json();
        const tagData = await tagRes.json();
        if (catData.ok) setCategories(catData.data || []);
        if (tagData.ok) setTags(tagData.data || []);
      } catch {
        showToast('error', '加载分类/标签失败');
      }
    };
    fetchData();
  }, []);

  const generateSlug = (title: string) => {
    return title.toLowerCase().replace(/[^a-z0-9一-龥]+/g, '-').replace(/^-+|-+$/g, '');
  };

  const handleTitleChange = (value: string) => {
    setForm((prev) => ({
      ...prev,
      title: value,
      slug: prev.slug === generateSlug(prev.title) || prev.slug === '' ? generateSlug(value) : prev.slug,
    }));
  };

  const toggleTag = (id: string) => {
    setSelectedTagIds((prev) => prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]);
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
        showToast('success', '标签已创建');
      } else {
        showToast('error', data.message || '创建标签失败');
      }
    } catch {
      showToast('error', '创建标签失败');
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    // Get the latest content directly from Vditor
    const content = editorRef.current?.getContent() || form.content;
    try {
      const res = await fetch('/api/admin/posts', {
        method: 'POST',
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
        showToast('success', '文章创建成功');
        setTimeout(() => router.push('/admin/posts'), 1000);
      } else {
        showToast('error', data.message || '创建失败');
      }
    } catch {
      showToast('error', '创建失败');
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
          {/* Cover URL */}
          <div className="admin-form-group" style={{ marginBottom: 0 }}>
            <label className="admin-form-label">封面图 URL</label>
            <input
              type="text"
              value={form.cover_url}
              onChange={(e) => setForm({ ...form, cover_url: e.target.value })}
              placeholder="https://..."
              className="admin-input"
            />
          </div>

          {/* Tags */}
          <div className="admin-form-group" style={{ marginBottom: 0 }}>
            <label className="admin-form-label">标签</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center', minHeight: 36 }}>
              {selectedTags.map((tag) => (
                <span key={tag.id} style={{
                  display: 'inline-flex', alignItems: 'center', gap: 4,
                  padding: '4px 10px', borderRadius: 6, fontSize: 13, fontWeight: 500,
                  background: '#5D87FF1a', color: '#5D87FF',
                }}>
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
                <button onClick={() => setShowTagInput(true)} style={{
                  display: 'inline-flex', alignItems: 'center', gap: 4,
                  padding: '4px 10px', borderRadius: 6, fontSize: 13,
                  border: '1px dashed #d0d5dd', background: 'transparent',
                  color: 'var(--admin-text-secondary)', cursor: 'pointer',
                }}>
                  + 添加标签
                </button>
              )}
              {/* Existing tags to select */}
              {!showTagInput && tags.filter(t => !selectedTagIds.includes(t.id)).length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 4, width: '100%' }}>
                  {tags.filter(t => !selectedTagIds.includes(t.id)).map((tag) => (
                    <button key={tag.id} onClick={() => toggleTag(tag.id)} style={{
                      padding: '2px 8px', borderRadius: 4, fontSize: 12,
                      border: '1px solid #e2e8ee', background: '#fff',
                      color: 'var(--admin-text-secondary)', cursor: 'pointer',
                    }}>
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
            <input type="text" value={form.title} onChange={(e) => handleTitleChange(e.target.value)} placeholder="文章标题" className="admin-input" required style={{ fontSize: 18, height: 44, fontWeight: 600 }} />
          </div>
          <div className="admin-form-group" style={{ marginBottom: 0 }}>
            <label className="admin-form-label">Slug</label>
            <input type="text" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="article-slug" className="admin-input" required style={{ height: 44 }} />
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
        {/* Vditor Editor */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <VditorEditor
            ref={editorRef}
            value={form.content}
            onChange={(val) => setForm({ ...form, content: val })}
          />
          {/* Submit Button - inside editor column, at the bottom */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 16 }}>
            <button onClick={handleSubmit} disabled={loading} className="admin-btn admin-btn-primary" style={{ height: 48, padding: '0 48px', fontSize: 15, fontWeight: 600, borderRadius: 10 }}>
              {loading ? '创建中...' : '创建文章'}
            </button>
          </div>
        </div>

        {/* Right Sidebar: Writing Assistant */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, position: 'sticky', top: 80 }}>
          {/* Publish Settings */}
          <div className="admin-card" style={{ padding: 16 }}>
            <h4 style={{ fontSize: 14, fontWeight: 600, color: 'var(--admin-text-primary)', marginBottom: 12 }}>发布设置</h4>

            <div className="admin-form-group" style={{ marginBottom: 10 }}>
              <label className="admin-form-label" style={{ fontSize: 12 }}>分类</label>
              <select value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })} className="admin-input" style={{ height: 32, fontSize: 13 }}>
                <option value="">未分类</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>

            <div className="admin-form-group" style={{ marginBottom: 10 }}>
              <label className="admin-form-label" style={{ fontSize: 12 }}>状态</label>
              <div style={{ display: 'flex', gap: 6 }}>
                <button type="button" onClick={() => setForm({ ...form, status: 'draft' })} className={`admin-btn admin-btn-sm ${form.status === 'draft' ? 'admin-btn-default' : 'admin-btn-default'}`} style={{ flex: 1, borderColor: form.status === 'draft' ? '#ffae1f' : undefined, color: form.status === 'draft' ? '#d48806' : undefined }}>
                  草稿
                </button>
                <button type="button" onClick={() => setForm({ ...form, status: 'published' })} className={`admin-btn admin-btn-sm ${form.status === 'published' ? 'admin-btn-success' : 'admin-btn-default'}`} style={{ flex: 1 }}>
                  发布
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 13, color: 'var(--admin-text-secondary)' }}>置顶文章</span>
              <input type="checkbox" checked={form.is_pinned === 1} onChange={() => setForm({ ...form, is_pinned: form.is_pinned ? 0 : 1 })} style={{ width: 16, height: 16, accentColor: '#5D87FF' }} />
            </div>
          </div>

          {/* Writing Tips */}
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

          {/* Shortcuts */}
          <div className="admin-card" style={{ padding: 16 }}>
            <h4 style={{ fontSize: 14, fontWeight: 600, color: 'var(--admin-text-primary)', marginBottom: 10 }}>快捷键</h4>
            <div style={{ fontSize: 12, color: 'var(--admin-text-secondary)', display: 'flex', flexDirection: 'column', gap: 6 }}>
              {[
                ['Ctrl + B', '加粗'],
                ['Ctrl + I', '斜体'],
                ['Ctrl + K', '插入链接'],
                ['Ctrl + Shift + I', '插入图片'],
                ['Ctrl + /', '打开命令面板'],
              ].map(([key, desc]) => (
                <div key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <code style={{ padding: '2px 6px', borderRadius: 4, background: '#f2f4f5', fontSize: 11, fontFamily: 'monospace' }}>{key}</code>
                  <span>{desc}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Word Count */}
          <div className="admin-card" style={{ padding: 16 }}>
            <h4 style={{ fontSize: 14, fontWeight: 600, color: 'var(--admin-text-primary)', marginBottom: 10 }}>字数统计</h4>
            <div style={{ fontSize: 12, color: 'var(--admin-text-secondary)', display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>字数（预估）</span><span style={{ fontWeight: 600, color: 'var(--admin-text-primary)' }}>{wordCount}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>字符数</span><span style={{ fontWeight: 600, color: 'var(--admin-text-primary)' }}>{charCount.toLocaleString()}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>段落数</span><span style={{ fontWeight: 600, color: 'var(--admin-text-primary)' }}>{paragraphCount}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>标题数</span><span style={{ fontWeight: 600, color: 'var(--admin-text-primary)' }}>{headingCount}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>图片数</span><span style={{ fontWeight: 600, color: 'var(--admin-text-primary)' }}>{imageCount}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>链接数</span><span style={{ fontWeight: 600, color: 'var(--admin-text-primary)' }}>{linkCount}</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
