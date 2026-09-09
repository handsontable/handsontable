# Comments plugin — per-cell notes and their tooltip editor

The `comments` plugin stores a note on a cell and shows a floating editor for it. Read this before touching
`comments.ts`, `commentEditor.ts`, `displaySwitch.ts`, `editorResizeObserver.ts`, `viewport.ts`, `utils.ts`
or anything in `contextMenuItem/`.

## A comment is cell meta, under a nested key

```
cellMeta.comment = { value: string, style?: { width, height }, readOnly?: boolean }
```

The key names are exported constants — `META_COMMENT`, `META_COMMENT_VALUE`, `META_STYLE`, `META_READONLY`.
Use them; the nesting is what makes `getCommentMeta(row, col, key)` and `updateCommentMeta()` necessary
instead of a flat `getCellMeta().comment`.

Removing a comment is `setCellMeta(row, col, META_COMMENT, undefined)`, not `delete`.

Because the value lives in cell meta, a comment travels with the record through sorts and moves, and a
sparse object data source needs no special handling (that was DEV-1718).

## Shadow DOM: the handlers are bound twice, and the dedupe is required

A shadow-hosted grid binds the pointer handlers **twice** — once inside the shadow tree, once on the
document — and the two bindings never see the same element. The in-tree listener gets the real cell; the
document listener gets the *retargeted shadow host*. That is intrinsic to event retargeting, not specific to
a sandboxed host.

Left undeduped, one hover shows the tooltip from the shadow-root listener and then hides it from the
document listener — which also clears the display switch's flag, so the debounced show is dropped and the
tooltip never appears at all (#8624 / DEV-2596). So:

- **An event is claimed by the first listener that receives it.** The shadow-root listener runs first (the
  event reaches the `ShadowRoot` before it crosses to the host), so it wins for anything inside the grid,
  and the document listener keeps handling only what never entered the shadow tree.
- **Everything hangs off one gate.** `isShadowRoot()` recognizes a native shadow root — a
  `DOCUMENT_FRAGMENT_NODE` carrying a `host`. A host whose *synthetic* root does not match that shape leaves
  the gate `null`, which makes the second binding, the dedupe and the point reader all inert, and the grid
  behaves exactly as it did before the fix. The Playwright fixture mounts a native shadow root, so the
  gate's false side is **not covered by tests** — change it carefully.
- **`elementFromPoint()` does not pierce shadow boundaries.** On a document it resolves to the shadow host.
  `#cellBelowCursor` reads it, but only feeds a `=== target` short circuit that a one-`mouseover`-per-cell
  pointer move never reaches, so today it is hygiene with no visible behavior. Do not build on it.

Grid-wide shadow-DOM rules (`getDeepActiveElement()`, `getShadowHostChain()`, `composedPath()`) are in the
core-package `../../../AGENTS.md`.

## The size clamp must run BEFORE `observeSize()`

`viewport.ts` caps the editor to the viewport (`shrinkSizeToViewport`, `clampPositionToViewport`,
`VIEWPORT_MARGIN = 8`) — mostly a mobile concern. The `setSize` that applies the clamp **must** happen
before `observeSize()`, so `EditorResizeObserver`'s `#ignoreInitialCall` guard swallows the resulting resize
event. In the other order, the clamped size is persisted to the cell meta and overwrites the size the user
had chosen.

Both `viewport.ts` functions are pure — no DOM, no Handsontable — so they are unit-testable in isolation.
Keep them that way.

## `DisplaySwitch` owns the show/hide delays

Show is a `debounce`d call whose reference is **immutable** (re-creating it per hover would never fire);
hide is a plain `setTimeout`. The API is `show(range)` / `hide()` / `cancelHiding()` / `updateDelay()` —
`updateDelay()` is what builds the debounced show, so it is also the constructor path.

Its internal flag records whether the last action was a show or a hide. Anything that hides the tooltip
clears that flag — which is exactly the shadow-DOM double-binding failure above.

## What survives a disable, and what has to be registered again

`disablePlugin()` removes every hook registered through the tracked `this.addHook()`, but the objects the
plugin built stay: `#editor` and `#displaySwitch` are created behind `if (!...)` guards and live until
`destroy()`. So the two kinds of listener go in opposite places, and #13410 got both wrong before it fixed
them:

- **`afterSetTheme` is registered on every `enablePlugin()`**, outside the `#editor` create guard. Inside
  it, the hook is removed by the first disable and never comes back, and a theme change then stops hiding
  the editor.
- **The `DisplaySwitch` `hide` / `show` local hooks are registered inside the create guard**, with the
  switch itself. `addLocalHook` in `../../mixins/localHooks.ts` pushes without a dedupe check, so
  registering them per enable leaves another pair behind on each round trip and one hover ends up running
  `showAtCell()` once per past enable. The editor's `resize` hook sits inside its guard for the same
  reason.

The shortcut context is a third case: `ShortcutManager` can create a context but never drop one, so
`plugin:comments` is immortal.

- `registerShortcuts()` takes it with `getOrCreateContext(SHORTCUTS_CONTEXT_NAME)`. `getContext` would
  throw `The "plugin:comments" context is already registered` on the second enable.
- `unregisterShortcuts()` calls `removeShortcutsByGroup(SHORTCUTS_GROUP)` on **both** `grid` and
  `plugin:comments`. Skipping the plugin context leaves a second copy of every shortcut in it after a
  re-enable.
- `disablePlugin()` also checks `getActiveContextName()` and hands the keyboard back to `grid`. Disabling
  the plugin while its editor had the focus otherwise leaves the emptied plugin context active, and the
  grid ignores the keyboard until the next click.

## Editor positioning

- **Reset the editor position to (0, 0) before measuring**, or the previous position influences the
  opening-direction calculation.
- The editor flips left/right when it would leave the browser viewport.
- **A hidden row is positioned against the previous row's coords.** There is a standing
  `// TODO: Probably using hot.getCell would be the best` on this, with the note that showing an editor for
  a hidden cell might be removable altogether — a spec currently passes for it, so it stays.

## Context menu items

`contextMenuItem/` holds `addEditComment`, `readOnlyComment` and `removeComment`, wired through
`afterContextMenuDefaultOptions`. A new item goes there, not inline in `comments.ts`.

## Where to look next

- The menu the items land in: `../contextMenu/AGENTS.md`.
- Theme reaction: this plugin listens on `afterSetTheme` — `useTheme()` does not go through
  `updateSettings`, so nothing else would notice. The hook is re-registered on every enable; see
  [What survives a disable](#what-survives-a-disable-and-what-has-to-be-registered-again).
- Cell meta storage and eviction: `../../dataMap/metaManager/AGENTS.md`.
- Plugin contract, lifecycle, priorities: `../base/AGENTS.md`.

## Testing

- `npm run test:e2e --prefix handsontable -- --testPathPattern='comments'`
- `npm run test:unit --prefix handsontable -- --testPathPattern='comments'`

## `renderMode: 'onChange'`

- The `htCommentCell` marker is written on the ELEMENT by `#onAfterRenderer`, from the cell meta, so a paint is the only thing that adds or removes it. `setComment`/`removeComment` write the meta through `setCellMeta`, which advances the cell's render version, and `updateSettings({ comments })` advances the render epoch - both repaint. A direct `disablePlugin()` does neither, so it calls `hot.markAllCellsChanged()` itself, or a skipped cell keeps the marker after the plugin is off.
