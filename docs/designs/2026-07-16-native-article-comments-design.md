# Native Article Comments and Public Accounts Design

## Goal

Replace the unconfigured Gitalk widget with a first-party article comment system. Visitors can read comments, registered users can comment, reply, like, and edit, and the existing administrator can participate as the article author and moderate users and comments.

The desktop experience places a compact comment card in the article sidebar. Mobile and tablet devices use a full-screen comment panel opened by a fixed comment button. Both light and dark themes follow the existing site design, with the supplied dark mockup as the visual reference.

## Scope

This feature includes:

- Public username-and-password registration and login.
- A required private email address used only as an administrator-visible account-recovery reference.
- User profile editing and avatar upload.
- Two-level article comments, replies, likes, editing, pagination, and reply expansion.
- Existing-administrator replies with an author badge.
- Comment and user management in the administrator area.
- Desktop sidebar and mobile full-screen comment interfaces.
- Durable database migrations, rate limits, automated tests, and deployment instructions.

This feature does not include:

- Email delivery or automatic email verification.
- Automatic password reset based only on knowing an email address.
- Comment image attachments.
- Markdown or HTML comment rendering.
- User-side comment deletion.
- Comment or reply email notifications.
- Anonymous commenting, downvotes, reports, or comment collections.
- Unlimited reply nesting or real-time push updates.

## Architecture Choice

The feature is implemented natively with the project's existing Next.js App Router, Turso/libSQL, bcrypt, jose JWTs, and image-bed upload service. This preserves control over appearance, account policy, moderation, and data while avoiding dependence on GitHub accounts or a third-party comment service.

Public-user authentication is separate from administrator authentication. It uses a distinct cookie name, token payload, validation path, and session-version check. The existing administrator cookie remains unchanged. Comment APIs can recognize either an active public user or an active administrator where the operation permits it.

## Public User Model

The `public_users` table contains:

- `id`: UUID primary key.
- `username`: unique public login name and display name.
- `email`: unique, normalized, private email address.
- `password_hash`: bcrypt hash.
- `avatar_url`: nullable processed avatar URL.
- `status`: `active`, `muted`, or `banned`.
- `muted_until`: nullable ISO timestamp.
- `session_version`: integer incremented to invalidate issued sessions.
- `must_change_password`: integer boolean set after an administrator reset.
- `last_login_at`, `created_at`, `updated_at`, and `deleted_at`.

Usernames are 2–20 characters and accept Chinese characters, Latin letters, digits, and underscores. Matching is case-insensitive for Latin input. Passwords are 8–72 characters. Emails are normalized to lowercase and never returned by public APIs.

Registration is open to everyone. It requires username, email, password, and password confirmation. The server enforces unique username and email constraints, hashes the password with bcrypt, and records durable rate-limit events before creating the account.

## Authentication and Sessions

Successful login creates a seven-day HttpOnly, Secure-in-production, SameSite=Lax cookie distinct from the administrator cookie. The JWT contains user ID and session version. Every authenticated write reloads the user record and rejects deleted, banned, expired-muted, or session-version-mismatched accounts.

Password changes increment `session_version`, invalidating all older sessions. Logout clears the current cookie. Account deletion soft-deletes the user, increments the session version, and soft-deletes all authored comments in one transaction.

No automatic password recovery endpoint is offered. The forgot-password interface explains that recovery is administrator-mediated. The administrator can compare the private email reference after an out-of-band identity check and set a temporary password. This increments `session_version` and sets `must_change_password`; the user must choose a new password after the next login before commenting.

## Avatar Processing

Users may upload JPEG, PNG, or WebP avatars up to 2 MiB. The server decodes the image with Sharp, enforces an input pixel limit, applies EXIF rotation, crops to a square, resizes to 256×256, and encodes WebP. Only the processed WebP is uploaded with the server-held image-bed token. The original upload is not preserved.

Avatar uploads are authenticated and rate-limited. If a user has no avatar, the interface renders a deterministic initials-based fallback without another network request.

## Comment Data Model

The `post_comments` table contains:

- `id`: UUID primary key.
- `post_id`: foreign key to the stable post record.
- `parent_id`: nullable reference to a top-level comment.
- `public_user_id`: nullable public-user author.
- `admin_user_id`: nullable administrator author.
- `content`: sanitized plain text.
- `status`: `visible`, `hidden`, `spam`, or `deleted`.
- `edited_at`, `created_at`, `updated_at`, and `deleted_at`.

Exactly one author column is populated. A reply must point to a top-level comment for the same post; replies to replies are normalized to that top-level parent. Comment content is 1–500 Unicode characters after whitespace normalization. HTML tags, control characters, and unsupported markup are treated as plain text or removed before storage.

The `comment_likes` table has `comment_id`, `public_user_id`, and `created_at`, with a unique composite key. Administrators do not need a separate like identity. Like counts are calculated in batched queries and returned with whether the current user liked each visible comment.

## Comment Behavior

Anyone can load visible comments. Only logged-in public users or administrators can create comments and replies. Comments are visible immediately.

Public users may edit their own visible comments but may not delete them. Administrators may hide, mark as spam, or soft-delete any comment. Editing updates `edited_at`; the UI displays “已编辑”. Banned users and account deletion soft-delete all of that user's comments, including replies, so they disappear from public results.

Top-level comments are ordered oldest first and returned 20 at a time with cursor pagination. Replies are ordered oldest first. Replies are grouped under their top-level comment, collapsed initially, and loaded or revealed when the reader selects “展开 N 条回复”. The total displayed count includes visible top-level comments and replies.

Each active public user may like a visible comment once and may cancel the like. The unique database key makes duplicate likes impossible even under concurrent requests.

## API Boundaries

Public-account endpoints cover registration, login, logout, current session, profile updates, avatar upload, password change, and account deletion. Authentication responses expose only public profile data and the `mustChangePassword` flag.

Article-comment endpoints cover paginated reads, creation, replies, edits, and like toggles. The server accepts the stable post ID rather than trusting an arbitrary slug. Every mutation validates authentication, account state, post existence, ownership or administrator privilege, content limits, and durable rate limits.

Administrator endpoints cover comment search and status changes, user search, muting, banning, and temporary-password resets. They reuse the existing administrator authorization helper and response contract.

## Rate Limiting and Abuse Controls

Rate limits are persisted in Turso so they work across serverless instances. Records use hashed combinations of purpose, normalized username or user ID, and client IP; raw credentials are not stored in rate-limit keys.

Initial limits are:

- Registration: 3 attempts per IP per hour.
- Login: 5 failures per account-and-IP key per 15 minutes.
- Comment creation: 5 per user per 10 minutes and 20 per hour.
- Comment edits: 20 per user per hour.
- Like toggles: 60 per user per 10 minutes.
- Avatar uploads: 5 per user per hour.

API responses use 429 with `Retry-After` when a limit is exceeded. The feature does not add CAPTCHA in this phase.

## Desktop Article Layout

The article page expands from the current 1152 px maximum to approximately 1440 px. The main article remains fluid, and the desktop sidebar grows to approximately 360 px.

The existing sidebar modules remain in their current order: profile card, lyric card, recommended posts, and table of contents. The new comment card follows those modules. The old Gitalk component and the comment block at the bottom of the article are removed.

The comment card shows a header with the total count and collapse control, a compact logged-in composer or login/register prompt, and the comment list. It is expanded by default. Once reached during page scrolling, the card sticks below the navigation bar. Its list has a viewport-relative maximum height and internal scrolling so a long thread does not enlarge the whole sidebar indefinitely.

The dark theme uses the supplied mockup's deep blue translucent surfaces, subtle borders, compact avatar rows, muted metadata, indigo actions, and nested reply guide line. The light theme maps the same hierarchy onto the site's cream and translucent white surfaces.

## Mobile and Tablet Layout

The sidebar comment card is hidden below the desktop breakpoint. A fixed comment button shows the count and opens a full-screen panel. The button is positioned to avoid the existing music player and global toolbox.

The full-screen panel contains a safe-area-aware header, collapse/close control, composer or login prompt, scrollable list, and reply composer. Opening it locks background page scrolling; closing it restores the previous article scroll position. Escape closes it on keyboard-capable devices, and focus is returned to the trigger.

## Client Data Flow and Performance

Article HTML remains server-rendered and statically generated. Comments load only after the client comment UI mounts, so comment traffic does not block article rendering or invalidate static pages.

The comment client performs one session request and one first-page request, aborts both on unmount, and uses optimistic updates for likes and successful edits with rollback on failure. It does not poll continuously. Reply data, additional pages, login/register forms, and the mobile full-screen panel are loaded only when needed.

## Administrator Experience

The administrator navigation gains “评论管理” and “用户管理”.

Comment management supports search by content, username, and article; filtering by visible, hidden, spam, and deleted status; and actions to hide, restore, mark spam, or delete. User management supports search by username or email, viewing status and creation time, temporary mute, permanent ban, and temporary-password reset.

Permanent ban and account deletion soft-delete all comments in a transaction. Temporary mute blocks new comments, replies, edits, and likes until expiration but leaves existing content visible.

## Migration and Removal

The base schema and initialization script add the new user, comment, like, and rate-limit tables and supporting indexes. A dedicated idempotent migration script creates missing tables and indexes on the existing Turso database. It does not run automatically during build or deployment.

The Gitalk dependency, site configuration, component, and article-bottom integration are removed. There is no legacy comment import because Gitalk is currently unconfigured.

Implementation occurs on a feature branch. After automated verification, the branch is pushed for review. The live Turso migration and merge to `main` wait for explicit confirmation.

## Error Handling

All public endpoints return stable Chinese error messages without revealing whether a private email belongs to another account beyond the registration context. Database unique constraints are translated into clear username or email conflicts. Authentication failures do not distinguish unknown usernames from bad passwords.

Avatar decode or upload failure leaves the previous avatar unchanged. Comment optimistic updates roll back on API failure. Administrator transactions either update account status and related comments together or leave both unchanged.

## Testing and Acceptance

Automated tests cover:

- Registration validation, unique identities, hashing, and durable rate limits.
- Login, seven-day cookie behavior, session-version invalidation, bans, and forced password change.
- Avatar format, size, pixel, crop, resize, and WebP output.
- Comment sanitization, two-level reply enforcement, ordering, pagination, ownership, editing, moderation, and total counts.
- Concurrent like uniqueness and cancellation.
- Administrator author badges, user moderation, temporary-password reset, and comment removal on ban or account deletion.
- Desktop source placement, removal of article-bottom Gitalk, responsive sidebar width, and mobile full-screen accessibility behavior.
- Abort cleanup, no polling, optimistic rollback, light/dark styles, and absence of unsafe HTML rendering.

Final verification runs the complete Node test suite, ESLint, and a production Next.js webpack build. Manual acceptance checks registration, login, forced password change, avatar upload, desktop comments, mobile panel, replies, likes, edits, administrator replies, moderation, and both themes.
