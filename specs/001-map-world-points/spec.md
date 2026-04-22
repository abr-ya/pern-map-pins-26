# Feature Specification: Points on the Map

**Feature Branch**: `001-map-world-points`  
**Created**: 2026-04-22  
**Status**: Draft  
**Input**: User description: "We are building a 'Points on the map' app. Main screen: world map with zoom and pan, showing the map and the five most recently created points. Registration/login via a screen or modal: email and password, Google sign-in; more providers may come later. For signed-in users: add points (click → coordinates, title, optional description and photo), folders for the user's own points, tags, everyone can see one another's points, a user category that can create points and folders visible only to them, favorites with folders, a point detail (page or sidebar) with comments and a 1–5 rating, and when a folder is selected, show that folder's points on the map."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Map and five latest points (Priority: P1)

A visitor opens the main screen and sees a world map: they can zoom, zoom out, and pan. The screen also shows the **five most recently created** points (newest first among globally displayable points). If there are no applicable points, the "latest five" area shows an empty or explanatory state, while the map remains fully interactive.

**Why this priority**: Without a map and basic browsing there is no product value; this is the minimum showcase.

**Independent Test**: Without signing in, verify that zoom and pan work; the five slots update per the "latest" rules when new public points appear; with zero points, empty-state behavior is as expected.

**Acceptance Scenarios**:

1. **Given** a user is on the main screen, **When** they zoom and pan the map, **Then** the map responds to gestures/controls without failure.
2. **Given** there are at least five publicly visible points in the system, **When** a user views the main screen, **Then** exactly five most recently created points are shown (per visibility rules).
3. **Given** there are no points to display, **When** a user views the main screen, **Then** the "latest five" block does not mislead the user and does not break the map.

---

### User Story 2 - Registration and sign-in (Priority: P1)

A user can **register and sign in with email and password** and **sign in with Google**; the same patterns apply to returning users. A dedicated flow (screen or modal) is available without breaking the main map use case.

**Why this priority**: All personal features require an account.

**Independent Test**: Create accounts (email and Google) and sign in/out; invalid credentials are rejected with clear feedback; after successful sign-in, the user sees that the session is active (e.g. name shown, actions that required sign-in become available).

**Acceptance Scenarios**:

1. **Given** a new user, **When** they register with a valid email and password, **Then** an account is created and they can sign in.
2. **Given** an existing user, **When** they sign in with email/password or Google, **Then** a session is established for the chosen method.
3. **Given** a user with a wrong password or non-existent email, **When** they try to sign in, **Then** they receive a message that does not leak unnecessary security details.

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

All **signed-in** users **see one another's points**, except for points protected by a **private group** mode. There is a **user category** (role/group) whose members can create **points and folders visible only to members of that category**; users outside the category do not have access to that content (and the public "latest five" on the main screen follows public-list rules and does not reveal private group content inappropriately).

**Why this priority**: The social layer and the split between public and group content differentiates the product from "only my markers."

**Independent Test**: Two public users see each other's public points; a private group member creates private points/folders—another member sees them, a non-member does not; the public "latest five" respects visibility rules.

**Acceptance Scenarios**:

1. **Given** two signed-in users with public points, **When** each opens the map, **Then** they see each other's public points (per display rules).
2. **Given** a user in a **private category** creates private points/folders, **When** another member of the same category views the map, **Then** they see that content.
3. **Given** the same private content, **When** a user **outside** the category looks, **Then** private points and folders are not revealed to them.

---

### User Story 5 - Favorites and point engagement (Priority: P3)

A user **saves other users' points to favorites (and their own if needed)**, can **create folders under favorites** and place saved points in them, and opens a **detail area (page or sidebar)** for a point where they can add a **comment** and/or a **rating from 1 to 5**; ratings are aggregated (e.g. average) for display per product rules.

**Why this priority**: Increases engagement after basic map and point flows; follows naturally from creation and shared viewing.

**Independent Test**: Add/remove favorites; create a favorite folder and move items into it; in detail, add a comment and rating; confirm one user cannot have two simultaneously active ratings for the same point without an explicit "change rating" path—one current rating per user per point, changeable.

**Acceptance Scenarios**:

1. **Given** a point the user is allowed to see, **When** they add it to favorites, **Then** it appears in their favorites list/set.
2. **Given** a user has a folder under favorites, **When** they place saved points in it, **Then** the structure is persisted and available on a later visit.
3. **Given** a user is viewing a point's detail, **When** they post a comment, **Then** the comment appears in the detail thread (per moderation rules if any).
4. **Given** a user rates a point, **When** they save a 1–5 score, **Then** it affects the displayed score summary and can be **changed** by the same user later.
5. **Given** a user not signed in, **When** they try to comment or rate, **Then** the product enforces sign-in (redirect or message).

### Edge Cases

- Coordinates **outside the valid range** (e.g. impossible values)—save is rejected with a clear error.
- **Multiple points** at the same location (or very close)—the map/detail flow **must not** lose the ability to open each point (cluster, list, offset—planning choice; interaction must not vanish).
- **Empty** folder selection or a folder with **no** points—predictable empty state, map remains valid.
- **Password change**, **unlinking** Google, and **one email / two providers**—consistent messages; no duplicate accounts without an explicit link step (details in the plan).
- **Photo** file too large or wrong format—rejection with a **clear** reason (limits in plan/assumptions).
- A user **leaves** a private category: content created in the group follows the **rules** captured in the plan (visibility retention / transfer—see assumptions).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST show an **interactive world map** on the main screen with **zooming** and **panning**.
- **FR-002**: The system MUST show the **five most recently created** points on the main screen (per global visibility rules), **excluding** private group content that should not appear in the public list; if fewer are available, show **at most** five and **not** surface hidden data.
- **FR-003**: The system MUST provide **registration and sign-in** (dedicated flow/screen/modal) with **email+password** and **Google sign-in**; additional providers are **out of scope** for this spec but must not break the current contract.
- **FR-004**: The system MUST **create a point** from a **map click** (coordinates = click location) with a **required** title and **optional** description and **photo** (if attachments are allowed in the plan).
- **FR-005**: The system MUST let users **organize** their points into **folders** (at most one such organizing folder per point unless the plan says otherwise) and **tags** (many tags per one point if the plan does not restrict).
- **FR-006**: The system MUST, **when a user selects a folder**, **highlight or show on the map** all **points in that folder** the selection applies to (the user's public/private cases; for private, within the group role as defined).
- **FR-007**: The system MUST show **signed-in** users each **other's points**, **except** points with **restricted visibility** (private groups).
- **FR-008**: The system MUST support a **user category (group)** whose members can create points and folders **not visible** outside the group.
- **FR-009**: The system MUST provide **favorites**: add/remove **others'** (and **one's own** as needed) points; create **folders under favorites** and arrange favorites into them.
- **FR-010**: The system MUST provide a **detail view** (page/sidebar) with **comments** for **signed-in** users and a **1–5 rating** with **one current** rating **per** user **per** point and the ability to **change** it; an **average** (or agreed aggregate) is **shown** to **readers**.

### Key Entities

- **User**: account, sign-in method (email, Google), membership in a **private category** (none, one, or more—per plan), display name/label.
- **Point (place)**: coordinates, title, optional description, optional photo, author, **visibility** (to all allowed users / group-only), **folder** link (if any), **tags** (if any), timestamps for "latest" ordering.
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

## Assumptions

- The main screen is available without sign-in to view the map and the five latest points; creating points and social features require sign-in unless otherwise agreed.
- "Latest five" is based on publicly counted points; private group content does not enter the public top-five by default.
- Folders for "own" points are logical grouping; in the first delivery a point is in at most one such folder (multiple membership—only if the plan adds it).
- **How** users are assigned to a private category (admin, invite, request) is defined in the implementation plan and access policy, without narrowing this spec.
- Comments form a chronological thread; "one comment per user" is not required unless the plan adds moderation or similar—details in the plan.
- Titles and descriptions follow normal civility rules; photo limits (size, format) are in the plan.
