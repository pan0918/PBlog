export type PlaybackSnapshot = {
  currentTime: number;
  duration: number;
  currentLyric: string;
};

const EMPTY_SNAPSHOT: PlaybackSnapshot = {
  currentTime: 0,
  duration: 0,
  currentLyric: "",
};

let snapshot: PlaybackSnapshot = EMPTY_SNAPSHOT;
const listeners = new Set<() => void>();

function hasChanges(previous: PlaybackSnapshot, next: PlaybackSnapshot) {
  return (Object.keys(next) as Array<keyof PlaybackSnapshot>)
    .some((key) => !Object.is(previous[key], next[key]));
}

export const musicPlaybackStore = {
  getSnapshot(): PlaybackSnapshot {
    return snapshot;
  },

  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },

  update(partial: Partial<PlaybackSnapshot>) {
    const next = { ...snapshot, ...partial };
    if (!hasChanges(snapshot, next)) return;
    snapshot = next;
    listeners.forEach((listener) => listener());
  },

  reset(next: Partial<PlaybackSnapshot> = {}) {
    const nextSnapshot = { ...EMPTY_SNAPSHOT, ...next };
    if (!hasChanges(snapshot, nextSnapshot)) return;
    snapshot = nextSnapshot;
    listeners.forEach((listener) => listener());
  },
};
