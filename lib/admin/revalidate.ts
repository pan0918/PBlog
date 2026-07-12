import { revalidatePath, revalidateTag } from 'next/cache';

export function revalidateAfterPost(slugs: Array<string | null | undefined> = []) {
  revalidateTag('posts', 'max');
  revalidateTag('homepage-stats', 'max');
  revalidatePath('/');
  revalidatePath('/timeline');
  revalidatePath('/about');
  for (const slug of new Set(slugs.filter((value): value is string => Boolean(value)))) {
    revalidatePath(`/posts/${slug}`);
  }
}

export function revalidateAfterMoment() {
  revalidateTag('homepage-stats', 'max');
  revalidatePath('/');
  revalidatePath('/moments');
}

export function revalidateAfterProject() {
  revalidatePath('/');
  revalidatePath('/projects');
}

export function revalidateAfterFriend() {
  revalidatePath('/friends');
}

export function revalidateAfterMessage() {
  revalidatePath('/chatter');
  revalidatePath('/');
}

export function revalidateAfterAlbum() {
  revalidatePath('/');
  revalidatePath('/photowall');
}

export function revalidateAfterPhoto() {
  revalidateTag('homepage-stats', 'max');
  revalidatePath('/');
  revalidatePath('/photowall');
}

export function revalidateAfterSong() {
  revalidatePath('/');
  revalidatePath('/music');
}
