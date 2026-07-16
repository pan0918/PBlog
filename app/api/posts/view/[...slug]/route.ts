import { NextRequest, NextResponse } from 'next/server';
import { getPublishedPostBySlug, incrementViewCount } from '@/lib/db/posts';

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string[] }> }
) {
  try {
    const { slug: slugParts } = await params;
    const slug = slugParts.join('/');
    const post = await getPublishedPostBySlug(slug);
    if (!post) {
      return NextResponse.json({ ok: false, message: 'Post not found' }, { status: 404 });
    }

    await incrementViewCount(post.id);

    return NextResponse.json({ ok: true, viewCount: post.view_count + 1 });
  } catch {
    return NextResponse.json({ ok: false, message: 'Failed to update view count' }, { status: 500 });
  }
}
