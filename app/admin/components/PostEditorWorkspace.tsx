"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import VditorEditor, { type VditorEditorHandle } from './VditorEditor';

export interface PostEditorCategory {
  id: string;
  name: string;
  slug: string;
}

export interface PostEditorTag {
  id: string;
  name: string;
  slug: string;
}

export interface PostEditorForm {
  title: string;
  slug: string;
  summary: string;
  cover_url: string;
  category_id: string;
  status: 'draft' | 'published';
  is_pinned: number;
  content: string;
}

interface PostEditorWorkspaceProps {
  mode: 'create' | 'edit';
  initialForm: PostEditorForm;
  categories: PostEditorCategory[];
  initialTags: PostEditorTag[];
  initialSelectedTagIds?: string[];
  submitUrl: string;
  submitMethod: 'POST' | 'PUT';
  submitLabel: string;
  loadingLabel: string;
  successMessage: string;
  failureMessage: string;
  cacheId: string;
  autoSlug?: boolean;
}

const emptyToast: { type: 'success' | 'error'; message: string } | null = null;

function generateSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9一-龥]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function getWritingStats(content: string) {
  const wordCount = content.replace(/\s/g, '').length;
  const charCount = content.length;
  const headingCount = (content.match(/^#{1,6}\s/gm) || []).length;
  const imageCount = (content.match(/!\[[^\]]*]\([^)]+\)/g) || []).length;
  const linkCount = (content.match(/(^|[^!])\[[^\]]+]\([^)]+\)/g) || []).length;
  const paragraphCount = content.split(/\n\n+/).filter((paragraph) => paragraph.trim()).length;

  return { wordCount, charCount, headingCount, imageCount, linkCount, paragraphCount };
}

export default function PostEditorWorkspace({
  mode,
  initialForm,
  categories,
  initialTags,
  initialSelectedTagIds = [],
  submitUrl,
  submitMethod,
  submitLabel,
  loadingLabel,
  successMessage,
  failureMessage,
  cacheId,
  autoSlug = mode === 'create',
}: PostEditorWorkspaceProps) {
  const router = useRouter();
  const editorRef = useRef<VditorEditorHandle>(null);
  const [form, setForm] = useState<PostEditorForm>(initialForm);
  const [tags, setTags] = useState<PostEditorTag[]>(initialTags);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>(initialSelectedTagIds);
  const [newTagName, setNewTagName] = useState('');
  const [newTagSlug, setNewTagSlug] = useState('');
  const [showTagInput, setShowTagInput] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(emptyToast);
  const [isDirty, setIsDirty] = useState(false);

  const showToast = useCallback((type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    window.setTimeout(() => setToast(null), 3000);
  }, []);

  const updateForm = useCallback((patch: Partial<PostEditorForm>) => {
    setForm((current) => ({ ...current, ...patch }));
    setIsDirty(true);
  }, []);

  const handleTitleChange = useCallback((value: string) => {
    setForm((current) => {
      const previousAutoSlug = generateSlug(current.title);
      const nextAutoSlug = generateSlug(value);
      return {
        ...current,
        title: value,
        slug: autoSlug && (current.slug === '' || current.slug === previousAutoSlug)
          ? nextAutoSlug
          : current.slug,
      };
    });
    setIsDirty(true);
  }, [autoSlug]);

  useEffect(() => {
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!isDirty) return;
      event.preventDefault();
      event.returnValue = '';
    };

    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [isDirty]);

  const selectedTags = useMemo(
    () => tags.filter((tag) => selectedTagIds.includes(tag.id)),
    [tags, selectedTagIds],
  );

  const availableTags = useMemo(
    () => tags.filter((tag) => !selectedTagIds.includes(tag.id)),
    [tags, selectedTagIds],
  );

  const stats = useMemo(() => getWritingStats(form.content), [form.content]);

  const toggleTag = useCallback((id: string) => {
    setSelectedTagIds((current) => current.includes(id) ? current.filter((tagId) => tagId !== id) : [...current, id]);
    setIsDirty(true);
  }, []);

  const handleNewTagNameChange = useCallback((value: string) => {
    setNewTagName(value);
    setNewTagSlug((current) => current || generateSlug(value));
  }, []);

  const handleAddTag = useCallback(async () => {
    const name = newTagName.trim();
    const slug = newTagSlug.trim();
    if (!name || !slug) return;

    try {
      const res = await fetch('/api/admin/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, slug }),
      });
      const data = await res.json();
      if (data.ok) {
        setTags((current) => [...current, data.data]);
        setSelectedTagIds((current) => [...current, data.data.id]);
        setNewTagName('');
        setNewTagSlug('');
        setShowTagInput(false);
        setIsDirty(true);
        showToast('success', '标签已创建');
      } else {
        showToast('error', data.message || '创建标签失败');
      }
    } catch {
      showToast('error', '创建标签失败');
    }
  }, [newTagName, newTagSlug, showToast]);

  const handleSubmit = useCallback(async () => {
    if (loading) return;
    if (editorRef.current?.isUploading()) {
      showToast('error', '图片还在上传，请稍后保存');
      return;
    }

    const content = editorRef.current?.getContent() || form.content;
    setLoading(true);

    try {
      const res = await fetch(submitUrl, {
        method: submitMethod,
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
        editorRef.current?.clearCache();
        setForm((current) => ({ ...current, content }));
        setIsDirty(false);
        showToast('success', successMessage);
        if (mode === 'create' && data.data?.id) {
          router.replace(`/admin/posts/${data.data.id}/edit`);
        }
      } else {
        showToast('error', data.message || failureMessage);
      }
    } catch {
      showToast('error', failureMessage);
    } finally {
      setLoading(false);
    }
  }, [failureMessage, form, loading, mode, router, selectedTagIds, showToast, submitMethod, submitUrl, successMessage]);

  return (
    <div style={{ maxWidth: 1240, margin: '0 auto' }}>
      {toast && (
        <div className={`fixed top-20 right-6 z-50 px-5 py-3 rounded-xl shadow-lg text-sm font-bold ${
          toast.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
        }`}>
          {toast.message}
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: 'var(--admin-text-primary)' }}>
            {mode === 'create' ? '写新文章' : '编辑文章'}
          </h2>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--admin-text-secondary)' }}>
            支持拖拽/粘贴图片、实时草稿缓存、全屏写作和快捷保存。
          </p>
        </div>
        <Link href="/admin/posts" className="admin-btn admin-btn-default">
          返回文章列表
        </Link>
      </div>

      <div className="admin-card" style={{ marginBottom: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, alignItems: 'start' }}>
          <div className="admin-form-group" style={{ marginBottom: 0 }}>
            <label className="admin-form-label">封面图 URL</label>
            <input
              type="text"
              value={form.cover_url}
              onChange={(event) => updateForm({ cover_url: event.target.value })}
              placeholder="https://... 或 /uploads/admin/..."
              className="admin-input"
            />
          </div>

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
                  <button type="button" onClick={() => toggleTag(tag.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#5D87FF', padding: 0, fontSize: 14, lineHeight: 1 }}>×</button>
                </span>
              ))}

              {showTagInput ? (
                <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                  <input type="text" value={newTagName} onChange={(event) => handleNewTagNameChange(event.target.value)} placeholder="名称" className="admin-input" style={{ width: 88, height: 28, fontSize: 12 }} />
                  <input type="text" value={newTagSlug} onChange={(event) => setNewTagSlug(event.target.value)} placeholder="slug" className="admin-input" style={{ width: 96, height: 28, fontSize: 12 }} />
                  <button type="button" onClick={handleAddTag} className="admin-btn admin-btn-primary admin-btn-sm" style={{ height: 28, fontSize: 12 }}>确定</button>
                  <button type="button" onClick={() => setShowTagInput(false)} className="admin-btn admin-btn-default admin-btn-sm" style={{ height: 28, fontSize: 12 }}>取消</button>
                </div>
              ) : (
                <button type="button" onClick={() => setShowTagInput(true)} style={{
                  display: 'inline-flex', alignItems: 'center', gap: 4,
                  padding: '4px 10px', borderRadius: 6, fontSize: 13,
                  border: '1px dashed #d0d5dd', background: 'transparent',
                  color: 'var(--admin-text-secondary)', cursor: 'pointer',
                }}>
                  + 添加标签
                </button>
              )}

              {!showTagInput && availableTags.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 4, width: '100%' }}>
                  {availableTags.map((tag) => (
                    <button key={tag.id} type="button" onClick={() => toggleTag(tag.id)} style={{
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

      <div className="admin-card" style={{ marginBottom: 16, padding: '16px 24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16 }}>
          <div className="admin-form-group" style={{ marginBottom: 0 }}>
            <label className="admin-form-label">标题</label>
            <input
              type="text"
              value={form.title}
              onChange={(event) => handleTitleChange(event.target.value)}
              placeholder="文章标题"
              className="admin-input"
              required
              style={{ fontSize: 18, height: 44, fontWeight: 600 }}
            />
          </div>
          <div className="admin-form-group" style={{ marginBottom: 0 }}>
            <label className="admin-form-label">Slug</label>
            <input
              type="text"
              value={form.slug}
              onChange={(event) => updateForm({ slug: event.target.value })}
              placeholder="article-slug"
              className="admin-input"
              required
              style={{ height: 44 }}
            />
          </div>
        </div>
      </div>

      <div className="admin-card" style={{ marginBottom: 16, padding: '16px 24px' }}>
        <div className="admin-form-group" style={{ marginBottom: 0 }}>
          <label className="admin-form-label">摘要</label>
          <textarea
            value={form.summary}
            onChange={(event) => updateForm({ summary: event.target.value })}
            placeholder="文章摘要..."
            rows={2}
            className="admin-input"
          />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 268px', gap: 16, alignItems: 'start', marginBottom: 20 }}>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <VditorEditor
            ref={editorRef}
            value={form.content}
            cacheId={cacheId}
            uploadUrl="/api/admin/uploads"
            onChange={(content) => updateForm({ content })}
            onSaveShortcut={handleSubmit}
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, paddingTop: 16 }}>
            <button type="button" onClick={handleSubmit} disabled={loading} className="admin-btn admin-btn-primary" style={{ height: 48, padding: '0 48px', fontSize: 15, fontWeight: 600, borderRadius: 10 }}>
              {loading ? loadingLabel : submitLabel}
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, position: 'sticky', top: 80 }}>
          <div className="admin-card" style={{ padding: 16 }}>
            <h4 style={{ fontSize: 14, fontWeight: 600, color: 'var(--admin-text-primary)', marginBottom: 12 }}>发布设置</h4>
            <div className="admin-form-group" style={{ marginBottom: 10 }}>
              <label className="admin-form-label" style={{ fontSize: 12 }}>分类</label>
              <select value={form.category_id} onChange={(event) => updateForm({ category_id: event.target.value })} className="admin-input" style={{ height: 32, fontSize: 13 }}>
                <option value="">未分类</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>{category.name}</option>
                ))}
              </select>
            </div>

            <div className="admin-form-group" style={{ marginBottom: 10 }}>
              <label className="admin-form-label" style={{ fontSize: 12 }}>状态</label>
              <div style={{ display: 'flex', gap: 6 }}>
                <button type="button" onClick={() => updateForm({ status: 'draft' })} className="admin-btn admin-btn-sm admin-btn-default" style={{ flex: 1, borderColor: form.status === 'draft' ? '#ffae1f' : undefined, color: form.status === 'draft' ? '#d48806' : undefined }}>
                  草稿
                </button>
                <button type="button" onClick={() => updateForm({ status: 'published' })} className={`admin-btn admin-btn-sm ${form.status === 'published' ? 'admin-btn-success' : 'admin-btn-default'}`} style={{ flex: 1 }}>
                  发布
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 13, color: 'var(--admin-text-secondary)' }}>置顶文章</span>
              <input type="checkbox" checked={form.is_pinned === 1} onChange={() => updateForm({ is_pinned: form.is_pinned ? 0 : 1 })} style={{ width: 16, height: 16, accentColor: '#5D87FF' }} />
            </div>
          </div>

          <div className="admin-card" style={{ padding: 16 }}>
            <h4 style={{ fontSize: 14, fontWeight: 600, color: 'var(--admin-text-primary)', marginBottom: 10 }}>写作辅助</h4>
            <div style={{ fontSize: 12, color: 'var(--admin-text-secondary)', lineHeight: 1.65 }}>
              <p style={{ fontWeight: 600, marginBottom: 4 }}>已启用</p>
              <ul style={{ margin: 0, paddingLeft: 16 }}>
                <li>拖拽/粘贴图片自动上传</li>
                <li>本地草稿缓存，保存后自动清理</li>
                <li>Ctrl/Cmd + Enter 快速保存</li>
                <li>{isDirty ? '当前有未保存修改' : '当前内容已保存或未修改'}</li>
              </ul>
            </div>
          </div>

          <div className="admin-card" style={{ padding: 16 }}>
            <h4 style={{ fontSize: 14, fontWeight: 600, color: 'var(--admin-text-primary)', marginBottom: 10 }}>快捷键</h4>
            <div style={{ fontSize: 12, color: 'var(--admin-text-secondary)', display: 'flex', flexDirection: 'column', gap: 6 }}>
              {[
                ['Ctrl/Cmd + Enter', '保存文章'],
                ['Ctrl/Cmd + B', '加粗'],
                ['Ctrl/Cmd + I', '斜体'],
                ['Ctrl/Cmd + K', '插入链接'],
                ['拖拽/粘贴', '上传图片'],
              ].map(([key, desc]) => (
                <div key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                  <code style={{ padding: '2px 6px', borderRadius: 4, background: '#f2f4f5', fontSize: 11, fontFamily: 'monospace' }}>{key}</code>
                  <span>{desc}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="admin-card" style={{ padding: 16 }}>
            <h4 style={{ fontSize: 14, fontWeight: 600, color: 'var(--admin-text-primary)', marginBottom: 10 }}>字数统计</h4>
            <div style={{ fontSize: 12, color: 'var(--admin-text-secondary)', display: 'flex', flexDirection: 'column', gap: 4 }}>
              {[
                ['字数（预估）', stats.wordCount],
                ['字符数', stats.charCount.toLocaleString()],
                ['段落数', stats.paragraphCount],
                ['标题数', stats.headingCount],
                ['图片数', stats.imageCount],
                ['链接数', stats.linkCount],
              ].map(([label, value]) => (
                <div key={label as string} style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>{label}</span>
                  <span style={{ fontWeight: 600, color: 'var(--admin-text-primary)' }}>{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
