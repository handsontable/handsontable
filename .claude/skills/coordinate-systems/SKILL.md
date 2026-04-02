---
name: coordinate-systems
description: Use when working with row or column indexes in Handsontable - translating between physical, visual, and renderable coordinates, using IndexMapper, or debugging index-related bugs where rows or columns appear in wrong positions
---

# Coordinate Systems

Handsontable uses three coordinate systems because the position of a row or column can differ depending on whether you are looking at the raw data, the logical grid after filtering/trimming, or the actual DOM. Mixing them up is one of the most common sources of bugs.

## The three systems

| System | What it represents | Changes when | Example |
|---|---|---|---|
| **Physical** | Position in the source data array | Data is inserted or removed | Row 5 in the original dataset stays physical 5 regardless of sorting, filtering, or hiding |
| **Visual** | Position in the DataMap after trimming | A `TrimmingMap` adds or removes indexes | If rows 0-1 are trimmed, former physical row 2 becomes visual row 0 |
| **Renderable** | Position in the DOM after hiding | A `HidingMap` adds or removes indexes | If visual row 1 is hidden, visual row 2 becomes renderable row 1 |

## HidingMap vs TrimmingMap

- **HidingMap** - The index stays in the DataMap (visual space) but is not rendered in the DOM. Used by `HiddenColumns` and `HiddenRows`. The data is still accessible via `getDataAtCell()` with visual coordinates.
- **TrimmingMap** - The index is removed from the DataMap entirely. Used by `TrimRows` and `Filters`. Trimmed rows do not exist in visual space at all.

## IndexMapper API

Access via `hot.rowIndexMapper` or `hot.columnIndexMapper`. Key methods:

```js
// Translate between systems
mapper.getPhysicalFromVisualIndex(visualIndex)
mapper.getVisualFromPhysicalIndex(physicalIndex)
mapper.getPhysicalFromRenderableIndex(renderableIndex)
mapper.getRenderableFromVisualIndex(visualIndex)

// Register a new map
mapper.createAndRegisterIndexMap(name, type, initialValue)
// type: 'hiding' | 'trimming'
```

## When to use which coordinate

| You are doing | Use |
|---|---|
| Reading or writing source data | **Physical** |
| Working with user-facing row/column positions, selection, or `getDataAtCol()` | **Visual** |
| Accessing DOM nodes, cell elements, or Walkontable APIs | **Renderable** |
| Storing persistent state (e.g., sorting order, filter conditions) | **Physical** |

## Common gotcha: Filters + ManualColumnMove

The `conditionCollection` and `conditionUpdateObserver` in the Filters plugin operate on **physical** indexes, while `getDataAtCol()` requires **visual** indexes. When `manualColumnMove` is active, physical and visual column order diverge. Always convert with `getVisualFromPhysicalIndex()` / `getPhysicalFromVisualIndex()` before crossing the boundary.

## Quick plugin reference

| Plugin | Map type | Coordinate it manages |
|---|---|---|
| `HiddenColumns` / `HiddenRows` | HidingMap | Visual to renderable |
| `TrimRows` / `Filters` | TrimmingMap | Physical to visual |
| `ManualColumnMove` / `ColumnSorting` | IndexesSequence | Physical to visual |

## Source files

Implementation lives in `src/translations/` - see `indexMapper.js`, `maps/`, and `mapCollections/`. For deeper architectural context, see `.ai/ARCHITECTURE.md`.
