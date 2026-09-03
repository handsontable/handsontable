# TouchScroll plugin — hiding the overlays during a momentum scroll

The `touchScroll` plugin makes touch scrolling look right by **fading the frozen overlays out while the
finger drags and back in when the momentum settles**. Read this before touching `touchScroll.ts` — it is
the whole plugin, ~200 lines.

It does not implement scrolling. The browser scrolls natively; this plugin only manages the overlay clones
so they do not lag behind the master table mid-gesture.

## `isEnabled()` ignores the settings entirely

```js
isEnabled() { return isTouchSupported(); }
```

`SETTING_KEYS` is `true`, so it reacts to every `updateSettings()` call — but **there is no `touchScroll`
option to switch it off.** On a touch device it is always on; on a desktop it never runs. Anything you add
here is dead code on desktop.

## The overlay collection is cached, and `lockedCollection` is the cache

`#onAfterViewRender` collects the scrollbars and clones **once** and sets `lockedCollection = true`, so
later renders skip the walk. `updatePlugin()` is the only thing that clears the flag — that is the entire
invalidation strategy.

Two shapes in that collection, and they are not interchangeable:

- **`scrollbars`** — overlay objects, refreshed after the scroll. `bottomOverlay` and
  `bottomInlineStartCornerOverlay` are included **only when they have a `clone`**; the top and inline-start
  overlays always are.
- **`clones`** — the clone holders' **parent nodes**, gated on `needFullRender` (except the corner overlays,
  which are gated on existence). These are what get the CSS classes.

Corner overlays are created **lazily**, which is why every corner access is guarded. Do not simplify those
guards away.

## The fade is three classes and one timeout

| Moment | Action |
|---|---|
| `beforeTouchScroll` | `freezeOverlays = true`; add `hide-tween` to every clone |
| `afterMomentumScroll` | `freezeOverlays = false`; swap `hide-tween` → `show-tween` |
| +400 ms | remove `show-tween` |

`freezeOverlays` is read by Walkontable to decide whether to reposition the overlays mid-scroll.

Then, still in `afterMomentumScroll`, each scrollbar gets `refresh()` **and** `resetFixedPosition()`, and
finally `wtOverlays.syncScrollWithMaster()`. All three are needed: the first two fix each overlay's own
geometry, the last realigns them with the master's scroll position.

The 400 ms cleanup goes through `hot._registerTimeout()`, never a raw `setTimeout` — it must auto-clear on
`destroy()`.

## Zero test coverage

`../../../.ai/CONCERNS.md` records this plugin as a **test coverage gap**: two source files, no test files,
touch-specific scrolling behavior entirely untested. Risk: mobile scroll regressions go undetected.

So there is no safety net here. A change needs a real device or an emulated-touch harness, and the
mandatory-test rule still applies — new coverage should be Playwright
(`../../../../tests/AGENTS.md`).

## Where to look next

- The overlay system this plugin manipulates: `../../3rdparty/walkontable/AGENTS.md` (`overlays.ts` and
  `overlay/`).
- The other touch-specific plugin, and the touch-event rules in general:
  `../multipleSelectionHandles/AGENTS.md`.
- Auto-scroll during a drag: `../dragToScroll/AGENTS.md`.
- Plugin contract, lifecycle, priorities: `../base/AGENTS.md`.

## Testing

There is no existing suite to run. Walkontable has its own pipeline
(`npm run test:walkontable --prefix handsontable`) — do **not** mix Walkontable tests with the main E2E
tests.
