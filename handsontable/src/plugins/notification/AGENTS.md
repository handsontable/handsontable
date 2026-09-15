# Notification plugin — non-blocking toasts

The `notification` plugin shows toast messages anchored to the grid root. Read this before touching
`notification.ts`, `ui.ts` or `constants.ts`.

## Root instances only

`isEnabled()` is `isRootInstance(this.hot) && !!getSettings()[PLUGIN_KEY]`, like `../dialog/`,
`../emptyDataState/` and `../loading/`. The host element is `hot.rootOverlaysElement` — the fixed overlays
layer, **not** a layout slot.

## Accessibility is the design, not a feature

- Toasts carry `aria-live` and **do not take keyboard focus when they appear**. That is the point of a
  non-blocking notification; anything that grabs focus on show is a regression.
- **F6** moves focus into the notification region. **Tab / Shift+Tab** move between controls, **Escape**
  leaves, and a programmatic `hide()` restores focus like Escape when the last toast closes while focus is
  in the region.

### The multi-instance F6 rule

With several grids on one page, **each grid only handles F6 for its own focus scope** — otherwise every
instance would activate at once. The exception: when focus is outside every `.ht-root-wrapper`, **exactly
one** grid may claim F6, and only if it is the only grid on the page. With multiple roots and focus outside
all of them, F6 does nothing until focus is in a grid.

The wired guard is `#shouldRunNotificationF6Shortcut()`, which calls
`#shouldThisInstanceHandleF6ForActiveElement()` internally. **One shortcut object is registered on two
contexts** (`#registerNotificationShortcuts`): `plugin:notification:global` (`scope: 'global'`) and the
**core `grid` context** (`GRID_SCOPE`, from `shortcuts/contexts/constants`) when it exists. The global one
is what makes F6 reachable while focus is outside the grid.

The plugin's own `plugin:notification` context carries **Escape and Tab only — not F6.** Changing the
multi-instance rule there changes nothing; edit the shared shortcut object and its `runOnlyIf` instead.

## `stackLimit` queues rather than drops

`DEFAULT_SETTINGS` is `{ stackLimit: 10, animation: true }`. When a position already shows `stackLimit`
toasts, the new one is **pushed onto that position's queue** and its id is still returned. So a caller's id
is always valid, whether the toast mounted or is waiting.

Queues are per position (`POSITION_SET` from `NOTIFICATION_POSITIONS`), not global.

## `showMessage()` validates by throwing, and normalizes before the hook

`#normalizeOptions` throws (`throwWithCause`) unless it gets an object whose `message` is a string or an
`HTMLElement`. It then assigns an id (`htn-<random>`) and resolves variant and position.

**Normalization happens before `beforeNotificationShow`**, so a listener sees the resolved options and a
veto (`return false`) costs nothing. The method returns `''` on a veto and the id otherwise — do not change
that to `null`.

## Action button types are normalized here, not validated

Unlike `../dialog/` and `../emptyDataState/`, this plugin has **no button-type entry in
`SETTINGS_VALIDATORS`**; `#normalizeOptions` normalizes action types instead (omit `type` for secondary).
Render sites still go through `isButtonType()` / `resolveButtonType()` from `helpers/uiButton.ts` — never
inline `['primary', 'secondary']`. The reasoning is in `../dialog/AGENTS.md`.

## `#lastEffectiveNotificationOptions` skips needless rebuilds

`SETTING_KEYS` includes the plugin key, so `updateSettings({ ...getSettings(), somethingElse })` reaches
this plugin with the `notification` key present but unchanged. The snapshot of the effective
`{ stackLimit, animation }` after the last enable is what lets `updatePlugin()` skip tearing down the UI —
which would otherwise dismiss live toasts on an unrelated settings change.

That pattern matters for the framework wrappers: React re-sends unchanged keys on every commit.

## Timers

The countdown ticks every `TICK_MS = 200`, and a toast carries a `paused` flag plus
`toastEventDisposers`. Use `hot._registerTimeout`, never a raw `setTimeout` — and null the disposers on
teardown, or a hidden toast keeps its listeners.

## Where to look next

- Sibling overlay surfaces: `../dialog/AGENTS.md`, `../emptyDataState/AGENTS.md`, `../loading/AGENTS.md`.
- The plugin that raises notifications on a server-backed grid: `../dataProvider/AGENTS.md` (it imports
  `NotificationMessageOptions` from here).
- Focus scopes and shortcut contexts: `../../shortcuts/contexts/`, `../../core/`.
- Plugin contract, lifecycle, priorities: `../base/AGENTS.md`.

## Testing

- `npm run test:e2e --prefix handsontable -- --testPathPattern='notification'`
- `npm run test:unit --prefix handsontable -- --testPathPattern='notification'`
