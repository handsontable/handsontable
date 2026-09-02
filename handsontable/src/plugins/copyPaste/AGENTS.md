# CopyPaste plugin — clipboard in and out

The `copyPaste` plugin owns copy, cut and paste. Read this before touching `copyPaste.ts`,
`copyableRanges.ts`, `clipboardData.ts`, `pasteEvent.ts` or anything in `contextMenuItem/`.

`SETTING_KEYS` is `[PLUGIN_KEY, 'fragmentSelection']` — the plugin reacts to a `fragmentSelection` change
too, because native text selection and clipboard handling compete for the same events. See
`../base/AGENTS.md` for what listing a foreign key implies.

## Listeners go on the document, not the root element

That is deliberate, for Chrome 133 and lower to copy/paste/cut correctly (DEV-2277). Do not "scope them
properly" to `rootElement`.

**Inside a Shadow DOM tree the same listeners are attached to the grid's shadow root as well.** Sandboxed
hosts (Salesforce Lightning Web Security) retarget events observed at the document level, which hides the
grid internals from the document listeners; listeners bound inside the grid's own shadow tree still receive
the untouched event path. `#processedClipboardEvents` is the registry that prevents double handling when
both listeners receive the same event — the same pattern the Comments plugin uses for hover.

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

## Header copying

Four options control it — `copyColumnHeaders`, `copyColumnGroupHeaders`, `copyColumnHeadersOnly`, and
`pasteMode` (`'overwrite'` | `'shift_down'` | `'shift_right'`). All default off except `pasteMode:
'overwrite'`. `rowsLimit` / `columnsLimit` default to `Infinity`.

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
