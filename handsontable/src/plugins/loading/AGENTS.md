# Loading plugin — the "please wait" overlay

The `loading` plugin shows a spinner over the grid. Read this before touching `loading.ts` or `content.ts`.

It is the smallest plugin here (~340 lines) because **it owns no DOM of its own**: it drives the Dialog
plugin.

## It force-enables the Dialog plugin

`enablePlugin()` resolves `getPlugin('dialog')` and, if that plugin is not enabled, sets
`getSettings().dialog = true` directly. Two things follow:

- **This is the exception to "no direct cross-plugin coupling"**, and it is deliberate. Everything visible —
  `isVisible()`, `show()`, `hide()`, `update()` — delegates to the dialog. Every one of those methods
  re-checks `this.#dialogPlugin?.isEnabled()` before acting, because a user can switch `dialog: false` back
  off at any time.
- **The dialog reference and the `afterDialogFocus` hook are wired once**, guarded on
  `#dialogPlugin === null`. `updatePlugin()` runs the usual `disablePlugin(); enablePlugin();` cycle, so
  without that guard the hook would be registered again on every settings update.

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
