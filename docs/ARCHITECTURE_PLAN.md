# Excelsior — Waterproofed Master Implementation Plan (v2)

> **Purpose**: This is the single source of truth for the RBAC & Club Management build.
> It was produced by auditing the original plan against the real codebase (`prisma/schema.prisma`,
> `src/lib/auth.ts`, 40+ API routes). Every ambiguity in v1 has been resolved into ONE decision.
> Implement phases in order. Never skip a phase's acceptance check.
>
> **Golden rule for the implementer**: If this document and your assumption disagree, follow this
> document. If this document is silent, copy the closest existing pattern in the codebase.

---

## 0. Review — Defects Found In The Original Plan (all fixed below)

| # | Defect | Resolution |
|---|--------|-----------|
| 1 | `VERIFIED_AUTHOR` role existed but was never given a migration target | Maps to `MEMBER` + `isVerified=true` (§3.4) |
| 2 | 6+ frontend files and ~23 API routes hardcode `'ADMIN'`/`'MODERATOR'` strings; plan never says to replace them | Mandatory refactor list + `rbac.ts` guards (§3.6, §3.7) |
| 3 | NextAuth uses **JWT sessions** — role changes by the Coordinator would NOT reach logged-in users until re-login | Session callback re-reads role from DB (§3.5) |
| 4 | Changing a Postgres enum via `prisma db push` fails/corrupts when removing values | Hand-written migration SQL (§3.3) — never `db push` for this step |
| 5 | Permission matrix cells were ambiguous (blank ≠ check?) | Fully explicit matrix (§2) |
| 6 | Nobody owns **publication moderation** after `MODERATOR` is deleted | `PUB_MOD_ROLES` (§2) |
| 7 | Nobody owns **payment verification** (`paymentStatus` never transitions) | TREASURER/OPERATIONS_HEAD/COORDINATOR queue (§11.4) |
| 8 | Nobody owns **event management** in the matrix | TECH_LEAD/COORDINATOR/OPERATIONS_HEAD (§2) |
| 9 | Optimistic interactions spec'd as "POST" — a cheap model will implement *toggle*, which breaks debouncing | Absolute-action protocol (§6.2) |
| 10 | `EditorShelfItem` model already exists and powers the homepage; plan introduces `Book` shelf fields but never reconciles the two | EditorShelfItem is migrated into `Book` and deleted (§7.1) |
| 11 | Coordinator can demote themselves / demote the last coordinator → total lockout | Last-coordinator guard (§4.4) |
| 12 | No `maxCapacity` enforcement at registration time (race condition) | Transactional count check (§11.3) |
| 13 | Google Sheets webhook failure could fail the registration | Fire-and-forget with catch (§11.5) |
| 14 | `googleSheetUrl` (a secret webhook) would leak via public `GET /api/events/[slug]` | Response sanitizer list (§12.1) |
| 15 | Client-side Cloudinary uploads could be unsigned/unguarded | All uploads go through `/api/uploads/image` with role + MIME + size checks (§12.2) |
| 16 | Guest (no account) vs `VISITOR` (registered external) naming confusion | Defined once, used consistently (§2.2) |
| 17 | `SiteSetting` had no enumerated keys — every consumer would invent its own shape | Exact key catalog (§10.2) |

---

## 1. Implementer Rules (read before writing any code)

1. **No inline role strings anywhere.** Never write `role === 'TECH_LEAD'` in a page or route.
   Always import a permission from `src/lib/rbac.ts`. Grep gate after every phase:
   `rg "=== '(ADMIN|MODERATOR|VERIFIED_AUTHOR|COORDINATOR|TECH_LEAD|PR_HEAD|OPERATIONS_HEAD|TREASURER|ALUMNI|MEMBER|VISITOR)'" src`
   must return **0 results**.
2. **Every `/api/admin/*`, `/api/moderator/*` route** must begin with the guard
   `const auth = await requirePermission(session, 'PERM_NAME')` and return its error response on failure.
3. **Verify after every phase**: `npx tsc --noEmit && npx prisma validate && npm run lint` must pass.
4. **One commit per phase.** Never proceed to the next phase with a red build.
5. All new user-visible text uses the site's editorial style: `font-mono text-[10px] uppercase tracking-[0.2em]`
   for labels, Playfair (`font-display`) for headings, theme tokens (`border`, `foreground`, `muted-foreground`).
6. Never log secrets (`NEXTAUTH_SECRET`, Cloudinary secrets, Sheet webhook URLs).

---

## 2. RBAC — Final, Explicit Matrix

### 2.1 Roles

| Role | Meaning |
|------|---------|
| `COORDINATOR` | Club lead. God-mode over everything, sole role-manager. |
| `TECH_LEAD` | Deputy lead. Everything except role management. |
| `PR_HEAD` | Content & outreach: alumni, gallery, achievements, publication moderation. |
| `OPERATIONS_HEAD` | Logistics: events, operations dashboard, payment verification. |
| `TREASURER` | Money: payment verification + treasury view only. |
| `MEMBER` | Current club member. Write/submit publications, interact. |
| `ALUMNI` | Verified ex-member. Interact + alumni profile. |
| `VISITOR` | Registered external account. Read + interact only. |

`GUEST` is **not a role** — it means "not logged in" and can only read public content.

### 2.2 Permission constants (the ONLY source of truth, defined in `src/lib/rbac.ts`)

```ts
export type Role = 'COORDINATOR' | 'TECH_LEAD' | 'PR_HEAD' | 'OPERATIONS_HEAD'
                | 'TREASURER' | 'MEMBER' | 'ALUMNI' | 'VISITOR';

export const PERMISSIONS = {
  MANAGE_ROLES:            ['COORDINATOR'],
  MANAGE_MEMBERS:          ['COORDINATOR', 'TECH_LEAD'],
  MANAGE_ALUMNI:           ['COORDINATOR', 'TECH_LEAD', 'PR_HEAD'],
  MANAGE_SHELF_LIBRARY:    ['COORDINATOR', 'TECH_LEAD'],
  MANAGE_GALLERY:          ['COORDINATOR', 'TECH_LEAD', 'PR_HEAD'],
  MANAGE_ACHIEVEMENTS:     ['COORDINATOR', 'TECH_LEAD', 'PR_HEAD'],
  MANAGE_OPERATIONS:       ['COORDINATOR', 'TECH_LEAD', 'OPERATIONS_HEAD'],
  MANAGE_HOMEPAGE_CMS:     ['COORDINATOR', 'TECH_LEAD'],
  MANAGE_EVENTS:           ['COORDINATOR', 'TECH_LEAD', 'OPERATIONS_HEAD'],
  VERIFY_PAYMENTS:         ['COORDINATOR', 'OPERATIONS_HEAD', 'TREASURER'],
  MODERATE_PUBLICATIONS:   ['COORDINATOR', 'TECH_LEAD', 'PR_HEAD'],
  PUBLISH_CONTENT:         ['COORDINATOR', 'TECH_LEAD', 'PR_HEAD', 'MEMBER', 'ALUMNI'],
  INTERACT:                ['COORDINATOR', 'TECH_LEAD', 'PR_HEAD', 'OPERATIONS_HEAD', 'TREASURER', 'MEMBER', 'ALUMNI', 'VISITOR'],
} as const satisfies Record<string, readonly Role[]>;

export type Permission = keyof typeof PERMISSIONS;
export const hasPermission = (role: string | undefined, perm: Permission): boolean =>
  !!role && (PERMISSIONS[perm] as readonly string[]).includes(role);
export const STAFF_ROLES: Role[] = ['COORDINATOR', 'TECH_LEAD', 'PR_HEAD', 'OPERATIONS_HEAD', 'TREASURER'];
```

Note: `MODERATE_PUBLICATIONS` (defect #6) and `VERIFY_PAYMENTS`/`MANAGE_EVENTS` (defects #7, #8)
are new decisions — they own the flows the old `MODERATOR`/`ADMIN` roles used to cover.

### 2.3 Capability matrix (derived automatically from §2.2 — do not re-derive by hand)

| Capability | COORD | TECH | PR | OPS | TREAS | ALUM | MEMBER | VISITOR | Guest |
|---|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|
| MANAGE_ROLES | ✔ | | | | | | | | |
| MANAGE_MEMBERS | ✔ | ✔ | | | | | | | |
| MANAGE_ALUMNI | ✔ | ✔ | ✔ | | | | | | |
| MANAGE_SHELF_LIBRARY | ✔ | ✔ | | | | | | | |
| MANAGE_GALLERY | ✔ | ✔ | ✔ | | | | | | |
| MANAGE_ACHIEVEMENTS | ✔ | ✔ | ✔ | | | | | | |
| MANAGE_OPERATIONS | ✔ | ✔ | | ✔ | | | | | |
| MANAGE_HOMEPAGE_CMS | ✔ | ✔ | | | | | | | |
| MANAGE_EVENTS | ✔ | ✔ | | ✔ | | | | | |
| VERIFY_PAYMENTS | ✔ | | | ✔ | ✔ | | | | |
| MODERATE_PUBLICATIONS | ✔ | ✔ | ✔ | | | | | | |
| PUBLISH_CONTENT | ✔ | ✔ | ✔ | | | ✔ | ✔ | | |
| INTERACT (login required) | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | ✖ |
| Read / browse | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ |

---

## 3. Phase 1 — Database, Migration & RBAC Core

### 3.1 New / changed enums & models (`prisma/schema.prisma`)

Apply exactly the models from the original plan §2.1 with these **corrections**:

- `Role` — final order (matters for migration): as §2.1 of this doc.
- Add to `User`: `verificationStatus`, `isVerified`, `rollNumber`, `branch`, `batch`,
  `memberSection`, `memberTitle`, `socialLinks` — all as in original plan §2.1.
- `Book` — take the original plan's model **as-is** (it already includes shelf customizer fields,
  `isShelfItem`, `displayOrder`).
- `GalleryItem` — add `isFeaturedOnHome Boolean @default(false)`.
- `Event` — take as-is from the plan (customFormFields, googleSheetUrl, payment fields).
- `EventRegistration` — take as-is, keep `@@unique([eventId, userId])` (registration requires login).
- Add `model AuditLog { id String @id @default(uuid()) actorId String actor User @relation(fields:[actorId],references:[id]) action String target String meta Json? createdAt DateTime @default(now()) }`
  and the back-relation on User (`auditLogs AuditLog[]` already exists).
- Add `model SiteSetting` exactly as the plan.
- **DELETE** `model EditorShelfItem` and its relations AFTER §7 migration runs (two-step; see §7.1).
- Add `displayOrder Float @default(0)` note: drag-reorder persists by writing `index * 1024` (gap-tolerant).

### 3.2 Pre-migration backup (mandatory)

```bash
npx prisma db pull --schema=prisma/backup-schema.prisma  # snapshot current shape
# Then take a Supabase dashboard snapshot/timestamp backup. Do not skip.
git checkout -b feat/rbac-system
```

### 3.3 Enum migration (defect #4 — NEVER use `db push` for this)

Create `prisma/migrations/<timestamp>_rbac_roles/migration.sql`:

```sql
-- 1. New Role values (additive; Postgres cannot remove enum values in place)
ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'COORDINATOR';
ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'TECH_LEAD';
ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'PR_HEAD';
ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'OPERATIONS_HEAD';
ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'TREASURER';
ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'ALUMNI';
ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'VISITOR';

-- NOTE: ADD VALUE cannot run inside a transaction block in older PG;
-- Prisma splits statements, so keep these as separate statements (they are).

-- 2. Migrate data
UPDATE "User" SET "role" = 'COORDINATOR'    WHERE "role" = 'ADMIN';
UPDATE "User" SET "role" = 'TECH_LEAD'      WHERE "role" = 'MODERATOR';
UPDATE "User" SET "role" = 'MEMBER'         WHERE "role" IN ('VERIFIED_AUTHOR', 'MEMBER');

-- 3. Swap to a fresh enum without the dead values
CREATE TYPE "Role_new" AS ENUM (
  'COORDINATOR','TECH_LEAD','PR_HEAD','OPERATIONS_HEAD','TREASURER','MEMBER','ALUMNI','VISITOR'
);
ALTER TABLE "User" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "User" ALTER COLUMN "role" TYPE "Role_new" USING ("role"::text::"Role_new");
ALTER TABLE "User" ALTER COLUMN "role" SET DEFAULT 'VISITOR';
DROP TYPE "Role";
ALTER TYPE "Role_new" RENAME TO "Role";
```

Then:
```bash
npx prisma migrate dev --name rbac_roles
npx prisma generate
```
If `migrate dev` reports drift, run `npx prisma migrate diff` and reconcile — do NOT `db push --accept-data-loss`.

### 3.4 Data backfill migration (second migration file)

```sql
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "verificationStatus" "VerificationStatus" NOT NULL DEFAULT 'VERIFIED';
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "isVerified" BOOLEAN NOT NULL DEFAULT false;
UPDATE "User" SET "isVerified" = true WHERE "role" <> 'VISITOR';
-- every existing account predates self-registration; treat as verified members
```
(Prisma will also emit column DDL; keep manual control over enum swap order. Column adds that
Prisma's diff produces may be combined into one migration with §3.3 if the CLI offers it —
the SQL above is authoritative for enum handling.)

### 3.5 Auth: role freshness (defect #3)

`src/lib/auth.ts` — session callback change (JWT strategy stays):

```ts
async session({ session, token }) {
  if (token?.id && session.user) {
    session.user.id = token.id as string;
    // Re-read role/verification from DB so role changes apply within one navigation.
    const fresh = await db.user.findUnique({
      where: { id: token.id as string },
      select: { role: true, verificationStatus: true, name: true, username: true, profilePhoto: true },
    });
    session.user.role = fresh?.role ?? (token.role as string);
    session.user.verificationStatus = fresh?.verificationStatus ?? 'VERIFIED';
    session.user.username = fresh?.username ?? (token.username as string);
    session.user.name = fresh?.name ?? token.name;
    session.user.image = fresh?.profilePhoto ?? null;
  }
  return session;
}
```

Remove all `console.log` calls from `src/lib/auth.ts`. Update `src/types/next-auth.d.ts`:
`role: Role` (import from `@/lib/rbac`), add `verificationStatus?: 'UNVERIFIED'|'PENDING'|'VERIFIED'|'REJECTED'`.

### 3.6 API guard utility — `src/lib/api-auth.ts` (new)

```ts
import { getServerSession } from 'next-auth';
import { authOptions } from './auth';
import { hasPermission, Permission } from './rbac';
import { NextResponse } from 'next/server';

export async function requirePermission(perm: Permission) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return { session: null, error: NextResponse.json({ error: 'Authentication required' }, { status: 401 }) };
  if (!hasPermission(session.user.role, perm)) return { session, error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) };
  return { session, error: null as null };
}
export async function requireLogin() { /* same shape, permission 'INTERACT' */ }
```

Every protected route:
```ts
const { session, error } = await requirePermission('MANAGE_EVENTS');
if (error) return error;
```

### 3.7 Mandatory refactor map (defect #2) — do in this phase

| File | Change |
|---|---|
| `src/components/Navbar.tsx` | `showModLink` → `hasPermission(role,'MANAGE_EVENTS') \|\| hasPermission(role,'MODERATE_PUBLICATIONS') \|\| hasPermission(role,'MANAGE_SHELF_LIBRARY')`; build admin-links array from permissions |
| `src/app/api/moderator/queue/route.ts`, `moderator/[id]/route.ts`, `moderator/[id]/review/route.ts` | guard → `MODERATE_PUBLICATIONS` |
| `src/app/api/admin/events/**` (8 routes) | guard → `MANAGE_EVENTS` |
| `src/app/api/admin/library/**` (6 routes) | guard → `MANAGE_SHELF_LIBRARY` |
| `src/app/api/admin/editors-shelf/route.ts` | guard → `MANAGE_SHELF_LIBRARY` (until §7) |
| `src/app/(main)/events/[slug]/page.tsx`, `src/app/(main)/community/members/page.tsx`, `src/app/api/comments/[id]/route.ts`, `src/app/api/events/[slug]/gallery/route.ts`, `src/components/discussion/CommentNode.tsx` | replace raw role checks with `hasPermission` |

### 3.8 `prisma/seed.ts`

Rewrite seeds to the new enum (`Role.COORDINATOR`, `Role.TECH_LEAD`, `Role.MEMBER`), set
`verificationStatus: 'VERIFIED'`, and seed one user per staff role
(`coordinator@excelsior`, `techlead@excelsior`, `pr@excelsior`, `ops@excelsior`, `treasurer@excelsior`, password `Test@1234`).

**Acceptance (Phase 1)**: `npx tsc --noEmit` green · grep gate (§1.1) returns 0 ·
login as seeded coordinator shows staff nav; login as visitor does not ·
`SELECT DISTINCT role FROM "User"` returns only new values.

---

## 4. Phase 2 — Registration, Verification & Role Portal

### 4.1 Image cropper — `src/components/ui/ImageCropperModal.tsx` (build FIRST)

- Props: `{ file: File; aspect: number; onCropped: (file: File) => void; onClose(): void }`
- Canvas-based: draw image, fixed aspect frame, pan/zoom via pointer events (no new deps).
- Output: re-encode to `image/jpeg` quality 0.85 via `canvas.toBlob`, max edge 1600px.
- Aspect presets exported: `AVATAR 1`, `BOOK 2/3`, `PORTRAIT 4/4.3`, `BANNER 16/9`, `FREE null`.

### 4.2 Register page — `src/app/(main)/register/page.tsx`

Two steps, exactly these fields:
1. **Identity**: name, username (lowercase, `[a-z0-9_]{3,20}`), email, password (min 8),
   branch, batch, bio (≤300), avatar (cropper, 1:1), up to 3 social links `{platform, url}`.
2. **Category** (radio, two cards):
   - *I am / was a club member* → extra `rollNumber` (required), then chooses `Current` (→ role `MEMBER`, status `PENDING`) or `Alumni` (→ role `ALUMNI`, status `PENDING`).
   - *Just visiting* → role `VISITOR`, status `VERIFIED`, instant login.

Client validation with zod; server is the authority.

### 4.3 API — `POST /api/auth/register`

Body: the §4.2 payload. Behavior: uniqueness checks (username/email → 409 with field name),
bcrypt hash 10 rounds, create user per category, **notify all COORDINATORs** (Notification rows)
when status = PENDING. Response: `{ success: true, requiresApproval: boolean }`.
Login for PENDING accounts is allowed but gated by `verificationStatus` checks on staff/action routes
(`requirePermission` additionally returns 403 with `{ error: 'Account pending verification' }`
when `session.user.verificationStatus === 'PENDING' && perm !== 'INTERACT'` — add this one line to §3.6).

### 4.4 Coordinator role portal — `/admin/roles` + `/api/admin/roles`

- `GET /api/admin/roles` → `{ pending: User[], all: User[] }` (guard `MANAGE_ROLES`).
- `PATCH /api/admin/roles/[id]` → body `{ role?: Role, verificationStatus?: 'VERIFIED'|'REJECTED' }`.
  Rules (in order):
  1. Guard `MANAGE_ROLES`.
  2. **Last-coordinator guard (defect #11)**: if target is the last COORDINATOR and the change
     removes COORDINATOR → 400 `{ error: 'Cannot demote the last coordinator' }`.
  3. `REJECTED` forces role → `VISITOR`.
  4. Write AuditLog `{ action: 'ROLE_CHANGE', target: userId, meta: { from, to } }`.
  5. Return updated user.
- UI: two tabs (Pending / All users), same editorial dropdown/table styling as other admin pages.

**Acceptance**: register visitor → instant login; register member → PENDING, coordinator sees
notification, approve → user's next page load shows member powers (session DB re-read from §3.5);
demoting last coordinator → 400.

---

## 5. Phase 3 — Login Prompt Modal

`src/components/auth/AuthPromptModal.tsx`:
- Controlled `{ open, action: string, onClose }`; copy: `"Sign in to ${action}"`.
- Frosted backdrop (`bg-black/60 backdrop-blur-xl`), centered card, Playfair headline,
  two buttons: Sign In (`/login`) and Join (`/register`), mono micro-labels.
- Exit animation 250ms; mount via `AnimatePresence` at page root of publications page.

---

## 6. Phase 4 — Optimistic Interactions

### 6.1 Hook — `src/hooks/useOptimisticInteract.ts`

```ts
type Action = 'LIKE' | 'DISLIKE' | 'UNLIKE' | 'UNDISLIKE' | 'BOOKMARK' | 'UNBOOKMARK';
function useOptimisticInteract(slug: string, initial: { liked: boolean; disliked: boolean; bookmarked: boolean; counts: { likes: number; dislikes: number } })
```

Behavior:
- `interact(action)` applies instantly to local state (LIKE also clears DISLIKE and vice-versa; counts move by ±1).
- Marks dirty and starts/resets a **2500ms** timer; also flushes on `beforeunload` and on unmount
  (`useEffect` cleanup) via `navigator.sendBeacon` fallback.
- Flush sends `POST /api/publications/[slug]/interact` with the **final absolute state**:
  `{ liked, disliked, bookmarked }` — NOT the action (defect #9).
- On failure (non-2xx / network): revert to the last-known server snapshot and toast
  `Couldn't sync your interaction — please try again.` Toast component: `src/components/ui/Toast.tsx`
  (simple bottom-center, editorial style; no new dependency).
- `useReducedMotion` respected for the count tick animation.

### 6.2 API — `POST /api/publications/[slug]/interact` (modify existing)

Guard `requireLogin`. Body `{ liked: boolean, disliked: boolean, bookmarked: boolean }`.
Server upserts/Deletes Interaction rows inside a transaction so DB state equals body exactly
(idempotent — safe for retries). Response `{ success: true, counts }` (counts recomputed server-side).

Unauthenticated click → client opens AuthPromptModal (§5), never calls the API.

**Acceptance**: rapid like/unlike 10× in 2.5s → exactly ONE request; offline toggle → rollback + toast;
counts correct after refresh.

---

## 7. Phase 5 — 3D Shelf & Library Unification (defect #10)

### 7.1 Migration decision

`Book` (with the plan's shelf fields) becomes the single catalog. The existing
`EditorShelfItem` rows are copied into `Book` by a one-off script:

`scripts/migrate-editorshelf.ts` (run with ts-node):
- For each EditorShelfItem: create Book `{ title, author, coverImage, description: editorialNote,
  genre, synopsis: editorialNote, isShelfItem: true, editorPickType: 'EDITORS_PICK', displayOrder: i*1024 }`.
- Preserve slugs by writing them to a new `Book.slug String? @unique` field.
- Only after homepage verification: drop model + `/api/admin/editors-shelf` write routes.

### 7.2 Admin manager — `/admin/shelf` + `/api/admin/shelf`

- Guard `MANAGE_SHELF_LIBRARY`.
- `GET` list (ordered by displayOrder) · `POST` create · `PATCH /api/admin/shelf/[id]` ·
  `DELETE /api/admin/shelf/[id]` (block delete when `issuedCopies > 0` → 400).
- `PUT /api/admin/shelf/reorder` body `{ ids: string[] }` → writes `displayOrder = index * 1024`.
- Cover upload uses cropper (2:3) → `/api/uploads/image`.
- Live preview: reuse `src/components/home/Book3DCard.tsx` with the draft values (it already
  accepts props; do not fork it).
- Fields exactly as original plan §2.4 plus validation: colors must match `^#[0-9a-fA-F]{6}$`,
  `totalCopies >= 1`, `motif ∈ ['lattice','border','none','medallion']`.

### 7.3 Homepage sync

- `/api/editors-shelf` (public GET) now queries `Book.findMany({ where: { isShelfItem: true },
  orderBy: { displayOrder: 'asc' }, take: 8 })` — homepage `LibraryShelf.tsx` keeps working with
  its existing props mapping; remove the static `hardback-data.ts` import as the default source
  (keep file as offline fallback if API fails).

**Acceptance**: add book in admin → appears in 3D shelf on homepage refresh in correct order;
reorder persists; delete blocked while copies issued.

---

## 8. Phase 6 — Members & Alumni Directories

### 8.1 Members — `/admin/members` + `/api/admin/members` (guard `MANAGE_MEMBERS`)

- `GET` → all users with role ∈ {COORDINATOR…MEMBER}; `PATCH /api/admin/members/[id]` body
  `{ memberSection?: 'COORDINATORS'|'CORE'|'TEAM', memberTitle?: string }` (≤60 chars) + AuditLog.
- `/community/members` page: fetch `/api/community/members`, group `memberSection` in order
  COORDINATORS → CORE → TEAM; unsectioned members go to TEAM. Keep existing card design.

### 8.2 Alumni — `/admin/alumni` + `/api/admin/alumni` (guard `MANAGE_ALUMNI`)

- Full CRUD over `AlumniProfile` (existing model already matches the plan's fields).
- Photo cropper aspect 4/4.3. `userId` link via username search (Typeahead on
  `/api/admin/alumni/users?q=`).
- AuditLog on create/update/delete.

**Acceptance**: assign member to CORE → `/community/members` reflects on refresh; alumnus with
linked username renders profile link.

---

## 9. Phase 7 — Gallery Toggle, Achievements, Operations

### 9.1 Gallery (guard `MANAGE_GALLERY`)

- `/api/admin/gallery`: `POST` (upload → cropper FREE → `/api/uploads/image`, folder
  `excelsior/gallery/`), `PATCH /[id]` toggle `isFeaturedOnHome` / edit caption/type, `DELETE /[id]`
  (also calls `/api/uploads/delete` for the Cloudinary destroy).
- `/api/community/gallery` unchanged shape + new `isFeaturedOnHome` field.
- `GalleryStrip.tsx` (homepage): fetch `/api/community/gallery?featured=true` (server component
  wrapper or client fetch — follow existing pattern in that file); fallback to current static
  TILES when request fails. Cap at 5, `md:col-span` pattern preserved.

### 9.2 Achievements (guard `MANAGE_ACHIEVEMENTS`)

- `/admin/achievements` CRUD over existing `Achievement` model (has `image` already).
- Reuse `AchievementsShowcase` untouched — it is already data-driven.

### 9.3 Operations dashboard (guard `MANAGE_OPERATIONS`) — `/admin/operations`

Sections (read-heavy, one page):
1. Active loans: existing `IssueRequest` where status ∈ ISSUED/REQUESTED, with the existing
   approve/return actions inlined.
2. Inventory: count of Books, copies issued/available.
3. Payment verifications (powers §11.4): rows of `EventRegistration` where
   `paymentStatus = 'PENDING'`, buttons Verify / Fail (guard `VERIFY_PAYMENTS`).
4. Club tasks: simple `Task` list is OUT OF SCOPE v1 (deferred — do not invent).

**Acceptance**: toggle homepage flag → homepage strip changes after refresh; treasurer sees
payment queue but not shelf admin (grep matrix).

---

## 10. Phase 8 — Homepage CMS (guard `MANAGE_HOMEPAGE_CMS`)

### 10.1 Center — `/admin/homepage` with sub-routes
`events-strip`, `testimonials`, `hero`, `footer` → each edits SiteSetting keys.

### 10.2 SiteSetting key catalog (defect #17 — exact shapes)

| Key | Value shape |
|---|---|
| `home.eventsStrip` | `{ items: [{ title, kind, date, venue, image, href }] }` (max 8) |
| `home.testimonials` | `{ mode: 'RANDOM' \| 'CURATED', pinnedIds: string[] (max 4) }` |
| `home.heroCards` | `{ cards: [{ quote, writer, accent }] }` (max 24 — matches Cardwall CARDS) |
| `footer.links` | `{ groups: [{ heading, links: [{ label, href }] }] , socials: [{ platform, url }] }` |

- `/api/admin/homepage/[key]`: `GET`/`PUT` with zod schemas mirroring the table above
  (`PUT` upserts; AuditLog).
- Consumers (`EventsIndex`, `AlumniVoices`, `Cardwall`, Footer): fetch via server component or
  client fetch — **every consumer must fall back to its current hardcoded array when the key is
  missing or the request fails.** This makes CMS opt-in and unbreakable.
- Testimonials RANDOM mode: `AlumniProfile.findMany({ where: { message: { not: null } }, take: 4, orderBy: { createdAt: 'asc' } })` — deterministic per deploy; CURATED uses `pinnedIds`.

**Acceptance**: edit events strip item → homepage updates; deleting a SiteSetting row → homepage
falls back to defaults (verify explicitly).

---

## 11. Phase 9 — Events Engine

### 11.1 Form builder — `/admin/events/new` (guard `MANAGE_EVENTS`)

- Custom field editor produces `customFormFields: [{ id, label, type, required, options? }]`,
  `type ∈ ['text','number','select','checkbox','textarea']` (no per-field file uploads in v1 —
  only the single payment screenshot).
- Payment block: `requirePayment`, `paymentAmount` (string like `₹150`), `paymentInstructions`,
  QR image upload (cropper 1:1, folder `excelsior/events/qr/`).
- `googleSheetUrl`: URL, must start `https://script.google.com/` or `https://hooks.` (zod refine).
- Event create/edit also available at `/admin/events/[id]`; slug auto from title (`slugify`,
  unique suffix `-2`).

### 11.2 Public form — `/events/[slug]`

- Renders `customFormFields` with the site's input styling; zod client validation generated from
  field defs; file input only when `requirePayment`.
- If `maxCapacity` reached (`GET /api/events/[slug]/capacity` → `{ remaining }`), form disables
  with `Registrations closed — house full.`

### 11.3 `POST /api/events/[slug]/register` (defects #12–#14)

Order of operations (exact):
1. `requireLogin`; reject if event `status !== 'UPCOMING'` (410).
2. zod: name, email, phone?, answers object; if `requirePayment`, `paymentScreenshotUrl` required.
3. Inside `prisma.$transaction` (Serializable where supported):
   `count({ eventId })` + 1 ≤ `maxCapacity` else 409 `{ error: 'Event full' }`;
   upsert registration `@@unique([eventId,userId])` (409 → `{ error: 'Already registered' }`).
4. After commit: fire-and-forget `fetch(googleSheetUrl, { method:'POST', body: JSON.stringify(row) }).catch(() => {})` — never awaited into the response path; log failures only.
5. After commit: `sendRegistrationEmail()` via Resend (§11.6) wrapped in try/catch — email
   failure must not fail the request; AuditLog entry.
6. Respond `{ success: true, ticketRef: 'EXC-' + registration.id.slice(0,8).toUpperCase(), count }`.

### 11.4 Payment verification queue (defect #7)

- UI lives in Operations dashboard (§9.3). API: `PATCH /api/admin/events/[id]/registrations/[regId]`
  body `{ paymentStatus: 'VERIFIED'|'FAILED' }`, guard `VERIFY_PAYMENTS`, AuditLog,
  Notification to the registrant, and on VERIFIED a Resend "payment confirmed" email.

### 11.5 Sheets isolation

The webhook push payload: `{ name, email, phone, answers, ticketRef, paymentScreenshotUrl,
registeredAt }`. Never include other users' data; one registration = one row push; no retries in v1.

### 11.6 Mail — `src/lib/mail.ts`

- Uses existing `resend` dependency; `RESEND_FROM` env (default `onboarding@resend.dev` in dev).
- `registrationConfirmed({ to, event, ticketRef, paymentStatus })` — editorial HTML template:
  Playfair headline, mono ticket ref, event date/venue, rulebook link (`rulebookUrl ?? omit`).
- All sends: `try { await resend.emails.send(...) } catch (e) { console.error('mail:', e.message) }`.

**Acceptance**: capacity 1 event → second registration 409; sheet webhook URL pointing to
`http://localhost:9` does NOT break registration; treasurer verifies payment → registrant
notification exists; confirmation email delivered (check Resend dashboard).

---

## 12. Cross-Cutting Security & Hygiene

### 12.1 API response sanitizer (defect #14)

Public event responses MUST omit: `googleSheetUrl`, `googleSheetId`. Implement via explicit
`select` in the two public routes (`/api/events/[slug]`, `/api/events`) — never `findUnique()` raw.
Add a vitest-free guard: a manual test that `curl /api/events/[slug] | grep script.google` is empty.

### 12.2 Uploads (defect #15)

`/api/uploads/image` (exists) must enforce: `requireLogin`; MIME ∈ {png,jpeg,webp}; ≤ 5MB;
folder allowlist by route param (`avatars`, `books`, `gallery`, `events/qr`, `events/payments`,
`alumni`, `members`); signed server-side Cloudinary upload only (never expose `api_secret`
to the client; never use unsigned presets).

### 12.3 Rate limiting (lightweight)

`src/lib/rate-limit.ts`: in-memory Map `key = userId|ip`, windows — interact: 30/min,
register: 5/15min, uploads: 20/hr. Return 429 `{ error: 'Too many requests' }`. (Single-instance
deploy — acceptable; note in code comment.)

### 12.4 Environment variables (append to `.env.example`)

```
DIRECT_URL=          # already used by schema
CLOUDINARY_*         # existing
RESEND_API_KEY=
RESEND_FROM="Excelsior <no-reply@...>"
```

### 12.5 Audit logging

Every mutating admin action writes AuditLog (action, target, meta JSON). `/admin/roles` page gets
an "Activity" tab (guard `MANAGE_ROLES`) listing latest 100.

---

## 13. Final Verification Matrix (run after all phases)

| # | Scenario | Expected |
|---|---|---|
| 1 | Fresh clone → `npm i && npx prisma generate && npm run build` | Zero errors |
| 2 | Register visitor | Logged in instantly, no staff UI |
| 3 | Register member w/ roll no | PENDING; coordinator notified; approve → powers on next nav |
| 4 | Coordinator demotes self when another coordinator exists | Allowed |
| 5 | Coordinator demotes last coordinator (self) | 400 blocked |
| 6 | Guest clicks Like | AuthPromptModal, no API call |
| 7 | Logged-in like → unlike ×10 in 3s | Exactly 1 network request, final state = unliked |
| 8 | Kill network before debounce flush | Rollback + toast |
| 9 | Add book via /admin/shelf | Homepage 3D shelf shows it, correct order |
| 10 | Reorder shelf, refresh | Order persists |
| 11 | Toggle gallery "Show on Homepage" | Homepage strip updates |
| 12 | PR_HEAD visits /admin/roles | 403 + redirect |
| 13 | Treasurer visits /admin/operations | Payment queue visible; shelf admin hidden |
| 14 | Register for capacity-1 event twice | Second gets 409 "Event full" |
| 15 | Event with dead sheet webhook | Registration still succeeds |
| 16 | `curl /api/events/[slug]` | No `script.google` in response |
| 17 | Role change while target user online | New role visible after one navigation (no re-login) |
| 18 | Delete SiteSetting row | Homepage falls back to defaults |
| 19 | `rg` gate §1.1 | 0 matches |
| 20 | `npx tsc --noEmit && npx prisma validate && npm run lint` | All green |

---

## 14. Out of Scope v1 (do NOT build)

- Per-field file uploads in dynamic event forms (only payment screenshot).
- Task management in Operations.
- Sheet→DB reverse sync (sheet is write-only mirror).
- Email on registration to *coordinators* (Notification row only).
- Multi-instance rate limiting / Redis.
