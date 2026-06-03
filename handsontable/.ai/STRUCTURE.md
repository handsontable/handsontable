# Core Package Structure

This document covers the core `handsontable/` package only. For the top-level monorepo tree and the workspace/package map, see `.ai/STRUCTURE.md` (repo root).

## Core Source Directory (`handsontable/src/`)

```
handsontable/src/
├── core.ts                     # Core class (~5656 lines) - main public API
├── base.ts                     # Tree-shakeable entry point (minimal)
├── index.ts                    # Full entry point (registers all modules)
├── registry.ts                 # Aggregated registerAll*() for all module types
├── tableView.ts                # Bridge between Core and Walkontable
├── editorManager.ts            # Manages cell editor lifecycle
├── eventManager.ts             # Centralized DOM event listener management
│
├── core/                       # Core submodules
│   ├── hooks/                  # Hooks (event bus) system
│   │   ├── index.ts            # Hooks class (singleton)
│   │   ├── bucket.ts           # HooksBucket storage
│   │   └── constants.ts        # REGISTERED_HOOKS, REMOVED_HOOKS, DEPRECATED_HOOKS
│   ├── coordsMapper/           # CellRange to renderable coordinate mapping
│   └── viewportScroll/         # Viewport scroll management
│
├── plugins/                    # All feature plugins (~40 plugins)
│   ├── base/                   # BasePlugin abstract class
│   │   └── base.ts             # Plugin lifecycle template
│   ├── registry.ts             # Plugin registry (register/get/getNames)
│   ├── index.ts                # Barrel export + registerAllPlugins()
│   ├── autoColumnSize/         # Auto column sizing
│   ├── autoRowSize/            # Auto row sizing
│   ├── autofill/               # Drag-to-fill
│   ├── bindRowsWithHeaders/    # Row-header binding
│   ├── collapsibleColumns/     # Column collapsing (nested headers)
│   ├── columnSorting/          # Single-column sorting
│   ├── columnSummary/          # Column summary calculations
│   ├── comments/               # Cell comments
│   ├── contextMenu/            # Right-click context menu
│   ├── copyPaste/              # Copy/paste support
│   ├── customBorders/          # Custom cell borders
│   ├── dataProvider/           # Server-backed fetchRows + CRUD
│   ├── dialog/                 # Dialog/modal support
│   ├── dragToScroll/           # Drag-to-scroll viewport
│   ├── dropdownMenu/           # Column header dropdown menus
│   ├── emptyDataState/         # Empty state display
│   ├── exportFile/             # CSV export
│   ├── filters/                # Column filters
│   ├── formulas/               # HyperFormula integration
│   ├── hiddenColumns/          # Column hiding
│   ├── hiddenRows/             # Row hiding
│   ├── loading/                # Loading indicator
│   ├── manualColumnFreeze/     # Manual column freezing
│   ├── manualColumnMove/       # Column drag-to-move
│   ├── manualColumnResize/     # Column drag-to-resize
│   ├── manualRowMove/          # Row drag-to-move
│   ├── manualRowResize/        # Row drag-to-resize
│   ├── mergeCells/             # Cell merging
│   ├── multiColumnSorting/     # Multi-column sorting
│   ├── multipleSelectionHandles/ # Mobile selection handles
│   ├── nestedHeaders/          # Multi-level column headers
│   ├── nestedRows/             # Hierarchical row data
│   ├── notification/           # Toast notifications
│   ├── pagination/             # Data pagination
│   ├── search/                 # Cell search
│   ├── stretchColumns/         # Column stretching strategies
│   │   └── strategies/         # 'all' and 'last' strategies
│   ├── touchScroll/            # Touch device scrolling
│   ├── trimRows/               # Row trimming (removes from DataMap)
│   └── undoRedo/               # Undo/redo support
│
├── editors/                    # Cell editor implementations
│   ├── baseEditor/             # Abstract BaseEditor class
│   ├── textEditor/             # Text input editor (base for most editors)
│   ├── autocompleteEditor/     # Autocomplete dropdown
│   ├── checkboxEditor/         # Checkbox toggle
│   ├── dateEditor/             # Date picker
│   ├── dropdownEditor/         # Dropdown select
│   ├── handsontableEditor/     # Embedded Handsontable editor
│   ├── intlDateEditor/         # Internationalized date editor
│   ├── intlTimeEditor/         # Internationalized time editor
│   ├── multiSelectEditor/      # Multi-select editor
│   ├── numericEditor/          # Numeric input
│   ├── passwordEditor/         # Password input
│   ├── selectEditor/           # Native select editor
│   ├── timeEditor/             # Time input
│   ├── registry.ts             # Editor registry
│   ├── factory.ts              # Editor factory
│   └── index.ts                # Barrel export + registerAllEditors()
│
├── renderers/                  # Cell renderer functions
│   ├── baseRenderer/           # Base decorator renderer
│   ├── textRenderer/           # Text cell renderer
│   ├── autocompleteRenderer/   # Autocomplete cell renderer
│   ├── checkboxRenderer/       # Checkbox renderer
│   ├── dateRenderer/           # Date renderer
│   ├── htmlRenderer/           # HTML content renderer
│   ├── numericRenderer/        # Numeric renderer
│   ├── passwordRenderer/       # Password mask renderer
│   ├── registry.ts             # Renderer registry
│   ├── factory.ts              # Renderer factory
│   └── index.ts                # Barrel export + registerAllRenderers()
│
├── validators/                 # Cell value validators
│   ├── autocompleteValidator/  # Autocomplete validation
│   ├── dateValidator/          # Date validation
│   ├── numericValidator/       # Numeric validation
│   ├── timeValidator/          # Time validation
│   ├── registry.ts             # Validator registry
│   └── index.ts                # Barrel export + registerAllValidators()
│
├── cellTypes/                  # Composite cell types (editor+renderer+validator)
│   ├── textType/               # Default text type
│   ├── numericType/            # Numeric type
│   ├── checkboxType/           # Checkbox type
│   ├── dateType/               # Date type
│   ├── dropdownType/           # Dropdown type
│   ├── autocompleteType/       # Autocomplete type
│   ├── handsontableType/       # Embedded grid type
│   ├── intlDateType/           # Internationalized date type
│   ├── intlTimeType/           # Internationalized time type
│   ├── multiSelectType/        # Multi-select type
│   ├── passwordType/           # Password type
│   ├── selectType/             # Select type
│   ├── timeType/               # Time type
│   ├── registry.ts             # Cell type registry
│   └── index.ts                # Barrel export + registerAllCellTypes()
│
├── dataMap/                    # Data management layer
│   ├── dataMap.ts              # DataMap - row/column data access
│   ├── dataSource.ts           # DataSource - raw data wrapper
│   ├── replaceData.ts          # Data replacement logic
│   ├── sourceDataValidator.ts  # Source data validation
│   ├── metaManager/            # Cascading metadata system
│   │   ├── index.ts            # MetaManager class
│   │   ├── metaSchema.ts       # Default meta schema (all settings defaults)
│   │   ├── lazyFactoryMap.ts   # Lazy map for meta objects
│   │   ├── metaLayers/         # Four meta layers
│   │   │   ├── globalMeta.ts   # Global defaults (prototype)
│   │   │   ├── tableMeta.ts    # Table-level overrides (instance)
│   │   │   ├── columnMeta.ts   # Column-level overrides (prototype)
│   │   │   └── cellMeta.ts     # Cell-level overrides (instance)
│   │   ├── mods/               # Meta modifier modules
│   │   │   ├── dynamicCellMeta.ts     # Dynamic cell meta from `cells()` function
│   │   │   └── extendMetaProperties.ts # Extends meta with type-resolved properties
│   │   └── utils.ts            # Meta utilities
│   └── index.ts                # Barrel export
│
├── translations/               # Index mapping (3 coordinate systems)
│   ├── indexMapper.ts           # IndexMapper - main translation class
│   ├── maps/                    # Map implementations
│   │   ├── hidingMap.ts         # HidingMap (hidden but in DataMap)
│   │   ├── trimmingMap.ts       # TrimmingMap (removed from DataMap)
│   │   ├── indexesSequence.ts   # IndexesSequence (ordering)
│   │   └── ...                  # PhysicalIndexToValueMap, LinkedPhysicalIndexToValueMap
│   ├── mapCollections/          # Map collection types
│   │   ├── mapCollection.ts     # MapCollection base
│   │   └── aggregatedCollection.ts # AggregatedCollection (aggregates multiple maps)
│   ├── changesObservable/       # Observable for index changes
│   └── index.ts                 # Barrel export
│
├── selection/                  # Selection management
│   ├── selection.ts            # Selection class (main)
│   ├── range.ts                # SelectionRange data layer
│   ├── highlight/              # Selection highlight rendering
│   │   └── highlight.ts        # Highlight class with type constants
│   ├── transformation/         # Selection transformation modules
│   │   ├── extender.ts         # ExtenderTransformation (extend selection)
│   │   └── focus.ts            # FocusTransformation (move focus)
│   ├── mouseEventHandler.ts    # Mouse event -> selection actions
│   └── utils.ts                # Selection utilities
│
├── 3rdparty/walkontable/       # Walkontable rendering engine
│   ├── src/
│   │   ├── core/               # Walkontable core classes
│   │   │   ├── _base.ts        # Base Walkontable class
│   │   │   ├── core.ts         # Main Walkontable core
│   │   │   └── clone.ts        # Clone Walkontable (for overlays)
│   │   ├── facade/             # Facade pattern for external access
│   │   │   └── core.ts         # Public Walkontable API
│   │   ├── table/              # Table implementations
│   │   │   ├── master.ts       # Master (main) table
│   │   │   ├── top.ts          # Top frozen overlay table
│   │   │   ├── bottom.ts       # Bottom frozen overlay table
│   │   │   ├── inlineStart.ts  # Left/right frozen overlay table
│   │   │   ├── topInlineStartCorner.ts    # Top-left corner table
│   │   │   └── bottomInlineStartCorner.ts # Bottom-left corner table
│   │   ├── overlay/            # Overlay system (frozen rows/cols)
│   │   │   ├── _base.ts        # Base overlay
│   │   │   ├── top.ts          # Top overlay
│   │   │   ├── bottom.ts       # Bottom overlay
│   │   │   ├── inlineStart.ts  # Inline-start (left/right) overlay
│   │   │   ├── topInlineStartCorner.ts    # Corner overlays
│   │   │   └── bottomInlineStartCorner.ts
│   │   ├── renderer/           # Low-level DOM renderers
│   │   │   ├── _base.ts        # Base renderer
│   │   │   ├── table.ts        # Table renderer orchestrator
│   │   │   ├── rows.ts         # Row renderer
│   │   │   ├── cells.ts        # Cell renderer
│   │   │   ├── columnHeaders.ts # Column header renderer
│   │   │   ├── rowHeaders.ts   # Row header renderer
│   │   │   └── colGroup.ts     # ColGroup renderer
│   │   ├── calculator/         # Viewport calculators
│   │   ├── cell/               # CellCoords and CellRange
│   │   ├── selection/          # Selection rendering in Walkontable
│   │   ├── filter/             # Row/column filters for rendering
│   │   ├── utils/              # Walkontable utilities
│   │   ├── scroll.ts           # Scroll position management
│   │   ├── viewport.ts         # Viewport state
│   │   ├── overlays.ts         # Overlay manager
│   │   ├── settings.ts         # Walkontable settings adapter
│   │   ├── event.ts            # Walkontable event handling
│   │   └── table.ts            # Table abstraction
│   └── test/                   # Walkontable-specific tests
│
├── shortcuts/                  # Keyboard shortcut system
│   ├── manager.ts              # ShortcutManager
│   ├── context.ts              # ShortcutContext
│   ├── recorder.ts             # Key recorder
│   ├── keyObserver.ts          # Key observer
│   └── utils.ts                # Shortcut utilities
│
├── shortcutContexts/           # Predefined shortcut contexts
│
├── focusManager/               # Focus management for accessibility
│   ├── index.ts                # FocusGridManager, scope manager
│   ├── grid.ts                 # Grid focus manager
│   ├── scope.ts                # Focus scope
│   ├── scopeManager.ts         # Scope manager
│   ├── scopes/                 # Predefined focus scopes
│   ├── eventListener.ts        # Focus event listener
│   ├── constants.ts            # Focus constants
│   └── utils/                  # Focus utilities
│
├── themes/                     # Theme system
│   ├── engine/                 # Theme engine (runtime)
│   ├── registry.ts             # Theme registry
│   ├── static/                 # Static theme definitions
│   ├── theme/                  # Theme class
│   └── index.ts                # Barrel export
│
├── styles/                     # SCSS source files
│   ├── handsontable.scss       # Main stylesheet
│   ├── handsontableStyles.ts   # Style injection
│   ├── base/                   # Base styles
│   ├── components/             # Component styles
│   └── utils/                  # Style utilities
│
├── i18n/                       # Internationalization
│   ├── registry.ts             # Language registry
│   └── utils.ts                # i18n utilities
│
├── helpers/                    # Shared utility functions
│   ├── dom/                    # DOM helpers
│   │   ├── element.ts          # Element manipulation (addClass, empty, etc.)
│   │   └── event.ts            # Event helpers (isImmediatePropagationStopped, etc.)
│   ├── a11y.ts                 # Accessibility ARIA helpers
│   ├── array.ts                # Array utilities
│   ├── browser.ts              # Browser detection
│   ├── console.ts              # Console wrappers (use instead of raw console)
│   ├── constants.ts            # Shared constants
│   ├── data.ts                 # Data helpers (spreadsheetColumnLabel, etc.)
│   ├── dateTime.ts             # Date/time utilities
│   ├── errors.ts               # throwWithCause (use instead of throw new Error)
│   ├── feature.ts              # Feature detection
│   ├── function.ts             # Function utilities
│   ├── mixed.ts                # Mixed type utilities
│   ├── moves.ts                # Movement helpers
│   ├── number.ts               # Number utilities (rangeEach, clamp)
│   ├── object.ts               # Object utilities (deepClone, mixin, etc.)
│   ├── string.ts               # String utilities
│   ├── templateLiteralTag.ts   # Template literal helpers
│   ├── themes.ts               # Theme helpers
│   ├── unicode.ts              # Unicode/keyboard key helpers
│   └── wrappers/               # Framework wrappers (jQuery)
│
├── mixins/                     # Object mixins
│   ├── localHooks.ts           # Local hooks mixin (used by IndexMapper, Selection, etc.)
│   └── hooksRefRegisterer.ts   # Hooks reference registerer mixin
│
└── utils/                      # Utility classes
    ├── autoResize.ts            # Auto-resize textarea utility
    ├── ghostTable.ts            # Ghost table for measuring
    ├── interval.ts              # Interval helper
    ├── paginator.ts             # Pagination utility
    ├── parseTable.ts            # HTML table parsing (instanceToHTML, etc.)
    ├── rootInstance.ts          # Root instance management
    ├── samplesGenerator.ts      # Sample data generator (for auto-sizing)
    ├── staticRegister.ts        # Static registration utility
    ├── stylesHandler.ts         # Runtime CSS style handler
    ├── valueAccessors.ts        # Value getter/setter utilities
    ├── a11yAnnouncer.ts         # Accessibility announcer
    └── dataStructures/          # Data structure utilities
        └── uniqueMap.ts         # UniqueMap implementation
```

## Directory Purposes

**`handsontable/src/plugins/`:**
- Purpose: All grid features as self-contained plugins
- Contains: Each plugin in its own directory with `index.ts` barrel export
- Key files: `base/base.ts` (BasePlugin), `registry.ts` (plugin registry)
- Convention: Each plugin directory exports `{ PLUGIN_KEY, PLUGIN_PRIORITY, PluginClassName }` from `index.ts`

**`handsontable/src/3rdparty/walkontable/`:**
- Purpose: Self-contained rendering engine with its own test suite
- Contains: DOM rendering, viewport calculation, overlay management, scroll handling
- Key files: `src/facade/core.ts` (public API), `src/core/core.ts` (internal core)
- Note: Has its own test runner (`npm run test:walkontable`). Do not mix with main E2E tests.

**`handsontable/src/dataMap/metaManager/`:**
- Purpose: Cascading configuration through prototype chain
- Contains: Four meta layers, meta schema with all default settings, modifier mods

**`handsontable/tmp/`:**
- Purpose: Auto-generated TypeScript definitions for the public API (`.d.ts`) plus ES/CJS module output consumed by wrapper packages.
- Contains: `.d.ts` files (from `tsc --emitDeclarationOnly`) and module output. Do not hand-edit — regenerate with `npm run build:types` after changing source.

## Key File Locations

**Entry Points:**
- `handsontable/src/index.ts`: Full entry - registers all modules, used for UMD builds
- `handsontable/src/base.ts`: Tree-shakeable entry - minimal registration, users add modules
- `handsontable/src/core.ts`: Core constructor function (~5656 lines)
- `handsontable/src/registry.ts`: Aggregated `registerAllModules()` function

**Configuration:**
- `hot.config.js`: Build environment variables (HOT_VERSION, HOT_BUILD_DATE, etc.)
- `handsontable/rspack.config.js`: Main Rspack config (entry loader that dispatches to `.config/` per `NODE_ENV`)
- `handsontable/.config/`: Additional Rspack configs (base, languages, styles, themes, e2e, etc.)
- `handsontable/babel.config.js`: Babel config
- `handsontable/jest.config.js`: Jest config for unit tests
- `.eslintrc.js`: Root ESLint config
- `handsontable/.eslintrc.js`: Package-level ESLint config
- `browser-targets.js`: Supported browser list
- `.nvmrc`: Node.js version (22)

**Core Logic:**
- `handsontable/src/core.ts`: All public API methods
- `handsontable/src/tableView.ts`: Core-to-Walkontable bridge
- `handsontable/src/editorManager.ts`: Editor lifecycle
- `handsontable/src/eventManager.ts`: DOM event management
- `handsontable/src/dataMap/metaManager/metaSchema.ts`: All default settings and their documentation

**Testing:**
- `handsontable/test/e2e/`: E2E test specs (Jasmine/Puppeteer)
- `handsontable/test/helpers/`: Test helper functions (globally available in specs)
- `handsontable/test/bootstrap.js`: Test environment bootstrap
- `handsontable/test/types/`: TypeScript type tests
- `handsontable/src/**/__tests__/`: Co-located unit tests (Jest) and some E2E specs
- `visual-tests/`: Playwright visual regression tests
- `handsontable/src/3rdparty/walkontable/test/`: Walkontable-specific tests

## Naming Conventions

**Files:**
- Source files: `camelCase.ts` (e.g., `dataMap.ts`, `indexMapper.ts`, `baseEditor/`). Walkontable is also `camelCase.ts`.
- Test files: `*.unit.js` (Jest unit), `*.spec.js` (Jasmine E2E)
- Type files: generated `*.d.ts` in `handsontable/tmp/`, `*.types.ts` for type tests
- Plugin directories: `camelCase` matching the plugin key (e.g., `hiddenColumns/`, `contextMenu/`)

**Directories:**
- Plugin directories: `camelCase` (e.g., `autoColumnSize/`, `manualRowMove/`)
- Feature modules: `camelCase` (e.g., `dataMap/`, `focusManager/`, `shortcutContexts/`)
- Walkontable subdirectories: `camelCase` (e.g., `calculator/`, `renderer/`, `overlay/`)

**Exports:**
- Plugin barrel files export: `{ PLUGIN_KEY, PLUGIN_PRIORITY, PluginClassName }`
- Registry modules export: `register*`, `get*`, `getRegistered*Names`
- Editor/renderer/validator directories: `camelCase` directory name, `PascalCase` class name

## Where to Add New Code

**New Plugin:**
- Create directory: `handsontable/src/plugins/myPlugin/`
- Implementation: `handsontable/src/plugins/myPlugin/myPlugin.ts`
- Barrel export: `handsontable/src/plugins/myPlugin/index.ts` (export `PLUGIN_KEY`, `PLUGIN_PRIORITY`, class)
- Register in: `handsontable/src/plugins/index.ts` (add to `registerAllPlugins()`)
- E2E tests: `handsontable/src/plugins/myPlugin/__tests__/myPlugin.spec.js`
- Unit tests: `handsontable/src/plugins/myPlugin/__tests__/myPlugin.unit.js`
- Types: auto-generated in `handsontable/tmp/` via `npm run build:types`

**New Editor:**
- Create directory: `handsontable/src/editors/myEditor/`
- Register in: `handsontable/src/editors/index.ts`
- Types: auto-generated in `handsontable/tmp/` via `npm run build:types`

**New Renderer:**
- Create directory: `handsontable/src/renderers/myRenderer/`
- Register in: `handsontable/src/renderers/index.ts`

**New Cell Type:**
- Create directory: `handsontable/src/cellTypes/myType/`
- Register in: `handsontable/src/cellTypes/index.ts`

**New Helper/Utility:**
- Shared helpers: `handsontable/src/helpers/myHelper.ts`
- Utility classes: `handsontable/src/utils/myUtil.ts`
- DOM helpers: `handsontable/src/helpers/dom/myDomHelper.ts`

**New Walkontable Feature:**
- Implementation: `handsontable/src/3rdparty/walkontable/src/`
- Tests: `handsontable/src/3rdparty/walkontable/test/`
- Note: Walkontable has its own test runner, separate from main E2E

**New Framework Wrapper Feature:**
- React: `wrappers/react-wrapper/src/`
- Angular: `wrappers/angular-wrapper/projects/hot-table/src/lib/`
- Vue 3: `wrappers/vue3/src/`

## Special Directories

**`handsontable/dist/`:**
- Purpose: UMD and minified bundle output
- Generated: Yes (via build)
- Committed: Yes (published to npm)

**`handsontable/tmp/`:**
- Purpose: ES and CJS module output consumed by wrapper packages via workspace linking
- Generated: Yes (via build)
- Committed: No

**`handsontable/styles/`:**
- Purpose: Compiled CSS output (themes, base styles)
- Generated: Yes (via build from `src/styles/`)
- Committed: Yes (published to npm)

**`handsontable/languages/`:**
- Purpose: Compiled language dictionary files
- Generated: Yes (via build)
- Committed: Yes

**`node_modules/`:**
- Purpose: Dependencies
- Generated: Yes (via `pnpm install`)
- Committed: No
