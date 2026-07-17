# Desktop Account Entry and Comment Database Migration

## Goal

Add a clear desktop account entry to the top-right navigation, make the supplied image the default public-user avatar, keep avatar upload accessible through the signed-in profile dialog, and migrate the currently configured Turso database so the native comment APIs can operate.

## Scope

This change includes only desktop navigation and existing comment/account surfaces. Mobile navigation is explicitly excluded.

Included:

- A circular account avatar beside the desktop theme control.
- Login/register modal when an unauthenticated visitor selects the avatar.
- Profile modal when an authenticated public user selects the avatar.
- The existing profile modal remains the upload interface for JPEG, PNG, and WebP avatars up to 2 MiB.
- The default avatar URL is `https://a68b43cc.cloudflare-imgbed-9pz.pages.dev/file/1784254976002_ChatGPT_Image_2026年7月17日_10_22_03.png`.
- Public-user session, comment author, comment composer, profile, and administrator user-list fallbacks use this default avatar instead of initials.
- An idempotent migration runs against the Turso database configured by the current `.env.local`.

Excluded:

- Mobile account entry or mobile navigation changes.
- A separate `/account` page.
- Email sending or automatic password recovery.
- Changes to avatar file validation, processing, or storage behavior.

## Interaction Design

The desktop account entry is a 36 px circular image button positioned immediately before the theme button. It uses the same restrained amber focus and hover language as the navigation.

When no account session exists, the button displays the default avatar and has an accessible “登录或注册” label. Selecting it opens the existing `AuthDialog`, defaulting to login and allowing a switch to registration.

When a public user is signed in, the button displays the uploaded avatar or the default avatar. Selecting it opens the existing `ProfileDialog`, where the user can update their name, password, account, and avatar. A successful login, logout, profile change, or avatar upload updates the navigation state without reloading the page.

When an administrator session is active, the avatar entry displays the default avatar and does not expose public-user profile editing. The administrator remains identified as the article author in the comment system.

## State and Component Boundaries

A desktop account control owns session loading and the two dialogs. It uses the existing `/api/auth/session`, login, registration, logout, profile, password, account, and avatar endpoints. The navigation only renders this control and does not duplicate authentication logic.

The default avatar URL is exported from a shared public-auth presentation module so the navigation, comment UI, profile dialog, and administrator user table cannot drift to different fallbacks.

The session request is made once when the account control mounts. It uses `cache: no-store` and aborts on unmount. Dialog callbacks update the shared local session state immediately.

## Database Migration and Error Handling

The observed `SQLITE_UNKNOWN: no such table: post_comments` error occurs because the application code is using the native comment repository before the new schema was applied to the configured Turso database.

The existing `scripts/migrate-native-comments.ts` migration is the source of truth. It creates the public-user, authentication-event, comment, like, and supporting index objects with `IF NOT EXISTS`. The migration will run once against the database URL loaded from `.env.local`, then a read-only schema query will verify the required tables and indexes.

The migration must not drop, truncate, or rewrite existing content tables. If credentials are missing or the remote database is unreachable, implementation stops and reports the exact failure instead of changing application error handling to hide the missing schema.

## Testing

Automated tests are added before production changes and cover:

- The desktop navbar renders the account control beside the theme control.
- The account control fetches the current session and opens authentication or profile dialogs according to state.
- The supplied URL is the single default avatar source used by public account and comment fallbacks.
- Existing avatar upload constraints remain present.
- The native comment migration declares all required tables and indexes and remains idempotent.

Final verification runs the focused tests, the full Node test suite, TypeScript, ESLint, and the Next.js production build. The migration is separately verified against the configured Turso schema.
