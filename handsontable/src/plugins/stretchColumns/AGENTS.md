# StretchColumns plugin — minimum-width rules

The `stretchColumns` plugin grows columns to fill available width. Read this before touching `stretchColumns.ts` or a strategy under `strategies/`.

## Width contract (the landmines)

- **Always respect defined column widths as minimum values.** Stretching may only ever grow a column past its base width, never below it.
- **If a column would shrink below its base width, disable stretching entirely** for that case rather than producing a sub-minimum width.
- **The `'all'` and `'last'` strategies must behave consistently** regarding minimum-width handling — do not let one strategy honor the minimum while the other ignores it.

## Where to look next

- Strategy implementations: `strategies/`.
- Plugin contract, hooks, settings validation, lifecycle: `handsontable-plugin-dev` skill.
