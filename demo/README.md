# Before/after demo — issue #4446 (PR #12811)

Manual-testing pages for the fix of [#4446](https://github.com/handsontable/handsontable/issues/4446)
("cell meta set with `setCellMeta` is lost after `updateSettings` with `cell`/`cells`/`columns`"),
fixed by [PR #12811](https://github.com/handsontable/handsontable/pull/12811) and released in v18.0.0.

Both pages are self-contained and load Handsontable from the jsDelivr CDN:

| Page | Loads | Shows |
|---|---|---|
| `before.html` | `handsontable@17.1.0` (last release without the fix) | The bug — `readOnly` set via `setCellMeta` is wiped by `updateSettings({ columns })` |
| `after.html` | `handsontable@18.0.0` (first release with the fix) | The fix — the value survives the same call |

Hosted copies (raw.githack, branch `claude/before-after-demo-ryzzbn`):

- Before: <https://raw.githack.com/handsontable/handsontable/claude/before-after-demo-ryzzbn/demo/before.html>
- After: <https://raw.githack.com/handsontable/handsontable/claude/before-after-demo-ryzzbn/demo/after.html>

## Test steps

1. Click **Step 1 — make B2 read-only (setCellMeta)**, or right-click cell B2 and choose
   *Read only* in the context menu.
2. Confirm the status bar shows `readOnly: true` and double-clicking B2 does not open the editor.
3. Click **Step 2 — updateSettings({ columns })**. The call does not touch B2's meta.
4. Check the status bar and double-click B2 again:
   - `before.html` (v17.1.0): `readOnly` flips back to `false`, B2 is editable — the bug.
   - `after.html` (v18.0.0): `readOnly` stays `true`, B2 stays read-only — the fix.

The pages share an identical Handsontable config; the only difference is the loaded version,
so any behavioral difference comes from the fix itself.
