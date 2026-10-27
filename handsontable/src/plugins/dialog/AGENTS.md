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
   into a single document, which a GUID cannot do. (WCAG 2.2 dropped 4.1.1 Parsing; duplicate ids break
   1.3.1 Info and Relationships and 4.1.2 Name, Role, Value, where `aria-labelledby` resolves the wrong element.)

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

## Each show describes one complete dialog

The plugin keeps two option sets apart, and the base plugin's settings are only ever the composition of the two
(`#composeSettings()`, defaults first):

- `#configuredOptions`: what the `dialog` setting configured, merged across `updateSettings()` calls. Dialog
  overrides `updatePluginSettings()`, which the base plugin calls for the settings path only.
- `#dialogOptions`: what `show()` and every `update()` gave the dialog being described now. `hide()` clears them.

So `getSetting()` still reads the dialog on screen, and every option reads its configured value again once the
dialog hides. The older shape merged every `show()`/`update()` into the plugin settings, so options outlived the
dialog that set them: after `showConfirm()` the `template` stayed and every `loading.show()` threw (template plus
content), after a loading screen the `content` stayed and every `showAlert()`/`showConfirm()` threw, and a
`closable: true` from one dialog let Escape close the next loading screen. An `update()` made while the dialog is
hidden is kept for the next `show()` (until a hide clears it), because that is how a caller prepares a dialog. The
template plus content check and the template type check run **before** the options are committed, so a
throwing `show()` leaves nothing behind. Options are validated against `SETTINGS_VALIDATORS` once, when they arrive
(`#pickValidOptions()`, which warns the way the base plugin does); never feed the composed object back through
validation, because the default `template: null` fails its own validator and would warn on every show.

## `updatePlugin()` does NOT run the disable and enable cycle

`disablePlugin()` hides the dialog, so the cycle hid a shown dialog (the loading screen included, without
`afterLoadingHide`) on every `updateSettings()` that carried `dialog`, which a wrapper re-render does. The plugin
stays enabled and re-renders a shown dialog through `update({})`, so the shortcuts and the focus scope stay
registered once. Turning the option off still goes through `disablePlugin()`. Pinned by
`__tests__/sharedSurface.unit.js`.

## `template` and `content` are mutually exclusive

Passing both throws (`throwWithCause`). The check compares each against `DEFAULT_SETTINGS`, so "not the
default" is what counts as "supplied". It throws only when one layer sets both: one call (with the `update()`
calls of the same dialog), or the `dialog` setting. Across the layers the dialog's own options win
(`#describeDialog()`): a show that names `content` and no `template` drops a configured `template` for that
dialog, and the reverse. Without that, a `template` in the `dialog` setting made every `loading.show()` throw,
since Loading always passes `content`, so the loading screen could never appear.

The UI's own template check (`Invalid template: …`) runs before the options are committed too: `update()` hands
the composed template to `useTemplate()` first, which throws before it changes anything. Committed first, a
rejected template type stayed in the dialog's options of a dialog that never became visible, so `hide()`
(which returns early on a hidden dialog) could not clear it, and every later `show({ content })` and
`loading.show()` threw.

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

## Transition listeners outlive `destroyDialog()`

`install()` binds `transitionstart`/`transitionend` on the container, and `destroyDialog()` removes the
element and clears `#refs` without unbinding them. A transition still running at that moment can deliver
`transitionend` afterwards — Chrome 154 does, Chrome 152 did not — so `#onTransitionEnd` returns early when
`#refs` is gone. Without the guard the listener throws an uncaught `TypeError`, and in the legacy Puppeteer
suite one uncaught page error aborts the whole run. Any new listener on the container needs the same guard.
Pinned by `__tests__/ui.unit.js`.

## Content may come from another realm

A grid inside an iframe builds its nodes from `hot.rootDocument`, the iframe's document, so the export
progress fragment (`buildExportDialogContent`) and any node an app builds there fail
`instanceof DocumentFragment` / `instanceof HTMLElement` against the top window's constructors. The
`content` validator and `DialogUI#updateDialog` therefore use `isHTMLElement()` and `isDocumentFragment()`
(`helpers/dom/element.ts`), which also test against the node's own realm. A bare `instanceof` there made the
overlay render empty with `"content" option is not valid and it will be ignored`. Pinned by
`__tests__/crossRealmContent.unit.js`.

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
bare `else` then moves the focus the user did not ask to move. A click on a focusable element never gets
that far: its own focus event activates the scope first with `'unknown'`, and `activateScope` returns early
on the second call. `methods/show.spec.js` pins the non-focusable case, which is the only one that
separates the two shapes.

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

### The container carries `tabindex="-1"` for EVERY template

`ui.ts` used to set it only when `TEMPLATE_NAME === 'base'`. That made `focusDialog()` — the public
`Dialog#focus()`, which `../loading/` calls from its `afterDialogFocus` listener — a **silent no-op** on a
`confirm` dialog: `dialogElement.focus()` on an element with no tab stop does nothing and throws nothing.
`-1` adds no tab stop, so setting it everywhere changes no Tab order. (`templates/confirm.ts` already put
`tabindex="-1"` on its own `contentElement`, which is why a buttonless `confirm` was focusable inside while
its container was not.)

## The stashed selection belongs to the view that was shown

`show()` stashes the selection and `hide()` imports it back, as coordinates. When the view changes under an open
dialog (a sheets bar switch), those coordinates name the departing sheet's cells, so the sheets bar calls
`_adoptViewSelection()` (`@private`) after the switch: the dialog takes the selection the grid shows then as the one
to restore, and clears it while it stays open. A `loadData()` under an open dialog drops the stash
(`#onBeforeLoadData`), and the hide then leaves the selection alone: the stashed coordinates addressed the replaced
data, and restoring them put the selection on unrelated cells or past the new data's end (`[[8, 8]]` on a 2×2 grid).
Two loads keep it, the same as EmptyDataState: a grid with an external data source (`hasExternalDataSource`), whose
loads bring another page or order of the same records, and `updateData()`, which fires `beforeUpdateData` and keeps
the dataset's state by design. Pinned by `__tests__/sharedSurface.unit.js` and
`tests/e2e/sheets-bar-in-flight-work.spec.ts`.

## Where to look next

- The plugin that reuses this one as its host: `../loading/AGENTS.md`.
- Sibling overlay surfaces: `../notification/AGENTS.md`, `../emptyDataState/AGENTS.md`.
- Overlays layer and layout slots: `../../core/layout/`.
- Plugin contract, lifecycle, priorities: `../base/AGENTS.md`.

## Testing

- `npm run test:e2e --prefix handsontable -- --testPathPattern='dialog'`
- `npm --prefix tests run test:e2e -- e2e/dialog-states.spec.ts`: the states the visual suite's
  `/dialog-demo` photographed, from DOM rects on every theme and bundle (the dialog over the grid's root,
  the solid and semi-transparent backdrops, the content box's fill, the confirm template's slots and
  OK button, the focus moves around a dialog holding inputs, RTL). Two captures of the dialog's look
  stay under `visual-tests/tests/js-only/dialog/`, with an RTL look check.

`__tests__/` splits into `hooks/`, `methods/`, `options/`, `keyboardShortcuts/`, `plugins/` and a separate
`editor.spec.js` — a dialog change usually touches the keyboard and editor specs too.
