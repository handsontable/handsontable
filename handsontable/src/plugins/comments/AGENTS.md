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
  `#cellBelowCursor` reads it and feeds a `=== target` short circuit in `#onMouseOver`. A
  one-`mouseover`-per-cell pointer move never reaches that short circuit, so for cell hovering it is
  hygiene with no visible behavior — but **a resizer drag does reach it**, which is why the editor-hover
  cancel below has to sit in front of it. Do not build anything else on it.

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

`hide()` reassigns `hidingTimer` **without clearing the previous one**, so several timers can be pending at
once and `cancelHiding()` only ever clears the last. It still works, because every timer callback re-checks
`wasLastActionShow` and `cancelHiding()` flips that to `true` — the flag is what does the work, not the
`clearTimeout`. Do not "simplify" that check away.

## Being over the editor must CANCEL a pending hide

The hide branch of `#onMouseOver` fires for anything in the rendered tree that is not a commented cell, and
for a long time nothing called it off except `showAtCell()`, which only runs for a commented cell. So the
pointer leaving the editor and coming straight back — inside the 250 ms delay — still hid it. That is
DEV-2871 (reported as DEV-65), and a resizer drag is the way users met it:

- **The browser hit-tests a `mousemove` against the textarea's PRE-resize box** and applies the new size
  afterwards. One drag step wider than the distance from the pressed point to the box edge therefore reports
  the element *underneath* the pointer, which reaches the hide branch. Speed only decides how often that
  happens; a drag in small enough steps never leaves the box and never reproduced the bug.
- **The cancel has to run BEFORE the guard block**, not as another `else if` at the bottom. By the time the
  next event arrives over the grown textarea, `#cellBelowCursor` already holds that textarea, so the
  `=== target` short circuit returns first and swallows the cancel. A fix placed in the `else if` chain
  passes the hover-out-and-back case and still fails every resize drag — measured, not assumed.
- **`#preventEditorAutoSwitch` is live again**, and it is set in **`#onInputElementMouseDown`**, never in
  `#onMouseDown`: that handler calls `event.stopPropagation()`, so a mousedown on the textarea never
  reaches the document-level one. It holds the editor open for the whole gesture, and the document's
  `mouseup` clears it. The two sites that used to set this flag were deleted with
  `onContextMenuAddComment()`/`onContextMenuRemoveComment()` in the accessibility epic; the deleted
  `onContextMenuAddComment` set it beside a `cancelHiding()`, the same pair used here.

  **A press on the resizer does not focus the textarea, and that is the whole reason the flag exists.**
  Measured in Chrome: a primary press on the grip leaves the focus on `body`, while a press anywhere else
  on the textarea — primary or secondary — focuses it. A focused editor is already held open by the
  `isFocused()` short circuit, so the grip press is the one gesture that had nothing holding it.

  That also bounds how bad a stranded flag can be, and it is easy to overestimate. The flag gates the
  *show* branch too, and `#onMouseDown` reads it, so a stuck `true` would suppress hover switching and the
  click-outside hide — but every press that could strand one **except** the grip press has focused the
  textarea, and focus suppresses the same things by design. So there is no reachable case where the flag
  is the visible cause, and no test here can honestly pin one. Two guards are kept as hygiene rather than
  as fixes: only the **primary button** sets it, and **`disablePlugin()` clears it** (the field is an
  instance field that `enablePlugin()` never touches, and a disable tears down the event manager that
  owned the pending `mouseup`). The remaining case, a grip release genuinely outside the browser window,
  heals on the user's next click anywhere.

Two things follow from that ordering, and both cost a round of review to find.

**The early return skips the `#cellBelowCursor` write, so the branch has to clear the field itself.** Left
alone, the field keeps naming the cell the pointer left the editor *for* — routinely a plain, comment-less
cell. Moving back onto that same cell then matches the `=== target` short circuit, no hide is ever armed, and
the editor stays open until some *other* cell is visited. Setting it to `null` keeps the short circuit doing
only its own job (dropping a repeated event for one cell) across a trip over the editor.

**Cancelling a hide also revives a show, so the hold uses `keepVisible()` and not `cancelHiding()`.**
`cancelHiding()` sets `wasLastActionShow` back to `true`, and that flag is the only thing suppressing a
debounced show that a later `hide()` had already overruled — `hide()` never clears the pending show, and
cannot, because the show is what a hover asked for. So a plain `cancelHiding()` here lets a show armed for
*another* commented cell fire a moment later, and the comment on screen is replaced while the pointer rests
on the editor. Measured with three pointer moves inside one 250 ms window. `keepVisible()` drops the pending
show first (the `debounce` helper returns a function carrying `cancel()`), then cancels the hide.

**And `updateDelay()` has to cancel, carry over, AND skip — all three.** It is the `updatePlugin()` path, so
the wrappers reach it on every commit, and a settings update inside the 250 ms display delay is ordinary
rather than exotic. Each half of the rule is a defect on its own, and the first two were shipped one after
the other:

- **Cancel.** A `debounce()` result keeps its timer inside its own closure, so overwriting the field leaves
  that timer live with nothing holding a reference to stop it — and it still closes over the instance, so it
  reads `wasLastActionShow` and shows a comment anyway. `keepVisible()` can only reach the *current*
  function, so one orphan defeats it.
- **Carry over.** Cancelling alone drops a hover the user already started, and the comment then never
  appears until the pointer moves again. `#pendingShowRange` is the only piece of that state living outside
  the closure, which is what lets the rebuild re-arm it on the replacement.
- **Skip.** When the delay is unchanged there is nothing to rebuild, so `updateDelay()` returns early and a
  pending show keeps its original schedule. That is the common call by a distance, and it keeps an unrelated
  settings update from disturbing the hover's timing at all.

All three are pinned by `displaySwitch.unit.ts`, and each test is red without its own half. A test that
stubs `showDebounced` must give the stub a `cancel`, which is what the field's type has always promised.

The pointer cases are pinned by `tests/e2e/comments-editor-resize.spec.ts`.

Testing it needs a real browser — the stray event comes from the browser's hit-testing order and jsdom never
produces it. `tests/e2e/comments-editor-resize.spec.ts` owns it, and **its drag step must stay larger than
the page object's `GRAB_INSET`**, or the gesture reproduces nothing and the spec passes against unfixed
code. The 250 ms boundary is crossed with `page.clock`, because `toBeVisible()` resolves the moment it is
true and so would never observe a hide that is still pending.

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
- `npm run test:e2e --prefix tests -- comments-editor-resize` (Playwright — the resize and hover-cancel
  behavior, which needs a real browser)

## `renderMode: 'onChange'`

- The `htCommentCell` marker is written on the ELEMENT by `#onAfterRenderer`, from the cell meta, so a paint is the only thing that adds or removes it. `setComment`/`removeComment` write the meta through `setCellMeta`, which advances the cell's render version, and `updateSettings({ comments })` advances the render epoch - both repaint. A direct `disablePlugin()` does neither, so it calls `hot.markAllCellsChanged()` itself, or a skipped cell keeps the marker after the plugin is off.
