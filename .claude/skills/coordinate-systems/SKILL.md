---
name: coordinate-systems
description: Use when working with row or column indexes in Handsontable - translating between physical, visual, and renderable coordinates, using IndexMapper, or debugging index-related bugs where rows or columns appear in wrong positions
---

# Coordinate systems

| System | What it represents | Key behavior |
|---|---|---|
| **Physical** | Position in the source data array (0 to N) | Never changes under filtering, sorting, trimming, hiding, or moving. |
| **Visual** | Position after Handsontable's processing | Changes when data is filtered, sorted, trimmed, or moved. **Hidden columns/rows keep their visual indexes.** |
| **Renderable** | Position in the DOM | Matters for Walkontable; almost absent from the public API. |

The public API mainly uses visual indexes, sometimes physical. Walkontable receives data already filtered, sorted, and trimmed and renders it 0 to N; it also uses "source index" and "render index" internally for virtualization.

## HidingMap vs TrimmingMap

- **HidingMap** (`HiddenColumns`, `HiddenRows`): the index stays in visual space but is not rendered. `getDataAtCell()` still works with visual coordinates.
- **TrimmingMap** (`TrimRows`, `Filters`): the index is removed from visual space entirely.

## IndexMapper API

Access via `hot.rowIndexMapper` or `hot.columnIndexMapper`:

```js
mapper.getPhysicalFromVisualIndex(visualIndex)
mapper.getVisualFromPhysicalIndex(physicalIndex)
mapper.getPhysicalFromRenderableIndex(renderableIndex)
mapper.getRenderableFromVisualIndex(visualIndex)

mapper.createAndRegisterIndexMap(name, type, initialValue)
// type: 'hiding' | 'trimming'
```

## Which coordinate to use

| You are doing | Use |
|---|---|
| Reading or writing source data | **Physical** |
| User-facing positions, selection, `getDataAtCol()` | **Visual** |
| DOM nodes, cell elements, Walkontable APIs | **Renderable** |
| Persistent state (sorting order, filter conditions) | **Physical** |

## Gotcha: Filters + ManualColumnMove

The Filters plugin's `conditionCollection` and `conditionUpdateObserver` use **physical** indexes, while `getDataAtCol()` takes **visual** indexes. With `manualColumnMove` active the two orders diverge: convert with `getVisualFromPhysicalIndex()` / `getPhysicalFromVisualIndex()` before crossing the boundary.

## Plugin reference

| Plugin | Map type | Coordinate it manages |
|---|---|---|
| `HiddenColumns` / `HiddenRows` | HidingMap | Visual to renderable |
| `TrimRows` / `Filters` | TrimmingMap | Physical to visual |
| `ManualColumnMove` / `ColumnSorting` | IndexesSequence | Physical to visual |

## Source files

`src/translations/`: `indexMapper.ts`, `maps/`, `mapCollections/`. Subsystem reference (map types, translation methods, cache, observers, registration lifecycle): `handsontable/.ai/INDEX-MAPPING.md`; system context: `handsontable/.ai/ARCHITECTURE.md`.
