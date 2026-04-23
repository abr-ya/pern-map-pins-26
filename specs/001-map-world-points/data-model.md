# Data model: Points on the Map (MVP)

**Database**: PostgreSQL (Neon)  
**CRS**: WGS84 — store `latitude` and `longitude` as `double precision`, validate in application: lat ∈ `[-90, 90]`, lng ∈ `[-180, 180]`.

## Entity relationship overview

- **User** (app) ↔ one row per Clerk user (`clerk_id` unique).
- **Point** ↔ one **User** (author); optional **Folder**; optional **Group** (when visibility is group-only); many **Tags** (via `point_tags`).
- **Folder** (organization) — owned by user; can be “personal” (public map) or scoped to a **Group** for group-only organization (if product ties folders to groups—**MVP**: folder has `user_id` + optional `group_id` NULL = personal public; `group_id` set = folder visible only in that group context).
- **Private group** (named **Group** below) ↔ many **GroupMember**; **Group** has optional visibility rules in code.
- **Favorites** — user saves **Point** into a **FavoriteFolder** (hierarchical: favorite folders belong to user).
- **Comment**, **Rating** — belong to **Point** + **User**.

## Tables (logical)

### `users`
| Column | Type | Notes |
|--------|------|--------|
| `id` | UUID | PK, default `gen_random_uuid()` |
| `clerk_id` | text | UNIQUE, not null |
| `display_name` | text | From Clerk or profile |
| `created_at` | timestamptz | |

Index: `clerk_id` unique.

### `groups` (private categories)
| Column | Type | Notes |
|--------|------|--------|
| `id` | UUID | PK |
| `name` | text | not null |
| `created_at` | timestamptz | |

### `group_members`
| Column | Type | Notes |
|--------|------|--------|
| `group_id` | UUID | FK → `groups.id` |
| `user_id` | UUID | FK → `users.id` |
| PK | `(group_id, user_id)` | |

Index: `user_id` for “groups I belong to”.

### `user_preferences` (active private group, optional)
| Column | Type | Notes |
|--------|------|--------|
| `user_id` | UUID | PK, FK |
| `active_group_id` | UUID | NULL = “public only” for private layer; FK → `groups.id` (must be in `group_members`) |

Enforce in app: on update, **if** `active_group_id` set then user must be member.

### `folders` (user organization — not “favorites”)
| Column | Type | Notes |
|--------|------|--------|
| `id` | UUID | PK |
| `user_id` | UUID | FK |
| `group_id` | UUID | NULL = public-personal; else folder only for that group’s private context |
| `name` | text | not null |
| `created_at` | timestamptz | |

Index: `(user_id)`.

### `points`
| Column | Type | Notes |
|--------|------|--------|
| `id` | UUID | PK |
| `user_id` | UUID | FK author |
| `folder_id` | UUID | NULL FK; at most one folder per spec |
| `group_id` | UUID | NULL = public to signed-in; set = visible only to group members (private point) |
| `visibility` | text enum | `public` \| `group_only` (redundant with `group_id` if we enforce `group_id NOT NULL` for group—**simplify**: `visibility` = `public` (default) or `group_only` with `group_id` required) |
| `title` | text | not null |
| `description` | text | |
| `photo_key` | text | R2 object key, nullable; max one image |
| `latitude` | double | not null, validated |
| `longitude` | double | not null, validated |
| `created_at` | timestamptz | for “latest five” |
| `updated_at` | timestamptz | |

Indexes:
- `created_at DESC` for “latest five” public: partial index `WHERE visibility = 'public' AND group_id IS NULL` (or equivalent rule for what counts as public in spec).
- `(latitude, longitude)` not required for v1; optional **GIST (PostGIS)** later.

**Business rules** (Express):
- “Latest five” for **guests**: points where public list rules match (per spec: **public**, not private group, ordered by `created_at` desc limit 5).
- **Signed-in** map: return points user may see: **all** `public` + **group_only** for **active** `group_id` in preferences where user is member.

### `tags` + `point_tags` (MVP: tags per user or global)
| `tags` | `id`, `name`, `user_id` (NULL = global tag—**MVP** use `user_id` for user-defined only) |
| `point_tags` | `point_id`, `tag_id` | PK (point_id, tag_id) |

### `favorite_folders`
| Column | Type | Notes |
|--------|------|--------|
| `id` | UUID | PK |
| `user_id` | UUID | FK |
| `name` | text | |
| `parent_id` | UUID | NULL if flat; or omit nesting in v1 (flat only) for simplicity |

**MVP simplification**: one level of **favorite** folders (no `parent_id`) unless tasks expand.

### `favorites` (user saved point, optional `favorite_folder_id`)
| `user_id` | UUID | |
| `point_id` | UUID | |
| `favorite_folder_id` | UUID | nullable FK |
| Unique | `(user_id, point_id)` | |

### `comments`
| `id` | UUID | PK |
| `point_id` | UUID | FK |
| `user_id` | UUID | FK |
| `body` | text | |
| `created_at` | timestamptz | |

Index: `point_id` for thread load order `created_at`.

### `ratings`
| `user_id` | UUID | |
| `point_id` | UUID | |
| `value` | smallint | 1..5 |
| `updated_at` | timestamptz | |
| PK | `(user_id, point_id)` | one current rating per user per point |

**Aggregate average**: `AVG(value)` in query or materialized in read model later.

## Migrations

- Use **Prisma ORM 7** + **Prisma Migrate**; single linear migration chain to Neon. Connection URL for `migrate` / `db push` lives in **`backend/prisma.config.ts`** (not in `schema.prisma`); schema and migrations under `backend/prisma/`.
- **Seed**: optional dev users/groups (not in production path).

## Validation (Zod 4) — field-level

Mirror rules in [contracts/openapi.yaml](./contracts/openapi.yaml) and Express middleware for every write.
