import { NextResponse } from 'next/server';
import { getPublishedSongs } from '../../../lib/db/songs';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const songs = await getPublishedSongs();
    return NextResponse.json(songs);
  } catch {
    return NextResponse.json([]);
  }
}
