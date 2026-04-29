---
id: 5a27e806
title: Recipes
metaTitle: Recipes - JavaScript Data Grid | Handsontable
description: Step-by-step tutorials for common Handsontable development tasks - custom cell types, themes, data management, filtering, import/export, and more.
permalink: /recipes/
canonicalUrl: /recipes/
searchCategory: Recipes
react:
  id: 1ae45a27
  metaTitle: Recipes - React Data Grid | Handsontable
angular:
  id: d2815b7b
  metaTitle: Recipes - Angular Data Grid | Handsontable
---

Recipes are step-by-step tutorials that walk you through solving a specific Handsontable development task. Each recipe shows a working example and explains the key concepts so you can adapt the solution to your own project.

## Cell types

Build custom cell editors, renderers, and validators using third-party libraries or your own components.

- [Color picker](@/content/recipes/cell-types/color-picker/color-picker.md) - Integrate the Pickr library as a custom color picker cell editor with hex validation.
- [Star rating](@/content/recipes/cell-types/rating/rating.md) - Build an SVG star rating cell using `editorFactory` and `rendererFactory` with no external libraries.
- [Feedback](@/content/recipes/cell-types/feedback/feedback.md) - Create emoji feedback buttons for quick user input using Handsontable's `editorFactory` helper.
- [Flatpickr date picker](@/content/recipes/cell-types/flatpickr/flatpickr.md) - Integrate Flatpickr as a custom date editor with per-column locale and format configuration.
- [Pikaday date picker](@/content/recipes/cell-types/pikaday/pikaday.md) - Integrate Pikaday with Moment.js formatting as a migration path from the built-in date cell type.
- [Moment.js date](@/content/recipes/cell-types/moment-date/moment-date.md) - Create a custom date cell type with format auto-correction using Moment.js and Pikaday.
- [Moment.js time](@/content/recipes/cell-types/moment-time/moment-time.md) - Create a custom time cell type with format validation using Moment.js.
- [Numbro](@/content/recipes/cell-types/numbro/numbro.md) - Create locale-aware numeric formatting with the Numbro library.

## Themes

Recipe categories include [cell types](@/recipes/cell-types/cell-types.md), [themes](@/recipes/themes/themes.md), and [rendering and styling](@/recipes/rendering-styling/rendering-styling.md).

- [Handsontable with Ant Design](@/content/recipes/themes/ant-design/ant-design.md) - Map Ant Design tokens to Handsontable Theme API parameters in a React app.
- [Handsontable with MUI](@/content/recipes/themes/mui-theme/mui-theme.md) - Match Material UI colors, typography, and spacing in a React app.
- [Handsontable with Fluent UI](@/content/recipes/themes/fluent-ui/fluent-ui.md) - Follow Fluent UI design tokens in a React app.
- [Handsontable with shadcn/ui](@/content/recipes/themes/custom-theme/custom-theme.md) - Integrate with shadcn/ui and Tailwind CSS, including dark mode support.
- [Handsontable with Base Web](@/content/recipes/themes/base-theme/base-theme.md) - Map Base Web design tokens to the Handsontable Theme API.

- [Editing and validation recipes](@/recipes/editing-validation/editing-validation.md) - Custom editors, validation patterns, and dynamic cell configuration.
### For AI Agents

Control how cells look using custom renderers, CSS classes, and row-level styling.

- [Conditional row coloring](@/content/recipes/rendering-styling/conditional-row-coloring/conditional-row-coloring.md) - Color entire rows from a status column using the `cells` callback and CSS classes.
- [Frozen summary row](@/content/recipes/rendering-styling/frozen-summary-row/frozen-summary-row.md) - Pin a read-only totals row at the bottom with `fixedRowsBottom`.
- [Sparkline cell renderer](@/content/recipes/rendering-styling/sparkline-cell-renderer/sparkline-cell-renderer.md) - Draw inline SVG bar charts from arrays of numbers in individual cells.

- [Import from CSV or Excel](@/recipes/import-export/import-csv-excel/import-csv-excel.md) - Client-side CSV (PapaParse) and `.xlsx` (SheetJS) import with header preview.
## Contributing

Load, save, sync, and undo data in Handsontable grids.

- [Load data from a REST API](@/content/recipes/data-management/load-data-rest-api/load-data-rest-api.md) - Fetch JSON from a REST API with loading and error state feedback.
- [Load data from a GraphQL API](@/content/recipes/data-management/load-data-graphql/load-data-graphql.md) - Fetch GraphQL data with both client-side and server-side DataProvider approaches.
- [Auto-save changes to a backend](@/content/recipes/data-management/auto-save-backend/auto-save-backend.md) - Debounce `afterChange` to send dirty rows to a backend automatically.
- [Sync two grids](@/content/recipes/data-management/sync-two-grids/sync-two-grids.md) - Propagate edits from a master grid to a detail grid in real time.
- [Undo/redo with a custom UI](@/content/recipes/data-management/undo-redo-custom-ui/undo-redo-custom-ui.md) - Build external Undo and Redo buttons that stay in sync with the undo stack.

### Server-side data

Connect Handsontable to backend frameworks using the `dataProvider` plugin for server-driven pagination, sorting, filtering, and CRUD.

- [Django](@/content/recipes/data-management/server-side-django/server-side-django.md)
- [Laravel](@/content/recipes/data-management/server-side-laravel/server-side-laravel.md)
- [NestJS](@/content/recipes/data-management/server-side-nestjs/server-side-nestjs.md)
- [Ruby on Rails](@/content/recipes/data-management/server-side-rails/server-side-rails.md)
- [Spring Boot](@/content/recipes/data-management/server-side-spring/server-side-spring.md)

## Editing and validation

Build dependent dropdowns, row-level validation, and other editing patterns.

- [Dependent dropdowns](@/content/recipes/editing-validation/dependent-dropdowns/dependent-dropdowns.md) - Drive a child column dropdown from a parent column using a dependency map.
- [Row validation with error summary](@/content/recipes/editing-validation/row-validation-error-summary/row-validation-error-summary.md) - Validate all rows on Submit and list failures in an external error summary.

## Filtering and search

Add external search inputs and filter panels that control the Handsontable `Search` and `Filters` plugins.

- [External search box](@/content/recipes/filtering-and-search/external-search-box/external-search-box.md) - Highlight matching cells in real time from an input outside the grid.
- [Highlight search matches](@/content/recipes/filtering-and-search/highlight-search-matches/highlight-search-matches.md) - Wrap matching text in `<mark>` tags using a custom renderer.
- [Multi-column filter panel](@/content/recipes/filtering-search/multi-column-filter-panel/multi-column-filter-panel.md) - Control filtering through an external panel with a category dropdown and price range.

## Import and export

Load data from files and export grid content to common formats.

- [Import from CSV or Excel](@/content/recipes/import-export/import-csv-excel/import-csv-excel.md) - Parse CSV and XLSX files in the browser with PapaParse and SheetJS.
- [Export to PDF](@/content/recipes/import-export/export-to-pdf/export-to-pdf.md) - Generate a downloadable PDF with jsPDF and jspdf-autotable.

## Performance

Optimize rendering and persist user preferences across sessions.

- [Lazy loading with pagination](@/content/recipes/performance/lazy-loading/lazy-loading.md) - Load rows page by page as the user scrolls using `afterScrollVertically`.
- [Persist column layout](@/content/recipes/performance/persist-column-layout/persist-column-layout.md) - Save and restore column widths and order to localStorage.

## Real-time and integrations

Sync the grid with WebSockets, charts, and other live data sources.

- [Real-time WebSocket updates](@/content/recipes/real-time/websocket-updates/websocket-updates.md) - Update individual cells from a WebSocket stream with `setDataAtCell`.
- [Sync rows to a Chart.js chart](@/content/recipes/real-time/chartjs-sync/chartjs-sync.md) - Reflect selected grid rows in a Chart.js bar chart using `afterSelectionEnd`.

## Accessibility

Make Handsontable grids keyboard-friendly and screen reader-compatible.

- [ARIA-friendly grid](@/content/recipes/accessibility/aria-grid/aria-grid.md) - Enable ARIA roles, aria-label on cells, and aria-sort on headers for WCAG 2.1 AA compliance.
- [Custom keyboard shortcuts](@/content/recipes/accessibility/keyboard-shortcuts/keyboard-shortcuts.md) - Register custom shortcuts with the ShortcutManager API.

## Column management

Control column visibility and freezing at runtime.

- [Column visibility](@/content/recipes/column-management/column-visibility/column-visibility.md) - Show and hide columns dynamically through an external control.
- [Freeze columns](@/content/recipes/column-management/freeze-columns/freeze-columns.md) - Pin columns to the left edge with `fixedColumnsStart`.

## Context menu

Extend the right-click menu with custom items and row operations.

- [Custom context menu](@/content/recipes/context-menu/custom-context-menu/custom-context-menu.md) - Add custom items and submenus to the Handsontable context menu.
- [Row operations](@/content/recipes/context-menu/row-operations/row-operations.md) - Add insert-above, insert-below, and delete-row commands to the context menu.
