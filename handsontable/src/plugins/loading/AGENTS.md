# Loading plugin — the "please wait" overlay

The `loading` plugin shows a spinner over the grid. Read this before touching `loading.ts` or `content.ts`.

It is the smallest plugin here (~370 lines) because **it owns no DOM of its own**: it drives the Dialog
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

## `content.ts`: the icon is markup, the text is escaped

The split is intentional and each half is documented at the parameter:

- **`icon` is written as markup on purpose**, so the default SVG spinner — and any replacement — renders.
  **Never pass a value derived from user input here.**
- **`title` and `description` go through `escapeHtml()`**, so markup passed there shows up literally
  instead of being interpreted.

Note this plugin uses `escapeHtml()`, not the `stripTags()` that `../dialog/` and `../emptyDataState/` use
for their titles. `escapeHtml` is the right tool — stripping drops everything from a `<` to the next `>`, so
`'Loaded 5 < 10 rows'` becomes `'Loaded 5 '`. The other two keep `stripTags` only because that is the
behavior they shipped with.

Element ids are namespaced `${id}-loading-title` / `-description`, and `id` comes from the dialog's
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
