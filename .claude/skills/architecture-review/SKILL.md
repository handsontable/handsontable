---
name: architecture-review
description: Use when reviewing code changes for architectural quality - SOLID principles, Law of Demeter, plugin decoupling, coordinate system correctness, breaking changes policy, and design patterns. Reference implementation is the Pagination plugin.
---

# Architecture Review

## Purpose

Review staged or changed code for architectural correctness within the Handsontable codebase. Verify that changes follow established design patterns, maintain plugin isolation, and do not introduce breaking changes.

## SOLID Principles Applied to Handsontable

- **Single Responsibility:** Each plugin has one clear purpose. UI rendering is separated from business logic. Do not combine unrelated concerns in a single class.
- **Open/Closed:** Extend behavior through hooks and the plugin API. Never modify another plugin's internals to add functionality.
- **Liskov Substitution:** All plugins must honor the BasePlugin contract - implement lifecycle methods (`isEnabled`, `enablePlugin`, `disablePlugin`, `destroy`) and declare static properties (`PLUGIN_KEY`, `PLUGIN_PRIORITY`, `SETTING_KEYS`).
- **Interface Segregation:** Keep plugin APIs narrow. Expose only what external consumers need. Internal helpers stay private.
- **Dependency Inversion:** Depend on hooks (abstractions), not concrete plugin references. Use `hot.getPlugin('Name')` when direct API access is unavoidable.

## Law of Demeter

No deep property chains like `this.hot.view.wt.wtTable`. Each architectural layer has its own API surface - use it. If you need data from Walkontable, go through `TableView` or the public `Core` API.

## Plugin Decoupling

- No direct cross-plugin imports. Plugins must not `import` from another plugin's files.
- Use hooks for event-driven communication between plugins.
- If another plugin's API is required, access it via `hot.getPlugin('PluginName')`.
- No circular dependencies between plugins.

## Conflict Ownership

The plugin that introduces an incompatibility owns the blocking logic. Other plugins must NOT contain awareness checks like `if (dataProviderEnabled) return;` - that logic belongs in the conflicting plugin. Compatibility tests also belong with the owning plugin, not the affected one. For hard conflicts, use `registerConflict()` from `src/plugins/base/conflictRegistry.ts` at module load time.

## Configuration Compatibility

New options should support Handsontable's cascading configuration model (`cell` -> `column` -> `global`) when applicable. Some options are intentionally table-level only (e.g., `data`, `colHeaders`) - document this limitation in JSDoc when so.

## Coordinate System Correctness

Verify the correct coordinate type at every usage site:

- **Physical** - position in the source data array. Use for data read/write.
- **Visual** - position in DataMap after trimming. Use for display logic.
- **Renderable** - position in the DOM after hiding. Use for DOM manipulation.

Translate between systems using `hot.rowIndexMapper` / `hot.columnIndexMapper`. Mixing coordinate types is a common source of bugs, especially with `manualColumnMove` and filters.

## Breaking Changes Policy

Review every change against these rules:

- **Renamed CSS class?** The legacy class name must remain in the DOM. Add tests verifying the old name.
- **Renamed API (method, option, hook)?** The legacy name must keep working. No console warnings for legacy APIs.
- **Changed API behavior?** Deprecated API must work until the next stable release with a one-time console warning.
- **Changed a default setting value?** This is **strictly forbidden**. Never change defaults.
- **Removed a hook or option?** Add it to the removed hooks list so an error is shown at runtime.

## Convention over Configuration

New features should work correctly with zero configuration for the common case. Configuration should only be required when the user explicitly wants to deviate from the established convention.

**Red flags - fail the review if present:**
- A new option whose value is always the same in all usages (should be the default)
- A new directory that breaks the existing folder taxonomy without architectural justification
- Logic that requires explicit wiring where auto-discovery or a lifecycle hook could handle it
- A workaround or duplicated logic caused by not following the naming/location convention
- Config options that encode what a file name, directory location, or type string already expresses

## Gold Standard Reference

The Pagination plugin (`src/plugins/pagination/`) demonstrates the expected patterns for plugin structure, lifecycle management, settings validation, and conflict registration. Use it as a reference when reviewing new or modified plugins.

## References

- `.ai/ARCHITECTURE.md` for full system architecture details.
- `.ai/CONCERNS.md` for known issues and technical debt.
- `src/plugins/base/base.ts` for the BasePlugin contract.
- `src/plugins/base/conflictRegistry.ts` for conflict registration API.
