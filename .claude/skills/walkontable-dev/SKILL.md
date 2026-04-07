---
name: walkontable-dev
description: Use when modifying the Walkontable rendering engine in src/3rdparty/walkontable/ - overlay system, viewport calculations, scroll handling, DOM management, or the TableView bridge between core Handsontable and Walkontable
---

# Walkontable Development Guide

## What is Walkontable

Walkontable is the low-level rendering engine embedded in Handsontable. It handles viewport calculation, DOM rendering, scroll synchronization, and the overlay system. It is labeled "3rd party" for historical reasons but is maintained in the same repository as the rest of Handsontable.

## Architecture boundary

Walkontable source lives entirely within `src/3rdparty/walkontable/src/`. The bridge between core Handsontable and Walkontable is the `TableView` class in `src/tableView.js`. Plugins must never access Walkontable internals directly - always go through TableView.

## Key subsystems

- **Overlay system** (6 types): Manages frozen rows and columns and their scroll synchronization. This subsystem is fragile and well-documented in `.ai/CONCERNS.md`. Proceed with extreme caution when modifying overlay positioning or synchronization logic.
- **Viewport calculation**: Determines which rows and columns are visible based on scroll position and container size.
- **Renderer**: DOM element management, row and column painting, cell element reuse.
- **Scroll handling**: Coordinates scroll between overlays and the main table. Uses `requestAnimationFrame` batching.

## Known technical debt

These issues are documented in `.ai/CONCERNS.md`:

- **DAO layer**: Uses Data Access Objects instead of dependency injection. Over 20 TODO comments exist around this pattern. The DAO layer is not unit tested.
- **Filter object recreation**: Walkontable filter objects are recreated on every render pass instead of being updated in place. This is a known performance concern.
- **Overlay complexity**: 6 overlay types with complex positioning logic. Changes here frequently cause regressions in frozen row/column scenarios.

## Performance rules

- Batch scroll events with `requestAnimationFrame`.
- Never use `arr.push(...largeArray)` with 10k+ elements - use a `forEach` loop instead.
- Reuse DOM elements instead of creating new ones.
- Minimize layout thrashing by batching DOM reads before DOM writes.

## Testing

Walkontable has its own dedicated test runner. Do NOT mix Walkontable tests with the main E2E test pipeline.

- **Run tests**: `npm run test:walkontable --prefix handsontable`
- **Test location**: `src/3rdparty/walkontable/test/`
- Always test with frozen rows and columns enabled to cover overlay edge cases.

## Key source files

| Path | Purpose |
|---|---|
| `src/3rdparty/walkontable/src/` | All Walkontable source code |
| `src/tableView.js` | Bridge to core Handsontable (the safe boundary for plugins) |
| `src/3rdparty/walkontable/src/overlay/` | Overlay system |
| `src/3rdparty/walkontable/src/renderer/` | DOM rendering |

## DOM abstraction rule

**No code in `handsontable/src/` (plugins, core, etc.) should manipulate Walkontable DOM elements directly.** Go through TableView or the public Core API.

Even within Walkontable itself, prefer wrapping DOM logic in abstract modules rather than manipulating elements inline. Direct DOM manipulation makes the code hard to change and maintain. The goal is to keep DOM access behind well-defined abstractions so the rendering strategy can evolve independently.

## Common mistakes

- Accessing or modifying Walkontable DOM elements from plugins or core code instead of going through TableView.
- Manipulating DOM directly inside Walkontable instead of wrapping it in an abstraction module.
- Running Walkontable tests through the main E2E pipeline instead of the dedicated runner.
- Not testing with frozen rows and columns, which misses overlay edge cases.
- Forgetting `requestAnimationFrame` for scroll-related changes, causing layout thrashing.

For deeper context, see `.ai/ARCHITECTURE.md` (Walkontable section) and `.ai/CONCERNS.md` (DAO layer, overlay fragility).
