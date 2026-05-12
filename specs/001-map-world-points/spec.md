# Feature Specification: Points on the Map

**Feature Branch**: `001-map-world-points`  
**Created**: 2026-04-22  
**Updated**: 2026-05-12  
**Status**: Draft  
**Input**: User description: "We are building a 'Points on the map' app. Main screen: world map with zoom and pan, showing the map and the five most recently created points. Registration/login via a screen or modal: email and password, Google sign-in; more providers may come later. For signed-in users: add points (click → coordinates, title, optional description and photo), folders for the user's own points, tags, everyone can see one another's points, a user category that can create points and folders visible only to them, favorites with folders, a point detail (page or sidebar) with comments and a 1–5 rating, and when a folder is selected, show that folder's points on the map."  
**Amendment (2026-05-12)**: Refine map pan/zoom when a point is selected and when selection is cleared: on select, center the chosen point and zoom to a neighborhood scale (about three to four city blocks around it); on deselect, restore default map position and zoom for the **current** set of points on the map (guest, signed-in, folder, etc.).

## Clarifications

### Session 2026-05-12

- Q: How should the map behave when the user **selects** a point and when they **clear** selection? → A: **On select**, the map MUST **move** so the selected point is **in the center of the screen** (viewport) and the zoom MUST increase to a **neighborhood** level where roughly **three to four city blocks** (or equivalent street context in non‑grid places) are visible **around** the point—close enough to orient by nearby streets, not whole‑city or world view. **On deselect**, the map MUST return to the **default** **position and zoom** defined for the **current** map context (which points are shown now): e.g. guest **latest five** framing per FR-011, signed‑in **fit** to the applicable public (and permitted) markers, **folder** view fit to that folder’s points, etc. If the visible point set is empty, the map stays valid and predictable (per existing empty‑state rules).

### Session 2026-04-22

- Q: For unsigned users, which public points may appear on the map beyond the "latest five" list? → A: Guests see on the map **only** the **same five** most recent public points (created by other users) as in the "latest five" block; the map shows the **geographic area** where those points are displayed (i.e. no extra public markers for guests). The full public layer for exploration applies **after** sign-in (see FR-007, FR-011).
- Q: What may an **unsigned** user open in **point detail** (tap/click) before sign-in? → A: **Read-only** detail for **public** points: **title**, **description** (if any), **photo** (if any), and the **displayed** **average** (or aggregate) rating. **Comment thread**, **favorites** actions, and **entering** a **personal** rating or **comment** require **sign-in** (see FR-010, FR-012).
- Q: Is **email address verification** (e.g. clicking a link) required **before** the user can **create a point** or use other **signed-in** write actions? → A: **Not** in the **first** release: after successful sign-up and sign-in, the user can **immediately** use features in this spec (e.g. create points) **without** a mandatory email verification step. Optional follow-up or stricter policy **may** be added **later** (see FR-013).
- Q: Can a user belong to **more than one** private group in v1, and how is **member-only** content combined on the map? → A: A user **may** belong to **several** private groups. **Member-only** **points and folders** are **not** all shown at once: the user chooses an **active** private **group** via a **switcher** (or equivalent). **Only** the **active** group's **private** **content** is in scope for map/folder views that show **that** group's data; the user must **change** the **active** group to work with another group's private content. **Public** (non–group-restricted) points follow FR-007; exact pairing of "public layer + active group" **overlay** is detailed in the plan (see **FR-014**).
- Q: How many **photos** per point in the **first** release? → A: **At most one** optional **image** per point (or **none**). **Multi-image** **galleries** are **out of scope** for this spec’s **first** release unless re-opened in a **later** change; technical limits (size, format) stay in the plan (see **FR-004**).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Map and five latest points (Priority: P1)

A visitor opens the main screen and sees a world map: they can zoom, zoom out, and pan. The screen also shows the **five most recently created** public points (newest first among points that count for the public "latest" list), added by other users. **While unsigned**, the map shows **only** markers for **those same five** points, and the view focuses on the **part of the map** where they appear; **it does not** show the full set of public points available to signed-in users. If there are no applicable points, the "latest five" area shows an empty or explanatory state, while the map remains fully interactive.

**Why this priority**: Without a map and basic browsing there is no product value; this is the minimum showcase.

**Independent Test**: Without signing in, verify that zoom and pan work; the five slots and **only those five** map markers update per the "latest" rules when new public points appear; the map is visually tied to the area where the five are shown; with zero points, empty-state behavior is as expected.

**Acceptance Scenarios**:

1. **Given** a user is on the main screen, **When** they zoom and pan the map, **Then** the map responds to gestures/controls without failure.
2. **Given** there are at least five applicable public points in the system, **When** an **unsigned** user views the main screen, **Then** the list shows five items and the map shows **five markers and no other** public points (per visibility rules for the "latest" list).
3. **Given** there are no points to display, **When** a user views the main screen, **Then** the "latest five" block does not mislead the user and does not break the map.
4. **Given** a user **signs in**, **When** they use the main map, **Then** they can see the **full** set of public points (per FR-007), not only the "latest five" markers.
5. **Given** a point can be **selected** (e.g. marker tap or equivalent), **When** the user selects it, **Then** the map **centers** that point in the view and zooms to show about **three to four city blocks** (neighborhood context) around it (per **FR-015**).
6. **Given** a point is selected and the map is in the neighborhood view, **When** the user **clears** selection (e.g. closes detail, deselects, or equivalent), **Then** the map **restores** the **default** position and zoom for the **current** visible points and context (per **FR-016**), e.g. guest framing for the latest five, or fit to all markers in scope for signed‑in or folder views.

---

### User Story 2 - Registration and sign-in (Priority: P1)

A user can **register and sign in with email and password** and **sign in with Google**; the same patterns apply to returning users. A dedicated flow (screen or modal) is available without breaking the main map use case. In the **first** release, **email link verification** is **not** a **required gate** before creating content or other actions in this spec; optional verification flows **may** be introduced later.

**Why this priority**: All personal features require an account.

**Independent Test**: Create accounts (email and Google) and sign in/out; invalid credentials are rejected with clear feedback; after successful sign-in, the user sees that the session is active (e.g. name shown, actions that required sign-in become available).

**Acceptance Scenarios**:

1. **Given** a new user, **When** they register with a valid email and password, **Then** an account is created and they can sign in.
2. **Given** an existing user, **When** they sign in with email/password or Google, **Then** a session is established for the chosen method.
3. **Given** a user with a wrong password or non-existent email, **When** they try to sign in, **Then** they receive a message that does not leak unnecessary security details.
4. **Given** a new user has completed **email+password** (or **Google**) sign-up and is **signed in**, **When** they attempt to **create a point** in the first release, **Then** the system does **not** require **email** **verification** (e.g. inbox link) as a **prerequisite** (per FR-013).

---

### User Story 3 - Creating and organizing own points (Priority: P2)

A signed-in user **adds a point** by clicking the map: the **click coordinates** and a **title** are set; **description** and **photo** are optional. The user can **group** their points into **folders** (each point in at most one user folder for organization, or no folder) and **assign tags** (per the tag rules in requirements below). **When a folder is selected** (one of the user's), **all points in that folder** that fit the current view context are shown on the map.

**Why this priority**: This is the core of "my places on the map."

**Independent Test**: Create a point with only a title, then with description/photo; move between folders; assign multiple tags; select a folder and see the expected markers on the map.

**Acceptance Scenarios**:

1. **Given** a signed-in user, **When** they click the map and save a form with a title, **Then** a point is created at those coordinates.
2. **Given** a user fills optional fields, **When** they save the point, **Then** the description and/or photo appear in that point's details.
3. **Given** a user has a folder with points, **When** they select that folder to view, **Then** the map shows all points in it allowed by the current visibility mode.
4. **Given** a user has tags, **When** they assign tags to points, **Then** the tags are saved and available for filtering/display per requirements.

---

### User Story 4 - Public visibility and private groups (Priority: P2)

All **signed-in** users **see one another's public points** (per FR-007), except where **visibility** is **restricted** to a **private group**. Members of a **user category (group)** can create **points and folders visible only to members of that group**; users outside the group do not see that **member-only** content. A user **may** belong to **more than one** private group; the product uses an **active private group** **switcher** so that **member-only** content for **other** joined groups is **not** shown **at the same time**—only the **active** group's **private** **slice** (plus the agreed **public** layer behavior) is in scope for that map/session context. The public "latest five" on the main screen follows public-list rules and does not reveal private group content inappropriately.

**Why this priority**: The social layer and the split between public and group content differentiates the product from "only my markers."

**Independent Test**: Two public users see each other's public points; a private group member creates private points/folders—another member sees them when that group is **active** and they are a member, a non-member does not; a user in two groups does **not** see both groups' private layers **simultaneously** without switching; the public "latest five" respects visibility rules.

**Acceptance Scenarios**:

1. **Given** two signed-in users with public points, **When** each opens the map, **Then** they see each other's public points (per display rules).
2. **Given** a user in a **private category** creates private points/folders, **When** another member of the same category has that group set as the **active** private context, **Then** they see that **member-only** content on the map and in folders as specified.
3. **Given** the same private content, **When** a user **outside** the category looks, **Then** private points and folders are not revealed to them.
4. **Given** a user is a **member of two** private groups, **When** they set **Group A** as the **active** private group, **Then** they **do not** simultaneously see **Group B**'s **member-only** **map/folder** content **until** they switch **active** to **B** (or the plan’s equivalent).

---

### User Story 5 - Favorites and point engagement (Priority: P3)

A **signed-in** user **saves other users' points to favorites (and their own if needed)**, can **create folders under favorites** and place saved points in them, and opens a **detail area (page or sidebar)** for a point where they can add a **comment** and/or a **rating from 1 to 5**; ratings are aggregated (e.g. average) for display per product rules. An **unsigned** user can open a **read-only** detail for a **public** point (see FR-012): **title**, **description**, **photo**, and the **aggregate** rating, but **not** the comment list or actions that change state; **favorites**, **commenting**, and **submitting a personal rating** require sign-in.

**Why this priority**: Increases engagement after basic map and point flows; follows naturally from creation and shared viewing.

**Independent Test**: As guest: open detail from the "latest five" and confirm read-only content and no comments/favorites. Signed-in: add/remove favorites; create a favorite folder and move items into it; in detail, add a comment and rating; confirm one user cannot have two simultaneously active ratings for the same point without an explicit "change rating" path—one current rating per user per point, changeable.

**Acceptance Scenarios**:

1. **Given** a point the user is allowed to see, **When** they add it to favorites, **Then** it appears in their favorites list/set.
2. **Given** a user has a folder under favorites, **When** they place saved points in it, **Then** the structure is persisted and available on a later visit.
3. **Given** a user is viewing a point's detail, **When** they post a comment, **Then** the comment appears in the detail thread (per moderation rules if any).
4. **Given** a user rates a point, **When** they save a 1–5 score, **Then** it affects the displayed score summary and can be **changed** by the same user later.
5. **Given** a user **is not signed in**, **When** they open a **public** point's detail from a surface allowed to guests, **Then** they see **title**, **description** (if any), **photo** (if any), and the **aggregate** rating, and they **do not** see the **comment** thread; actions for favorites, new comments, and new ratings are unavailable until sign-in.
6. **Given** a user not signed in, **When** they try to use favorites, comment, or submit a **personal** rating, **Then** the product enforces sign-in (redirect or message).

### Edge Cases

- Coordinates **outside the valid range** (e.g. impossible values)—save is rejected with a clear error.
- **Multiple points** at the same location (or very close)—the map/detail flow **must not** lose the ability to open each point (cluster, list, offset—planning choice; interaction must not vanish).
- The "latest five" points for a **guest** are **far apart** geographically—the map **must still** show all five markers; **framing** may zoom out to a **regional** or **world** view (per plan) so no marker is dropped.
- **Empty** folder selection or a folder with **no** points—predictable empty state, map remains valid.
- **Password change**, **unlinking** Google, and **one email / two providers**—consistent messages; no duplicate accounts without an explicit link step (details in the plan).
- A user with **unverified** email (if the product even tracks verification) in the first release: **write** features remain **available** per FR-013 unless the plan adds a **separate** optional nudge, not a hard block.
- **Photo** file too large or wrong format—rejection with a **clear** reason (limits in plan/assumptions).
- User attempts to attach a **second** image to a point in v1—the system prevents more than one current image per point (per FR-004); replacing the existing image is allowed.
- A user **leaves** a private category: content created in the group follows the **rules** captured in the plan (visibility retention / transfer—see assumptions).
- A user belongs to **two** private groups: **map** and **lists** of **group** **folders** **reflect** only the **active** group’s **private** **slice** until they **switch**; **stale** **UI** (showing the wrong group’s label) is **unacceptable** for **acceptance**.
- **Unsigned** user opens a **valid** public detail—**comment** and **favorites** areas show a clear path to **sign in** (not a blank or broken state).
- User **selects** a point that is **near the edge** of the current view—map still **centers** it with neighborhood zoom (per FR-015).
- User **deselects** while the visible point set is **empty**—map behavior stays consistent with empty‑state rules; no broken or stuck zoom.
- **Context change** (e.g. sign‑in, folder switch, active private group switch) while a point was selected: the product applies **default** framing for the **new** context; if the selected point is **no longer** in the visible set, selection is **cleared** and FR-016 applies to the new set.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST show an **interactive world map** on the main screen with **zooming** and **panning**.
- **FR-002**: The system MUST show the **five most recently created** points on the main screen (per global visibility rules), **excluding** private group content that should not appear in the public list; if fewer are available, show **at most** five and **not** surface hidden data.
- **FR-003**: The system MUST provide **registration and sign-in** (dedicated flow/screen/modal) with **email+password** and **Google sign-in**; additional providers are **out of scope** for this spec but must not break the current contract.
- **FR-004**: The system MUST **create a point** from a **map click** (coordinates = click location) with a **required** title, **optional** description, and **at most one** optional **photo** per point in the first release. A point MUST **not** have more than **one** image attached at a time; the user **may** **replace** that image. **Multi-photo galleries** are **out of scope** for the first release. **File** size and format rules are set in the plan.
- **FR-005**: The system MUST let users **organize** their points into **folders** (at most one such organizing folder per point unless the plan says otherwise) and **tags** (many tags per one point if the plan does not restrict).
- **FR-006**: The system MUST, **when a user selects a folder**, **highlight or show on the map** all **points in that folder** the selection applies to (the user's public/private cases; for **group-only** folders, **within** the **active** private **group** **context** per FR-014 where relevant).
- **FR-007**: The system MUST show **signed-in** users each **other’s public** points, and any **group-only** or **other** points the viewer is **permitted** to see according to the **active private group** control (see FR-014). **Group-only** content MUST **not** be shown to **non-members** of that group.
- **FR-008**: The system MUST support **user categories (private groups)** whose **members** can create points and folders **not visible** outside the group. **Non-members** MUST **not** see that **member-only** content.
- **FR-009**: The system MUST provide **favorites**: add/remove **others'** (and **one's own** as needed) points; create **folders under favorites** and arrange favorites into them.
- **FR-010**: The system MUST provide a **detail view** (page/sidebar) for points. For **signed-in** users, it MUST show the **comment** thread, **1–5 personal** rating **entry** (with **one current** rating **per** user **per** point, **changeable**), and **favorites** actions where applicable. An **average** (or agreed aggregate) of ratings MUST be **shown** to **any** viewer who is allowed to open the point's detail, including where **read-only** access applies per FR-012.
- **FR-011**: For **unsigned** users on the main screen, the system MUST show **only** map markers for the **five** points in the "latest five" set (no other public markers). The map presentation MUST keep the guest's attention on the **geographic area** where those points are shown (e.g. framing, fit-to-bounds, or equivalent), while preserving **zoom and pan** per FR-001; if the five are very far apart, the system MAY use a **wider** world-level view so that all five remain visible, as detailed in the plan.
- **FR-012**: For **unsigned** users, the system MUST support **read-only** opening of a **public** point from guest-allowed entry points (e.g. a marker in the "latest five" set). The detail MUST include **title**, **description** (if any), **photo** (if any), and the **displayed aggregate** rating. It MUST **not** expose the **comment** list or **favorites** controls to guests, and **must not** allow **entering** a **comment** or **personal** rating without sign-in. **Private** or **group-restricted** content MUST follow FR-007/FR-008 and not be **surfaced** to guests in violation of those rules.
- **FR-013**: For the **first** product release, the system MUST **not** require **email ownership verification** (e.g. a confirmation link) as a **mandatory** step before the user can **create points**, use **favorites**, **comment**, **rate**, or other **signed-in** behaviors in this spec. The implementation plan may still include **optional** verification, re-send flows, or **later** stricter policy for **abuse** prevention.
- **FR-014**: A user **MAY** belong to **more than one** private group. The system MUST provide a clear **active private group** control (e.g. a **switcher**). For map and folder views that include **member-only** data, the system MUST treat only the **active** group’s private points and folders (among groups the user belongs to) as in scope, together with the **applicable** public points as defined in the plan. **Other** private groups’ **member-only** content MUST **not** appear in that view until the user selects that group as **active**. A **"public only"** (or **no** private overlay) mode MAY be specified in the plan; it MUST remain consistent with FR-007 and FR-008.
- **FR-015**: When the user **selects** a point (marker, list row, or other deliberate **selection** that makes that point **active** on the map), the system MUST **center** the map on that point’s coordinates and set zoom so the visible extent shows approximately **three to four city blocks** (or **equivalent** local street context where a regular street grid does not apply)—a **neighborhood‑scale** view, not a city‑wide or world view. This MUST apply in every map context where point selection is offered (guest, signed‑in, folder, etc.), unless the implementation plan documents a **narrow** exception (e.g. impossible projection); there MUST be **no** case where selection leaves the point **off‑screen** without user panning.
- **FR-016**: When the user **clears** point selection (closes detail, taps outside, explicit **deselect**, or equivalent), the system MUST restore the map to the **default** **position and zoom** for the **current** map context and **currently visible** points: the same framing rules as **before** that selection for that context (e.g. **FR-011** for unsigned **latest five**, fit‑to‑markers for signed‑in public layer, fit for **folder** contents, etc.). If **no** points are visible, the map MUST remain usable and match the agreed **empty** default for that screen.

### Key Entities

- **User**: account, sign-in method (email, Google), membership in **zero or more** private **groups**, current **active private group** (if any) for map/folder **context** (see FR-014), display name/label.
- **Point (place)**: coordinates, title, optional description, **at most one** optional **photo** (first release), author, **visibility** (to all allowed users / group-only), **folder** link (if any), **tags** (if any), timestamps for "latest" ordering.
- **Folder (personal organization)**: owned by a user, groups **their** points (including public; private-group rules apply where relevant).
- **Favorite folder**: organization inside **favorites** for **saved** **others'/own** points.
- **Tag**: user-defined (or global—per plan) label; many-to-many with **points** if the plan does not restrict.
- **Comment**: text (and metadata, e.g. time), **linked** to a **point** and **author**; edit/delete rules **in** the plan.
- **Rating**: integer **1–5**; **one current** per **(user, point)**, with a **displayed** **average** (or other aggregate).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A new participant in the acceptance test completes registration (email and password) or first-time Google sign-in and can place their first point within **three minutes** of session start on a normal network (per an agreed test script).
- **SC-002**: In a short scenario test, at least **90%** of participants create a point and find it on the map on the **first** try (using a pre-defined task).
- **SC-003**: In every private-group-related acceptance case, users **outside** the group do not see other users' private content, and **members** do per the rules (verified by a checklist).
- **SC-004**: The main-screen map remains usable for zoom and pan with **zero** and with **hundreds** of test markers, without a case where a specific test point cannot be opened (per an agreed pattern such as list/cluster).
- **SC-005**: Average satisfaction with favorites and favorite folders is **at least 4/5** in a survey at the end of the first release acceptance cycle (sample size set in advance).
- **SC-006**: In scripted map tasks, **at least 85%** of participants **on first try** report that the map **clearly** shows the **selected** point’s **immediate surroundings** (neighborhood context) **without** needing to zoom or pan further after selection; after **deselect**, **at least 90%** recognize that the map returned to a **sensible overview** of **all** points currently in scope (per agreed test script).

## Assumptions

- The main screen is available without sign-in to view the map and the five latest points; **guests** see **only** those five as map markers, not the entire public catalog. Creating points and social features require sign-in unless otherwise agreed.
- After sign-in, the main map experience includes **all** other users' **public** points (per FR-007), not only five—unless a future screen variant narrows the view.
- "Latest five" is based on publicly counted points; private group content does not enter the public top-five by default.
- Folders for "own" points are logical grouping; in the first delivery a point is in at most one such folder (multiple membership—only if the plan adds it).
- **How** users are assigned to a private category (admin, invite, request) is defined in the implementation plan and access policy, without narrowing this spec.
- **Multiple** private **groups** per user use an **active** **group** **switcher**; **only** the **active** group’s **member-only** **map/folder** **content** is **combined** with the **agreed** **public** **behavior**; **other** **joined** **groups**’ **private** **layers** are **off** **until** **selected** (per FR-014 and the plan).
- Comments form a chronological thread; "one comment per user" is not required unless the plan adds moderation or similar—details in the plan.
- Titles and descriptions follow normal civility rules; **at most one** photo per point in v1; **multi-photo** support is deferred unless a **later** spec revision adds it. **Photo** file limits (size, format) are in the plan.
- Point **detail** for **guests** is **read-only** for core fields and the **aggregate** rating; **full** **social** (comments, own rating, favorites) is **signed-in** only (per FR-010, FR-012).
- **Email** **verification** (inbox link) is **not** a **required** **gate** for **MVP** features in this spec; **anti-abuse** may rely on other controls in the plan (per FR-013).
- **“Three to four city blocks”** is a **product‑level** neighborhood scale; exact numeric scale may be refined in the plan for different latitudes and map styles, but the user‑visible outcome is **street‑level context** around the point (not building‑floor indoor scale, not metropolitan overview).
- **Default** map position and zoom after deselect **match** the framing the product would use when opening the **same** screen with the **same** visible points and **no** point selected (FR-016); transient manual pans before select **need not** be restored—only the **product default** for the current data.
