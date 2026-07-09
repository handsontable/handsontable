# Vue demos & sandboxes — validation checklist

Task: [DEV-1219](https://app.clickup.com/t/86c98ke4b) — Validate all Vue documentation examples and sandboxes.

- **Scope:** every Vue example embedded in the docs guides (248 examples across 79 pages).
- **Docs link:** production (`handsontable.com/docs`, v18.0) where the example is already released — 230 examples. The remaining 18 exist only on `develop` and are linked to the staging build (`handsontable-docs-staging.pages.dev`), marked *(dev)*.
- **Sandbox:** sandboxes are not static URLs — each example generates its StackBlitz project on the fly and POSTs it to `stackblitz.com/run`. To verify a sandbox by hand, open the docs link and click the ⚡ **Edit on StackBlitz** button on that example.

## Automated verification results

Both columns were verified automatically from the `develop` branch (same content that ships to prod):

- **Docs OK** — the locally built docs site was driven with Playwright/Chromium: each page loaded, each example waited for its Vue component to mount, and a rendered Handsontable grid was asserted inside the example container, with uncaught page errors captured. ✅ = rendered with data, ⚠️ = mounted but needs a manual look, ❌ = did not render.
- **Sandbox OK** — the exact StackBlitz project that the ⚡ button generates (Vite 5 + `@vitejs/plugin-vue`, published `handsontable@18.0.0` + `@handsontable/vue3@18.0.0` from npm) was assembled for every example and built with `vite build`. ✅ = builds, ❌ = build error (would break in StackBlitz). Note: the Vue sandbox pipeline does no TypeScript type-checking (Vite strips types), so type-only issues cannot fail it.

**Results: Docs 246 ✅ / 2 ⚠️ / 0 ❌ · Sandbox 246 ✅ / 2 ❌**

## Getting started


### Demo

| Demo | Docs link | Docs OK | Sandbox (StackBlitz) | Sandbox OK |
|---|---|:---:|---|:---:|
| Demo (`example3`) | [demo/#example3](https://handsontable.com/docs/vue-data-grid/demo/#example3) | ✅ | ⚡ button — builds | ✅ |

### Installation

| Demo | Docs link | Docs OK | Sandbox (StackBlitz) | Sandbox OK |
|---|---|:---:|---|:---:|
| Preview the result (`example1`) | [installation/#example1](https://handsontable.com/docs/vue-data-grid/installation/#example1) | ✅ | ⚡ button — builds | ✅ |

### Configuration options

| Demo | Docs link | Docs OK | Sandbox (StackBlitz) | Sandbox OK |
|---|---|:---:|---|:---:|
| Example (`example1`) | [configuration-options/#example1](https://handsontable.com/docs/vue-data-grid/configuration-options/#example1) | ✅ | ⚡ button — builds | ✅ |
| Example (`example2`) | [configuration-options/#example2](https://handsontable.com/docs/vue-data-grid/configuration-options/#example2) | ✅ | ⚡ button — builds | ✅ |
| Example (`example3`) | [configuration-options/#example3](https://handsontable.com/docs/vue-data-grid/configuration-options/#example3) | ✅ | ⚡ button — builds | ✅ |
| Example (`example4`) | [configuration-options/#example4](https://handsontable.com/docs/vue-data-grid/configuration-options/#example4) | ✅ | ⚡ button — builds | ✅ |
| Solution (`example6`) | [configuration-options/#example6](https://handsontable.com/docs/vue-data-grid/configuration-options/#example6) | ✅ | ⚡ button — builds | ✅ |

### Grid size

| Demo | Docs link | Docs OK | Sandbox (StackBlitz) | Sandbox OK |
|---|---|:---:|---|:---:|
| Compare size units (`example2`) | [grid-size/#example2](https://handsontable-docs-staging.pages.dev/docs/vue-data-grid/grid-size/#example2) *(dev)* | ✅ | ⚡ button — builds | ✅ |
| Manual resizing (`example`) | [grid-size/#example](https://handsontable.com/docs/vue-data-grid/grid-size/#example) | ✅ | ⚡ button — builds | ✅ |

### Custom ID, class, and style

| Demo | Docs link | Docs OK | Sandbox (StackBlitz) | Sandbox OK |
|---|---|:---:|---|:---:|
| Set the id, class, and style (`example1`) | [custom-id-class-style/#example1](https://handsontable.com/docs/vue-data-grid/custom-id-class-style/#example1) | ✅ | ⚡ button — builds | ✅ |

### Instance reference

| Demo | Docs link | Docs OK | Sandbox (StackBlitz) | Sandbox OK |
|---|---|:---:|---|:---:|
| Use Handsontable's API (`example1`) | [vue-instance-reference/#example1](https://handsontable.com/docs/vue-data-grid/vue-instance-reference/#example1) | ✅ | ⚡ button — builds | ✅ |

### HotColumn component

| Demo | Docs link | Docs OK | Sandbox (StackBlitz) | Sandbox OK |
|---|---|:---:|---|:---:|
| Declare column settings (`example1`) | [vue-hot-column/#example1](https://handsontable.com/docs/vue-data-grid/vue-hot-column/#example1) | ✅ | ⚡ button — builds | ✅ |
| Array of objects (`example2`) | [vue-hot-column/#example2](https://handsontable.com/docs/vue-data-grid/vue-hot-column/#example2) | ✅ | ⚡ button — builds | ✅ |
| Declare a custom editor as a component (`example3`) | [vue-hot-column/#example3](https://handsontable.com/docs/vue-data-grid/vue-hot-column/#example3) | ✅ | ⚡ button — builds | ✅ |
| Declare a custom renderer (`example4`) | [vue-hot-column/#example4](https://handsontable.com/docs/vue-data-grid/vue-hot-column/#example4) | ✅ | ⚡ button — builds | ✅ |
| Render columns dynamically (`example5`) | [vue-hot-column/#example5](https://handsontable-docs-staging.pages.dev/docs/vue-data-grid/vue-hot-column/#example5) *(dev)* | ✅ | ⚡ button — builds | ✅ |

### Vuex state management

| Demo | Docs link | Docs OK | Sandbox (StackBlitz) | Sandbox OK |
|---|---|:---:|---|:---:|
| Integrate with Vuex (`example1`) | [vue-vuex/#example1](https://handsontable.com/docs/vue-data-grid/vue-vuex/#example1) | ✅ | ⚡ button — builds | ✅ |

### Pinia state management

| Demo | Docs link | Docs OK | Sandbox (StackBlitz) | Sandbox OK |
|---|---|:---:|---|:---:|
| Example (`example1`) | [vue-pinia/#example1](https://handsontable.com/docs/vue-data-grid/vue-pinia/#example1) | ✅ | ⚡ button — builds | ✅ |

## Styling


### Themes

| Demo | Docs link | Docs OK | Sandbox (StackBlitz) | Sandbox OK |
|---|---|:---:|---|:---:|
| Built-in themes (`exampleTheme`) | [themes/#exampleTheme](https://handsontable.com/docs/vue-data-grid/themes/#exampleTheme) | ✅ | ⚡ button — builds | ✅ |

### Theme Customization

| Demo | Docs link | Docs OK | Sandbox (StackBlitz) | Sandbox OK |
|---|---|:---:|---|:---:|
| Theme API example (`example2`) | [theme-customization/#example2](https://handsontable.com/docs/vue-data-grid/theme-customization/#example2) | ✅ | ⚡ button — builds | ✅ |
| Option 3: Override CSS variables (`example1`) | [theme-customization/#example1](https://handsontable.com/docs/vue-data-grid/theme-customization/#example1) | ✅ | ⚡ button — builds | ✅ |

## Columns


### Column headers

| Demo | Docs link | Docs OK | Sandbox (StackBlitz) | Sandbox OK |
|---|---|:---:|---|:---:|
| Default headers (`example1`) | [column-header/#example1](https://handsontable.com/docs/vue-data-grid/column-header/#example1) | ✅ | ⚡ button — builds | ✅ |
| Header labels as an array (`example2`) | [column-header/#example2](https://handsontable.com/docs/vue-data-grid/column-header/#example2) | ✅ | ⚡ button — builds | ✅ |
| Header labels as a function (`example3`) | [column-header/#example3](https://handsontable.com/docs/vue-data-grid/column-header/#example3) | ✅ | ⚡ button — builds | ✅ |
| Header labels in the columns option (`example6`) | [column-header/#example6](https://handsontable-docs-staging.pages.dev/docs/vue-data-grid/column-header/#example6) *(dev)* | ✅ | ⚡ button — builds | ✅ |
| Customize column headers (`example4`) | [column-header/#example4](https://handsontable.com/docs/vue-data-grid/column-header/#example4) | ✅ | ⚡ button — builds | ✅ |
| Customize column headers (`example5`) | [column-header/#example5](https://handsontable.com/docs/vue-data-grid/column-header/#example5) | ✅ | ⚡ button — builds | ✅ |
| Column header height (`example7`) | [column-header/#example7](https://handsontable-docs-staging.pages.dev/docs/vue-data-grid/column-header/#example7) *(dev)* | ✅ | ⚡ button — builds | ✅ |

### Column groups

| Demo | Docs link | Docs OK | Sandbox (StackBlitz) | Sandbox OK |
|---|---|:---:|---|:---:|
| Example (`example1`) | [column-groups/#example1](https://handsontable.com/docs/vue-data-grid/column-groups/#example1) | ✅ | ⚡ button — builds | ✅ |
| Example (`example2`) | [column-groups/#example2](https://handsontable.com/docs/vue-data-grid/column-groups/#example2) | ✅ | ⚡ button — builds | ✅ |
| Choose which columns stay visible when collapsed (`example3`) | [column-groups/#example3](https://handsontable.com/docs/vue-data-grid/column-groups/#example3) | ✅ | ⚡ button — builds | ✅ |
| Keep a group cohesive or let it split (`example4`) | [column-groups/#example4](https://handsontable-docs-staging.pages.dev/docs/vue-data-grid/column-groups/#example4) *(dev)* | ✅ | ⚡ button — builds | ✅ |

### Column hiding

| Demo | Docs link | Docs OK | Sandbox (StackBlitz) | Sandbox OK |
|---|---|:---:|---|:---:|
| Enable column hiding (`example1`) | [column-hiding/#example1](https://handsontable.com/docs/vue-data-grid/column-hiding/#example1) | ✅ | ⚡ button — builds | ✅ |
| Step 1: Specify columns hidden by default (`example2`) | [column-hiding/#example2](https://handsontable.com/docs/vue-data-grid/column-hiding/#example2) | ✅ | ⚡ button — builds | ✅ |
| Step 2: Show UI indicators (`example3`) | [column-hiding/#example3](https://handsontable.com/docs/vue-data-grid/column-hiding/#example3) | ✅ | ⚡ button — builds | ✅ |
| Step 3: Set up context menu items (`example4`) | [column-hiding/#example4](https://handsontable.com/docs/vue-data-grid/column-hiding/#example4) | ✅ | ⚡ button — builds | ✅ |
| Step 3: Set up context menu items (`example5`) | [column-hiding/#example5](https://handsontable.com/docs/vue-data-grid/column-hiding/#example5) | ✅ | ⚡ button — builds | ✅ |
| Step 4: Set up copy and paste behavior (`example6`) | [column-hiding/#example6](https://handsontable.com/docs/vue-data-grid/column-hiding/#example6) | ✅ | ⚡ button — builds | ✅ |

### Adding and removing columns

| Demo | Docs link | Docs OK | Sandbox (StackBlitz) | Sandbox OK |
|---|---|:---:|---|:---:|
| Insert and remove columns with the API (`example1`) | [column-adding/#example1](https://handsontable-docs-staging.pages.dev/docs/vue-data-grid/column-adding/#example1) *(dev)* | ✅ | ⚡ button — builds | ✅ |
| Add and remove columns from the context menu (`example2`) | [column-adding/#example2](https://handsontable-docs-staging.pages.dev/docs/vue-data-grid/column-adding/#example2) *(dev)* | ✅ | ⚡ button — builds | ✅ |

### Column moving

| Demo | Docs link | Docs OK | Sandbox (StackBlitz) | Sandbox OK |
|---|---|:---:|---|:---:|
| Enable the plugin (`example1`) | [column-moving/#example1](https://handsontable.com/docs/vue-data-grid/column-moving/#example1) | ✅ | ⚡ button — builds | ✅ |
| Move column headers (`example2`) | [column-moving/#example2](https://handsontable.com/docs/vue-data-grid/column-moving/#example2) | ✅ | ⚡ button — builds | ✅ |
| Move column headers (`example3`) | [column-moving/#example3](https://handsontable.com/docs/vue-data-grid/column-moving/#example3) | ✅ | ⚡ button — builds | ✅ |

### Column freezing

| Demo | Docs link | Docs OK | Sandbox (StackBlitz) | Sandbox OK |
|---|---|:---:|---|:---:|
| Freeze columns at initialization (`example1`) | [column-freezing/#example1](https://handsontable.com/docs/vue-data-grid/column-freezing/#example1) | ✅ | ⚡ button — builds | ✅ |
| User-triggered freeze (`example2`) | [column-freezing/#example2](https://handsontable.com/docs/vue-data-grid/column-freezing/#example2) | ✅ | ⚡ button — builds | ✅ |

### Column widths

| Demo | Docs link | Docs OK | Sandbox (StackBlitz) | Sandbox OK |
|---|---|:---:|---|:---:|
| Set the column width as a constant (`example1`) | [column-width/#example1](https://handsontable.com/docs/vue-data-grid/column-width/#example1) | ✅ | ⚡ button — builds | ✅ |
| Set the column width in an array (`example2`) | [column-width/#example2](https://handsontable.com/docs/vue-data-grid/column-width/#example2) | ✅ | ⚡ button — builds | ✅ |
| Set the column width using a function (`example3`) | [column-width/#example3](https://handsontable.com/docs/vue-data-grid/column-width/#example3) | ✅ | ⚡ button — builds | ✅ |
| Set a dynamic maximum column width (`example7`) | [column-width/#example7](https://handsontable-docs-staging.pages.dev/docs/vue-data-grid/column-width/#example7) *(dev)* | ✅ | ⚡ button — builds | ✅ |
| Adjust the column width manually (`example4`) | [column-width/#example4](https://handsontable.com/docs/vue-data-grid/column-width/#example4) | ✅ | ⚡ button — builds | ✅ |
| Fit all columns equally (`example5`) | [column-width/#example5](https://handsontable.com/docs/vue-data-grid/column-width/#example5) | ✅ | ⚡ button — builds | ✅ |
| Stretch only the last column (`example6`) | [column-width/#example6](https://handsontable.com/docs/vue-data-grid/column-width/#example6) | ✅ | ⚡ button — builds | ✅ |

### Column summary

| Demo | Docs link | Docs OK | Sandbox (StackBlitz) | Sandbox OK |
|---|---|:---:|---|:---:|
| Column summary example (`example1`) | [column-summary/#example1](https://handsontable.com/docs/vue-data-grid/column-summary/#example1) | ✅ | ⚡ button — builds | ✅ |
| Step 5: Make room for the destination cell (`example2`) | [column-summary/#example2](https://handsontable.com/docs/vue-data-grid/column-summary/#example2) | ✅ | ⚡ button — builds | ✅ |
| Set up column summaries, using a function (`example7`) | [column-summary/#example7](https://handsontable.com/docs/vue-data-grid/column-summary/#example7) | ✅ | ⚡ button — builds | ✅ |
| Set up column summaries, using a function (`example8`) | [column-summary/#example8](https://handsontable.com/docs/vue-data-grid/column-summary/#example8) | ✅ | ⚡ button — builds | ✅ |
| Implement a custom summary function (`example9`) | [column-summary/#example9](https://handsontable.com/docs/vue-data-grid/column-summary/#example9) | ✅ | ⚡ button — builds | ✅ |
| Round a column summary result (`example12`) | [column-summary/#example12](https://handsontable.com/docs/vue-data-grid/column-summary/#example12) | ✅ | ⚡ button — builds | ✅ |
| Force numeric values (`example10`) | [column-summary/#example10](https://handsontable.com/docs/vue-data-grid/column-summary/#example10) | ✅ | ⚡ button — builds | ✅ |
| Throw data type errors (`example11`) | [column-summary/#example11](https://handsontable.com/docs/vue-data-grid/column-summary/#example11) | ✅ | ⚡ button — builds | ✅ |

### Column virtualization

| Demo | Docs link | Docs OK | Sandbox (StackBlitz) | Sandbox OK |
|---|---|:---:|---|:---:|
| Configure the column virtualization (`example1`) | [column-virtualization/#example1](https://handsontable.com/docs/vue-data-grid/column-virtualization/#example1) | ✅ | ⚡ button — builds | ✅ |

### Column filter

| Demo | Docs link | Docs OK | Sandbox (StackBlitz) | Sandbox OK |
|---|---|:---:|---|:---:|
| Filtering demo (`exampleFilterBasicDemo`) | [column-filter/#exampleFilterBasicDemo](https://handsontable.com/docs/vue-data-grid/column-filter/#exampleFilterBasicDemo) | ✅ | ⚡ button — builds | ✅ |
| Enable filtering (`exampleShowFilterItemsOnly`) | [column-filter/#exampleShowFilterItemsOnly](https://handsontable.com/docs/vue-data-grid/column-filter/#exampleShowFilterItemsOnly) | ✅ | ⚡ button — builds | ✅ |
| Enable filtering for individual columns (`exampleEnableFilterInColumns`) | [column-filter/#exampleEnableFilterInColumns](https://handsontable.com/docs/vue-data-grid/column-filter/#exampleEnableFilterInColumns) | ✅ | ⚡ button — builds | ✅ |
| Enable filtering within already filtered results (`exampleSearchMode`) | [column-filter/#exampleSearchMode](https://handsontable.com/docs/vue-data-grid/column-filter/#exampleSearchMode) | ✅ | ⚡ button — builds | ✅ |
| Filter different types of data (`exampleFilterDifferentTypes`) | [column-filter/#exampleFilterDifferentTypes](https://handsontable.com/docs/vue-data-grid/column-filter/#exampleFilterDifferentTypes) | ✅ | ⚡ button — builds | ✅ |
| Filter data on initialization (`exampleFilterOnInitialization`) | [column-filter/#exampleFilterOnInitialization](https://handsontable.com/docs/vue-data-grid/column-filter/#exampleFilterOnInitialization) | ✅ | ⚡ button — builds | ✅ |
| External quick filter (`exampleQuickFilter`) | [column-filter/#exampleQuickFilter](https://handsontable.com/docs/vue-data-grid/column-filter/#exampleQuickFilter) | ✅ | ⚡ button — builds | ✅ |
| Customize the filter button (`exampleCustomFilterButton`) | [column-filter/#exampleCustomFilterButton](https://handsontable.com/docs/vue-data-grid/column-filter/#exampleCustomFilterButton) | ✅ | ⚡ button — builds | ✅ |
| Customize the filter button (`exampleCustomFilterButton2`) | [column-filter/#exampleCustomFilterButton2](https://handsontable.com/docs/vue-data-grid/column-filter/#exampleCustomFilterButton2) | ✅ | ⚡ button — builds | ✅ |
| Exclude rows from filtering (`exampleExcludeRowsFromFiltering`) | [column-filter/#exampleExcludeRowsFromFiltering](https://handsontable.com/docs/vue-data-grid/column-filter/#exampleExcludeRowsFromFiltering) | ✅ | ⚡ button — builds | ✅ |
| Server-side filtering (`exampleServerSideFilter`) | [column-filter/#exampleServerSideFilter](https://handsontable.com/docs/vue-data-grid/column-filter/#exampleServerSideFilter) | ✅ | ⚡ button — builds | ✅ |
| Filter data programmatically (`exampleFilterThroughAPI1`) | [column-filter/#exampleFilterThroughAPI1](https://handsontable.com/docs/vue-data-grid/column-filter/#exampleFilterThroughAPI1) | ✅ | ⚡ button — builds | ✅ |
| Save and restore filter settings (`exampleSaveRestoreFilters`) | [column-filter/#exampleSaveRestoreFilters](https://handsontable-docs-staging.pages.dev/docs/vue-data-grid/column-filter/#exampleSaveRestoreFilters) *(dev)* | ✅ | ⚡ button — builds | ✅ |
| Get filtered data (`exampleGetFilteredData`) | [column-filter/#exampleGetFilteredData](https://handsontable-docs-staging.pages.dev/docs/vue-data-grid/column-filter/#exampleGetFilteredData) *(dev)* | ✅ | ⚡ button — builds | ✅ |

## Rows


### Row headers

| Demo | Docs link | Docs OK | Sandbox (StackBlitz) | Sandbox OK |
|---|---|:---:|---|:---:|
| Row headers as an array (`example2`) | [row-header/#example2](https://handsontable-docs-staging.pages.dev/docs/vue-data-grid/row-header/#example2) *(dev)* | ✅ | ⚡ button — builds | ✅ |
| Row headers as a function (`example3`) | [row-header/#example3](https://handsontable-docs-staging.pages.dev/docs/vue-data-grid/row-header/#example3) *(dev)* | ✅ | ⚡ button — builds | ✅ |
| Basic example (`example1`) | [row-header/#example1](https://handsontable.com/docs/vue-data-grid/row-header/#example1) | ✅ | ⚡ button — builds | ✅ |

### Row parent-child

| Demo | Docs link | Docs OK | Sandbox (StackBlitz) | Sandbox OK |
|---|---|:---:|---|:---:|
| Prepare the data source (`example1`) | [row-parent-child/#example1](https://handsontable.com/docs/vue-data-grid/row-parent-child/#example1) | ✅ | ⚡ button — builds | ✅ |

### Row hiding

| Demo | Docs link | Docs OK | Sandbox (StackBlitz) | Sandbox OK |
|---|---|:---:|---|:---:|
| Enable row hiding (`example1`) | [row-hiding/#example1](https://handsontable.com/docs/vue-data-grid/row-hiding/#example1) | ✅ | ⚡ button — builds | ✅ |
| Step 1: Specify rows hidden by default (`example2`) | [row-hiding/#example2](https://handsontable.com/docs/vue-data-grid/row-hiding/#example2) | ✅ | ⚡ button — builds | ✅ |
| Step 2: Show UI indicators (`example3`) | [row-hiding/#example3](https://handsontable.com/docs/vue-data-grid/row-hiding/#example3) | ✅ | ⚡ button — builds | ✅ |
| Step 3: Set up context menu items (`example4`) | [row-hiding/#example4](https://handsontable.com/docs/vue-data-grid/row-hiding/#example4) | ✅ | ⚡ button — builds | ✅ |
| Step 3: Set up context menu items (`example5`) | [row-hiding/#example5](https://handsontable.com/docs/vue-data-grid/row-hiding/#example5) | ✅ | ⚡ button — builds | ✅ |
| Step 4: Set up copy and paste behavior (`example6`) | [row-hiding/#example6](https://handsontable.com/docs/vue-data-grid/row-hiding/#example6) | ✅ | ⚡ button — builds | ✅ |

### Row moving

| Demo | Docs link | Docs OK | Sandbox (StackBlitz) | Sandbox OK |
|---|---|:---:|---|:---:|
| Enable the ManualRowMove plugin (`example1`) | [row-moving/#example1](https://handsontable.com/docs/vue-data-grid/row-moving/#example1) | ✅ | ⚡ button — builds | ✅ |

### Row freezing

| Demo | Docs link | Docs OK | Sandbox (StackBlitz) | Sandbox OK |
|---|---|:---:|---|:---:|
| Example (`example1`) | [row-freezing/#example1](https://handsontable.com/docs/vue-data-grid/row-freezing/#example1) | ✅ | ⚡ button — builds | ✅ |

### Row heights

| Demo | Docs link | Docs OK | Sandbox (StackBlitz) | Sandbox OK |
|---|---|:---:|---|:---:|
| Set row heights to a number (`example1`) | [row-height/#example1](https://handsontable.com/docs/vue-data-grid/row-height/#example1) | ✅ | ⚡ button — builds | ✅ |
| Set row heights with an array (`example2`) | [row-height/#example2](https://handsontable.com/docs/vue-data-grid/row-height/#example2) | ✅ | ⚡ button — builds | ✅ |
| Set row heights with a function (`example3`) | [row-height/#example3](https://handsontable.com/docs/vue-data-grid/row-height/#example3) | ✅ | ⚡ button — builds | ✅ |
| Adjust row heights manually (`example4`) | [row-height/#example4](https://handsontable.com/docs/vue-data-grid/row-height/#example4) | ✅ | ⚡ button — builds | ✅ |

### Row virtualization

| Demo | Docs link | Docs OK | Sandbox (StackBlitz) | Sandbox OK |
|---|---|:---:|---|:---:|
| Configuring row virtualization (`example1`) | [row-virtualization/#example1](https://handsontable.com/docs/vue-data-grid/row-virtualization/#example1) | ✅ | ⚡ button — builds | ✅ |

### Rows sorting

| Demo | Docs link | Docs OK | Sandbox (StackBlitz) | Sandbox OK |
|---|---|:---:|---|:---:|
| Sorting demo (`exampleSortingDemo`) | [rows-sorting/#exampleSortingDemo](https://handsontable.com/docs/vue-data-grid/rows-sorting/#exampleSortingDemo) | ✅ | ⚡ button — builds | ✅ |
| Enable sorting (`exampleEnableSortingForColumns`) | [rows-sorting/#exampleEnableSortingForColumns](https://handsontable.com/docs/vue-data-grid/rows-sorting/#exampleEnableSortingForColumns) | ✅ | ⚡ button — builds | ✅ |
| Sort different types of data (`exampleSortDifferentTypes`) | [rows-sorting/#exampleSortDifferentTypes](https://handsontable.com/docs/vue-data-grid/rows-sorting/#exampleSortDifferentTypes) | ✅ | ⚡ button — builds | ✅ |
| Use sorting hooks (`exampleSortingHooks`) | [rows-sorting/#exampleSortingHooks](https://handsontable-docs-staging.pages.dev/docs/vue-data-grid/rows-sorting/#exampleSortingHooks) *(dev)* | ✅ | ⚡ button — builds | ✅ |
| Exclude rows from sorting (`exampleExcludeRowsFromSorting`) | [rows-sorting/#exampleExcludeRowsFromSorting](https://handsontable.com/docs/vue-data-grid/rows-sorting/#exampleExcludeRowsFromSorting) | ✅ | ⚡ button — builds | ✅ |
| Sort data programmatically (`exampleSortByAPI`) | [rows-sorting/#exampleSortByAPI](https://handsontable.com/docs/vue-data-grid/rows-sorting/#exampleSortByAPI) | ✅ | ⚡ button — builds | ✅ |
| Sort by multiple columns (`exampleSortByMultipleColumns`) | [rows-sorting/#exampleSortByMultipleColumns](https://handsontable.com/docs/vue-data-grid/rows-sorting/#exampleSortByMultipleColumns) | ✅ | ⚡ button — builds | ✅ |
| Set an initial multi-column sort order (`exampleInitialSortOrder`) | [rows-sorting/#exampleInitialSortOrder](https://handsontable.com/docs/vue-data-grid/rows-sorting/#exampleInitialSortOrder) | ✅ | ⚡ button — builds | ✅ |
| Sort by multiple columns programmatically (`exampleSortByAPIMultipleColumns`) | [rows-sorting/#exampleSortByAPIMultipleColumns](https://handsontable.com/docs/vue-data-grid/rows-sorting/#exampleSortByAPIMultipleColumns) | ✅ | ⚡ button — builds | ✅ |
| Add custom sort icons (`exampleCustomSortIcons`) | [rows-sorting/#exampleCustomSortIcons](https://handsontable.com/docs/vue-data-grid/rows-sorting/#exampleCustomSortIcons) | ✅ | ⚡ button — builds | ✅ |
| Add custom sort icons (`exampleCustomSortIcons3`) | [rows-sorting/#exampleCustomSortIcons3](https://handsontable.com/docs/vue-data-grid/rows-sorting/#exampleCustomSortIcons3) | ✅ | ⚡ button — builds | ✅ |

### Rows pagination

| Demo | Docs link | Docs OK | Sandbox (StackBlitz) | Sandbox OK |
|---|---|:---:|---|:---:|
| Pagination demo (`example1`) | [rows-pagination/#example1](https://handsontable.com/docs/vue-data-grid/rows-pagination/#example1) | ✅ | ⚡ button — builds | ✅ |
| Configure pagination (`example2`) | [rows-pagination/#example2](https://handsontable.com/docs/vue-data-grid/rows-pagination/#example2) | ✅ | ⚡ button — builds | ✅ |
| Control pagination programmatically (`example3`) | [rows-pagination/#example3](https://handsontable.com/docs/vue-data-grid/rows-pagination/#example3) | ✅ | ⚡ button — builds | ✅ |
| Choose where to display the pagination UI (`example4`) | [rows-pagination/#example4](https://handsontable.com/docs/vue-data-grid/rows-pagination/#example4) | ✅ | ⚡ button — builds | ✅ |
| Modify paged data (`example5`) | [rows-pagination/#example5](https://handsontable.com/docs/vue-data-grid/rows-pagination/#example5) | ✅ | ⚡ button — builds | ✅ |
| Localize pagination (`example6`) | [rows-pagination/#example6](https://handsontable.com/docs/vue-data-grid/rows-pagination/#example6) | ✅ | ⚡ button — builds | ✅ |

### Row trimming

| Demo | Docs link | Docs OK | Sandbox (StackBlitz) | Sandbox OK |
|---|---|:---:|---|:---:|
| Example (`example1`) | [row-trimming/#example1](https://handsontable.com/docs/vue-data-grid/row-trimming/#example1) | ✅ | ⚡ button — builds | ✅ |

### Row pre-populating

| Demo | Docs link | Docs OK | Sandbox (StackBlitz) | Sandbox OK |
|---|---|:---:|---|:---:|
| Basic spare rows (`example1`) | [row-prepopulating/#example1](https://handsontable.com/docs/vue-data-grid/row-prepopulating/#example1) | ✅ | ⚡ button — builds | ✅ |
| Spare rows with placeholder styling (`example2`) | [row-prepopulating/#example2](https://handsontable.com/docs/vue-data-grid/row-prepopulating/#example2) | ✅ | ⚡ button — builds | ✅ |
| Auto-populating with template values (`example3`) | [row-prepopulating/#example3](https://handsontable.com/docs/vue-data-grid/row-prepopulating/#example3) | ✅ | ⚡ button — builds | ✅ |

## Cell features


### Selection

| Demo | Docs link | Docs OK | Sandbox (StackBlitz) | Sandbox OK |
|---|---|:---:|---|:---:|
| Select ranges (`example1`) | [selection/#example1](https://handsontable.com/docs/vue-data-grid/selection/#example1) | ✅ | ⚡ button — builds | ✅ |
| Get data from the selected ranges (`example2`) | [selection/#example2](https://handsontable.com/docs/vue-data-grid/selection/#example2) | ✅ | ⚡ button — builds | ✅ |
| Modify the selected cells (`example3`) | [selection/#example3](https://handsontable.com/docs/vue-data-grid/selection/#example3) | ✅ | ⚡ button — builds | ✅ |
| Style the selection area (`example4`) | [selection/#example4](https://handsontable.com/docs/vue-data-grid/selection/#example4) | ✅ | ⚡ button — builds | ✅ |
| Select cells programmatically (`example5`) | [selection/#example5](https://handsontable.com/docs/vue-data-grid/selection/#example5) | ✅ | ⚡ button — builds | ✅ |
| Jump across horizontal edges (`example6`) | [selection/#example6](https://handsontable-docs-staging.pages.dev/docs/vue-data-grid/selection/#example6) *(dev)* | ✅ | ⚡ button — builds | ✅ |

### Merge cells

| Demo | Docs link | Docs OK | Sandbox (StackBlitz) | Sandbox OK |
|---|---|:---:|---|:---:|
| How to merge cells (`example1`) | [merge-cells/#example1](https://handsontable.com/docs/vue-data-grid/merge-cells/#example1) | ✅ | ⚡ button — builds | ✅ |
| Optimizing rendering of the wide/tall merged cells (`example2`) | [merge-cells/#example2](https://handsontable.com/docs/vue-data-grid/merge-cells/#example2) | ✅ | ⚡ button — builds | ✅ |

### Conditional formatting

| Demo | Docs link | Docs OK | Sandbox (StackBlitz) | Sandbox OK |
|---|---|:---:|---|:---:|
| Example of conditional formatting (`example1`) | [conditional-formatting/#example1](https://handsontable.com/docs/vue-data-grid/conditional-formatting/#example1) | ✅ | ⚡ button — builds | ✅ |

### Text alignment

| Demo | Docs link | Docs OK | Sandbox (StackBlitz) | Sandbox OK |
|---|---|:---:|---|:---:|
| Basic example (`example1`) | [text-alignment/#example1](https://handsontable.com/docs/vue-data-grid/text-alignment/#example1) | ✅ | ⚡ button — builds | ✅ |

### Disabled cells

| Demo | Docs link | Docs OK | Sandbox (StackBlitz) | Sandbox OK |
|---|---|:---:|---|:---:|
| To disable a cell (`exampleReadOnlyGrid`) | [disabled-cells/#exampleReadOnlyGrid](https://handsontable.com/docs/vue-data-grid/disabled-cells/#exampleReadOnlyGrid) | ✅ | ⚡ button — builds | ✅ |
| To disable a column (`example1`) | [disabled-cells/#example1](https://handsontable.com/docs/vue-data-grid/disabled-cells/#example1) | ✅ | ⚡ button — builds | ✅ |
| To disable a row (`example2`) | [disabled-cells/#example2](https://handsontable.com/docs/vue-data-grid/disabled-cells/#example2) | ✅ | ⚡ button — builds | ✅ |
| To disable a column (non-editable) (`example3`) | [disabled-cells/#example3](https://handsontable.com/docs/vue-data-grid/disabled-cells/#example3) | ✅ | ⚡ button — builds | ✅ |
| To disable a cell (`example4`) | [disabled-cells/#example4](https://handsontable.com/docs/vue-data-grid/disabled-cells/#example4) | ✅ | ⚡ button — builds | ✅ |

### Comments

| Demo | Docs link | Docs OK | Sandbox (StackBlitz) | Sandbox OK |
|---|---|:---:|---|:---:|
| Basic example (`example1`) | [comments/#example1](https://handsontable.com/docs/vue-data-grid/comments/#example1) | ✅ | ⚡ button — builds | ✅ |
| Make a comment read-only (`example2`) | [comments/#example2](https://handsontable.com/docs/vue-data-grid/comments/#example2) | ✅ | ⚡ button — builds | ✅ |
| Set a comment box's size (`example3`) | [comments/#example3](https://handsontable.com/docs/vue-data-grid/comments/#example3) | ✅ | ⚡ button — builds | ✅ |
| Set a delay for displaying comments (`example4`) | [comments/#example4](https://handsontable.com/docs/vue-data-grid/comments/#example4) | ✅ | ⚡ button — builds | ✅ |

### Autofill values

| Demo | Docs link | Docs OK | Sandbox (StackBlitz) | Sandbox OK |
|---|---|:---:|---|:---:|
| How double-click autofill determines the range (`example1`) | [autofill-values/#example1](https://handsontable.com/docs/vue-data-grid/autofill-values/#example1) | ✅ | ⚡ button — builds | ✅ |
| Autofill in a vertical direction only and creating new rows (`example2`) | [autofill-values/#example2](https://handsontable.com/docs/vue-data-grid/autofill-values/#example2) | ✅ | ⚡ button — builds | ✅ |

### Formatting cells

| Demo | Docs link | Docs OK | Sandbox (StackBlitz) | Sandbox OK |
|---|---|:---:|---|:---:|
| Apply custom CSS class styles (`example1`) | [formatting-cells/#example1](https://handsontable.com/docs/vue-data-grid/formatting-cells/#example1) | ✅ | ⚡ button — builds | ✅ |
| Apply inline styles (`example2`) | [formatting-cells/#example2](https://handsontable.com/docs/vue-data-grid/formatting-cells/#example2) | ✅ | ⚡ button — builds | ✅ |
| Custom cell borders (`example3`) | [formatting-cells/#example3](https://handsontable.com/docs/vue-data-grid/formatting-cells/#example3) | ✅ | ⚡ button — builds | ✅ |

## Cell functions


### Cell functions

| Demo | Docs link | Docs OK | Sandbox (StackBlitz) | Sandbox OK |
|---|---|:---:|---|:---:|
| Mixing renderer, editor, and validator (`example1`) | [cell-function/#example1](https://handsontable.com/docs/vue-data-grid/cell-function/#example1) | ✅ | ⚡ button — builds | ✅ |

### Cell renderer

| Demo | Docs link | Docs OK | Sandbox (StackBlitz) | Sandbox OK |
|---|---|:---:|---|:---:|
| Declare a custom renderer as a component (`example1`) | [cell-renderer/#example1](https://handsontable.com/docs/vue-data-grid/cell-renderer/#example1) | ✅ | ⚡ button — builds | ✅ |
| Declare a custom renderer as a component (`example2`) | [cell-renderer/#example2](https://handsontable.com/docs/vue-data-grid/cell-renderer/#example2) | ✅ | ⚡ button — builds | ✅ |
| Render custom HTML in cells (`example4`) | [cell-renderer/#example4](https://handsontable.com/docs/vue-data-grid/cell-renderer/#example4) | ✅ | ⚡ button — builds | ✅ |
| Render custom HTML in header (`example5`) | [cell-renderer/#example5](https://handsontable.com/docs/vue-data-grid/cell-renderer/#example5) | ✅ | ⚡ button — builds | ✅ |

### Cell editor

| Demo | Docs link | Docs OK | Sandbox (StackBlitz) | Sandbox OK |
|---|---|:---:|---|:---:|
| Extending an existing editor (`example1`) | [cell-editor/#example1](https://handsontable.com/docs/vue-data-grid/cell-editor/#example1) | ✅ | ⚡ button — builds | ✅ |
| Building an editor from scratch (`example2`) | [cell-editor/#example2](https://handsontable.com/docs/vue-data-grid/cell-editor/#example2) | ✅ | ⚡ button — ❌ vite build fails: Missing "./helpers/dom/event" specifier in "handsontable" package — the import is not exposed by the published package exports map | ❌ |

### Cell validator

| Demo | Docs link | Docs OK | Sandbox (StackBlitz) | Sandbox OK |
|---|---|:---:|---|:---:|
| Full featured example (`example1`) | [cell-validator/#example1](https://handsontable.com/docs/vue-data-grid/cell-validator/#example1) | ✅ | ⚡ button — builds | ✅ |

### Custom Cells

| Demo | Docs link | Docs OK | Sandbox (StackBlitz) | Sandbox OK |
|---|---|:---:|---|:---:|
| Function renderer (`example1`) | [custom-cells/#example1](https://handsontable.com/docs/vue-data-grid/custom-cells/#example1) | ✅ | ⚡ button — builds | ✅ |
| Vue component renderer (`example2`) | [custom-cells/#example2](https://handsontable.com/docs/vue-data-grid/custom-cells/#example2) | ✅ | ⚡ button — builds | ✅ |
| Custom editors (`example3`) | [custom-cells/#example3](https://handsontable.com/docs/vue-data-grid/custom-cells/#example3) | ✅ | ⚡ button — builds | ✅ |

## Cell types


### Cell type

| Demo | Docs link | Docs OK | Sandbox (StackBlitz) | Sandbox OK |
|---|---|:---:|---|:---:|
| Built-in cell types example (`example1`) | [cell-type/#example1](https://handsontable.com/docs/vue-data-grid/cell-type/#example1) | ✅ | ⚡ button — builds | ✅ |
| Empty cells (`example2`) | [cell-type/#example2](https://handsontable.com/docs/vue-data-grid/cell-type/#example2) | ✅ | ⚡ button — builds | ✅ |

### Numeric cell type

| Demo | Docs link | Docs OK | Sandbox (StackBlitz) | Sandbox OK |
|---|---|:---:|---|:---:|
| Numeric cell type demo (`example1`) | [numeric-cell-type/#example1](https://handsontable.com/docs/vue-data-grid/numeric-cell-type/#example1) | ✅ | ⚡ button — builds | ✅ |

### Date cell type

| Demo | Docs link | Docs OK | Sandbox (StackBlitz) | Sandbox OK |
|---|---|:---:|---|:---:|
| Date cell type demo (`example1`) | [date-cell-type/#example1](https://handsontable.com/docs/vue-data-grid/date-cell-type/#example1) | ✅ | ⚡ button — builds | ✅ |

### Time cell type

| Demo | Docs link | Docs OK | Sandbox (StackBlitz) | Sandbox OK |
|---|---|:---:|---|:---:|
| Time cell type demo (`example1`) | [time-cell-type/#example1](https://handsontable.com/docs/vue-data-grid/time-cell-type/#example1) | ✅ | ⚡ button — builds | ✅ |

### Checkbox cell type

| Demo | Docs link | Docs OK | Sandbox (StackBlitz) | Sandbox OK |
|---|---|:---:|---|:---:|
| Checkbox true/false values (`example1`) | [checkbox-cell-type/#example1](https://handsontable.com/docs/vue-data-grid/checkbox-cell-type/#example1) | ✅ | ⚡ button — builds | ✅ |
| Checkbox template (`example2`) | [checkbox-cell-type/#example2](https://handsontable.com/docs/vue-data-grid/checkbox-cell-type/#example2) | ✅ | ⚡ button — builds | ✅ |
| Checkbox labels (`example3`) | [checkbox-cell-type/#example3](https://handsontable.com/docs/vue-data-grid/checkbox-cell-type/#example3) | ✅ | ⚡ button — builds | ✅ |
| Label value as a function (`example4`) | [checkbox-cell-type/#example4](https://handsontable.com/docs/vue-data-grid/checkbox-cell-type/#example4) | ✅ | ⚡ button — builds | ✅ |

### Select cell type

| Demo | Docs link | Docs OK | Sandbox (StackBlitz) | Sandbox OK |
|---|---|:---:|---|:---:|
| Usage (`example1`) | [select-cell-type/#example1](https://handsontable.com/docs/vue-data-grid/select-cell-type/#example1) | ✅ | ⚡ button — builds | ✅ |

### Dropdown cell type

| Demo | Docs link | Docs OK | Sandbox (StackBlitz) | Sandbox OK |
|---|---|:---:|---|:---:|
| Usage (`example1`) | [dropdown-cell-type/#example1](https://handsontable.com/docs/vue-data-grid/dropdown-cell-type/#example1) | ✅ | ⚡ button — builds | ✅ |
| Array of values (`example2`) | [dropdown-cell-type/#example2](https://handsontable.com/docs/vue-data-grid/dropdown-cell-type/#example2) | ✅ | ⚡ button — builds | ✅ |
| Array of objects (`example3`) | [dropdown-cell-type/#example3](https://handsontable.com/docs/vue-data-grid/dropdown-cell-type/#example3) | ✅ | ⚡ button — builds | ✅ |
| Set the dropdown width (`example4`) | [dropdown-cell-type/#example4](https://handsontable-docs-staging.pages.dev/docs/vue-data-grid/dropdown-cell-type/#example4) *(dev)* | ✅ | ⚡ button — builds | ✅ |
| Set the dropdown height (`example5`) | [dropdown-cell-type/#example5](https://handsontable-docs-staging.pages.dev/docs/vue-data-grid/dropdown-cell-type/#example5) *(dev)* | ✅ | ⚡ button — builds | ✅ |

### Autocomplete cell type

| Demo | Docs link | Docs OK | Sandbox (StackBlitz) | Sandbox OK |
|---|---|:---:|---|:---:|
| Autocomplete flexible mode (`example1`) | [autocomplete-cell-type/#example1](https://handsontable.com/docs/vue-data-grid/autocomplete-cell-type/#example1) | ✅ | ⚡ button — builds | ✅ |
| Autocomplete strict mode (`example2`) | [autocomplete-cell-type/#example2](https://handsontable.com/docs/vue-data-grid/autocomplete-cell-type/#example2) | ✅ | ⚡ button — builds | ✅ |
| Autocomplete strict mode with asynchronous data (`example3`) | [autocomplete-cell-type/#example3](https://handsontable.com/docs/vue-data-grid/autocomplete-cell-type/#example3) | ✅ | ⚡ button — builds | ✅ |
| Array of values (`example4`) | [autocomplete-cell-type/#example4](https://handsontable.com/docs/vue-data-grid/autocomplete-cell-type/#example4) | ✅ | ⚡ button — builds | ✅ |
| Array of objects (`example5`) | [autocomplete-cell-type/#example5](https://handsontable.com/docs/vue-data-grid/autocomplete-cell-type/#example5) | ✅ | ⚡ button — builds | ✅ |
| The filter option (`example6`) | [autocomplete-cell-type/#example6](https://handsontable.com/docs/vue-data-grid/autocomplete-cell-type/#example6) | ✅ | ⚡ button — builds | ✅ |
| The filteringCaseSensitive option (`example7`) | [autocomplete-cell-type/#example7](https://handsontable.com/docs/vue-data-grid/autocomplete-cell-type/#example7) | ✅ | ⚡ button — builds | ✅ |

### MultiSelect cell type

| Demo | Docs link | Docs OK | Sandbox (StackBlitz) | Sandbox OK |
|---|---|:---:|---|:---:|
| Array of values (`example1`) | [multiselect-cell-type/#example1](https://handsontable.com/docs/vue-data-grid/multiselect-cell-type/#example1) | ✅ | ⚡ button — builds | ✅ |
| Array of objects (`example2`) | [multiselect-cell-type/#example2](https://handsontable.com/docs/vue-data-grid/multiselect-cell-type/#example2) | ✅ | ⚡ button — builds | ✅ |
| Other options (`example3`) | [multiselect-cell-type/#example3](https://handsontable.com/docs/vue-data-grid/multiselect-cell-type/#example3) | ✅ | ⚡ button — builds | ✅ |

### Password cell type

| Demo | Docs link | Docs OK | Sandbox (StackBlitz) | Sandbox OK |
|---|---|:---:|---|:---:|
| Overview (`example1`) | [password-cell-type/#example1](https://handsontable.com/docs/vue-data-grid/password-cell-type/#example1) | ✅ | ⚡ button — builds | ✅ |
| Fixed hash length (`example2`) | [password-cell-type/#example2](https://handsontable.com/docs/vue-data-grid/password-cell-type/#example2) | ✅ | ⚡ button — builds | ✅ |
| Custom hash symbol (`example3`) | [password-cell-type/#example3](https://handsontable.com/docs/vue-data-grid/password-cell-type/#example3) | ✅ | ⚡ button — builds | ✅ |
| Reveal delay (`example4`) | [password-cell-type/#example4](https://handsontable.com/docs/vue-data-grid/password-cell-type/#example4) | ✅ | ⚡ button — builds | ✅ |

### Handsontable cell type

| Demo | Docs link | Docs OK | Sandbox (StackBlitz) | Sandbox OK |
|---|---|:---:|---|:---:|
| Basic example (`example1`) | [handsontable-cell-type/#example1](https://handsontable.com/docs/vue-data-grid/handsontable-cell-type/#example1) | ✅ | ⚡ button — builds | ✅ |

## Formulas


### Formula calculation

| Demo | Docs link | Docs OK | Sandbox (StackBlitz) | Sandbox OK |
|---|---|:---:|---|:---:|
| Basic multi-sheet example (`example1`) | [formula-calculation/#example1](https://handsontable.com/docs/vue-data-grid/formula-calculation/#example1) | ✅ | ⚡ button — builds | ✅ |
| Data grid example (`example-data-grid`) | [formula-calculation/#example-data-grid](https://handsontable.com/docs/vue-data-grid/formula-calculation/#example-data-grid) | ✅ | ⚡ button — builds | ✅ |
| Demo: plain-value named expression (`example-named-expressions1`) | [formula-calculation/#example-named-expressions1](https://handsontable.com/docs/vue-data-grid/formula-calculation/#example-named-expressions1) | ✅ | ⚡ button — builds | ✅ |
| Demo: formula-based named expressions (`example-named-expressions2`) | [formula-calculation/#example-named-expressions2](https://handsontable.com/docs/vue-data-grid/formula-calculation/#example-named-expressions2) | ✅ | ⚡ button — builds | ✅ |
| Demo: custom COMMISSION function (`example-custom-functions`) | [formula-calculation/#example-custom-functions](https://handsontable-docs-staging.pages.dev/docs/vue-data-grid/formula-calculation/#example-custom-functions) *(dev)* | ✅ | ⚡ button — ⚠️ builds and runs, but hyperformula/typings/* type-only imports are blocked by hyperformula's exports map — they show as TS errors in the StackBlitz editor | ⚠️ |

## Server-side data


### Server-side data

| Demo | Docs link | Docs OK | Sandbox (StackBlitz) | Sandbox OK |
|---|---|:---:|---|:---:|
| Demo (`example1`) | [server-side-data/#example1](https://handsontable.com/docs/vue-data-grid/server-side-data/#example1)<br>⚠️ renders 0 rows without a backend (expected locally) — verify once on prod | ⚠️ | ⚡ button — builds | ✅ |

## Data management


### Binding to data

| Demo | Docs link | Docs OK | Sandbox (StackBlitz) | Sandbox OK |
|---|---|:---:|---|:---:|
| Array of arrays (`example1`) | [binding-to-data/#example1](https://handsontable.com/docs/vue-data-grid/binding-to-data/#example1) | ✅ | ⚡ button — builds | ✅ |
| Array of arrays with a selective display of columns (`example2`) | [binding-to-data/#example2](https://handsontable.com/docs/vue-data-grid/binding-to-data/#example2) | ✅ | ⚡ button — builds | ✅ |
| Array of objects (`example3`) | [binding-to-data/#example3](https://handsontable.com/docs/vue-data-grid/binding-to-data/#example3) | ✅ | ⚡ button — builds | ✅ |
| Array of objects with column as a function (`example4`) | [binding-to-data/#example4](https://handsontable.com/docs/vue-data-grid/binding-to-data/#example4) | ✅ | ⚡ button — builds | ✅ |
| Array of objects with column mapping (`example5`) | [binding-to-data/#example5](https://handsontable.com/docs/vue-data-grid/binding-to-data/#example5) | ✅ | ⚡ button — builds | ✅ |
| Array of objects with custom data schema (`example6`) | [binding-to-data/#example6](https://handsontable.com/docs/vue-data-grid/binding-to-data/#example6)<br>⚠️ renders 0 rows in ALL frameworks: dataSchema demo passes data: [] which suppresses startRows — content fix needed | ⚠️ | ⚡ button — builds | ✅ |
| Function data source and schema (`example7`) | [binding-to-data/#example7](https://handsontable.com/docs/vue-data-grid/binding-to-data/#example7) | ✅ | ⚡ button — builds | ✅ |
| No data (`example9`) | [binding-to-data/#example9](https://handsontable.com/docs/vue-data-grid/binding-to-data/#example9) | ✅ | ⚡ button — builds | ✅ |
| Understand binding as a reference (`example10`) | [binding-to-data/#example10](https://handsontable.com/docs/vue-data-grid/binding-to-data/#example10) | ✅ | ⚡ button — builds | ✅ |
| Working with a copy of data (`example11`) | [binding-to-data/#example11](https://handsontable.com/docs/vue-data-grid/binding-to-data/#example11) | ✅ | ⚡ button — builds | ✅ |

### Saving data

| Demo | Docs link | Docs OK | Sandbox (StackBlitz) | Sandbox OK |
|---|---|:---:|---|:---:|
| Save changes using a callback (`example1`) | [saving-data/#example1](https://handsontable.com/docs/vue-data-grid/saving-data/#example1) | ✅ | ⚡ button — builds | ✅ |

### Events and hooks

| Demo | Docs link | Docs OK | Sandbox (StackBlitz) | Sandbox OK |
|---|---|:---:|---|:---:|
| External control (`example3`) | [events-and-hooks/#example3](https://handsontable.com/docs/vue-data-grid/events-and-hooks/#example3) | ✅ | ⚡ button — builds | ✅ |
| The beforeKeyDown callback (`example2`) | [events-and-hooks/#example2](https://handsontable.com/docs/vue-data-grid/events-and-hooks/#example2) | ✅ | ⚡ button — ❌ vite build fails: Missing "./helpers/dom/event" specifier in "handsontable" package — the import is not exposed by the published package exports map | ❌ |

### Export to Excel

| Demo | Docs link | Docs OK | Sandbox (StackBlitz) | Sandbox OK |
|---|---|:---:|---|:---:|
| Example (`example1`) | [export-to-excel/#example1](https://handsontable.com/docs/vue-data-grid/export-to-excel/#example1) | ✅ | ⚡ button — builds | ✅ |
| Multi-sheet export (`example2`) | [export-to-excel/#example2](https://handsontable.com/docs/vue-data-grid/export-to-excel/#example2) | ✅ | ⚡ button — builds | ✅ |
| Context menu (`example3`) | [export-to-excel/#example3](https://handsontable.com/docs/vue-data-grid/export-to-excel/#example3) | ✅ | ⚡ button — builds | ✅ |

### Export to CSV

| Demo | Docs link | Docs OK | Sandbox (StackBlitz) | Sandbox OK |
|---|---|:---:|---|:---:|
| Export to file (`example1`) | [export-to-csv/#example1](https://handsontable.com/docs/vue-data-grid/export-to-csv/#example1) | ✅ | ⚡ button — builds | ✅ |
| Export as a JavaScript Blob object (`example2`) | [export-to-csv/#example2](https://handsontable.com/docs/vue-data-grid/export-to-csv/#example2) | ✅ | ⚡ button — builds | ✅ |
| Export as a string (`example3`) | [export-to-csv/#example3](https://handsontable.com/docs/vue-data-grid/export-to-csv/#example3) | ✅ | ⚡ button — builds | ✅ |
| Prevent CSV Injection attack (`example4`) | [export-to-csv/#example4](https://handsontable.com/docs/vue-data-grid/export-to-csv/#example4) | ✅ | ⚡ button — builds | ✅ |

### Clipboard

| Demo | Docs link | Docs OK | Sandbox (StackBlitz) | Sandbox OK |
|---|---|:---:|---|:---:|
| Context menu (`example1`) | [basic-clipboard/#example1](https://handsontable.com/docs/vue-data-grid/basic-clipboard/#example1) | ✅ | ⚡ button — builds | ✅ |
| Trigger copy & cut programmatically (`example3`) | [basic-clipboard/#example3](https://handsontable.com/docs/vue-data-grid/basic-clipboard/#example3) | ✅ | ⚡ button — builds | ✅ |
| Copy with headers (`example2`) | [basic-clipboard/#example2](https://handsontable.com/docs/vue-data-grid/basic-clipboard/#example2) | ✅ | ⚡ button — builds | ✅ |

### Handling collaboration and simultaneous editing

| Demo | Docs link | Docs OK | Sandbox (StackBlitz) | Sandbox OK |
|---|---|:---:|---|:---:|
| Avoid overwriting a cell that's being edited (`example1`) | [collaboration/#example1](https://handsontable-docs-staging.pages.dev/docs/vue-data-grid/collaboration/#example1) *(dev)* | ✅ | ⚡ button — builds | ✅ |

## Accessories and menus


### Context menu

| Demo | Docs link | Docs OK | Sandbox (StackBlitz) | Sandbox OK |
|---|---|:---:|---|:---:|
| Context menu with default options (`example1`) | [context-menu/#example1](https://handsontable.com/docs/vue-data-grid/context-menu/#example1) | ✅ | ⚡ button — builds | ✅ |
| Context menu with selected options (`example2`) | [context-menu/#example2](https://handsontable.com/docs/vue-data-grid/context-menu/#example2) | ✅ | ⚡ button — builds | ✅ |
| Context menu with custom options (`example4`) | [context-menu/#example4](https://handsontable.com/docs/vue-data-grid/context-menu/#example4) | ✅ | ⚡ button — builds | ✅ |
| Menu item configuration options (`example3`) | [context-menu/#example3](https://handsontable.com/docs/vue-data-grid/context-menu/#example3) | ✅ | ⚡ button — builds | ✅ |

### Column menu

| Demo | Docs link | Docs OK | Sandbox (StackBlitz) | Sandbox OK |
|---|---|:---:|---|:---:|
| Quick setup (`example1`) | [column-menu/#example1](https://handsontable.com/docs/vue-data-grid/column-menu/#example1) | ✅ | ⚡ button — builds | ✅ |
| Plugin configuration (`example2`) | [column-menu/#example2](https://handsontable.com/docs/vue-data-grid/column-menu/#example2) | ✅ | ⚡ button — builds | ✅ |

### Drag to scroll

| Demo | Docs link | Docs OK | Sandbox (StackBlitz) | Sandbox OK |
|---|---|:---:|---|:---:|
| Enable drag to scroll (`example1`) | [drag-to-scroll/#example1](https://handsontable.com/docs/vue-data-grid/drag-to-scroll/#example1) | ✅ | ⚡ button — builds | ✅ |
| Configure scroll speed (`example2`) | [drag-to-scroll/#example2](https://handsontable.com/docs/vue-data-grid/drag-to-scroll/#example2) | ✅ | ⚡ button — builds | ✅ |

### Undo and redo

| Demo | Docs link | Docs OK | Sandbox (StackBlitz) | Sandbox OK |
|---|---|:---:|---|:---:|
| Basic demo (`example`) | [undo-redo/#example](https://handsontable.com/docs/vue-data-grid/undo-redo/#example) | ✅ | ⚡ button — builds | ✅ |

### Empty Data State

| Demo | Docs link | Docs OK | Sandbox (StackBlitz) | Sandbox OK |
|---|---|:---:|---|:---:|
| Basic configuration (`example1`) | [empty-data-state/#example1](https://handsontable.com/docs/vue-data-grid/empty-data-state/#example1)<br>empty grid is the demoed feature | ✅ | ⚡ button — builds | ✅ |
| Custom configuration (`example2`) | [empty-data-state/#example2](https://handsontable.com/docs/vue-data-grid/empty-data-state/#example2)<br>empty grid is the demoed feature | ✅ | ⚡ button — builds | ✅ |
| Dynamic messages based on source (`example3`) | [empty-data-state/#example3](https://handsontable.com/docs/vue-data-grid/empty-data-state/#example3)<br>empty grid is the demoed feature | ✅ | ⚡ button — builds | ✅ |

### Dialog

| Demo | Docs link | Docs OK | Sandbox (StackBlitz) | Sandbox OK |
|---|---|:---:|---|:---:|
| Basic configuration (`example1`) | [dialog/#example1](https://handsontable.com/docs/vue-data-grid/dialog/#example1) | ✅ | ⚡ button — builds | ✅ |
| Plain text content (`example2`) | [dialog/#example2](https://handsontable.com/docs/vue-data-grid/dialog/#example2) | ✅ | ⚡ button — builds | ✅ |
| HTML content (`example3`) | [dialog/#example3](https://handsontable.com/docs/vue-data-grid/dialog/#example3) | ✅ | ⚡ button — builds | ✅ |
| Template types (`example4`) | [dialog/#example4](https://handsontable.com/docs/vue-data-grid/dialog/#example4) | ✅ | ⚡ button — builds | ✅ |
| Background variants (`example5`) | [dialog/#example5](https://handsontable.com/docs/vue-data-grid/dialog/#example5) | ✅ | ⚡ button — builds | ✅ |
| Content background (`example6`) | [dialog/#example6](https://handsontable.com/docs/vue-data-grid/dialog/#example6) | ✅ | ⚡ button — builds | ✅ |
| Dialog accessibility (`example7`) | [dialog/#example7](https://handsontable.com/docs/vue-data-grid/dialog/#example7) | ✅ | ⚡ button — builds | ✅ |
| Show and hide dialog (`example8`) | [dialog/#example8](https://handsontable.com/docs/vue-data-grid/dialog/#example8) | ✅ | ⚡ button — builds | ✅ |

### Loading

| Demo | Docs link | Docs OK | Sandbox (StackBlitz) | Sandbox OK |
|---|---|:---:|---|:---:|
| Basic configuration (`example1`) | [loading/#example1](https://handsontable.com/docs/vue-data-grid/loading/#example1) | ✅ | ⚡ button — builds | ✅ |
| Custom configuration (`example2`) | [loading/#example2](https://handsontable.com/docs/vue-data-grid/loading/#example2) | ✅ | ⚡ button — builds | ✅ |
| Real-world usage (`example3`) | [loading/#example3](https://handsontable.com/docs/vue-data-grid/loading/#example3)<br>grid fills after clicking "Load data" — empty start is by design | ✅ | ⚡ button — builds | ✅ |
| Loading with Pagination plugin (`example4`) | [loading/#example4](https://handsontable.com/docs/vue-data-grid/loading/#example4)<br>grid fills after clicking "Load data" — empty start is by design | ✅ | ⚡ button — builds | ✅ |

### Notification

| Demo | Docs link | Docs OK | Sandbox (StackBlitz) | Sandbox OK |
|---|---|:---:|---|:---:|
| Basic configuration (`example1`) | [notification/#example1](https://handsontable.com/docs/vue-data-grid/notification/#example1) | ✅ | ⚡ button — builds | ✅ |
| Toolbar actions (inventory-style) (`example2`) | [notification/#example2](https://handsontable.com/docs/vue-data-grid/notification/#example2) | ✅ | ⚡ button — builds | ✅ |

## Internationalization


### Language

| Demo | Docs link | Docs OK | Sandbox (StackBlitz) | Sandbox OK |
|---|---|:---:|---|:---:|
| Demo (`example1`) | [language/#example1](https://handsontable.com/docs/vue-data-grid/language/#example1) | ✅ | ⚡ button — builds | ✅ |

### Layout direction

| Demo | Docs link | Docs OK | Sandbox (StackBlitz) | Sandbox OK |
|---|---|:---:|---|:---:|
| RTL demo (`example1`) | [layout-direction/#example1](https://handsontable.com/docs/vue-data-grid/layout-direction/#example1) | ✅ | ⚡ button — builds | ✅ |
| Set the layout direction automatically (`example2`) | [layout-direction/#example2](https://handsontable.com/docs/vue-data-grid/layout-direction/#example2) | ✅ | ⚡ button — builds | ✅ |
| Set the layout direction to RTL (`example3`) | [layout-direction/#example3](https://handsontable.com/docs/vue-data-grid/layout-direction/#example3) | ✅ | ⚡ button — builds | ✅ |
| Set the layout direction to LTR (`example4`) | [layout-direction/#example4](https://handsontable.com/docs/vue-data-grid/layout-direction/#example4) | ✅ | ⚡ button — builds | ✅ |
| Set the horizontal text alignment (`example5`) | [layout-direction/#example5](https://handsontable.com/docs/vue-data-grid/layout-direction/#example5) | ✅ | ⚡ button — builds | ✅ |

## Accessibility and navigation


### Focus scopes

| Demo | Docs link | Docs OK | Sandbox (StackBlitz) | Sandbox OK |
|---|---|:---:|---|:---:|
| Inline scopes (`example1`) | [focus-scopes/#example1](https://handsontable.com/docs/vue-data-grid/focus-scopes/#example1) | ✅ | ⚡ button — builds | ✅ |
| Modal scopes (`example2`) | [focus-scopes/#example2](https://handsontable.com/docs/vue-data-grid/focus-scopes/#example2) | ✅ | ⚡ button — builds | ✅ |

### Searching values

| Demo | Docs link | Docs OK | Sandbox (StackBlitz) | Sandbox OK |
|---|---|:---:|---|:---:|
| Simplest use case (`example1`) | [searching-values/#example1](https://handsontable.com/docs/vue-data-grid/searching-values/#example1) | ✅ | ⚡ button — builds | ✅ |
| Custom search result class (`example2`) | [searching-values/#example2](https://handsontable.com/docs/vue-data-grid/searching-values/#example2) | ✅ | ⚡ button — builds | ✅ |
| Custom query method (`example3`) | [searching-values/#example3](https://handsontable.com/docs/vue-data-grid/searching-values/#example3) | ✅ | ⚡ button — builds | ✅ |
| Custom callback (`example4`) | [searching-values/#example4](https://handsontable.com/docs/vue-data-grid/searching-values/#example4) | ✅ | ⚡ button — builds | ✅ |

### Accessibility

| Demo | Docs link | Docs OK | Sandbox (StackBlitz) | Sandbox OK |
|---|---|:---:|---|:---:|
| Accessible data grid demo (`example2`) | [accessibility/#example2](https://handsontable.com/docs/vue-data-grid/accessibility/#example2) | ✅ | ⚡ button — builds | ✅ |

## Optimization


### Batch operations

| Demo | Docs link | Docs OK | Sandbox (StackBlitz) | Sandbox OK |
|---|---|:---:|---|:---:|
| Live demo of the suspend feature (`example1`) | [batch-operations/#example1](https://handsontable.com/docs/vue-data-grid/batch-operations/#example1) | ✅ | ⚡ button — builds | ✅ |
