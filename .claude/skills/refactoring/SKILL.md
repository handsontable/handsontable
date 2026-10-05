---
name: refactoring
description: Use when refactoring Handsontable code - applying SOLID principles, Law of Demeter, plugin extraction, performance optimization, code modernization, and API redesign with backward compatibility preservation
---

## Conventions over configuration

Eliminate config that naming, location, or type conventions already express. Use auto-discovery or lifecycle hooks in place of new options or wiring.

## Handsontable specifics

- **Single responsibility:** one concern per plugin; extract a second concern into its own plugin.
- **Open/closed:** extend through hooks and the plugin system; new logic listens for hooks.
- **Liskov:** honor the BasePlugin contract (`isEnabled`, `enablePlugin`, `disablePlugin`, `updatePlugin`, `destroy`, required static properties).
- **Interface segregation:** keep public plugin APIs narrow; expose a focused method through `hot.getPlugin('{Name}')`.
- **Dependency inversion:** depend on hooks; reach another plugin's API through `hot.getPlugin('{Name}')`, never by importing its class.
- **Law of Demeter:** replace chains like `this.hot.view.wt.wtTable.holder` with a method on the intermediate layer.

## Patterns

- **Plugin extraction:** when logic in `core.js` or a large plugin outgrows one responsibility, move it to a dedicated plugin that communicates through new hooks.
- **Performance:**
  - `forEach` loop in place of `arr.push(...largeArray)` (stack overflow at 10k+ elements).
  - Batch render cycles with `batch()`, `batchRender()`, `suspendRender()`/`resumeRender()`.
  - Batch scroll-related work in `requestAnimationFrame`.
- **Modernization:**
  - `#privateFields` in place of `@private` JSDoc (exception: when `#` measurably hurts performance).
  - Arrow-function class fields for hook and event callbacks in place of `.bind(this)`.
  - `?.` only for values optional by design.
- **API redesign:** keep the old name working (table below).

## Breaking changes protection

| Rule | Detail |
|------|--------|
| Default setting values stay unchanged | Defaults in `metaSchema.ts`. |
| Keep legacy CSS class names | Add new names alongside old ones; old names stay in the DOM. |
| Legacy API names keep working with no console warning | "Legacy", not "deprecated". |
| Deprecated APIs get a one-time warning | `deprecatedWarn()` from `src/helpers/console.ts`; works until the next major release. |
| Removed hooks go on the removed list | Users get a clear error instead of silent failure. |

## Maintainability

- Cognitive complexity at most 15 per function (Sonar); extract helpers or use early returns above it.
- Reuse helpers from `src/helpers/` before writing new ones.
- Method order: public methods first, then private listeners.

## Tests after refactoring

- **Unit** (`*.unit.js`): extracted helpers, strategies, pure logic.
- **E2E** (`*.spec.js`): feature still works in the browser; `it()` callbacks are `async`.
- **Backward compatibility:** legacy API names, CSS classes, and option names still work.
- **Performance:** for data-heavy paths, unit tests with 50k+ rows.
