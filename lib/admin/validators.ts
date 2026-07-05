import { z } from 'zod';

// --- Auth ---
export const loginSchema = z.object({
  username: z.string().min(1, '用户名不能为空').max(50),
  password: z.string().min(1, '密码不能为空').max(100),
});

// --- Posts ---
export const createPostSchema = z.object({
  title: z.string().min(1, '标题不能为空').max(200),
  slug: z.string().min(1, 'slug 不能为空').max(200),
  summary: z.string().max(500).optional().nullable(),
  content: z.string().min(1, '内容不能为空'),
  cover_url: z.string().url('封面 URL 格式不正确').optional().nullable().or(z.literal('')),
  category_id: z.string().uuid().optional().nullable(),
  tag_ids: z.array(z.string().uuid()).optional(),
  status: z.enum(['draft', 'published']).default('draft'),
  is_pinned: z.number().int().min(0).max(1).default(0),
  published_at: z.string().optional().nullable(),
});

export const updatePostSchema = createPostSchema.partial();

// --- Categories ---
export const createCategorySchema = z.object({
  name: z.string().min(1, '名称不能为空').max(50),
  slug: z.string().min(1, 'slug 不能为空').max(50),
  description: z.string().max(200).optional().nullable(),
  sort_order: z.number().int().default(0),
});

export const updateCategorySchema = createCategorySchema.partial();

// --- Tags ---
export const createTagSchema = z.object({
  name: z.string().min(1, '名称不能为空').max(50),
  slug: z.string().min(1, 'slug 不能为空').max(50),
});

export const updateTagSchema = createTagSchema.partial();

// --- Moments ---
export const createMomentSchema = z.object({
  content: z.string().min(1, '内容不能为空'),
  mood: z.string().max(20).optional().nullable(),
  weather: z.string().max(20).optional().nullable(),
  location: z.string().max(100).optional().nullable(),
  status: z.enum(['draft', 'published']).default('published'),
  published_at: z.string().optional().nullable(),
});

export const updateMomentSchema = createMomentSchema.partial();

// --- Projects ---
export const createProjectSchema = z.object({
  title: z.string().min(1, '名称不能为空').max(100),
  slug: z.string().min(1, 'slug 不能为空').max(100),
  description: z.string().max(500).optional().nullable(),
  content: z.string().optional().nullable(),
  project_url: z.string().url().optional().nullable().or(z.literal('')),
  github_url: z.string().url().optional().nullable().or(z.literal('')),
  status: z.enum(['draft', 'published']).default('published'),
  sort_order: z.number().int().default(0),
  started_at: z.string().optional().nullable(),
  ended_at: z.string().optional().nullable(),
});

export const updateProjectSchema = createProjectSchema.partial();

// --- Friends ---
export const createFriendSchema = z.object({
  name: z.string().min(1, '名称不能为空').max(50),
  url: z.string().url('URL 格式不正确'),
  avatar_url: z.string().url().optional().nullable().or(z.literal('')),
  description: z.string().max(200).optional().nullable(),
  site_title: z.string().max(100).optional().nullable(),
  status: z.enum(['pending', 'approved', 'rejected']).default('pending'),
  sort_order: z.number().int().default(0),
});

export const updateFriendSchema = createFriendSchema.partial();

// --- Messages ---
export const createMessageSchema = z.object({
  author: z.string().min(1, '昵称不能为空').max(20),
  content: z.string().min(1, '留言不能为空').max(300),
  honeypot: z.string().max(0, '请求无效').optional(),
});

// --- Albums ---
export const createAlbumSchema = z.object({
  title: z.string().min(1, '标题不能为空').max(100),
  slug: z.string().min(1, 'slug 不能为空').max(100),
  description: z.string().max(500).optional().nullable(),
  cover_url: z.string().url().optional().nullable().or(z.literal('')),
  location: z.string().max(100).optional().nullable(),
  status: z.enum(['draft', 'published']).default('published'),
  sort_order: z.number().int().default(0),
});

export const updateAlbumSchema = createAlbumSchema.partial();

// --- Photos ---
export const createPhotoSchema = z.object({
  title: z.string().max(100).optional().nullable(),
  description: z.string().max(200).optional().nullable(),
  image_url: z.string().url('图片 URL 格式不正确'),
  thumbnail_url: z.string().url().optional().nullable().or(z.literal('')),
  width: z.number().int().positive().optional().nullable(),
  height: z.number().int().positive().optional().nullable(),
  sort_order: z.number().int().default(0),
});

export const updatePhotoSchema = createPhotoSchema.partial();
