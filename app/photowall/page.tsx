import Navbar from '../../components/Navbar';
import PageTransition from '../../components/PageTransition';
import PhotoWallClient from './PhotoWallClient';
import { getPublishedAlbums } from '../../lib/db/albums';
import { getPhotosByAlbumId } from '../../lib/db/photos';

export default async function PhotoWallPage() {
  const dbAlbums = await getPublishedAlbums();

  const albums = await Promise.all(
    dbAlbums.map(async (a) => {
      const dbPhotos = await getPhotosByAlbumId(a.id);
      return {
        id: a.slug,
        title: a.title,
        description: a.description || '',
        cover: a.cover_url || '',
        date: '',
        photos: dbPhotos.map(p => ({
          url: p.image_url,
          caption: p.title || p.description || '',
        })),
      };
    })
  );

  return (
    <div className="min-h-screen relative pb-20">
      <Navbar />
      <PageTransition>
        <main className="w-[95%] md:w-[90%] max-w-6xl mx-auto mt-24 md:mt-28 relative z-10">
          <h1 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white mb-8 tracking-tight">照片墙</h1>
          <PhotoWallClient albums={albums} />
        </main>
      </PageTransition>
    </div>
  );
}
