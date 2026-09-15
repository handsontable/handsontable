# Dialog plugin — the modal surface

The `dialog` plugin shows a modal over the grid. Read this before touching `dialog.ts`, `ui.ts`,
`constants.ts` or anything in `templates/`.

It is a **shared surface an application legitimately uses**, and that shapes everything below.

## Root instances only

`isEnabled()` is `isRootInstance(this.hot) && !!getSettings()[PLUGIN_KEY]`. A nested grid (the
`handsontable` cell type) never gets a dialog. `../emptyDataState/`, `../notification/` and `../loading/`
all gate the same way.

## It lives in `ht-overlay`, not in a layout slot

The dialog renders into `hot.rootOverlaysElement` — a **fixed internal element**, like `ht-grid`, not a
user-orderable layout slot. `ui.install()` appends its container there, so **there is nothing to register
with the layout manager**, and `disablePlugin()` detaches the element by hand and drops the UI
(`enablePlugin` rebuilds it).

Contrast with the edge-slot plugins, which must go through `hot.getLayoutManager().register(...)`. The full
wrapper-placement rule is in `../../../AGENTS.md`.

## `template.id` is assigned AFTER the spread — on purpose

```js
useTemplate({ ...template, id: this.hot.guid })
```

The id reaches the `id` attribute of the title and description elements (`templates/confirm.ts`). Two
separate defects made this ordering necessary:

1. A caller-supplied `template.id` carrying a quote **broke out of that attribute** — the `html` tagged
   template that built this surface assigned to `innerHTML`, and `stripTags()` escapes no quotes. DEV-2617
   replaced that template with a `TemplateSpec`, so the injection route is closed; the ordering stays
   because the WCAG reason below stands on its own.
2. Even a *benign* custom id was wrong: two grids configured with the same one emit duplicate element ids
   into a single document (WCAG 4.1.1), which a GUID cannot do.

Unknown keys inside `template` pass `SETTINGS_VALIDATORS` untouched — `BasePlugin` iterates the validator's
own keys only — so a value the library itself must control has to be kept out of the caller's reach by
construction, not by validation.

The general rule this is the worked example of — a value interpolated into an HTML *attribute* is resolved
at the render site, never trusted from a validator in another file — is in `../../../AGENTS.md`.

## Button types go through `helpers/uiButton.ts`

`isButtonType()` / `resolveButtonType()` are called at the render site **and** in `SETTINGS_VALIDATORS`.
Never inline `['primary', 'secondary']`: duplicating it is what let the render sites and the validators
drift, down to a validator that accepted `String(value)` where the render site required a real string.

Type the incoming value `unknown`, not `ButtonType` — the narrow type belongs on what the resolver
*returns*; claiming it on the way in asserts a check that has not run. The guard also keeps earning its
place after any DOM-construction refactor, because `classList.add()` throws `InvalidCharacterError` on a
value containing a space.

`emptyDataState` and `notification` share this helper; `notification` has no button-type validator and
normalizes action types in `#normalizeOptions` instead.

## `template` and `content` are mutually exclusive

Passing both throws (`throwWithCause`). The check compares each against `DEFAULT_SETTINGS`, so "not the
default" is what counts as "supplied".

## Titles are DOM text now, via `htmlToPlainText()`

DEV-2617 removed this plugin's HTML sinks. `templates/confirm.ts` is a `TemplateSpec`, and the title,
description and button labels are set as `text:` through `htmlToPlainText()` (`helpers/string.ts`) — which
is `stripTags()` plus character-reference decoding, chosen so the surfaces render exactly what they rendered
while they still wrote through `innerHTML`.

That means it **inherits `stripTags`'s limit**: `'Loaded 5 < 10 rows'` still becomes `'Loaded 5 '`. That is
an accepted trade for a phrase the library or a language pack authors, and it is **never** acceptable for a
user's header or cell value — those go through `textExtractor`. `emptyDataState` uses the same helper for
the same reason; keep the two together, and treat a change as a behavior change.

## Show forces a reflow before the transition class

`display: block` is set first, then a style/layout read forces a synchronous reflow, and only then is
`ht-dialog--show` added. The read is what commits the `display` change, so the transition runs instead of
being skipped. Removing it is invisible in tests and breaks the animation.

## The license lock screen is NOT this plugin

Core's `utils/licenseBranding/lockScreen.ts` **reuses this plugin's CSS by wearing its class names**
(`ht-dialog ht-dialog--confirm handsontable …`) rather than calling the plugin. The reasons matter if you
ever consider unifying them: the dialog is a surface an app uses, so any `show` would replace the lock, any
hide would look like a dismissal, and a `dialog: true` setup would never tear the lock down. The lock also
copies this plugin's width sizing — pin `style.width` to the table workspace width on `afterViewRender`, or
the `.ht-dialog` box spans the whole root wrapper instead of the grid.

Keep the stylesheet shipping in full so that inheritance keeps working without importing the plugin.

## Focus and shortcuts

The plugin owns a shortcut context (`SHORTCUTS_CONTEXT_NAME`) and a focus scope. `afterDialogFocus` is the
hook `../loading/` listens on.

### `onActivate` branches on the focus SOURCE, and `show()` arrives as `unknown`

`show()` calls `activateScope(PLUGIN_KEY)` with no source, and `activateScopeById` defaults that to
`'unknown'` — the same value a click-free activation carries. So `onActivate` sees four sources, and every
one of them needs its own branch. The two Tab sources pick an end of `getFocusableElements()`; `'unknown'`
picks the first element; `'click'` deliberately picks **nothing**.

Never collapse the `'unknown'` branch into a bare `else`, which would also catch `'click'`. A click on a
**non-focusable** part of the dialog — its title, say — sends no focus event of its own, so with the scope
deactivated (the user clicked outside the open modal first) it reaches `onActivate` as `'click'`, and a
bare `else` then moves the focus the user did not ask to move. `methods/show.spec.js` pins it.

**`'unknown'` is not only `show()`, and that is why the branch carries the same `contains` test as the
fallback.** A focus event on an element with no `data-ht-focus-source` also arrives as `'unknown'` — and a
plain button has none. It reaches `onActivate` whenever the scope was deactivated **without** unlistening,
which is what `activateScope` does to the previously active scope every time another scope activates (a
`notification` opening over an open dialog is the in-tree path; `deactivateScope` called directly is the
other). Without the test, that focus would snap back to the first button, away from where the user put it.
An earlier revision of this file claimed such a focus "never gets that far" because the scope would
already be active — that is wrong whenever something else deactivated it, and a code review caught it.
`methods/show.spec.js` pins this case too; note that `simulateClick` cannot express it, because the legacy
harness delivers that as `'click'` — the test focuses the button directly.

DEV-47 is what the missing `'unknown'` branch cost: the outer `if (focusableElements.length > 0)` was
entered, neither Tab branch matched, and the `else if` fallback below it is unreachable from there — so a
`confirm` dialog opened with `showConfirm()` / `showAlert()` left the keyboard focus on the grid cell
**behind** the open modal. The fallback only ever covers the "nothing focusable inside" case, so a template
that reports focusable elements gets no help from it.

The `'unknown'` branch is gated on `isListening()`, matching the fallback. A grid that was never clicked is
not listening (`activeGuid` starts `null` in `core.ts`), and `methods/focus.spec.js` pins that such a grid
does **not** take the focus when a dialog opens — a deliberate "don't steal focus from a page the user has
not touched" rule that predates the focus-scope rewrite. It is also a WAI-ARIA APG deviation, since APG
moves focus into a modal in all circumstances; re-deciding it is a product call, not a bug fix.

### The container carries `tabindex="-1"`, and it is set in `install()`

`ui.ts` used to set it inside `updateDialog()` and only when `TEMPLATE_NAME === 'base'`. The template gate
was the DEV-47 bug: it made `focusDialog()` — the public `Dialog#focus()`, which `../loading/` calls from
its `afterDialogFocus` listener — a **silent no-op** on a `confirm` dialog, because `focus()` on an element
with no tab stop does nothing and throws nothing. `-1` adds no tab stop, so setting it for every template
changes no Tab order. (`templates/confirm.ts` already put `tabindex="-1"` on its own `contentElement`,
which is why a buttonless `confirm` was focusable inside while its container was not.)

It now lives in `install()`, in the same `setAttribute` array as `aria-modal` and `dir`, because the
container is built once and never replaced and the value is identical for every template — an invariant of
the element, not something to rewrite on every show. That is a tidiness argument, **not** a second bug
fix: a code review suggested the move would also let a caller focus the dialog before the first `show()`,
and it does not. The container is `display: none` until then, and a hidden element cannot take the focus
whatever its tabindex — measured. Do not restate that claim; `focus()` only does anything while the dialog
is visible, and five specs across `methods/focus.spec.js`, `methods/show.spec.js`,
`keyboardShortcuts/escape.spec.js` and `../loading/__tests__/loading.spec.js` fail if the attribute goes
missing.

### Known, NOT fixed by DEV-47 — measured, and each needs its own ticket

Found while fixing the focus branches. All four are pre-existing, and the last two were confirmed to behave
identically with the `'unknown'` branch removed, so they are not consequences of it.

1. **`template` and `content` accumulate across calls.** `updatePluginSettings` only assigns the keys the
   new object carries, so `loading.show()` (which sets `content`) followed by `showConfirm()` (which sets
   `template`) trips the mutual-exclusion `throwWithCause` in `update()`. Both orders throw, and the caller
   cannot recover: `SETTINGS_VALIDATORS.template` is `isPlainObject(...)`, which rejects `null`, so
   `update({ template: null })` is ignored with a console warning. Either accept `null` there, or have
   `update()` reset the other key to its default when one of the pair is supplied.
2. **The zero-focusable fallback excludes both Tab sources.** Tab into a `content` dialog with nothing
   focusable inside and the focus stays on the hidden `htFocusCatcher` — no announcement. `../loading/`
   patches exactly this from outside, with its `afterDialogFocus` listener; dropping the two
   `focusSource !== 'tab_from_*'` conditions would fix it here for every `content` dialog instead, but it
   changes what `keyboardShortcuts/tab.spec.js` pins.
3. **`hide()` restores the focus only through the selection-restore path.** With the grid listening but
   nothing selected, `hide()` takes the `else` branch, which only renders — so the focus falls to `body`.
4. **`deactivateScope` does not restore the shortcut context.** After `hide()` the active context is still
   `plugin:dialog`, so the grid's own shortcuts are dead until something re-activates the grid scope. The
   selection restore heals it by accident; with no selection nothing does. Same family as DEV-53
   (`emptyDataState`).

## Where to look next

- The plugin that reuses this one as its host: `../loading/AGENTS.md`.
- Sibling overlay surfaces: `../notification/AGENTS.md`, `../emptyDataState/AGENTS.md`.
- Overlays layer and layout slots: `../../core/layout/`.
- Plugin contract, lifecycle, priorities: `../base/AGENTS.md`.

## Testing

- `npm run test:e2e --prefix handsontable -- --testPathPattern='dialog'`

`__tests__/` splits into `hooks/`, `methods/`, `options/`, `keyboardShortcuts/`, `plugins/` and a separate
`editor.spec.js` — a dialog change usually touches the keyboard and editor specs too.
