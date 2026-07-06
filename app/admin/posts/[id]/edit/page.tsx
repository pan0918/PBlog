"use client";
import '../../../admin.css';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import PostEditorWorkspace, {
  type PostEditorCategory,
  type PostEditorForm,
  type PostEditorTag,
} from '../../../components/PostEditorWorkspace';

interface AdminPostResponse extends Partial<PostEditorForm> {
  tags?: Array<{ id: string }>;
}

function toPostForm(post: AdminPostResponse): PostEditorForm {
  return {
    title: post.title || '',
    slug: post.slug || '',
    summary: post.summary || '',
    cover_url: post.cover_url || '',
    category_id: post.category_id || '',
    status: post.status || 'draft',
    is_pinned: post.is_pinned || 0,
    content: post.content || '',
  };
}

export default function EditPostPage() {
  const params = useParams();
  const id = params.id as string;
  const [form, setForm] = useState<PostEditorForm | null>(null);
  const [categories, setCategories] = useState<PostEditorCategory[]>([]);
  const [tags, setTags] = useState<PostEditorTag[]>([]);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [fetching, setFetching] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

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
          const post = postData.data as AdminPostResponse;
          setForm(toPostForm(post));
          setSelectedTagIds(Array.isArray(post.tags) ? post.tags.map((tag) => tag.id) : []);
        } else {
          setErrorMessage('文章不存在');
        }
      } catch {
        setErrorMessage('加载文章失败');
      } finally {
        setFetching(false);
      }
    };
    fetchData();
  }, [id]);

  if (fetching) {
    return <div className="admin-loading"><div className="admin-spinner" /> 加载中...</div>;
  }

  if (errorMessage || !form) {
    return <div className="admin-card" style={{ color: '#fa896b' }}>{errorMessage || '文章不存在'}</div>;
  }

  return (
    <PostEditorWorkspace
      mode="edit"
      initialForm={form}
      categories={categories}
      initialTags={tags}
      initialSelectedTagIds={selectedTagIds}
      submitUrl={`/api/admin/posts/${id}`}
      submitMethod="PUT"
      submitLabel="更新文章"
      loadingLabel="更新中..."
      successMessage="文章更新成功"
      failureMessage="更新失败"
      cacheId={`admin-post-edit-${id}`}
      autoSlug={false}
    />
  );
}
