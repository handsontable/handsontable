---
name: refactoring
description: Use when refactoring Handsontable code - applying SOLID principles, Law of Demeter, plugin extraction, performance optimization, code modernization, and API redesign with backward compatibility preservation
---

## Convention over Configuration

Prefer conventions that work with zero configuration for the common case. When refactoring, eliminate config that duplicates what naming, location, or type conventions already express. Do not introduce new options or wiring when auto-discovery or lifecycle hooks can handle it.

## SOLID Principles in Handsontable

- **Single Responsibility:** Each plugin handles one concern. If a plugin is doing two things (e.g. data fetching and rendering), extract the second concern into its own plugin.
- **Open/Closed:** Extend behavior through hooks and the plugin system, not by modifying existing plugin internals. New logic should listen for hooks and react.
- **Liskov Substitution:** Every plugin must honor the BasePlugin contract -- implement the lifecycle methods (`isEnabled`, `enablePlugin`, `disablePlugin`, `updatePlugin`, `destroy`) and declare required static properties.
- **Interface Segregation:** Keep public plugin APIs narrow. Do not expose internal state or helper methods. If external access is needed, expose a focused method through `hot.getPlugin('{Name}')`.
- **Dependency Inversion:** Depend on hooks and abstract interfaces, not concrete plugins. Use `hot.getPlugin('{Name}')` when you need another plugin's API. Never import a plugin class directly.

## Law of Demeter

Avoid deep access chains like `this.hot.view.wt.wtTable.holder`. Each layer should only talk to its immediate neighbors. If you find yourself reaching through multiple objects, introduce a method on the intermediate layer that provides what you need.

## Refactoring Patterns

**Plugin extraction:** When logic in `core.js` or a large plugin grows beyond a single responsibility, move it into a dedicated plugin. Register new hooks so the extracted plugin communicates without tight coupling.

**Performance:**
- Replace `arr.push(...largeArray)` with a `forEach` loop -- spread causes stack overflow with 10k+ elements.
- Batch render cycles using `batch()`, `batchRender()`, `suspendRender()`/`resumeRender()`.
- Reduce DOM reads and writes. Batch scroll-related work inside `requestAnimationFrame`.

**Modernization:**
- Use `#privateFields` instead of `@private` JSDoc annotations (exception: when `#` measurably hurts performance).
- Use arrow-function class fields for hook and event callbacks instead of `.bind(this)`.
- Use optional chaining (`?.`) only when a value is genuinely optional by design, not as a blanket safety net.

**API redesign:** When renaming or replacing an API, keep the old name working. See the backward compatibility section below.

## Breaking Changes Protection

These rules are non-negotiable when refactoring:

| Rule | Detail |
|------|--------|
| Never change default setting values | Defaults in `metaSchema.js` must stay the same. |
| Keep legacy CSS class names | Add new class names alongside old ones. Old names stay in the DOM. |
| Keep legacy API names working | Old method/option/hook names continue to work with no console warnings (this is "legacy", not "deprecated"). |
| Deprecated APIs get one-time warning | Use `deprecatedWarn()` from `src/helpers/console.js`. The old API works until the next major release. |
| Removed hooks go on the removed list | So users see a clear error instead of silent failure. |

## Clarity and Maintainability

- Keep cognitive complexity at 15 or below per function (Sonar metric). Extract helpers or use early-return guards when a function exceeds this limit.
- Favor clarity over cleverness. A slightly longer but readable solution is better than a compact but obscure one.
- Reuse existing helpers from `src/helpers/`. Check what already exists before writing new utility functions.
- Follow the established method ordering: public methods first, then private listeners.

## Testing After Refactoring

Refactored code must maintain full test coverage. For every change:

- **Unit tests** (`*.unit.js`): test extracted helpers, strategies, and pure logic in isolation.
- **E2E tests** (`*.spec.js`): verify the feature still works end-to-end in the browser. All `it()` callbacks must be `async`.
- **Backward compatibility tests**: verify that legacy API names, CSS classes, and option names still work after the refactor.
- **Performance tests**: for data-heavy paths, add unit tests with 50k+ rows to catch regressions.
