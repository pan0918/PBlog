export type PlaybackSnapshot = {
  progress: number;
  currentTime: number;
  duration: number;
  currentLyric: string;
};

const EMPTY_SNAPSHOT: PlaybackSnapshot = {
  progress: 0,
  currentTime: 0,
  duration: 0,
  currentLyric: "",
};

let snapshot: PlaybackSnapshot = EMPTY_SNAPSHOT;
const listeners = new Set<() => void>();

export const musicPlaybackStore = {
  getSnapshot(): PlaybackSnapshot {
    return snapshot;
  },

  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },

  update(partial: Partial<PlaybackSnapshot>) {
    snapshot = { ...snapshot, ...partial };
    listeners.forEach((listener) => listener());
  },

  reset(next: Partial<PlaybackSnapshot> = {}) {
    snapshot = { ...EMPTY_SNAPSHOT, ...next };
    listeners.forEach((listener) => listener());
  },
};
