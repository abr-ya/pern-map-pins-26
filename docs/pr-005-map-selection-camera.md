# PR: Map camera on point select / deselect (`005-map-selection-camera`)

**Branch**: `005-map-selection-camera`  
**Suggested PR title**: `feat(map): neighborhood zoom on pin select and restore overview (FR-015/FR-016)`

---

## Summary

Implements **FR-015** and **FR-016** from **[`specs/001-map-world-points/spec.md`](../specs/001-map-world-points/spec.md)** (amendment 2026-05-12): when the user **selects** a point (marker or list), the map **flies** to a **neighborhood-scale** view (~zoom **16**, tunable in **`mapBounds.ts`**) centered on that pin; when selection is **cleared** (Back, map background click for guests, or map click while signed in before “create point”), the map **restores** the same **overview** framing as for the current context (guest latest-five fit, signed-in **explore** pins currently in memory, or **folder** pins).

Spec, plan, research §8, and the requirements checklist were updated in **`specs/001-map-world-points/`** so planning artifacts stay aligned with product wording.

---

## What ships

| Area | Change |
|------|--------|
| **`mapBounds.ts`** (new) | Shared **`applyPointsBounds`** (world / single / `fitBounds` multi) and **`flyToNeighborhood`** (`NEIGHBORHOOD_ZOOM`, fly duration). |
| **`useGuestMapBounds.ts`** | Optional **`enabled`** flag so autofit does not fight the selection camera while guest detail is open. |
| **`GuestMapLayer.tsx`** | **`selectedPointId`**, **`onClearSelection`**; suspend autofit when detail open; **`GuestSelectionCamera`**; map click clears selection when a point is selected. |
| **`SignedInSelectionCamera.tsx`** (new) | Signed-in: fly to selected pin; on deselect, **`applyPointsBounds`** over **`explorePoints`** or **`myPoints`** depending on folder filter. |
| **`MapPage.tsx`** | Wires guest props; **`SignedInMapClick`** — if detail is open, first map click **closes detail** (no accidental “create point” on the same gesture); otherwise unchanged create-on-click when the create modal is closed. |
| **Specs** | **`spec.md`** (FR-015/016, scenarios, SC-006), **`plan.md`** (map camera table + notes), **`research.md`** (§8), **`checklists/requirements.md`** (validation note). |

---

## How to verify locally

From repo root (env per **[`specs/001-map-world-points/quickstart.md`](../specs/001-map-world-points/quickstart.md)**):

1. **Guest**: open main map → pick a point from the list or marker → map should **center and zoom in**; **Back** or **click empty map** → map returns to **latest-five** framing (or world if empty).
2. **Signed in**: open a point from markers or list → same **neighborhood** behavior; **Back** or **click map** (with create modal **not** open) → **overview** over pins in view (explore) or folder pins (folder filter on).
3. **Signed in + create flow**: with **no** point detail open, map click still opens **create point** as before.

**Tests** (run locally; agents skip full Vitest in this workspace):

- `pnpm --filter frontend exec tsc --noEmit`
- `pnpm --filter frontend exec vitest run src/features/map/GuestMapLayer.test.tsx` (and any new tests if added later)

---

## Spec / docs pointers

| Artifact | Purpose |
|----------|---------|
| [`specs/001-map-world-points/spec.md`](../specs/001-map-world-points/spec.md) | **FR-015**, **FR-016**, acceptance scenarios 5–6 |
| [`specs/001-map-world-points/plan.md`](../specs/001-map-world-points/plan.md) | Map camera implementation table |
| [`specs/001-map-world-points/research.md`](../specs/001-map-world-points/research.md) | **§8** — Leaflet / zoom defaults |
| [`specs/001-map-world-points/checklists/requirements.md`](../specs/001-map-world-points/checklists/requirements.md) | Spec quality checklist |

---

## Checklist for reviewers

- [ ] Guest: selection **does not** leave the pin off-screen; deselect matches **unselected** guest bounds behavior.
- [ ] Signed-in **explore**: after deselect, overview uses **current** `explorePoints` (viewport query result), not a silent world jump unless the set is empty (per plan).
- [ ] Signed-in **folder**: after deselect, **`fitBounds`** (or single/world) matches the folder’s point list.
- [ ] Map click with **detail open** does **not** open the create form on the same click; without detail, create-on-click still works when the create modal is closed.
- [ ] No new backend routes or DB migrations — **client-only** map behavior.

---

## Copy-paste for GitHub

Use the suggested title; paste **Summary** through **Checklist**, or link to this file: `docs/pr-005-map-selection-camera.md`.
