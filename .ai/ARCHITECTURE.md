# Architecture

## Pattern Overview

**Overall:** Microkernel with plugin system and layered rendering engine

**Key Characteristics:**
- Constructor-function-based Core class (`Core`) that exposes the entire public API as instance methods
- Plugin system where all features extend `BasePlugin` and hook into the core via an event/hook bus
- Separate rendering engine (Walkontable) embedded as a "3rd party" module, bridged through `TableView`
- Three coordinate systems (physical, visual, renderable) managed by `IndexMapper`
- Cascading metadata system (GlobalMeta -> TableMeta -> ColumnMeta -> CellMeta) for configuration
- Registry pattern for all extensible components (plugins, editors, renderers, validators, cell types, themes)
- Two entry points: `base.js` (tree-shakeable, minimal) and `index.js` (full, registers everything)

## Layers

**Public API (Core):**
- Purpose: Exposes all grid methods (getData, setData, selectCell, updateSettings, etc.)
- Location: `handsontable/src/core.js` (~5656 lines)
- Contains: The `Core` constructor function with all public API methods defined on `this`
- Depends on: Every subsystem (Selection, DataMap, MetaManager, IndexMapper, TableView, EditorManager, Hooks, ShortcutManager, FocusManager, ThemeManager)
- Used by: Framework wrappers (React, Angular, Vue), end users

**View Layer (TableView + Walkontable):**
- Purpose: Bridges Core to the DOM rendering engine (Walkontable)
- Location: `handsontable/src/tableView.js` (TableView), `handsontable/src/3rdparty/walkontable/src/` (Walkontable)
- Contains: DOM element creation, event delegation (mouse/touch/keyboard), scroll handling, overlay management
- Depends on: Walkontable engine, Core instance for data callbacks
- Used by: Core (via `this.view`)

**Walkontable Rendering Engine:**
- Purpose: Low-level table rendering, viewport calculation, scroll synchronization, overlays for frozen rows/columns
- Location: `handsontable/src/3rdparty/walkontable/src/`
- Contains: Table renderers (`renderer/`), overlay managers (`overlay/`), viewport calculators (`calculator/`), cell/range coordinate primitives (`cell/`), scroll logic (`scroll.js`), selection rendering (`selection/`)
- Depends on: Settings object provided by TableView, DOM APIs
- Used by: TableView exclusively (via Facade pattern in `facade/core.js`)
- Key submodules:
  - `core/_base.js`, `core/core.js`, `core/clone.js` - Walkontable core and clone instances
  - `table/master.js` - Master table, `table/top.js`, `table/bottom.js`, etc. - Overlay tables
  - `overlay/` - 6 overlay types (top, bottom, inlineStart, topInlineStartCorner, bottomInlineStartCorner, plus base)
  - `calculator/` - Viewport row/column calculators
  - `renderer/` - Low-level cell/row/colgroup/header renderers
  - `scroll.js` - Scroll position management
  - `viewport.js` - Viewport state

**Data Layer (DataMap + DataSource):**
- Purpose: Manages source data, data transformations, and the mapping between data and grid cells
- Location: `handsontable/src/dataMap/`
- Contains: `DataMap` (row/column data access), `DataSource` (raw data wrapper), `replaceData` (data replacement logic), `sourceDataValidator` (validation)
- Depends on: MetaManager for cell metadata
- Used by: Core (via `datamap` and `dataSource` internal variables)

**Metadata Layer (MetaManager):**
- Purpose: Cascading configuration system - GlobalMeta -> TableMeta -> ColumnMeta -> CellMeta
- Location: `handsontable/src/dataMap/metaManager/`
- Contains: Four meta layers (`metaLayers/globalMeta.js`, `tableMeta.js`, `columnMeta.js`, `cellMeta.js`), meta schema (`metaSchema.js`), modifier mods (`mods/`)
- Depends on: Helpers
- Used by: Core, plugins (via `hot.getCellMeta()`, `hot.getSettings()`)
- Pattern: Prototype chain inheritance. GlobalMeta is the prototype of ColumnMeta, which is the prototype of CellMeta. TableMeta is a direct instance of GlobalMeta. This allows cascading: cell-level settings override column-level, which override table-level, which override global defaults.

**Index Translation Layer:**
- Purpose: Manages the three coordinate systems (physical, visual, renderable) and index maps (hiding, trimming)
- Location: `handsontable/src/translations/`
- Contains: `IndexMapper` (main class), `maps/` (HidingMap, TrimmingMap, IndexesSequence, PhysicalIndexToValueMap, LinkedPhysicalIndexToValueMap), `mapCollections/` (AggregatedCollection, MapCollection), `changesObservable/`
- Depends on: Helpers, mixins
- Used by: Core (`hot.rowIndexMapper`, `hot.columnIndexMapper`), plugins that modify row/column visibility

**Selection Layer:**
- Purpose: Manages cell/range selection, multi-selection, focus, and selection transformations
- Location: `handsontable/src/selection/`
- Contains: `Selection` class (`selection.js`), `SelectionRange` (`range.js`), `Highlight` system (`highlight/`), transformation modules (`transformation/`), mouse event handler (`mouseEventHandler.js`), utilities (`utils.js`)
- Depends on: IndexMapper (for coordinate translation), Walkontable Selection (for rendering highlights)
- Used by: Core (via `selection` internal variable), EditorManager, plugins

**Plugin System:**
- Purpose: All grid features are implemented as plugins that extend `BasePlugin`
- Location: `handsontable/src/plugins/`
- Contains: 40+ plugins, each in its own directory with an `index.js` barrel export
- Depends on: Core (via `this.hot`), Hooks system, IndexMapper
- Used by: Core instantiates all registered plugins
- Key plugins: `autoColumnSize`, `autoRowSize`, `columnSorting`, `dataProvider`, `filters`, `formulas`, `hiddenColumns`, `hiddenRows`, `mergeCells`, `nestedHeaders`, `nestedRows`, `notification`, `undoRedo`, `contextMenu`, `copyPaste`, `comments`, `stretchColumns`
- **DataProvider and error UI:** With a complete `dataProvider` configuration, failed `fetchRows` or `onRowsCreate` / `onRowsUpdate` / `onRowsRemove` (including refetch after a mutation) can show a built-in **error toast** when the **Notification** plugin is enabled (`notification: true` or a config object). **Fetch** failures add a **Refetch** action that calls `fetchData()` again (toast uses `duration: 0` until dismissed or Refetch). The **Dialog** plugin is not used for those errors; Dialog remains for blocking overlays (for example Loading plugin, ExportFile binary export progress, and custom modal content).

**Hooks System:**
- Purpose: Event bus for inter-component communication (before/after patterns)
- Location: `handsontable/src/core/hooks/`
- Contains: `Hooks` class (singleton), `HooksBucket`, hook constants (`constants.js` with REGISTERED_HOOKS, REMOVED_HOOKS, DEPRECATED_HOOKS)
- Depends on: Helpers
- Used by: Core, all plugins, EditorManager, Selection
- Pattern: Global singleton + per-instance buckets. Hooks can be added globally or per-instance. Plugins use `this.addHook()` (auto-cleaned on disable) vs `this.hot.addHook()` (manual cleanup).

**Editor System:**
- Purpose: Manages cell editors (text input, dropdown, date picker, etc.)
- Location: `handsontable/src/editors/`, `handsontable/src/editorManager.js`
- Contains: `EditorManager` (orchestrates editor lifecycle), `BaseEditor` (abstract base), 15+ editor types
- Depends on: Selection (to know which cell is active), MetaManager (for cell type config)
- Used by: Core

**Renderer System:**
- Purpose: Cell rendering functions that produce HTML content for cells
- Location: `handsontable/src/renderers/`
- Contains: `baseRenderer`, `textRenderer`, `numericRenderer`, `checkboxRenderer`, `htmlRenderer`, etc.
- Depends on: MetaManager (for cell configuration)
- Used by: Walkontable (calls renderer functions during table render)

**Validator System:**
- Purpose: Cell value validation
- Location: `handsontable/src/validators/`
- Contains: `autocompleteValidator`, `dateValidator`, `numericValidator`, `timeValidator`, etc.
- Used by: Core (triggered on data changes)

**Cell Type System:**
- Purpose: Bundles an editor + renderer + validator into a named cell type
- Location: `handsontable/src/cellTypes/`
- Contains: Composite types like `textType`, `numericType`, `checkboxType`, `dateType`, `dropdownType`, etc.
- Used by: MetaManager (resolves cell type to editor/renderer/validator)

**Shortcut System:**
- Purpose: Keyboard shortcut management with context-based scoping
- Location: `handsontable/src/shortcuts/` (manager, recorder, context), `handsontable/src/shortcutContexts/` (predefined contexts)
- Used by: Core, plugins

**Focus Management:**
- Purpose: Manages browser focus and focus scoping for accessibility
- Location: `handsontable/src/focusManager/`
- Contains: `FocusGridManager`, scope manager, predefined scopes
- Used by: Core

**Theme System:**
- Purpose: CSS theme management with CSS variables
- Location: `handsontable/src/themes/` (engine, registry, static themes), `handsontable/src/styles/` (SCSS sources)
- Contains: Theme engine (`engine/`), theme registry (`registry.js`), static theme definitions (`static/`), theme class (`theme/`)
- Used by: Core (via `stylesHandler` and `themeManager`)

## Data Flow

**Initialization Flow:**

1. User calls `new Handsontable(element, settings)` which calls `base.js` -> `Core(element, settings, rootInstanceSymbol)`
2. Core creates: `MetaManager`, `IndexMapper` (row + column), `DataSource`, `Selection`, `EditorManager`, `ShortcutManager`, `FocusGridManager`, `StylesHandler`, `ThemeManager`
3. Core creates `TableView` which creates `Walkontable` instance
4. All registered plugins are instantiated (each calls `constructor(hotInstance)`)
5. `afterPluginsInitialized` hook fires, each plugin's `isEnabled()` is checked, and `enablePlugin()` called if true
6. `init()` triggers initial data load and render

**Render Flow:**

1. Core calls `this.view.render()` (or plugin triggers render via hooks)
2. `TableView` delegates to Walkontable's `draw()` method
3. Walkontable calculates visible viewport using `ViewportRowsCalculator` and `ViewportColumnsCalculator`
4. Walkontable iterates visible rows/columns, calls renderer functions from the renderer registry for each cell
5. Each overlay (top frozen, left frozen, corner) renders its own clone table synchronized with the master table
6. Selection highlights are rendered via Walkontable's `Selection` rendering system

**Data Change Flow:**

1. User edits a cell or calls `setDataAtCell(row, col, value)`
2. Core fires `beforeChange` hook (plugins can modify/cancel)
3. `DataMap.set()` updates the source data
4. Core fires `afterChange` hook
5. If validation is configured, `validateCells()` runs validators
6. `render()` is called to update the DOM

**Settings Update Flow:**

1. User calls `updateSettings(newSettings)`
2. Core fires `beforeUpdateSettings` hook
3. `MetaManager` updates cascading meta layers
4. Each plugin's `onUpdateSettings()` is called; if the changed key is in `SETTING_KEYS`, `updatePlugin()` runs
5. Core fires `afterUpdateSettings` hook
6. Re-render

**Coordinate Translation Flow:**

1. User provides visual coordinates (e.g., `selectCell(2, 3)`)
2. Core uses `rowIndexMapper.getRenderableFromVisualIndex()` to get renderable index for DOM operations
3. Core uses `rowIndexMapper.getPhysicalFromVisualIndex()` to get physical index for data operations
4. Plugins like `hiddenRows`/`hiddenColumns` register `HidingMap` instances that affect visual-to-renderable translation
5. Plugins like `trimRows` register `TrimmingMap` instances that affect physical-to-visual translation

**State Management:**
- Source data: Held in `DataSource` (reference to user's array/object)
- Cell metadata: Cascading prototype chain in `MetaManager`
- Index state: `IndexMapper` with registered `HidingMap`/`TrimmingMap` instances per plugin
- Selection state: `Selection` class with `SelectionRange` tracking visual coordinates
- Plugin state: Each plugin manages its own internal state

## Key Abstractions

**CellCoords / CellRange:**
- Purpose: Coordinate and range primitives used throughout the codebase
- Examples: `handsontable/src/3rdparty/walkontable/src/cell/coords.js`, `handsontable/src/3rdparty/walkontable/src/cell/range.js`
- Pattern: Value objects with methods like `isEqual()`, `includes()`, `getTopStartCorner()`, etc.

**IndexMapper:**
- Purpose: Single source of truth for row/column index translations between physical, visual, and renderable coordinate systems
- Examples: `handsontable/src/translations/indexMapper.js`
- Pattern: Maintains collections of maps (trimming, hiding, value) and caches translations. Plugins register named maps.

**BasePlugin:**
- Purpose: Abstract base for all plugin implementations with standardized lifecycle
- Examples: `handsontable/src/plugins/base/base.js`
- Pattern: Template method pattern with `isEnabled()` -> `enablePlugin()` -> `updatePlugin()` -> `disablePlugin()` -> `destroy()`

**Hooks (Event Bus):**
- Purpose: Decoupled communication between Core, plugins, and user code
- Examples: `handsontable/src/core/hooks/index.js`
- Pattern: Observer/pub-sub with global singleton and per-instance buckets. Supports ordered callbacks via `orderIndex`.

**MetaManager (Cascading Config):**
- Purpose: Configuration inheritance chain from global defaults to individual cell settings
- Examples: `handsontable/src/dataMap/metaManager/index.js`
- Pattern: Prototype-chain inheritance: GlobalMeta (prototype) -> ColumnMeta (prototype) -> CellMeta (instance). TableMeta is a separate instance of GlobalMeta.

**Registry Pattern:**
- Purpose: Dynamic registration and lookup of components by string key
- Examples: `handsontable/src/plugins/registry.js`, `handsontable/src/editors/registry.js`, `handsontable/src/renderers/registry.js`, `handsontable/src/validators/registry.js`, `handsontable/src/cellTypes/registry.js`, `handsontable/src/themes/registry.js`
- Pattern: Map-based registries with `register()` / `get()` / `getNames()` methods. The `registry.js` module in `src/` aggregates all `registerAll*()` calls.

## Entry Points

**Full Entry (`index.js`):**
- Location: `handsontable/src/index.js`
- Triggers: `registerAllModules()` which registers all editors, renderers, validators, cell types, and plugins
- Responsibilities: Creates the full Handsontable namespace with all modules pre-registered. Used for UMD/CDN builds.

**Base Entry (`base.js`):**
- Location: `handsontable/src/base.js`
- Triggers: Registers only `TextCellType` and `baseRenderer` (minimal defaults)
- Responsibilities: Tree-shakeable entry point. Users import and register only needed modules.

**Core Constructor:**
- Location: `handsontable/src/core.js` (exported as `Core`)
- Triggers: Called by `Handsontable()` wrapper in `base.js`
- Responsibilities: Instantiates all subsystems, creates DOM structure, sets up hooks

## Error Handling

**Strategy:** Custom error helper with cause tracking

**Patterns:**
- Use `throwWithCause(message, cause)` from `handsontable/src/helpers/errors.js` instead of `throw new Error()`. Enforced by ESLint rule `handsontable/no-native-error-throw`.
- Hooks use before/after pattern where `before*` hooks can return `false` to cancel operations
- Validators use callback pattern (async-capable): `validator(value, callback)` where `callback(true/false)` signals validity
- Console warnings use helpers from `handsontable/src/helpers/console.js` (never raw `console`)

## Cross-Cutting Concerns

**Logging:** Via `handsontable/src/helpers/console.js` helpers (`warn`, `log`, `error`). Raw `console` is banned by ESLint.

**Validation:** Cell validators in `handsontable/src/validators/`. Source data validators in `handsontable/src/dataMap/sourceDataValidator.js`. Triggered on data changes and via `validateCells()` API.

**Authentication:** Not applicable (frontend-only library, no auth).

**Internationalization:** `handsontable/src/i18n/` with language dictionaries and a registry. RTL layout support via `layoutDirection` setting and `isRtl()`/`isLtr()` Core methods.

**Accessibility:** ARIA attributes applied via helpers in `handsontable/src/helpers/a11y.js`. Announcer utility in `handsontable/src/utils/a11yAnnouncer.js`. Focus management in `handsontable/src/focusManager/`. Two navigation modes: spreadsheet mode and data grid mode.

**DOM Abstraction:** All DOM access goes through `handsontable/src/helpers/dom/element.js` and `handsontable/src/helpers/dom/event.js`. Global `window`/`document` are banned; use `this.hot.rootWindow`/`this.hot.rootDocument`.

**Event Management:** `handsontable/src/eventManager.js` provides centralized DOM event listener management with automatic cleanup.
