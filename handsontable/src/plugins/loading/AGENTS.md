# Loading plugin — the "please wait" overlay

The `loading` plugin shows a spinner over the grid. Read this before touching `loading.ts` or `content.ts`.

It is the smallest plugin here (~340 lines) because **it owns no DOM of its own**: it drives the Dialog
plugin.

## It force-enables the Dialog plugin

**Dialog must be registered, and `new Handsontable()` throws without it (since 19.0).** `PLUGIN_DEPS` names
`plugin:Dialog` (`feature.json`, `enforceAtInit`; generated into `feature.generated.ts`). Before 19.0 a modular
build that registered Loading alone got a working grid where `show()` showed nothing and nothing said why,
because every method below returns early without a dialog. This was a breaking change, with a step in the
18.1 → 19.0 migration guide. Pinned by `__tests__/pluginDependencies.unit.ts`.

`enablePlugin()` resolves `getPlugin('dialog')` and, if that plugin is not enabled, sets
`getSettings().dialog = true` directly. Four things follow:

- **This is the exception to "no direct cross-plugin coupling"**, and it is deliberate. Everything visible —
  `isVisible()`, `show()`, `hide()`, `update()` — delegates to the dialog, while the dialog is this plugin's
  (see "Loading owns the dialog" below). Every one of those methods
  re-checks `this.#dialogPlugin?.isEnabled()` before acting; keep those checks as guards, but do not read
  them as "the user can turn Dialog off".
- **Dialog stays on, by design.** The direct settings write is never undone: after `loading: false` the
  Dialog plugin is still enabled and `getSettings().dialog` is still `true`. And while `loading` is on,
  `updateSettings({ dialog: false })` does not turn Dialog off either (measured: the plugin stays enabled
  and `show()` still shows the overlay). Loading is built on Dialog, so this is the intended state; the
  class JSDoc says so for users. Do not "fix" it by restoring the previous `dialog` value on disable: an
  application may have opened its own dialog in the meantime.
- **The dialog reference is resolved once**, guarded on `#dialogPlugin === null`, and it outlives a
  disable. **The `afterDialogFocus` hook is not**: it is registered with the tracked `this.addHook(...)` on
  every `enablePlugin()`, outside that guard, so `disablePlugin()` drops it and the next enable puts it
  back. Registering it inside the guard is the older shape and it silently loses the hook after one
  disable and enable (fixed in #13410, covered by `src/plugins/__tests__/hooksReleasedOnDisable.unit.js`).
- **`updatePlugin()` does NOT run the disable and enable cycle.** `disablePlugin()` hides the overlay, so
  the cycle hid a visible loading screen on every `updateSettings()` that carried `loading`, including a
  wrapper re-sending the same value. It keeps the plugin enabled and, when the overlay is visible, applies
  the new options through `update({})` (an empty object: `update(undefined)` would wipe the plugin's
  settings through `updatePluginSettings`). So no `afterLoadingHide` fires on such an update, and the
  `afterDialogFocus` hook stays registered once. Pinned by `__tests__/loadingUpdate.unit.js`.
- **The content element is reused while its inputs are the same** (`#content`: the id, icon, title,
  description and sanitizer it was built from). Dialog skips a render only when the description is the
  same, and it compares `content` by identity, so a fresh element per `#describeDialog()` re-rendered the
  shown screen and restarted the spinner on every wrapper re-send.

### Loading owns the dialog only while it shows its own screen

The dialog is a surface the application uses too, so its visibility says nothing about the loading screen.
`#ownsDialog` is set by a successful `show()` and cleared by `hide()`, by `afterDialogHide` for any other hide
(`dialog.hide()`, Escape on a configured `closable` dialog, the Dialog plugin turned off), and by the Dialog
plugin's replaced listener (`_addReplacedListener()`) when another dialog is shown over the screen (an app
`dialog.show({ content })` or `dialog.update({ content })`, `showAlert()`/`showConfirm()`, the ExportFile progress
dialog). Loading's own `update()` goes through `dialog._updateDialog()`, which calls no listener. `isVisible()`, `hide()`
and `update()` act on the dialog only while the flag is set: before it, `loading.isVisible()` answered `true` for
the application's own dialog, and `loading.hide()`/`update()` closed or rewrote it. Rules that ride along:

- **Every way the screen goes away fires `afterLoadingHide` once, and only `hide()` fires `beforeLoadingHide`**: a
  hide or a replacement through the Dialog plugin cannot be vetoed. `hide()` clears the flag *before* it hides the
  dialog, so its own hide fires the hook once, after `afterDialogHide` as before.
- **The flag is set before the dialog shows and reset when that show throws** (the error is rethrown). It has to be
  set first, because `afterDialogFocus` fires from inside the show; without the reset a throwing
  `beforeDialogShow` listener or a template conflict left the flag set, and the application's next dialog read as
  the loading screen and fired a spurious `afterLoadingHide` when it hid.
- **`show()` shows a complete description through `dialog._showDialog()`** (`#describeDialog()`), after hiding a
  dialog the application shows. `_showDialog()` starts from the configured `dialog` options alone, so options an
  application prepared with `dialog.update()` for another dialog (`closable: true`, say) never reach the screen.
- **`update()` while the screen is not on screen only stores the options** for the next `show()`. It used to
  write the loading content into the hidden dialog, which is where the cross-show leaks in `../dialog/AGENTS.md`
  started.

The replaced listener is added in `enablePlugin()` and removed in `disablePlugin()`, so it is registered once per
enable, like the tracked hooks.

### `afterDialogFocus` fires for EVERY dialog, so the listener must check whose it is

`#onAfterDialogFocus()` re-focuses the dialog container, which is what lets a screen reader announce the
loading overlay — a loading screen always renders through `content`, so it reports no focusable elements
and nothing inside it can hold the focus. But the hook is the **dialog's**, not this plugin's, so it also
fires for a dialog the application opened for its own reasons. It is therefore gated on `#ownsDialog`: a
`template` dialog reports its own focusable elements and the dialog plugin has just focused one of them, so
re-focusing the container would undo that and leave the buttons unannounced.

Without the gate, enabling `loading` silently broke the confirm-dialog focus fix from DEV-47 — the dialog
focused the first button and this listener pulled it straight back onto the container. It stayed invisible
because `focus()` was a no-op on the `confirm` template until that same ticket fixed it, so the two
defects hid each other. Pinned by `__tests__/loadingOwnership.unit.js`.

## `show()` is idempotent, and vetoable only on a real open

If the dialog is already visible, `show(options)` **updates and returns** — it does not re-run
`beforeLoadingShow` / `afterLoadingShow`. So those hooks mean "the loading overlay opened", not "someone
called `show`". Do not use them to count calls.

`disablePlugin()` calls `hide()` **before** `super.disablePlugin()`, so the overlay cannot outlive the
plugin.

## `content.ts` returns DOM nodes, and four things about it are load-bearing

DEV-2617 rewrote this file. It used to return an **HTML string** that the Dialog plugin wrote through
`fastInnerHTML` — a Trusted Types sink, so `loading.show()` threw under a CSP carrying
`require-trusted-types-for 'script'` and the overlay never rendered. It was easy to miss because the grid
constructs cleanly: the overlay is only built on `show()`/`update()`.

It now builds a `TemplateSpec` through `buildTemplate()` (`helpers/dom/template.ts`). Four rules:

1. **It returns an ELEMENT, not a `DocumentFragment`.** Dialog stores `content` in its settings and
   re-reads it on every render (`#renderDialog`), and **appending a fragment empties it** — so the first
   render showed the overlay and the next one showed an empty box. Re-appending the same element is a no-op.
2. **The spinner spec carries `ns: SVG_NS`.** An `<svg>` created through `createElement` without the SVG
   namespace is an unknown HTML element that renders **nothing at all, with no error**. Descendants inherit
   it, so only the root needs it.
3. **`LOADING_CLASS_NAME` is imported from `helpers/constants`, not re-exported through `./loading`.** The
   two modules import each other, and `DEFAULT_ICON_SPEC` reads the class name at **module scope** — a
   cyclic binding read that early lands in the temporal dead zone and throws
   `Cannot access '_constants' before initialization` when a wrapper loads the ESM build. `PLUGIN_KEY` and
   `DEFAULT_ICON` stay cyclic safely because they are only read inside the function body.
4. **`title` and `description` are `text:` nodes** — markup passed there shows up literally. Only a
   **custom** `icon` still goes through `fastInnerHTML`, because that option is documented as markup; the
   built-in spinner is recognized by identity (`icon === DEFAULT_ICON`) and built as nodes. A custom icon is
   the caller's own markup, so it is passed the resolved `sanitizer` and a `warnScope` and obeys their
   policy like any other value they hand the grid. **Never pass a value derived from user input.**

Element ids stay namespaced `${id}-loading-title` / `-description`, and `id` comes from the dialog's
GUID-derived value — see the `template.id` rule in `../dialog/AGENTS.md` for why it must not be
caller-supplied.

## Root instances only

`isEnabled()` is `isRootInstance(this.hot) && !!getSettings()[PLUGIN_KEY]`, like the other overlay plugins.

## Where to look next

- The surface this plugin drives, and everything about its placement, focus and CSS:
  `../dialog/AGENTS.md`.
- Sibling overlay surfaces: `../notification/AGENTS.md`, `../emptyDataState/AGENTS.md`.
- The plugin that usually triggers it: `../dataProvider/AGENTS.md`.
- Plugin contract, lifecycle, priorities: `../base/AGENTS.md`.

## Testing

- `npm run test:e2e --prefix handsontable -- --testPathPattern='loading'`
- `npm run test:unit --prefix handsontable -- --testPathPattern='loading'`
- `npm --prefix tests run test:e2e -- e2e/loading-states.spec.ts`: the overlay's states from the visual
  suite's `/loading-demo`, on every theme and bundle (default and custom content, the focus Tab puts on
  the container, a grid with no rows, the RTL mirror). Its fixture loads the ar-AR pack for RTL, which
  neither bundle carries.
