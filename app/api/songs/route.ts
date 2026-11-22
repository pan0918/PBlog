import { NextResponse } from 'next/server';
import { getPublishedSongs } from '../../../lib/db/songs';
import { toCdnAssetUrl } from '../../../lib/images/cdn';

// Every page load asks for the playlist, so serve it from the cache; admin
// song changes refresh it through revalidateAfterSong(). Database errors are
// thrown so a failed refresh keeps serving the previous playlist.
export const revalidate = 3600;

export async function GET() {
  const songs = await getPublishedSongs();
  return NextResponse.json(songs.map((song) => ({
    ...song,
    url: toCdnAssetUrl(song.url),
    pic: song.pic ? toCdnAssetUrl(song.pic) : song.pic,
  })));
}
