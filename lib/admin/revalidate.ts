import { revalidatePath } from 'next/cache';

export function revalidateAfterPost(slugs: Array<string | null | undefined> = []) {
  revalidatePath('/');
  revalidatePath('/timeline');
  revalidatePath('/about');
  for (const slug of new Set(slugs.filter((value): value is string => Boolean(value)))) {
    revalidatePath(`/posts/${slug}`);
  }
}

export function revalidateAfterMoment() {
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
  revalidatePath('/');
  revalidatePath('/photowall');
}
