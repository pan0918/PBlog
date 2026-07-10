# PBlog Music and Effects Performance Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove duplicate full-song downloads and seek races while preserving the current player UI, then centralize automatic effect quality so the existing visual style consumes substantially less CPU, GPU, memory, and network bandwidth.

**Architecture:** Keep low-frequency music controls in `MusicContext` and timeline data in the existing external store; stream the remote MP3 directly through native `<audio>` and expose unit-safe seek APIs. Add one global quality provider plus deterministic CSS-driven particle layers, with bounded Canvas work and page-visibility suspension.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript 5, Tailwind CSS 4, native HTMLMediaElement, CSS keyframes, Canvas 2D, Node test runner.

## Global Constraints

- Preserve the current warm glass visual language, layout, controls, themes, and all named decorative effects.
- Do not add a visible quality setting; desktop defaults to `high`, mobile or `hardwareConcurrency <= 4` uses `low`, and reduced motion uses `static`.
- Hidden pages pause decoration but never pause music.
- Do not modify the audio host, add a player/animation dependency, or use Blob audio URLs.
- Continuous animation changes only `transform` and `opacity`; high quality retains the current visual density.
- Use tests before implementation and preserve full TypeScript types without `any` escapes.

---

### Task 1: Native audio seeking and low-frequency playback state

**Files:**
- Modify: `tests/music-player-performance.test.mjs`
- Modify: `tests/music-heat-performance.test.mjs`
- Modify: `lib/music-playback-store.ts`
- Modify: `components/MusicProvider.tsx`
- Modify: `components/MusicProgressBar.tsx`
- Modify: `components/CloudPlayer.tsx`
- Modify: `components/SidebarLyric.tsx`
- Modify: `app/music/MusicClient.tsx`

**Interfaces:**
- Produces: `seekToSeconds(seconds: number): void`, `seekToPercent(percent: number): void`, `useMusicPlayback()`, and `useCurrentLyric(): string`.
- Store shape: `{ currentTime: number; duration: number; currentLyric: string }`; `progress` is derived by `useMusicPlayback`.

- [ ] **Step 1: Replace Blob-oriented tests with failing native-streaming tests**

Use assertions equivalent to:

```js
assert.match(provider, /src=\{currentSong\.url\}/);
assert.match(provider, /seekToSeconds/);
assert.match(provider, /seekToPercent/);
assert.match(provider, /onDurationChange/);
assert.doesNotMatch(provider, /blobUrlRef|prepareSeekableBlob|ensureSeekableSource/);
assert.doesNotMatch(provider, /res\.blob\(|URL\.createObjectURL|audioSrc/);
assert.doesNotMatch(provider, /fetch\(song\.url/);
assert.doesNotMatch(provider, /t\s*>=\s*dur\s*-\s*0\.3/);
assert.match(progressBar, /seekToPercent\(Number\(e\.target\.value\)\)/);
assert.match(musicPage, /seekToSeconds\(line\.time\)/);
```

Add store assertions for derived progress and no-op equality checks:

```js
assert.doesNotMatch(store, /^\s*progress:\s*number/m);
assert.match(store, /Object\.is/);
assert.match(provider, /useCurrentLyric/);
```

- [ ] **Step 2: Run the focused tests and confirm the expected failures**

Run:

```bash
node --test tests/music-player-performance.test.mjs tests/music-heat-performance.test.mjs
```

Expected: failures mention the still-present Blob path, missing explicit seek functions, stored progress, and old consumers.

- [ ] **Step 3: Make the playback store ignore unchanged data and derive progress**

Implement this store contract:

```ts
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

function hasChanges(previous: PlaybackSnapshot, next: PlaybackSnapshot) {
  return (Object.keys(next) as Array<keyof PlaybackSnapshot>)
    .some((key) => !Object.is(previous[key], next[key]));
}
```

`update()` and `reset()` must return without notifying listeners when `hasChanges()` is false.

- [ ] **Step 4: Replace the provider media engine without changing control behavior**

Update `MusicContextValue` to expose:

```ts
seekToSeconds: (seconds: number) => void;
seekToPercent: (percent: number) => void;
```

Delete `audioSrc`, every Blob/pending-ratio ref and callback, source switching, seek-time `load()`, and the timeupdate end detector. Implement the exact seek relationship:

```ts
const seekToSeconds = useCallback((requestedSeconds: number) => {
  const audio = audioRef.current;
  if (!audio || audio.readyState < HTMLMediaElement.HAVE_METADATA) return;
  if (!Number.isFinite(audio.duration) || audio.duration <= 0) return;

  const target = Math.max(
    0,
    Math.min(requestedSeconds, Math.max(0, audio.duration - 0.05)),
  );
  audio.currentTime = target;
  const nextLyric = lyricAt(target);
  lastLyricRef.current = nextLyric;
  musicPlaybackStore.update({
    currentTime: target,
    duration: audio.duration,
    currentLyric: nextLyric,
  });
  requestPlayback();
}, [lyricAt, requestPlayback]);

const seekToPercent = useCallback((percent: number) => {
  const audio = audioRef.current;
  if (!audio || !Number.isFinite(audio.duration) || audio.duration <= 0) return;
  const normalized = Math.max(0, Math.min(100, percent));
  seekToSeconds(audio.duration * normalized / 100);
}, [seekToSeconds]);
```

The media element must use:

```tsx
<audio
  ref={audioRef}
  src={currentSong.url}
  preload="metadata"
  crossOrigin="anonymous"
  onTimeUpdate={handleTimeUpdate}
  onLoadedMetadata={handleDurationChange}
  onDurationChange={handleDurationChange}
  onSeeking={() => setIsLoading(true)}
  onSeeked={() => setIsLoading(false)}
  onWaiting={() => setIsLoading(true)}
  onCanPlay={handleCanPlay}
  onPlaying={handlePlaying}
  onError={handleAudioError}
  onEnded={handleEnded}
/>
```

Visible timeline updates are throttled at 200ms; hidden pages return before store writes. `handleEnded` is the only automatic end transition. Song changes reset the store and pause the old element without calling `load()`.

- [ ] **Step 5: Update every seek and lyric consumer**

`MusicProgressBar` and the music-page range input call `seekToPercent`. Lyric buttons call `seekToSeconds(line.time)` directly. `CloudPlayerLyric` and `SidebarLyricLine` call `useCurrentLyric()` so unrelated timeline updates do not re-render them.

- [ ] **Step 6: Run focused tests, typecheck, and commit**

Run:

```bash
node --test tests/music-player-performance.test.mjs tests/music-heat-performance.test.mjs
npx tsc --noEmit
```

Expected: all focused tests pass and TypeScript reports no errors.

Commit:

```bash
git add tests/music-player-performance.test.mjs tests/music-heat-performance.test.mjs lib/music-playback-store.ts components/MusicProvider.tsx components/MusicProgressBar.tsx components/CloudPlayer.tsx components/SidebarLyric.tsx app/music/MusicClient.tsx
git commit -m "fix: stream music with native range seeking"
```

---

### Task 2: Shared automatic effect quality

**Files:**
- Create: `components/EffectQualityProvider.tsx`
- Modify: `app/layout.tsx`
- Modify: `components/ClientDecorations.tsx`
- Create: `tests/effect-quality.test.mjs`

**Interfaces:**
- Produces: `EffectQuality = "high" | "low" | "static"` and `useEffectQuality(): { quality; isVisible; isActive }`.
- Root classes: `effects-high`, `effects-low`, `effects-static`, and `effects-paused`.

- [ ] **Step 1: Add a failing quality-provider test**

Assert all decision inputs, cleanup, and integration:

```js
assert.match(provider, /prefers-reduced-motion: reduce/);
assert.match(provider, /navigator\.hardwareConcurrency/);
assert.match(provider, /window\.innerWidth < 768/);
assert.match(provider, /visibilitychange/);
assert.match(provider, /removeEventListener/);
assert.match(layout, /<EffectQualityProvider>/);
assert.doesNotMatch(decorations, /addEventListener\(['"]visibilitychange/);
```

- [ ] **Step 2: Run the new test and confirm it fails because the provider is absent**

Run:

```bash
node --test tests/effect-quality.test.mjs
```

- [ ] **Step 3: Implement the provider with one listener set**

Use a typed context with an initial high-quality snapshot. The quality calculation is:

```ts
function resolveEffectQuality(reducedMotion: boolean): EffectQuality {
  if (reducedMotion) return "static";
  const cores = navigator.hardwareConcurrency ?? 4;
  return window.innerWidth < 768 || cores <= 4 ? "low" : "high";
}
```

Register `resize`, `visibilitychange`, and media-query `change`; remove all three on cleanup. A second effect synchronizes exactly one quality class and `effects-paused` to `document.documentElement`, removing them on cleanup. Set `isActive = isVisible && quality !== "static"`.

- [ ] **Step 4: Integrate above all pages and remove duplicate visibility ownership**

Wrap `SplashScreen`, `MusicProvider`, the background, decorations, and page children with `EffectQualityProvider` in `app/layout.tsx`. Remove the visibility listener from `ClientDecorations`; it remains responsible only for route-aware component mounting.

- [ ] **Step 5: Run the focused test and commit**

```bash
node --test tests/effect-quality.test.mjs tests/runtime-performance-lifecycle.test.mjs
npx tsc --noEmit
git add components/EffectQualityProvider.tsx app/layout.tsx components/ClientDecorations.tsx tests/effect-quality.test.mjs
git commit -m "feat: centralize automatic effect quality"
```

---

### Task 3: Deterministic CSS decoration layers and composited background

**Files:**
- Modify: `components/Fireflies.tsx`
- Modify: `components/Sakura.tsx`
- Modify: `components/WindyGrass.tsx`
- Modify: `components/DanmakuBackground.tsx`
- Modify: `components/BackgroundEffects.tsx`
- Modify: `app/layout.tsx`
- Modify: `app/globals.css`
- Modify: `tests/ui-theme.test.mjs`
- Create: `tests/effects-performance.test.mjs`

**Interfaces:**
- Consumes: `useEffectQuality()` from Task 2.
- Particle budgets: fireflies `20/10/5`, petals `14/8/5`, grass `30/15/10`, danmaku `6/3/0` for `high/low/static`.

- [ ] **Step 1: Add failing fixed-budget and compositor tests**

Assert exact budgets and prohibited patterns:

```js
assert.match(fireflies, /high:\s*20/);
assert.match(sakura, /high:\s*14/);
assert.match(grass, /high:\s*30/);
assert.match(danmaku, /high:\s*6/);
assert.doesNotMatch(fireflies, /setFlies|box-shadow/);
assert.doesNotMatch(sakura, /will-change-transform|filter:\s*['"]blur/);
assert.doesNotMatch(danmaku, /setInterval|onAnimationEnd/);
assert.doesNotMatch(layout, /backgroundSize:\s*['"]400% 400%/);
assert.doesNotMatch(layout, /gradientMove/);
assert.match(globals, /@keyframes site-gradient-drift/);
```

- [ ] **Step 2: Run effect tests and confirm existing components fail the new contract**

```bash
node --test tests/effects-performance.test.mjs tests/ui-theme.test.mjs
```

- [ ] **Step 3: Convert particles to deterministic, fixed DOM**

Each component declares its exact budget map and uses a deterministic function:

```ts
function pseudoRandom(seed: number) {
  const value = Math.sin(seed * 999.91) * 43758.5453;
  return value - Math.floor(value);
}
```

Generate only when `quality` changes with `useMemo`. Fireflies use a motion wrapper plus radial-gradient glow child; sakura and grass use CSS custom properties. Remove visibility state, random regeneration, per-particle blur, animated shadow, and per-node `will-change`.

- [ ] **Step 4: Replace interval danmaku with six reusable tracks**

Return `null` for static. Otherwise render the quality budget from `siteConfig.danmakuList`, using deterministic top, duration, and negative delay values. CSS uses one infinite `translate3d(calc(-100vw - 100%), 0, 0)` animation. No timer, animation-end state mutation, or growing item list remains.

- [ ] **Step 5: Move animations to global CSS and pause by root class**

Add scoped keyframes for firefly movement/pulse, sakura fall, grass sway, danmaku travel, and site gradient drift. Every infinite effect rule gets:

```css
html.effects-paused .effect-layer *,
html.effects-static .effect-layer * {
  animation-play-state: paused !important;
}
```

Static particles use `animation: none`. Low quality lengthens gradient timing and reduces local glass blur; high quality preserves existing surface values.

- [ ] **Step 6: Replace background repaint work**

In layout, use `.site-gradient-layer` on a fixed layer with `inset: -8%` and animate only transform. Replace both blurred glow divs with one `.site-ambient-glow` layer composed of radial gradients at the same corners. Remove the inline `gradientMove` style element.

- [ ] **Step 7: Run tests, typecheck, and commit**

```bash
node --test tests/effects-performance.test.mjs tests/ui-theme.test.mjs tests/runtime-performance-lifecycle.test.mjs
npx tsc --noEmit
git add components/Fireflies.tsx components/Sakura.tsx components/WindyGrass.tsx components/DanmakuBackground.tsx components/BackgroundEffects.tsx app/layout.tsx app/globals.css tests/ui-theme.test.mjs tests/effects-performance.test.mjs
git commit -m "perf: bound decorative animation work"
```

---

### Task 4: Bounded Canvas effects and visibility-aware player motion

**Files:**
- Modify: `components/ClickEffect.tsx`
- Modify: `components/HeroBanner.tsx`
- Modify: `tests/effects-performance.test.mjs`

**Interfaces:**
- Consumes: `quality` and `isVisible` from `useEffectQuality()`.
- Canvas budgets: high `30 FPS / DPR 1.5 / 12 concurrent`, low `20 FPS / DPR 1.25 / 6 concurrent`, static disabled.
- Wave budgets: high `30 FPS / DPR 1.5`, low `20 FPS / DPR 1.25`, static one frame.

- [ ] **Step 1: Extend tests with failing Canvas and wave budgets**

```js
assert.match(click, /high:\s*\{[^}]*fps:\s*30[^}]*dpr:\s*1\.5[^}]*maxParticles:\s*12/s);
assert.match(click, /low:\s*\{[^}]*fps:\s*20[^}]*dpr:\s*1\.25[^}]*maxParticles:\s*6/s);
assert.match(click, /cancelAnimationFrame/);
assert.match(hero, /quality === ['"]high['"] \? 30 : 20/);
assert.match(hero, /Math\.min\([^)]*1\.5/);
assert.match(hero, /isVisible/);
```

- [ ] **Step 2: Run the focused test and confirm failures**

```bash
node --test tests/effects-performance.test.mjs
```

- [ ] **Step 3: Bound click particles and Canvas cost**

Use quality-specific config objects. Resize backing storage to `innerWidth * dpr` and call `ctx.setTransform(dpr, 0, 0, dpr, 0, 0)`. Gate drawing by `1000 / fps`; clamp delta time; cap the particle array by removing oldest entries. Static quality does not install the click listener. When hidden, cancel RAF and resume only if particles remain. Cleanup always removes resize/click/visibility listeners and cancels RAF.

- [ ] **Step 4: Throttle and suspend the hero wave**

Keep `WAVE_HEIGHT`, `WAVE_COLORS`, all three layer amplitudes, and motion formula. Gate RAF by the quality FPS, cap DPR, draw one frame in static mode, and avoid scheduling while hidden. Register and clean visibility, resize, and reduced-quality effect changes through the shared hook only.

- [ ] **Step 5: Run tests, typecheck, and commit**

```bash
node --test tests/effects-performance.test.mjs tests/ui-theme.test.mjs
npx tsc --noEmit
git add components/ClickEffect.tsx components/HeroBanner.tsx tests/effects-performance.test.mjs
git commit -m "perf: cap canvas and wave rendering"
```

---

### Task 5: Full regression, production build, and visual comparison

**Files:**
- Modify only if verification reveals a scoped regression in files already listed above.

**Interfaces:**
- Consumes all Task 1–4 behavior.
- Produces a passing production-ready branch with documented verification evidence.

- [ ] **Step 1: Run the complete automated suite**

```bash
node --test tests/*.test.mjs
npm run lint
npx tsc --noEmit
npm run build
```

Expected: all tests pass, lint has no errors, TypeScript has no errors, and Next.js finishes a production build. Existing `<img>` lint warnings may remain only outside this task's scope.

- [ ] **Step 2: Inspect forbidden performance patterns**

```bash
rg -n "res\.blob|createObjectURL|blobUrlRef|prepareSeekableBlob|background-position.*animation|setInterval" components/MusicProvider.tsx components/Fireflies.tsx components/Sakura.tsx components/WindyGrass.tsx components/DanmakuBackground.tsx app/layout.tsx
```

Expected: no Blob audio path, no interval-driven particle path, and no animated background-position path.

- [ ] **Step 3: Compare desktop visuals in the local browser**

Start `npm run dev`, inspect `/` and `/music` at desktop width in light and dark modes, and compare against the recorded baseline. Verify the same navigation, warm surfaces, wave height, particle identity, music console layout, cover rotation, controls, lyrics, and playlist remain visible. Inspect computed root class as `effects-high` on the desktop test environment.

- [ ] **Step 4: Verify the media element contract**

Check the page element:

```js
const audio = document.querySelector("audio");
({
  srcAttribute: audio?.getAttribute("src"),
  currentSrc: audio?.currentSrc,
  isBlob: audio?.currentSrc.startsWith("blob:"),
  duration: audio?.duration,
  seekable: audio?.seekable.length,
});
```

Expected: the source is the remote MP3 URL and `isBlob` is false. If remote media is reachable, seek through the progress bar and a lyric line and verify currentTime remains at the target. If the isolated local browser cannot reach the host, record that limitation and rely on tests plus DOM/source verification.

- [ ] **Step 5: Review the final diff and commit any verification-only correction**

```bash
git diff --check
git status --short
git log -5 --oneline
```

If a scoped correction was necessary, commit only its related files with:

```bash
git commit -m "fix: preserve visuals after performance optimization"
```
