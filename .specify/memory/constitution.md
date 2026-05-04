<!--
  Sync Impact Report
  - Version change: 1.0.0 → 1.0.1 (PATCH: Technology & Stack — Express 5 + Prisma ORM 7)
  - Modified principles: N/A
  - Templates: .specify/templates/* — N/A
  - Follow-up: plans/tasks should reference prisma.config + adapter
-->
# React Express Map Pins Constitution

## Core Principles

### I. Full-Stack Boundaries

The user interface is implemented in **React**; HTTP APIs and server-side behavior run on **Node.js** with **Express**. Domain rules that affect data correctness MUST live in one authoritative layer (typically the server) unless a documented exception explains safe duplication. Cross-origin, environment, and build-time configuration MUST be explicit for development versus production. Rationale: clear boundaries keep map and pin state consistent and simplify debugging.

### II. Geospatial and Data Integrity

**Pin and location data** (coordinates, optional metadata) MUST be validated at system boundaries. Invalid or out-of-range inputs MUST be rejected with clear errors; the project MUST not silently corrupt or round coordinates in ways that change meaning without documentation. Rationale: map applications depend on trustworthy geography; bugs here are high-impact for users and downstream systems.

### III. Testable Delivery

**Automated tests** are mandatory for the Express API that exposes pin and map-related behavior: new or changed routes and domain logic require tests that fail first when behavior is wrong. The React client MUST have a testing strategy in each plan (unit and/or component tests, and targeted end-to-end tests when critical paths warrant them). Rationale: regressions in CRUD, validation, and map integration are too costly to catch only by hand.

### IV. API Contracts and Stability

The HTTP API is contract-first: request and response shapes for public endpoints are captured under `specs/.../contracts/` (or equivalent) as the feature plan defines. **Breaking** changes to JSON fields, status codes, or URL paths require a version bump, client migration notes, and explicit tracking in the implementation plan. Rationale: decoupled React and Express teams (or future clients) need predictable integration points.

### V. Operability and Simplicity

The server MUST use **structured, readable logging** for errors and important lifecycle events. User-visible failures on the client MUST be explainable in plain language where feasible. Unnecessary complexity (extra services, abstractions, or dependencies) requires justification in the plan’s **Complexity Tracking** section. Rationale: map apps generate varied runtime conditions; operability and YAGNI keep the system maintainable.

## Technology & Stack

- **Client**: React (TypeScript when the project adopts it; align with `plan.md` Technical Context).
- **Server**: Node.js, **Express 5**, documented REST/JSON API; persistence via **Prisma ORM 7** as defined in the active feature `plan.md`.
- **Maps**: The concrete map library or provider (e.g., Leaflet, Mapbox) is selected per feature plan and recorded in `plan.md`; geospatial behavior MUST follow Principle II.
- **Persistence**: Databases, files, or external stores are specified per plan; no implicit global state for pins across deployments.

## Development Workflow

- Features use the **Spec Kit** pipeline: **specify** → **plan** → **tasks** → **implement**, with `specs/[###-feature-name]/` as the source of truth for scope.
- **Constitution Check** in `plan.md` (before Phase 0 and after Phase 1) MUST be satisfied or violations documented in **Complexity Tracking** with a simpler alternative and rationale.
- Work proceeds on **feature branches**; commits SHOULD be small and message conventional enough for reviewers to follow history (see project Git conventions when documented in `README.md`).

## Governance

This constitution supersedes ad-hoc practices for this repository when they conflict. **Amendments** MUST update `.specify/memory/constitution.md`, bump **CONSTITUTION_VERSION** per semantic versioning (MAJOR: incompatible governance or removed principles; MINOR: new principle or material new guidance; PATCH: clarifications and non-semantic edits), and set **Last Amended** to the ISO date of the change. **Ratification** date records original adoption. Pull requests and design reviews SHOULD verify that plans and major changes align with the Core Principles; recurring violations trigger a governance review. Day-to-day development may also reference `.cursor/rules/specify-rules.mdc` and the active feature `plan.md` for context.

**Version**: 1.0.1 | **Ratified**: 2026-04-22 | **Last Amended**: 2026-04-23
