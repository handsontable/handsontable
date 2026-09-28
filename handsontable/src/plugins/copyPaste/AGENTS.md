# CopyPaste plugin — clipboard in and out

The `copyPaste` plugin owns copy, cut and paste. Read this before touching `copyPaste.ts`,
`copyableRanges.ts`, `clipboardData.ts`, `pasteEvent.ts` or anything in `contextMenuItem/`.

`SETTING_KEYS` is `[PLUGIN_KEY, 'fragmentSelection']` — the plugin reacts to a `fragmentSelection` change
too, because native text selection and clipboard handling compete for the same events. See
`../base/AGENTS.md` for what listing a foreign key implies.

## Three binding points, because a clipboard event arrives three ways

`copy`/`cut`/`paste` are bound on **all three** of these, through one `bindClipboardListeners()` helper:

| Target | Why it exists | Ticket |
|---|---|---|
| `rootDocument` | Events targeting `document.body` — outside the grid, so nothing bound below would see them — and Chrome 133 and lower needs it to copy/cut/paste at all | DEV-2277 |
| `rootElement` | Salesforce Lightning Web Security delivers clipboard events **only** to listeners bound at or below the element the grid owns | DEV-2795 / #13388 |
| the grid's shadow root, when it has one | Predates `rootElement` and is now a deliberate duplicate of it — see below | DEV-1619 |

**Never drop the document one** — do not "scope the listeners properly" to `rootElement`. The `rootElement`
one does not replace it: outside a sandbox it merely sees an in-grid event first.

**The shadow-root row no longer carries a case of its own.** `rootElement` is always a descendant of its own
shadow root and all three listeners are bubble-phase, so every event that reaches the shadow-root listener
already passed `rootElement` and was consumed by the registry. The only events it can see that `rootElement`
cannot are ones targeting a sibling inside the same shadow tree, and `isInternalElement()` rejects those in
`onCopy`/`onCut`/`onPaste`. It is kept because removing it is a behavior change in exactly the environment
nobody here can test — do not "clean it up" on the strength of this paragraph, and do not restore an
independent-sounding justification for it either.

`#processedClipboardEvents` is the registry that keeps the handler running once when several of these see
the same event — the same pattern the Comments plugin uses for hover. It is a `WeakSet` keyed on event
**identity**, which holds because `EventManager`'s `extendEvent()` mutates and returns the same event
object rather than wrapping it. A change there breaks dedupe silently, into double paste.

**Since DEV-2795 that registry is load-bearing for every grid, not just one in a shadow tree** — the
document and `rootElement` listeners both see every in-grid event. Under the default `overwrite` paste mode
a double paste writes the same values twice and looks identical, so no value assertion can catch it; the
`afterPaste` counter in the fixture below is what does. `pasteMode: 'shift_down'` is where it would actually
corrupt data, by inserting the rows twice.

Under LWS only one listener fires anyway, so dedupe is not what carries that case — but the membrane's
event identity is unverified, so do not lean on it there.

### Testing the LWS shape

`tests/e2e/shadow-dom.spec.ts` drives it through the `?delivery=lws-shape` mode of
`tests/fixtures/demo/shadow-dom.html`, which reproduces the two things LWS does that this plugin feels.
Both are needed — with only the first, the tests never exercise the branch that actually carries a paste in
an org:

1. **Delivery**, with `stopPropagation` on the container. That is the same reach LWS has, since listeners
   **on** the container still fire. It must not be `stopImmediatePropagation` (that would cut off the
   plugin's own container listener) and it must not sit on the shadow root (the plugin binds there too, so
   the test would pass without the fix).
2. **A collapsed `composedPath()`**, replaced in the capture phase with the shadow host chain. This is what
   sends `#resolveClipboardEventTarget` down its second branch, onto the retargeted `event.target`. With an
   intact path the first branch answers instead, and the LWS half of that method goes untested.

The fixture also records what reached the document — the tests assert that list is empty, and the
default-delivery test asserts it contains `paste`, so the empty list is not a claim about a recorder that
never worked.

**This reproduces the shape of LWS, not LWS.** A real org also runs the grid behind a sandbox membrane that
proxies the DOM itself, which no fixture here stands in for — the same caveat #13227 carried. Changes to
this area still want confirmation in an actual org.

The browser clipboard outlives a test (each test gets a fresh context, not a fresh clipboard), so **a
clipboard test must copy a value no other test in the file copies.** Otherwise a broken copy still pastes
the leftover from an earlier test and the assertion passes.

## Two Safari workarounds, both still needed

Tested on Safari 16.5.2:

- without one workaround, Safari **allows** copying/cutting from the browser menu when it should not;
- without the other, Safari **does not fire** the `copy` event at all.

Both are guarded on the instance listening — if it is not listening, the workaround is not needed.

## Ragged clipboard payloads (DEV-2615, #7389)

A clipboard whose rows have unequal length must **not** be narrowed to the first row's width, or cells past
that width are never written. **The widest row wins**, as in spreadsheet applications.

Then, for a row shorter than the widest one, write the **empty-cell value**, not `undefined` — `undefined`
deletes the property outright in an object data source.

## `getRangedData()` reads raw values, not `getCopyableData()` (DEV-2942)

`Core#getCopyableData()` returns a **string**, as its docs and type always said. `getRangedData()`
reads through the private `_getCopyableData()` instead, for two reasons:

- **The hooks.** `beforeCopy`, `afterCopy`, `beforeCut`, and `afterCut` all receive `getRangedData()`'s
  output, and hand consumers the values as they are stored.
- **The clipboard text.** `SheetClip.stringify()` builds the text with `str += value`, which reads an
  object through `valueOf()` first. `getCopyableData()` runs `helpers/mixed#stringify()`, which calls
  `toString()`. The two agree for primitives and `Date`, and differ for any object with its own
  `valueOf()`, such as a Moment instance: the clipboard gets `1789`, `getCopyableData()` returns
  `'2026-09-17'`.

`_getCopyableData()` is not on the public `HotInstance` type, so the call goes through the local
`HotInstanceInternal` type at the top of `copyPaste.ts`. `hooks/beforeCopy.spec.js` ("should be called
with the cell values as they are stored") pins both reasons in one case. The source-data branch keeps
`getCopyableSourceData()`, which still returns the stored object for the JSON serialization below.

## `SheetClip` and the trailing newline

Excel terminates every row, including the last, with a CRLF. For a single-cell copy that leaves a trailing
newline, which `SheetClip.parse` would read as a row separator and emit an extra empty row — blanking the
cell below the paste target. **A single trailing newline is a terminator, not a separator.**

## Two clipboard types, two sanitizer contexts

The plugin writes `text/html` and its own `SOURCE_DATA_HTML_MIME_TYPE`
(`application/ht-source-data-json-html`). Both are sanitized on the way in, and **each gets its own
context**:

- The private type is written by Handsontable's own copy handler, but **the clipboard is not a trusted
  channel** — any page can set the same type from its own `copy` handler. So it is sanitized like the
  `text/html` branch.
- It needs a *separate* context because the sink it feeds is inert (`htmlToGridSettings()` parses through
  `DOMParser`), so a sanitizer may legitimately pass that payload through without reopening an injection
  hole — and passing it through is what keeps object-based source data surviving a strict sanitizer. Sharing
  one context would force that choice on everyone, and would also run the sanitizer **twice over the same
  cells** on an internal paste, since both clipboard types carry a full table.

Clipboard markup is parsed with `DOMParser`, which has no browsing context, so nothing loads or runs while
the markup is read. **Never `importNode` those nodes into the live document** — that makes them live again.
Background in `../../../.ai/CONCERNS.md`.

**`parseFromString` is itself a Trusted Types sink, so *both* parses are wrapped in a `try`/`catch` that
degrades instead of failing** (DEV-2617). Under `require-trusted-types-for 'script'` it throws unless the
value came from a policy — which it did not when no `sanitizer` is configured, or when one is configured and
returns a plain string. Each catch warns through `#warnClipboardParseRefused`, then falls back differently:

- **The source-data parse** loses only object-key fidelity on an internal paste; the `text/html` branch
  carries the paste.
- **The `text/html` parse** falls back to `text/plain`, losing the cell types and styling the HTML flavor
  carried — but **only when there is something to fall back to.** An empty `text/plain` parses into
  `[['']]`, which the guard in `onPaste` does not stop, so assigning it would blank the target cell.
  Leaving `pastedData` as `undefined` makes the paste a no-op instead, which is the better outcome for a
  payload that was valid markup the parser simply refused.

Do not "tidy" either catch away.

## The private flavor is often absent, and that is not an error

`pastedSourceData` is `undefined` for every paste the grid did not write itself, so `populateValues()`
falls through to the plain string. Three routes reach that state and **only the first is obvious**:

- **<kbd>Cmd/Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>V</kbd>**, the browser's "paste as plain text" command
  (`IDC_CONTENT_CONTEXT_PASTE_AND_MATCH_STYLE`, bound to that combination on every desktop platform).
  It delivers a paste event carrying **`text/plain` only** — `text/html` is stripped along with the
  private flavor. Right-click → "Paste as plain text" is the same command.
- **A paste from any other application.** It usually carries `text/html`, so it takes the
  `htmlToGridSettings()` branch rather than `readPlainText()` — a different branch, the same outcome,
  because only Handsontable writes the private flavor.
- **`getPlugin('copyPaste').paste(text)`**, which sets `text/plain` and nothing else. This is the
  deterministic way to exercise all three from a test; simulating the key combination cannot work,
  because the accelerator is handled in the **browser process** and a synthetic key event never
  reaches this code at all.

**So a cell type whose stored shape differs from its displayed text cannot rely on this plugin to
restore it.** That is the cell type's `valueSetter`'s job — see `.claude/skills/handsontable-celltype-dev/SKILL.md`.
DEV-57 is the worked example: an `autocomplete`/`dropdown` column with a key/value `source` stored a
bare label on every one of the three routes above, and a `strict` column then marked the cell invalid.
The fix is in `cellTypes/autocompleteType/accessors/valueSetter.ts`, **not here** — do not add
cell-type knowledge to `populateValues()`. Nothing in this plugin reads the SHIFT key, and nothing
should: merely holding it while the browser runs an ordinary paste changes none of the flavors.

## Copy is not a sanitizer surface — it is a text surface

Content leaving the grid as *text* goes through `utils/textExtractor.ts`, never through `sanitizer` —
routing it through a sanitizer entity-encodes plain values (`R&D` → `R&amp;D`). The full rule and the three
traps behind it are in `../exportFile/AGENTS.md`, which shares the mechanism.

**The scope here is column headers only.** There is exactly one call site — `extractText(this.hot, value,
'CopyPaste.columnHeader')` — behind an early return when `getTextExtractor(this.hot) === false` or no header
rows are copied. Cell values and row headers are **not** projected, and that is deliberate: a value such as
`a<b` is data rather than a display string, and parsing it as HTML would destroy it. So a user's
`textExtractor` not running on copied cell values is the designed behavior, not a missing call — do not
"complete" it.

## Hook ordering details

- **`beforePaste` may modify the values, and the original payload is snapshotted first**, so the plugin can
  detect a user modification and respect it over the source data.
- **The copyable range array's identity is captured before `beforeCopy`**, which may reshape the array.
  Identity is what survives that — do not switch the check to a content comparison.
- `modifyCopyableRange` is the hook for constraining what may be copied (DEV-844).

Paste sizing is inherently two-phase: the plugin tries to populate all copied data, or repeat it within the
selection, but **it cannot know up front whether the populated data exceeds the selection** — some cells
reject values, and that is only known after reading their cell meta.

**Paste settling is also two-phase, and the post-paste selection rides the second phase (DEV-38).** A
validated cell anywhere in the pasted range — a `dropdown`/`autocomplete` column always carries a validator,
so do `numeric`/`date`/custom — makes the write settle asynchronously. `validateCell` (`core.ts`) defers
**every** validated cell through `_registerMicrotask` ("validation should be always asynchronous"), so
`applyChanges()` — where the new rows are actually created (`datamap.createRow`, guarded by
`allowInsertRow`) — runs only after the validator queue drains, **after** `onPaste()` has already returned.
For a synchronous validator (the array-source `dropdown` in the test) that is one microtask; an async
validator (function `source`, custom async) settles on a later, arbitrary boundary. Consequences for anyone
touching `onPaste`: (1) any synchronous post-paste read of `countRows()`/`countCols()` is **stale** for a
validated paste, so the inline `selectCell` clamps the selection down to the pre-paste last row (the reported
bug); the fix keeps that inline selection and adds a one-shot `afterChange` correction (`#onAfterChange`,
gated on `source === 'CopyPaste.paste'`) that re-selects against the settled count. (2) The correction lands
**after `afterPaste` fires**, and `afterPaste` (and `populateValues`'s return value) still describe the stale
collapsed range — only the DOM selection is corrected once the write settles. (3) The correction re-selects
with `selectCell(..., false, false)` — no scroll and `changeListener: false`, so it fixes the range whether
or not the grid still has focus and **never re-listens**: a slow async validator that settles after the user
clicked away corrects the selection in place instead of yanking focus back. (4) It runs only while the live
selection still equals the **exact range the inline selection produced** — read back from the grid after that
selection (so `mergeCells`' `beforeSetRangeStart` snap is already reflected), start and end corners both — so
a selection the user or a synchronous `afterPaste` handler changed since the paste, even one that still starts
at the paste origin, is left alone. (5) `#pastePlan` is cleared at the **top of `onPaste`**, not only when the
correction consumes it: a paste that writes nothing (`beforeChange` returns false, or a `dropdown` under
`allowInvalid: false` rejects every value so `applyChanges` skips `afterChange` at `changes.length === 0`)
leaves the plan armed, and clearing on entry stops it driving a later paste's correction.

**Scope — two shapes the fix deliberately does not cover.** The changelog names the default `overwrite` mode
for this reason. (a) `afterChange` fires only when `changes.length > 0`, and the **shift paste modes**
(`shift_down`/`shift_right`) recurse into `populateFromArray` **without** the `'CopyPaste.paste'` source, so
the handler never runs for them. They create rows only after the validator queue drains too, so a shift paste
with a validated column still clamps against the stale count exactly like the unfixed overwrite path — it is
not fixed, and widening the source gate to `'populateFromArray'` is the wrong fix. That string is the default
source `core.ts` stamps (`source || 'populateFromArray'`) on any `populateFromArray()` call made without a
source argument, and CopyPaste's own shift-mode recursion is one such caller, so the gate would match those
recursions and any other unsourced populate, and a stale armed plan plus one of them would re-select garbage.
(Autofill is NOT one: `autofill.ts` always passes an explicit `'Autofill.fill'` source.) (b) `#pastePlan` is a **single slot**,
so with an async validator two pastes can interleave: a second paste's `populateValues` overwrites the first's
plan before the first's `applyChanges` settles, the first paste's `afterChange` then consumes the second's
plan, and when the second settles it finds the slot empty and returns — leaving the **second** paste with the
collapsed selection this fix exists to correct. That is a live defect on a grid with genuinely async
(e.g. remote) validation, not a theoretical one; it is out of DEV-38's scope. Both are unreachable with a
synchronous validator (its microtask drains before any next user paste event); a per-paste token (a stack, as
the index-mapper does) is the fix if async-validated paste interleaving ever
needs to be correct.

(c) A **merge partially overlapping the paste and extending outside it, on the COLUMN axis**, ends the
validated (deferred) paste on a wider selection than the validator-free (synchronous) one (raised in review,
measured, scoped out). The mechanism: the deferred correction re-selects at CopyPaste's `afterChange` priority
(80), which runs BEFORE MergeCells' `#unmergeAfterPaste` (150) in the same cycle, so `#onBeforeSelectionHighlightSet`
runs `expandByRange` on a merge that overlaps the corrected selection but extends outside it and pulls the
outside cells in. A validator-free paste unmerges first (its inline `selectCell` runs after `#unmergeAfterPaste`,
so the merge is already gone) and selects clean. The two axes behave differently:

- **Row axis: closed by construction.** The DEV-38 bug is a paste that starts at the last row and runs past
  it, so the paste's bottom corner is the grid's last row after the grow and there is no row below it for a
  merge to extend into. A merge overlapping the paste and extending outside it therefore has to extend ABOVE,
  which means it contains the paste's top corner (the origin). `pasteBlockAt` selects that origin before
  pasting, so with the merge live the pre-paste `selectCell` snaps the anchor up to the merge's top-start
  corner identically on both paths. Measured: a `{ row: 3, col: 0, rowspan: 2, colspan: 2 }` merge straddling
  the boundary gives `[[3, 0, 6, 1]]` on both the validated and the validator-free paste. That is the case
  `tests/e2e/paste-selection-validated-column.spec.ts` `corrects the selection when the paste covers a merged
  area` pins.
- **Column axis: open, and the fix introduces the divergence.** A paste narrower than the grid can overlap a
  merge that extends sideways out of it without containing the paste origin, so no pre-paste snap fires.
  Measured on a five-column grid, paste into cols 2-3 starting at the last row, merge `{ row: 4, col: 3,
  rowspan: 1, colspan: 2 }` (overlaps the paste at col 3, extends to col 4): the synchronous paste ends on
  `[[4, 2, 7, 3]]`, the validated one on `[[4, 2, 7, 4]]`.

Not fixed here on purpose. The hook round's priority order is fixed (CopyPaste 80 before MergeCells 150), and
both alternatives are worse than this narrow defect: a `queueMicrotask`/`_registerTimeout` hop to run the
correction after `#unmergeAfterPaste` adds a new race and a new window for the user to move the selection
first, and a post-`selectCell` shrink-back fights MergeCells' own documented selection expansion. This is a
two-plugin hook-ordering interaction on a narrow shape (validated column AND a merge partially overlapping the
paste sideways AND the paste extending past the last row). Unlike (a) and (b), which the fix merely fails to
cover, this one the fix introduces, because the deferred correction did not exist before.

## Header copying

Three options control it — `copyColumnHeaders`, `copyColumnGroupHeaders` and `copyColumnHeadersOnly` —
and all three default to `false`. `rowsLimit` / `columnsLimit` default to `Infinity`.

`pasteMode` (`'overwrite'` | `'shift_down'` | `'shift_right'`, default `'overwrite'`) is **not** a header
option. It is handed straight to `populateFromArray()` as the paste method, so it only decides how pasted
data lands relative to the selection.

In the header path, the `row` argument doubles as the **header level** — a signature quirk worth knowing
before reading `copyableRanges.ts`.

## Where to look next

- The text-extraction contract shared with export: `../exportFile/AGENTS.md`.
- Menu entries: `contextMenuItem/` (`copy`, `cut`, `copyWithColumnHeaders`, `copyWithColumnGroupHeaders`,
  `copyColumnHeadersOnly`), wired via `../contextMenu/AGENTS.md`.
- Clipboard parsing helpers: `../../utils/parseTable.ts`.
- Plugin contract, lifecycle, priorities: `../base/AGENTS.md`.

## Testing

- `npm run test:e2e --prefix handsontable -- --testPathPattern='copyPaste'`
- `npm run test:unit --prefix handsontable -- --testPathPattern='copyPaste|copyableRanges'`

`__tests__/` splits into `copy.spec.js`, `cut.spec.js`, `paste.spec.js`, plus `hooks/`, `methods/` and
`settings/` — a clipboard change usually touches several.
