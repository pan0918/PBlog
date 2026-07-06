"use client";
import '../../admin.css';

import { useEffect, useState } from 'react';
import PostEditorWorkspace, {
  type PostEditorCategory,
  type PostEditorForm,
  type PostEditorTag,
} from '../../components/PostEditorWorkspace';

const initialForm: PostEditorForm = {
  title: '',
  slug: '',
  summary: '',
  cover_url: '',
  category_id: '',
  status: 'draft',
  is_pinned: 0,
  content: '',
};

export default function NewPostPage() {
  const [categories, setCategories] = useState<PostEditorCategory[]>([]);
  const [tags, setTags] = useState<PostEditorTag[]>([]);
  const [fetching, setFetching] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

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
        setErrorMessage('加载分类/标签失败');
      } finally {
        setFetching(false);
      }
    };
    fetchData();
  }, []);

  if (fetching) {
    return <div className="admin-loading"><div className="admin-spinner" /> 加载中...</div>;
  }

  if (errorMessage) {
    return <div className="admin-card" style={{ color: '#fa896b' }}>{errorMessage}</div>;
  }

  return (
    <PostEditorWorkspace
      mode="create"
      initialForm={initialForm}
      categories={categories}
      initialTags={tags}
      submitUrl="/api/admin/posts"
      submitMethod="POST"
      submitLabel="创建文章"
      loadingLabel="创建中..."
      successMessage="文章创建成功"
      failureMessage="创建失败"
      cacheId="admin-post-new"
      autoSlug
    />
  );
}
