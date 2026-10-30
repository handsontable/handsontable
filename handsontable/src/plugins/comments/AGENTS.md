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

`getCommentMeta()` answers `undefined` for a negative row or column (a header), and reads through
`getCellMetaTransient()` because it only probes. `getComment()` and `getCommentAtCell()` go through it, so
they soft-fail for a header. Keep that guard in this plugin: `Core#getCellMeta()` still asserts an unsigned
index on purpose. What else a header does:

- `show()` and `showAtCell()` return `false` before they read any meta.
- The editor's focus handler and `#onAfterUndoRedo` return early (or hide) for a range on a header. Without
  that, a focus switches the shortcut context to `plugin:comments` and the blur's save throws before the
  context goes back to `grid`, leaving the grid shortcuts dead.
- The write side throws on purpose, a write to a header being a caller bug: `setCommentAtCell()`,
  `setComment()`, `updateCommentMeta()`, `removeCommentAtCell()`. So does `refreshEditor()`, which reads the raw
  `getCellMeta()` and is only reached for a cell.

A row or column past the last one is not guarded: it still reaches `getCellMeta()` and is read as a physical
index, as it was before.

Because the value lives in cell meta, a comment travels with the record through sorts and moves, and a
sparse object data source needs no special handling (that was DEV-1718).

## A comment menu item's `disabled()` judges the cells its `callback()` acts on

"Delete comment" and "Read-only comment" act on every cell of the active selection range
(`range.forAll`) that holds a comment. Past the guards both items share (a header highlight, select-all,
nothing rendered), each is disabled when no cell in that range holds one:
`checkSelectionConsistency([range], hasCommentAtCell)`. The guards win: select-all keeps both items
disabled even over cells with comments. A highlight-only check greys out an item that would still have
acted on the rest of the range, and no check at all left "Delete comment" enabled on a cell without a
comment, where its click wrote `comment: undefined` meta (DEV-263).

**`disabled()` and the click must count the same cells.** Both items use `hasCommentAtCell()` /
`hasCommentInMeta()` from `utils.ts` in both places: a value is required, a hidden cell under a merged
block is skipped, and the read is transient, because the walk runs on every menu draw. So a click writes
nothing to a cell without a comment (no meta write, no undo entry), and a comment on a hidden cell is never
deleted or toggled from the menu - it is invisible, and counting it in the click but not in `disabled()`
greyed out an item that would still have deleted it. "Add comment" / "Edit comment" is the exception: it
looks at the highlighted cell only, through `plugin.getCommentAtCell()`, which does not skip hidden cells.

The `META_*` keys and `CommentObject` live in `constants.ts`, so `utils.ts` and the items do not import
`comments.ts` (which imports them). `comments.ts` re-exports them, and that stays the public path.

The menu renderer (`../contextMenu/menu/menuItemRenderer.ts`) calls `isItemDisabled()` once per render,
because these callbacks walk the whole range: a column selected from its header on a 100k-row grid with no
comment is a full walk on every call.

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
hide is a plain `setTimeout`. The API is `show(range)` / `hide()` / `cancelHiding()` / `keepVisible()` /
`cancel()` / `updateDelay()` —
`updateDelay()` is what builds the debounced show, so it is also the constructor path.

**`disablePlugin()` calls `cancel()` first**, and `destroy()` does too. `cancel()` drops the debounced
show, the tracked hide timer and the carried-over range, and sets the flag back to its initial `true`.
Without it a hover that armed a show just before `updateSettings({ comments: false })`, or a switch to a
sheet that turns the plugin off, opened the editor a moment later over a grid with the plugin off, and
neither Escape nor a click outside closed it: those handlers went with the plugin. Pinned by
`__tests__/commentsDisableHover.unit.js` and `tests/e2e/comments-plugin-off-hover.spec.ts`.

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
  the closure, which is what lets the rebuild re-arm it on the replacement. **`hide()` clears that field**,
  because a hide overrules the hover: re-arming an overruled show puts a copy of it beyond the reach of the
  flag that was suppressing it, and the next `cancelHiding()` — which is what `showAtCell()` does when
  another cell's comment is opened — then lets the stale timer replace it. The armed timer itself is still
  left alone by `hide()`; the flag gating it, and `cancelHiding()` reviving it, are long-standing behavior.
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
- **The RTL flip compares against the viewport, not the document extent.** The branch is keyed on the
  grid's direction (`hot.isRtl()`), not the page's, so `scrollX` can be zero, negative (RTL page), or
  positive (RTL grid on an LTR page). The viewport's left edge in document coordinates is
  `rootWindow.scrollX` in all three. The document's leftmost x (`-(scrollWidth - clientWidth)`) matches
  it only for an RTL page scrolled all the way to its inline end, so other scroll states missed the flip
  and `clampPositionToViewport` put the editor on the cell. Never reduce the check to a sign-based or
  document-based one. Chrome and Firefox put an RTL page's vertical scrollbar on the left, which neither
  the flip nor the clamp accounts for yet.
- **The default height follows a merged range that spans more than one row.** The box is a fixed `88px`
  textarea (`_comments.scss`), so on a merged range it stuck out below a short one and ended short of a tall
  one. With no saved `style`, `refreshEditor()` sizes it to the merged block through
  `#getMergedBlockHeight()` and `getEditorAnchorHeight()` (`utils.ts`), after `resetSize()` and before
  `getSize()`, so the flip and the viewport clamp see the real height. Five rules, each pinned by a case of
  `tests/e2e/comments-merged-editor-size.spec.ts` that goes red without it. (1) **Read the height from the
  MASTER table's cell** (`wt.getCell(coords)`), not from the topmost one the rest of the method uses: with a
  frozen row across the block, the topmost cell is the top overlay's copy, cut at the freeze line, and the box
  came out as tall as that part (58px for a 116px range). (2) **Fall back to the topmost cell only when the master has none AND no freeze line crosses the block.** A
  block in a frozen start column that the grid has scrolled away from is drawn by the overlay only
  (`getCell()` answers a negative code), and a block wholly in the frozen rows has no master cell once the grid
  scrolls past them. The overlay's copy is whole in both. A block that crosses `fixedRowsTop` or
  `fixedRowsBottom` keeps its `rowSpan` in the overlay but is drawn only as tall as the overlay, so the
  `rowSpan` cannot tell a cut copy from a whole one: the check is the freeze line
  (`countNotHiddenFixedRowsTop()` and the start of the bottom band, in renderable rows), and a crossing block
  keeps the default. (3) **Count the DRAWN rows, not the meta's `rowspan`.** Hidden rows shrink the cell, so `{ rowspan: 2 }` with its second row hidden is a
  one-row cell, and a one-row cell keeps the default like a plain one. (4) **A hidden row or column keeps the
  default** (`targetingPreviousRow`, `targetingOtherColumn`): the anchor is a neighbor's cell, which is not the
  range the comment belongs to, and a one-row cell there would give the box its own height (29px). (5) **The
  flip reads the block's height, not the topmost cell's** (`blockHeight ?? cellHeight`): the flip moves the box
  up by what sticks out below the range, and the cut copy made that the cut part as well.
  `resetSize()` runs first, always: a saved `style` holding only one size sets nothing, and used to leave the
  previous comment's derived height on the next box. The derived height is a display value that is never
  written to `META_STYLE`, because only `#onEditorResize()` writes it and the saved size wins. It is
  synchronous, so unlike the clamp it does not depend on running before `observeSize()`. With `virtualized`
  the master block is clamped to the rendered band (`../mergeCells/AGENTS.md`), so the box is as tall as the
  rendered part there. There is no minimum height, and no maximum beyond the viewport clamp: a range taller
  than the window gives a window-tall box.
- **A hidden row is positioned against the previous row's coords.** There is a standing
  `// TODO: Probably using hot.getCell would be the best` on this, with the note that showing an editor for
  a hidden cell might be removable altogether — a spec currently passes for it, so it stays.

## Context menu items

`contextMenuItem/` holds `addEditComment`, `readOnlyComment` and `removeComment`, wired through
`afterContextMenuDefaultOptions`. A new item goes there, not inline in `comments.ts`.

`show()` and `showAtCell()` open the editor on a cell with no comment, empty, and that is a contract: `addEditComment`
(Add comment) and the Ctrl+Alt+M shortcut call `show()` on such cells to author a comment, and applications call
`showAtCell()` for the same reason. Do not gate either on an existing comment; it is a breaking change. Leaving the focused
empty editor stores an empty comment (`{ value: '' }`), as before. The hover path is gated on the `htCommentCell` class
(`targetIsCellWithComment()`), not on the comment meta, so it is not a guard for this. The empty editor is pinned for
`show()` through `showAtCell()` in `tests/e2e/comments-show-at-cell.spec.ts`. For Add comment, `comments.spec.js` pins only
that the editor opens on a cell without a comment, not that it is empty; `addEditComment` reaches the same `show()`.

`readOnlyComment`'s mark and click must agree on which cells count (DEV-124). Both go through
`getCommentReadOnlyState()`, which leaves out a hidden cell under a merged block and a cell with no
comment `value`. The mark can be `'mixed'`, so the click sets **one** state for every comment in the
active range – any read-only comment makes them all writable, otherwise they all become read-only –
and never writes to a cell without a comment. It used to flip each cell on its own, which turned a
mixed selection into the opposite mixed selection, and wrote value-less comment meta onto cells
that had no comment.

## Undo and redo

A comment is cell meta, so UndoRedo restores it from the step's journal - the plugin has no state
of its own to capture. What the plugin owns is how many steps a user action makes:

- **Every comment write is one operation** (`'comment'`): `updateCommentMeta()` and
  `removeComment()` run inside `runOperation()`, and so does each context menu item's loop over its
  range. Drop the wrapper from a menu item and one click becomes one undo step per cell.
- **The box size is never recorded.** `#onEditorResize()` writes the size under
  `operationScope.suppress()`. The resize observer reports every frame of a drag, so a recorded
  resize would push dozens of steps per drag, and the size is a view setting rather than content.
- **Leaving the editor without a change records nothing.** A blur, and the Tab shortcut, save
  through `#saveEditorComment()`, which compares the text with `#commentValueBeforeSave` (the text at
  focus) and suppresses an unchanged save. The save itself still runs, so a new comment with no
  text is created exactly as before; only its undo step is gone.
- **An undo refreshes an open editor** (`#onAfterUndoRedo`) when it changed the comment of the
  editor's cell. Otherwise the editor keeps the text from before the undo, and the next blur writes
  it back as a new step. The editor is hidden when its cell is gone. The comment is read in
  `beforeUndo`/`beforeRedo` (`#commentBeforeUndoRedo`), and an undo that left it as it was only
  repositions the editor: an editor opened by **Add comment** on an empty cell holds text nobody
  saved yet, and an API `undo()` of an unrelated step (from a timer, with no blur) closed it and
  dropped the text.
- **An undo that removes the comment under an open editor closes the editor without saving**
  (`#closeEditorWithoutSave()`). Hiding a focused editor fires a blur, and that blur saves: with the
  editor refreshed to `''` it wrote an empty comment, and with the old text left in it wrote the undone
  comment back. So the blur is fired right there, under `#preventEditorSaveOnBlur`, and the flag is
  cleared at once - a flag left set would skip the save of the next real edit. Pinned in
  `tests/e2e/undo-plugin-state.spec.ts`.

## A sheet switch saves and closes the editor first

`_saveAndCloseEditor()` (`@private`) saves the open editor's text the way a blur does (`#saveEditorComment`) and
closes it without a second save (`#closeEditorWithoutSave`). The sheets bar calls it before it captures the sheet it
leaves: an editor opened through the API is not blurred by a switch made through the API, so it stayed over the
arriving sheet and its text was saved into that sheet's cell. It saves only a focused editor. Typing needs the focus
and a blur saves on its own, so an unfocused editor (a hover preview, one the API opened) holds nothing new: saving
it wrote an empty comment, with an undo step, onto the cell. Do not widen the test to "the text differs from the
comment": `setCommentAtCell()` moves the plugin's range without touching the editor, so the text then belongs to
another cell, and the save wrote one cell's comment over another's. Pinned by `tests/e2e/sheets-bar-in-flight-work.spec.ts` and
`../sheetsBar/__tests__/inFlightSwitch.unit.js`.

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
- `npm run test:e2e --prefix tests -- comments-merged-editor-size` (Playwright — the box height on merged
  ranges)

## `renderMode: 'onChange'`

- The `htCommentCell` marker is written on the ELEMENT by `#onAfterRenderer`, from the cell meta, so a paint is the only thing that adds or removes it. `setComment`/`removeComment` write the meta through `setCellMeta`, which advances the cell's render version, and `updateSettings({ comments })` advances the render epoch - both repaint. A direct `disablePlugin()` does neither, so it calls `hot.markAllCellsChanged()` itself, or a skipped cell keeps the marker after the plugin is off.
