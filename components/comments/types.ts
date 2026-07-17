import type { PublicSessionSnapshot } from '../../lib/public-auth/session-events';

export type CommentSession = PublicSessionSnapshot;
export type CommentAuthor = {
  id: string;
  username: string;
  avatarUrl: string | null;
  isAuthor: boolean;
};

export type ArticleComment = {
  id: string;
  parentId: string | null;
  content: string;
  createdAt: string;
  editedAt: string | null;
  likeCount: number;
  likedByViewer: boolean;
  replyCount: number;
  repliesLoaded?: boolean;
  replyNextCursor?: string | null;
  author: CommentAuthor;
  replies: ArticleComment[];
};

export type CommentPage = {
  comments: ArticleComment[];
  total: number;
  nextCursor: string | null;
};

export type CommentReplyPage = {
  comments: ArticleComment[];
  nextCursor: string | null;
};
