---
type: how-to
id: la7yk3ts
title: How to order grid UI elements
metaTitle: How to order grid UI elements - JavaScript Data Grid | Handsontable
description: Place custom UI in the wrapper slots around the grid and control the order of elements within each slot.
permalink: /layout-slots
tags:
  - layout
  - slots
  - toolbar
  - pagination
searchCategory: Guides
category: Accessories and menus
---

Place custom UI in the slots that Handsontable renders around the grid, and control the order of the elements within each slot.

## Overview

Handsontable wraps the grid in a root element that contains four areas:

| Slot | Class | Position | Orderable |
|---|---|---|---|
| `beforeGrid` | `ht-before-grid` | Above the grid | Yes |
| (grid) | `ht-grid` | The table and the empty-data-state | No |
| `afterGrid` | `ht-after-grid` | Below the grid | Yes |
| `overlays` | `ht-overlays` | On top of the grid (modal layer) | No |

The grid area is internal and cannot be reordered. The `beforeGrid` and `afterGrid` slots are user-orderable through the `layout` setting. The `overlays` slot holds floating UI (such as the dialog); its ordering is owned by the plugins that register into it and is not part of the public `layout` config. You reach all slots with [`getLayoutManager()`](@/api/core.md#getlayoutmanager). Built-in UI already uses these slots: pagination and the license notification render in `afterGrid`, and the dialog renders in `overlays`.

## Prerequisites

- A Handsontable instance.
- A DOM element you want to render in a slot.

## Steps

### Add an element to a slot

Call `register(key, element, options)` on the layout manager. The `key` is a unique string you choose. The `options.side` selects the user-orderable edge slot (`'before'` or `'after'`). The `options.weight` controls the order -- a lower weight comes first. The manager owns the placement, so you do not append the element to the DOM yourself. The `overlays` slot is internal and not a `register` target.

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

hot.getLayoutManager().register('toolbar', toolbar, { side: 'before', weight: 100 });
```

### Remove an element from a slot

Call `unregister(key, side)` with the same key and slot. This detaches the element from the DOM.

```javascript
hot.getLayoutManager().unregister('toolbar', 'before');
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
    afterGrid: ['licenseNotification', 'pagination'],
  },
  licenseKey: 'non-commercial-and-evaluation',
});
```

You can change the order later with [`updateSettings()`](@/api/core.md#updatesettings):

```javascript
hot.updateSettings({
  layout: {
    afterGrid: ['pagination', 'licenseNotification'],
  },
});
```

## Result

Your element renders in the chosen slot, and the elements within each slot follow the order you set.

## Styling slot items

Every element you add to the `beforeGrid` or `afterGrid` slot receives the `ht-slot-element` class. The slot frames its items for you:

- Each item gets a border, and adjacent items share a single divider line.
- The first `afterGrid` item drops its top border; the grid's own bottom border divides them.
- The last `beforeGrid` item drops its grid-facing border for the same reason.

Style your own slot UI through the `ht-slot-element` class so it matches this framing. The `overlays` slot holds floating UI (such as the dialog) and is not framed.

## Built-in keys

Use these keys in the `layout` setting to order the built-in UI:

| Key | Slot | Provided by |
|---|---|---|
| `pagination` | `afterGrid` | The [`Pagination`](@/api/pagination.md) plugin |
| `licenseNotification` | `afterGrid` | The license notification |

The [`Dialog`](@/api/dialog.md) plugin renders in the `overlays` slot, which is not user-orderable through the `layout` setting.

## Related

- [Pagination](@/api/pagination.md)
- [Dialog](@/api/dialog.md)
- [`layout`](@/api/options.md#layout)
