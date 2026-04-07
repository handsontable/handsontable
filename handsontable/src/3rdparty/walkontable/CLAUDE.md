# Walkontable Rendering Engine

Self-contained rendering engine for viewport calculation, DOM rendering, scroll synchronization, and the overlay system.

## Architecture Boundary

- Walkontable lives in `src/3rdparty/walkontable/src/`
- The bridge to core Handsontable is `src/tableView.js` (TableView class)
- Plugins must NEVER access Walkontable internals directly - always go through TableView
- Do not import core Handsontable modules from Walkontable code

## Key Subsystems

- **Overlay system** (6 types): Frozen rows/columns and scroll sync. Fragile - proceed with caution.
- **Viewport calculation**: Determines visible rows/columns based on scroll position
- **Renderer**: DOM element management, cell reuse
- **Scroll handling**: requestAnimationFrame batching required

## Known Tech Debt

- DAO layer uses Data Access Objects instead of DI (20+ TODO comments)
- Filter objects are recreated instead of updated
- See `.ai/CONCERNS.md` for full list

## Performance

- Batch scroll events with requestAnimationFrame
- Never `arr.push(...largeArray)` with 10k+ elements
- Reuse DOM elements, minimize layout thrashing

## Testing

Separate test runner - do NOT mix with main E2E tests:
`pnpm --filter handsontable run test:walkontable`

Tests in: `src/3rdparty/walkontable/test/`

For detailed guidance: use skills `walkontable-dev`, `walkontable-testing`
