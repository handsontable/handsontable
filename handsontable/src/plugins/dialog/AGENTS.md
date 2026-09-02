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

The template interpolates the id into the `id` attribute of its title and description elements. Two
separate defects made this ordering necessary:

1. A caller-supplied `template.id` carrying a quote **broke out of that attribute** — the `html` tagged
   template assigns to `innerHTML`, and `stripTags()` escapes no quotes.
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

## Titles still use `stripTags()`

That is the behavior the plugin shipped with, so it stays — even though `escapeHtml()` is the better tool
for a text-position value (stripping drops everything from a `<` to the next `>`, so `'5 < 10 rows'`
silently becomes `'5 '`). `emptyDataState` matches. Do not change one without the other, and treat it as a
behavior change.

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

## Where to look next

- The plugin that reuses this one as its host: `../loading/AGENTS.md`.
- Sibling overlay surfaces: `../notification/AGENTS.md`, `../emptyDataState/AGENTS.md`.
- Overlays layer and layout slots: `../../core/layout/`.
- Plugin contract, lifecycle, priorities: `../base/AGENTS.md`.

## Testing

- `npm run test:e2e --prefix handsontable -- --testPathPattern='dialog'`

`__tests__/` splits into `hooks/`, `methods/`, `options/`, `keyboardShortcuts/`, `plugins/` and a separate
`editor.spec.js` — a dialog change usually touches the keyboard and editor specs too.
