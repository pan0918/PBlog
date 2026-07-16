export type CommentSession = {
  id: string;
  username: string;
  email?: string;
  avatarUrl: string | null;
  status: string;
  mustChangePassword: boolean;
  isAuthor: boolean;
};
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
