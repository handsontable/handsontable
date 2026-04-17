# Codebase Structure

## Directory Layout

```
handsontable-develop/
├── handsontable/               # Core data grid package (vanilla JS)
│   ├── src/                    # Source code
│   ├── test/                   # E2E tests and test infrastructure
│   ├── types/                  # Hand-authored TypeScript .d.ts definitions
│   ├── dist/                   # UMD/minified build output
│   ├── tmp/                    # ES/CJS module build output (used by wrappers)
│   ├── styles/                 # Compiled CSS output
│   ├── languages/              # Compiled language files
│   ├── .config/                # Rspack configs (the `.config/` name predates the Webpack→Rspack switch)
│   ├── scripts/                # Build scripts
│   ├── dev.html                # Dev playground (LTR)
│   ├── dev-rtl.html            # Dev playground (RTL)
│   └── dev-ltr-rtl.html        # Dev playground (both)
├── wrappers/
│   ├── react-wrapper/          # @handsontable/react-wrapper
│   ├── angular-wrapper/        # @handsontable/angular-wrapper
│   └── vue3/                   # @handsontable/vue3
├── docs/                       # Astro Starlight documentation site (Node 20)
├── examples/                   # Code examples
├── visual-tests/               # Playwright visual regression tests
├── .changelogs/                # Changelog entry mechanism
├── bin/                        # CLI tools (changelog)
├── scripts/                    # Monorepo-level scripts
├── resources/                  # Shared resources
├── .github/                    # GitHub workflows and CI
├── hot.config.js               # Build environment variables
├── pnpm-workspace.yaml         # pnpm workspace definition
├── package.json                # Root package.json (pnpm 10.30.2)
├── babel.config.js             # Root Babel config
├── .eslintrc.js                # Root ESLint config
├── .eslintignore               # ESLint ignore patterns
├── browser-targets.js          # Supported browser targets
├── .nvmrc                      # Node.js version (22)
└── CHANGELOG.md                # Release changelog
```

## Core Source Directory (`handsontable/src/`)

```
handsontable/src/
├── core.js                     # Core class (~5656 lines) - main public API
├── base.js                     # Tree-shakeable entry point (minimal)
├── index.js                    # Full entry point (registers all modules)
├── registry.js                 # Aggregated registerAll*() for all module types
├── tableView.js                # Bridge between Core and Walkontable
├── editorManager.js            # Manages cell editor lifecycle
├── eventManager.js             # Centralized DOM event listener management
│
├── core/                       # Core submodules
│   ├── hooks/                  # Hooks (event bus) system
│   │   ├── index.js            # Hooks class (singleton)
│   │   ├── bucket.js           # HooksBucket storage
│   │   └── constants.js        # REGISTERED_HOOKS, REMOVED_HOOKS, DEPRECATED_HOOKS
│   ├── coordsMapper/           # CellRange to renderable coordinate mapping
│   └── viewportScroll/         # Viewport scroll management
│
├── plugins/                    # All feature plugins (~40 plugins)
│   ├── base/                   # BasePlugin abstract class
│   │   └── base.js             # Plugin lifecycle template
│   ├── registry.js             # Plugin registry (register/get/getNames)
│   ├── index.js                # Barrel export + registerAllPlugins()
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
│   ├── registry.js             # Editor registry
│   ├── factory.js              # Editor factory
│   └── index.js                # Barrel export + registerAllEditors()
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
│   ├── registry.js             # Renderer registry
│   ├── factory.js              # Renderer factory
│   └── index.js                # Barrel export + registerAllRenderers()
│
├── validators/                 # Cell value validators
│   ├── autocompleteValidator/  # Autocomplete validation
│   ├── dateValidator/          # Date validation
│   ├── numericValidator/       # Numeric validation
│   ├── timeValidator/          # Time validation
│   ├── registry.js             # Validator registry
│   └── index.js                # Barrel export + registerAllValidators()
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
│   ├── registry.js             # Cell type registry
│   └── index.js                # Barrel export + registerAllCellTypes()
│
├── dataMap/                    # Data management layer
│   ├── dataMap.js              # DataMap - row/column data access
│   ├── dataSource.js           # DataSource - raw data wrapper
│   ├── replaceData.js          # Data replacement logic
│   ├── sourceDataValidator.js  # Source data validation
│   ├── metaManager/            # Cascading metadata system
│   │   ├── index.js            # MetaManager class
│   │   ├── metaSchema.js       # Default meta schema (all settings defaults)
│   │   ├── lazyFactoryMap.js   # Lazy map for meta objects
│   │   ├── metaLayers/         # Four meta layers
│   │   │   ├── globalMeta.js   # Global defaults (prototype)
│   │   │   ├── tableMeta.js    # Table-level overrides (instance)
│   │   │   ├── columnMeta.js   # Column-level overrides (prototype)
│   │   │   └── cellMeta.js     # Cell-level overrides (instance)
│   │   ├── mods/               # Meta modifier modules
│   │   │   ├── dynamicCellMeta.js     # Dynamic cell meta from `cells()` function
│   │   │   └── extendMetaProperties.js # Extends meta with type-resolved properties
│   │   └── utils.js            # Meta utilities
│   └── index.js                # Barrel export
│
├── translations/               # Index mapping (3 coordinate systems)
│   ├── indexMapper.js           # IndexMapper - main translation class
│   ├── maps/                    # Map implementations
│   │   ├── hidingMap.js         # HidingMap (hidden but in DataMap)
│   │   ├── trimmingMap.js       # TrimmingMap (removed from DataMap)
│   │   ├── indexesSequence.js   # IndexesSequence (ordering)
│   │   └── ...                  # PhysicalIndexToValueMap, LinkedPhysicalIndexToValueMap
│   ├── mapCollections/          # Map collection types
│   │   ├── mapCollection.js     # MapCollection base
│   │   └── aggregatedCollection.js # AggregatedCollection (aggregates multiple maps)
│   ├── changesObservable/       # Observable for index changes
│   └── index.js                 # Barrel export
│
├── selection/                  # Selection management
│   ├── selection.js            # Selection class (main)
│   ├── range.js                # SelectionRange data layer
│   ├── highlight/              # Selection highlight rendering
│   │   └── highlight.js        # Highlight class with type constants
│   ├── transformation/         # Selection transformation modules
│   │   ├── extender.js         # ExtenderTransformation (extend selection)
│   │   └── focus.js            # FocusTransformation (move focus)
│   ├── mouseEventHandler.js    # Mouse event -> selection actions
│   └── utils.js                # Selection utilities
│
├── 3rdparty/walkontable/       # Walkontable rendering engine
│   ├── src/
│   │   ├── core/               # Walkontable core classes
│   │   │   ├── _base.js        # Base Walkontable class
│   │   │   ├── core.js         # Main Walkontable core
│   │   │   └── clone.js        # Clone Walkontable (for overlays)
│   │   ├── facade/             # Facade pattern for external access
│   │   │   └── core.js         # Public Walkontable API
│   │   ├── table/              # Table implementations
│   │   │   ├── master.js       # Master (main) table
│   │   │   ├── top.js          # Top frozen overlay table
│   │   │   ├── bottom.js       # Bottom frozen overlay table
│   │   │   ├── inlineStart.js  # Left/right frozen overlay table
│   │   │   ├── topInlineStartCorner.js    # Top-left corner table
│   │   │   └── bottomInlineStartCorner.js # Bottom-left corner table
│   │   ├── overlay/            # Overlay system (frozen rows/cols)
│   │   │   ├── _base.js        # Base overlay
│   │   │   ├── top.js          # Top overlay
│   │   │   ├── bottom.js       # Bottom overlay
│   │   │   ├── inlineStart.js  # Inline-start (left/right) overlay
│   │   │   ├── topInlineStartCorner.js    # Corner overlays
│   │   │   └── bottomInlineStartCorner.js
│   │   ├── renderer/           # Low-level DOM renderers
│   │   │   ├── _base.js        # Base renderer
│   │   │   ├── table.js        # Table renderer orchestrator
│   │   │   ├── rows.js         # Row renderer
│   │   │   ├── cells.js        # Cell renderer
│   │   │   ├── columnHeaders.js # Column header renderer
│   │   │   ├── rowHeaders.js   # Row header renderer
│   │   │   └── colGroup.js     # ColGroup renderer
│   │   ├── calculator/         # Viewport calculators
│   │   ├── cell/               # CellCoords and CellRange
│   │   ├── selection/          # Selection rendering in Walkontable
│   │   ├── filter/             # Row/column filters for rendering
│   │   ├── utils/              # Walkontable utilities
│   │   ├── scroll.js           # Scroll position management
│   │   ├── viewport.js         # Viewport state
│   │   ├── overlays.js         # Overlay manager
│   │   ├── settings.js         # Walkontable settings adapter
│   │   ├── event.js            # Walkontable event handling
│   │   └── table.js            # Table abstraction
│   └── test/                   # Walkontable-specific tests
│
├── shortcuts/                  # Keyboard shortcut system
│   ├── manager.js              # ShortcutManager
│   ├── context.js              # ShortcutContext
│   ├── recorder.js             # Key recorder
│   ├── keyObserver.js          # Key observer
│   └── utils.js                # Shortcut utilities
│
├── shortcutContexts/           # Predefined shortcut contexts
│
├── focusManager/               # Focus management for accessibility
│   ├── index.js                # FocusGridManager, scope manager
│   ├── grid.js                 # Grid focus manager
│   ├── scope.js                # Focus scope
│   ├── scopeManager.js         # Scope manager
│   ├── scopes/                 # Predefined focus scopes
│   ├── eventListener.js        # Focus event listener
│   ├── constants.js            # Focus constants
│   └── utils/                  # Focus utilities
│
├── themes/                     # Theme system
│   ├── engine/                 # Theme engine (runtime)
│   ├── registry.js             # Theme registry
│   ├── static/                 # Static theme definitions
│   ├── theme/                  # Theme class
│   └── index.js                # Barrel export
│
├── styles/                     # SCSS source files
│   ├── handsontable.scss       # Main stylesheet
│   ├── handsontableStyles.js   # Style injection
│   ├── base/                   # Base styles
│   ├── components/             # Component styles
│   └── utils/                  # Style utilities
│
├── i18n/                       # Internationalization
│   ├── registry.js             # Language registry
│   └── utils.js                # i18n utilities
│
├── helpers/                    # Shared utility functions
│   ├── dom/                    # DOM helpers
│   │   ├── element.js          # Element manipulation (addClass, empty, etc.)
│   │   └── event.js            # Event helpers (isImmediatePropagationStopped, etc.)
│   ├── a11y.js                 # Accessibility ARIA helpers
│   ├── array.js                # Array utilities
│   ├── browser.js              # Browser detection
│   ├── console.js              # Console wrappers (use instead of raw console)
│   ├── constants.js            # Shared constants
│   ├── data.js                 # Data helpers (spreadsheetColumnLabel, etc.)
│   ├── dateTime.js             # Date/time utilities
│   ├── errors.js               # throwWithCause (use instead of throw new Error)
│   ├── feature.js              # Feature detection
│   ├── function.js             # Function utilities
│   ├── mixed.js                # Mixed type utilities
│   ├── moves.js                # Movement helpers
│   ├── number.js               # Number utilities (rangeEach, clamp)
│   ├── object.js               # Object utilities (deepClone, mixin, etc.)
│   ├── string.js               # String utilities
│   ├── templateLiteralTag.js   # Template literal helpers
│   ├── themes.js               # Theme helpers
│   ├── unicode.js              # Unicode/keyboard key helpers
│   └── wrappers/               # Framework wrappers (jQuery)
│
├── mixins/                     # Object mixins
│   ├── localHooks.js           # Local hooks mixin (used by IndexMapper, Selection, etc.)
│   └── hooksRefRegisterer.js   # Hooks reference registerer mixin
│
└── utils/                      # Utility classes
    ├── autoResize.js            # Auto-resize textarea utility
    ├── ghostTable.js            # Ghost table for measuring
    ├── interval.js              # Interval helper
    ├── paginator.js             # Pagination utility
    ├── parseTable.js            # HTML table parsing (instanceToHTML, etc.)
    ├── rootInstance.js          # Root instance management
    ├── samplesGenerator.js      # Sample data generator (for auto-sizing)
    ├── staticRegister.js        # Static registration utility
    ├── stylesHandler.js         # Runtime CSS style handler
    ├── valueAccessors.js        # Value getter/setter utilities
    ├── a11yAnnouncer.js         # Accessibility announcer
    └── dataStructures/          # Data structure utilities
        └── uniqueMap.js         # UniqueMap implementation
```

## Directory Purposes

**`handsontable/src/plugins/`:**
- Purpose: All grid features as self-contained plugins
- Contains: Each plugin in its own directory with `index.js` barrel export
- Key files: `base/base.js` (BasePlugin), `registry.js` (plugin registry)
- Convention: Each plugin directory exports `{ PLUGIN_KEY, PLUGIN_PRIORITY, PluginClassName }` from `index.js`

**`handsontable/src/3rdparty/walkontable/`:**
- Purpose: Self-contained rendering engine with its own test suite
- Contains: DOM rendering, viewport calculation, overlay management, scroll handling
- Key files: `src/facade/core.js` (public API), `src/core/core.js` (internal core)
- Note: Has its own test runner (`npm run test:walkontable`). Do not mix with main E2E tests.

**`handsontable/src/dataMap/metaManager/`:**
- Purpose: Cascading configuration through prototype chain
- Contains: Four meta layers, meta schema with all default settings, modifier mods

**`handsontable/types/`:**
- Purpose: Hand-authored TypeScript definitions for the public API
- Contains: `.d.ts` files only. Do NOT create `.ts` files in the core package.

## Key File Locations

**Entry Points:**
- `handsontable/src/index.js`: Full entry - registers all modules, used for UMD builds
- `handsontable/src/base.js`: Tree-shakeable entry - minimal registration, users add modules
- `handsontable/src/core.js`: Core constructor function (~5656 lines)
- `handsontable/src/registry.js`: Aggregated `registerAllModules()` function

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
- `handsontable/src/core.js`: All public API methods
- `handsontable/src/tableView.js`: Core-to-Walkontable bridge
- `handsontable/src/editorManager.js`: Editor lifecycle
- `handsontable/src/eventManager.js`: DOM event management
- `handsontable/src/dataMap/metaManager/metaSchema.js`: All default settings and their documentation

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
- Source files: `camelCase.js` (e.g., `dataMap.js`, `indexMapper.js`, `baseEditor/`)
- Test files: `*.unit.js` (Jest unit), `*.spec.js` (Jasmine E2E)
- Type files: `*.d.ts` in `handsontable/types/`, `*.types.ts` for type tests
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
- Implementation: `handsontable/src/plugins/myPlugin/myPlugin.js`
- Barrel export: `handsontable/src/plugins/myPlugin/index.js` (export `PLUGIN_KEY`, `PLUGIN_PRIORITY`, class)
- Register in: `handsontable/src/plugins/index.js` (add to `registerAllPlugins()`)
- E2E tests: `handsontable/src/plugins/myPlugin/__tests__/myPlugin.spec.js`
- Unit tests: `handsontable/src/plugins/myPlugin/__tests__/myPlugin.unit.js`
- Types: `handsontable/types/plugins/myPlugin/myPlugin.d.ts`

**New Editor:**
- Create directory: `handsontable/src/editors/myEditor/`
- Register in: `handsontable/src/editors/index.js`
- Types: `handsontable/types/editors/myEditor.d.ts`

**New Renderer:**
- Create directory: `handsontable/src/renderers/myRenderer/`
- Register in: `handsontable/src/renderers/index.js`

**New Cell Type:**
- Create directory: `handsontable/src/cellTypes/myType/`
- Register in: `handsontable/src/cellTypes/index.js`

**New Helper/Utility:**
- Shared helpers: `handsontable/src/helpers/myHelper.js`
- Utility classes: `handsontable/src/utils/myUtil.js`
- DOM helpers: `handsontable/src/helpers/dom/myDomHelper.js`

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

**`handsontable/types/`:**
- Purpose: Hand-authored TypeScript `.d.ts` definitions
- Generated: No (manually maintained)
- Committed: Yes

**`handsontable/languages/`:**
- Purpose: Compiled language dictionary files
- Generated: Yes (via build)
- Committed: Yes

**`node_modules/`:**
- Purpose: Dependencies
- Generated: Yes (via `pnpm install`)
- Committed: No
