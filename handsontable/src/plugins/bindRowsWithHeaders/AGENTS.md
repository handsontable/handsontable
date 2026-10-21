# BindRowsWithHeaders plugin — row headers that stick to their rows

The `bindRowsWithHeaders` plugin makes a row header label follow its row when rows are hidden or moved,
instead of always showing the row's current position. Read this before touching
`bindRowsWithHeaders.ts` or the two maps in `maps/`.

It is the smallest real plugin here: one index map, one hook (`modifyRowHeader`).

## Two strategies, chosen once at enable time

The setting selects a map class through `bindTypeToMapStrategy`:

| Setting | Map | On insert | On remove |
|---|---|---|---|
| `'loose'` (the default) | `maps/looseBindsMap.ts` | existing values are shifted up (`getIncreasedIndexes`); new rows take the identity value | remaining values are shifted down (`getDecreasedIndexes`) |
| `'strict'` | `maps/strictBindsMap.ts` | existing values are **untouched**; new rows get `max(existing) + 1 + ordinal` | remaining values are **untouched** |

So the difference is whether existing headers are renumbered. **Loose keeps the numbering contiguous** —
insert a row in the middle and everything below it shifts. **Strict keeps every header's original number
forever**, which means an inserted row is numbered past the current maximum (it does not take the number of
the position it occupies) and a removal leaves a **gap** in the sequence.

Both extend `IndexMap` with an identity initializer — `(index) => index` — so before anything moves, each
header maps to itself.

Two consequences:

- **The strategy is resolved in `enablePlugin()` and baked into the registered map instance.** Changing the
  setting therefore needs the plugin to re-enable; there is no in-place strategy switch.
- **An unknown setting value falls back to `DEFAULT_BIND`**, and if even that is missing the plugin returns
  from `enablePlugin()` without registering anything or calling `super.enablePlugin()` — so `enabled` stays
  `false`. That is the intended failure mode, not an oversight.

## `registerMap`, not `createAndRegisterIndexMap`

Because the plugin supplies its **own** map subclass, it calls
`rowIndexMapper.registerMap('bindRowsWithHeaders', new MapStrategy())`. The `createAndRegisterIndexMap`
convenience only builds the built-in map types.

Both map classes override `insert()` and `remove()`, reorganize `indexedValues` through the
`translations/maps/utils/physicallyIndexed` helpers, and then call `super`. **Keep the `super` call last** —
the base class's own bookkeeping depends on the reorganized list.

## `PLUGIN_PRIORITY = 210`

That is after the move plugins (ManualRowMove is 140) and before the hiding plugins (HiddenRows is 320).
The hiding plugins running later does not matter: `modifyRowHeader` — the only place the mapped value is
read — fires at **render** time, not at enable time, so every map is settled by then.

## Where to look next

- The mapper this plugin extends, and the physically-indexed helpers it uses:
  `../../translations/AGENTS.md`, `../../../.ai/INDEX-MAPPING.md`.
- What moves the rows underneath it: `../manualRowMove/AGENTS.md`, `../columnSorting/AGENTS.md`.
- Row headers whose *width* is measured elsewhere: `../autoRowHeaderSize/AGENTS.md`.
- Plugin contract, lifecycle, priorities: `../base/AGENTS.md`.

## Testing

- `npm run test:e2e --prefix handsontable -- --testPathPattern='bindRowsWithHeaders'`
- `npm run test:unit --prefix handsontable -- --testPathPattern='bindRowsWithHeaders'`

`__tests__/maps/` covers the two strategies directly — a strategy change belongs there first.
