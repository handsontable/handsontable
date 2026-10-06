---
type: how-to
title: Layout slots
metaTitle: Layout slots - JavaScript Data Grid | Handsontable
description: Place custom UI in the wrapper slots around the grid and control the order of elements within each slot.
permalink: /layout-slots
tags:
  - layout
  - slots
  - toolbar
  - pagination
searchCategory: Guides
category: Accessories and menus
menuTag: updated
addedIn: "18.0.0"
---

Place custom UI in the slots that Handsontable renders around the grid, and control the order of the elements within each slot.

## Overview

Handsontable wraps the grid in a root element that contains six areas:

| Slot | Class | Position | Orderable |
|---|---|---|---|
| `top` | `ht-slot-top` | Above the grid | Yes |
| (grid) | `ht-grid` | The table and the empty-data-state | No |
| `bottom` | `ht-slot-bottom` | Below the grid | Yes |
| `start` | `ht-slot-start` | At the grid's inline-start edge (left in LTR, right in RTL), full height | Yes |
| `end` | `ht-slot-end` | At the grid's inline-end edge (right in LTR, left in RTL), full height | Yes |
| (overlays) | `ht-overlay` | On top of the grid and all slots (the dialog and the license lock also cover the side panels) | No |

The grid and overlays areas are internal and cannot be reordered. The `top`, `bottom`, `start`, and `end` slots are user-orderable through the `layout` setting; you reach them with [`getLayoutManager()`](@/api/core.md#getlayoutmanager). The overlays layer holds floating UI (such as the dialog) and renders like the grid -- a fixed internal element, not a slot. Built-in UI uses these areas: pagination renders in the `bottom` slot, and the dialog renders in the overlays layer. With side panels docked, the dialog and the license lock cover the side panels too, while notification toasts stay over the grid area. The license notification also renders at the bottom, but it is not a slot contributor -- it always stays last in the `bottom` slot and is not orderable through the `layout` setting.

## Prerequisites

- A Handsontable instance.
- A DOM element you want to render in a slot.

## Steps

### Add an element to a slot

Call `register(key, element, options)` on the layout manager. The `key` is a unique string you choose. The `options.side` selects the slot (`'top'`, `'bottom'`, `'start'`, or `'end'`). The `options.weight` controls the order -- a lower weight comes first. The manager owns the placement, so you do not append the element to the DOM yourself.

```javascript
const container = document.querySelector('#grid');
const hot = new Handsontable(container, {
  data: [
    ['SKU-4821', 'Harbor Goods', 142],
    ['SKU-0093', 'Alpine Supply Co.', 0],
    ['SKU-7740', 'Vertex Industries', 67],
  ],
  colHeaders: ['SKU', 'Supplier', 'In stock'],
  licenseKey: 'non-commercial-and-evaluation',
});

const toolbar = document.createElement('div');

toolbar.textContent = 'Inventory';

hot.getLayoutManager().register('toolbar', toolbar, { side: 'top', weight: 100 });
```

### Add a side panel

Register the element in the `start` or `end` slot. A side slot spans the full height of the root element, so it sits beside the `top` slot, the grid, and the `bottom` slot. Pagination and other `top` or `bottom` UI stay aligned with the grid, between the side panels.

The element sets its own width, either inline or through its own CSS class. The grid takes the remaining width and scrolls horizontally when its columns do not fit. Handsontable sets no minimum or maximum width on a side slot.

The element stretches to the height of the grid block, and its content never makes the grid taller. When the content is taller than the grid, set `overflow: auto` on the element so it scrolls.

```javascript
const filters = document.createElement('aside');

filters.textContent = 'Filters';
filters.style.width = '280px';

hot.getLayoutManager().register('filters', filters, { side: 'start', weight: 100 });
```

The `start` and `end` slots follow the [layout direction](@/guides/internationalization/layout-direction/layout-direction.md). With `layoutDirection: 'rtl'`, the `start` slot renders on the right and the `end` slot on the left.

When a side slot holds more than one element, the elements sit next to each other, each one full height. They follow the same order rules: by weight, or by the `layout` setting, in reading order. In the `start` slot the first element is at the outer edge and the last one touches the grid; in the `end` slot the first element touches the grid. Each element adds its width to the side panels, so the grid gets less.

With side panels docked, the [`width`](@/api/options.md#width) option includes them, and the grid fills the rest. When the page scrolls the grid's columns (no `height` and no fixed `width`), an `end` panel follows the table's last column only when the table is wider than the space between the panels, and you scroll the page sideways to reach it. A narrower table fills that space, and the `end` panel stays at the edge of the component. A `start` panel scrolls out of view as you scroll right, unless it is `position: sticky` itself.

When the side panels take up a pixel `width` entirely, the grid has no room left, and Handsontable prints a warning to the console once.

#### Keep a side panel in view when the window scrolls

Without the [`height`](@/api/options.md#height) option, the window scrolls the grid, and a side slot stretches to the full height of the grid. To keep the panel in view while you scroll the page, make the element itself sticky:

```javascript
Object.assign(filters.style, {
  position: 'sticky',
  top: '0',
  maxHeight: '100vh',
  overflow: 'auto',
});
```

The side slot sets no `overflow` of its own, so `position: sticky` works against the page scroll.

### Remove an element from a slot

Call `unregister(key, side)` with the same key and slot. This detaches the element from the DOM.

```javascript
hot.getLayoutManager().unregister('toolbar', 'top');
```

### Order elements with the `layout` setting

When a slot holds more than one element, set the order with the `layout` option. Each slot takes an ordered array of keys. Keys you list come first, in that order. Any remaining elements follow by their default weight.

```javascript
const hot = new Handsontable(container, {
  data: [
    ['SKU-4821', 'Harbor Goods', 142],
    ['SKU-0093', 'Alpine Supply Co.', 0],
    ['SKU-7740', 'Vertex Industries', 67],
  ],
  pagination: true,
  layout: {
    bottom: ['summary', 'pagination'],
  },
  licenseKey: 'non-commercial-and-evaluation',
});

const summary = document.createElement('div');

summary.textContent = '3 items in stock';

hot.getLayoutManager().register('summary', summary, { side: 'bottom', weight: 100 });
```

You can change the order later with [`updateSettings()`](@/api/core.md#updatesettings):

```javascript
hot.updateSettings({
  layout: {
    bottom: ['pagination', 'summary'],
  },
});
```

## Result

Your element renders in the chosen slot, and the elements within each slot follow the order you set.

## Styling slot items

Every element you add to a slot receives the `ht-slot-element` class. The slot frames its items for you:

- Each item gets a border, and adjacent items share a single divider line.
- The first `bottom` item drops its top border; the grid's own bottom border divides them.
- The last `top` item drops its grid-facing border for the same reason.
- Items in the `start` and `end` slots drop their grid-facing border, and the corners next to a filled side slot lose their rounding: the grid's corners, the matching corners of the `top` and `bottom` items, and the corners of the empty data state box.

Style your own slot UI through the `ht-slot-element` class so it matches this framing. The overlays layer holds floating UI (such as the dialog) and is not framed.

## DOM order

The `.ht-root-wrapper` element renders its slot and layer elements in this order: `ht-slot-start`, `ht-slot-top`, `ht-grid`, `ht-slot-bottom`, `ht-slot-end`, `ht-overlay`. The DOM order sets the Tab order, so keyboard focus reaches a `start` panel before the grid, and an `end` panel after the `bottom` slot.

The `ht-slot-start` and `ht-slot-end` elements are in the DOM only while a side panel is docked in them. Without side panels, the DOM and the layout of `.ht-root-wrapper` are the same as without layout slots: a flex column of `ht-slot-top`, `ht-grid`, `ht-slot-bottom`, and `ht-overlay`.

While a side slot holds at least one element, `.ht-root-wrapper` carries the `ht-slot-start-filled` or `ht-slot-end-filled` class and switches to a CSS grid layout, in which each slot is a separate grid area. Use class-based selectors to target the slots. Do not rely on the position of a child element.

## Built-in keys

Use these keys in the `layout` setting to order the built-in UI:

| Key | Slot | Provided by |
|---|---|---|
| `pagination` | `bottom` | The [`Pagination`](@/api/pagination.md) plugin |

The license notification renders at the bottom but is not a slot contributor: it always stays last in the `bottom` slot and ignores any `layout` entry. The [`Dialog`](@/api/dialog.md) plugin renders in the overlays layer, which is not user-orderable through the `layout` setting.

## Related

- [Pagination](@/api/pagination.md)
- [Dialog](@/api/dialog.md)
- [`layout`](@/api/options.md#layout)
