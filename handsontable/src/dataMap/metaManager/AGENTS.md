# Metadata management — landmines

This directory holds `MetaManager` and the meta layers that resolve the effective configuration of the grid, every column, and every cell through a prototype-chain cascade. Full reference: `handsontable/.ai/META-MANAGEMENT.md`.

- **Cell meta is keyed by PHYSICAL index — it survives moves and sorts.** `CellMeta` stores objects in physical-row by physical-column `LazyFactoryMap`s. The meta follows the data, not the screen position. Every `MetaManager` method takes physical coordinates (see the class JSDoc). Never store or look up cell meta by visual index.
- **Two `getCellMeta` methods exist — do not conflate them.** `MetaManager.getCellMeta(physicalRow, physicalColumn, { visualRow, visualColumn })` takes physical plus an options bag. `Core`'s `hot.getCellMeta(visualRow, visualColumn)` takes visual and converts to physical (`toPhysicalRow`/`toPhysicalColumn`) before calling the `MetaManager` one. This doc covers the `MetaManager` API.
- **Read defaults from, and add new options to, `metaSchema.ts`.** It is the single declaration point — every built-in option with its default and Typedoc. An option missing here has no default. **Never change an existing default — that is a forbidden breaking change.**
- **Respect the cascade: cell → column → global.** The cascade is a prototype chain. A cell meta object's prototype is its column meta object, whose prototype is the global meta object (schema defaults plus instance settings). `TableMeta` is a sibling snapshot (`getSettings()`), NOT a cascade link — instance settings reach cells through GlobalMeta. The `cells` function layers on the cell, `columns` on the column.
- **Dynamic meta recomputes per render, not per call — keep `cells`/`columns` cheap.** `DynamicCellMetaMod` memoizes through `metaSyncMemo`, cleared on `beforeRender` with `forceFullRender`. The `cells` function and `before`/`afterGetCellMeta` hooks run once per cell per full render cycle. Heavy work there scales with the visible grid.
- **Persist with `setCellMeta`/`updateCellMeta`; do not mutate a returned meta object directly.** `setCellMeta` updates the `_automaticallyAssignedMetaProps` bookkeeping. Direct mutation bypasses it, so the value can be overwritten by `type` expansion or the `cells` function on the next render.

Pointers:
- Deep reference: `handsontable/.ai/META-MANAGEMENT.md`
- `handsontable/.ai/ARCHITECTURE.md` — "Metadata Layer (MetaManager)"
