# Angular demos & sandboxes — validation checklist

Task: [DEV-1219](https://app.clickup.com/t/86c98ke4b) — Fix and validate all Angular documentation examples and sandboxes.


- **Scope:** every Angular example embedded in the docs guides (240 examples across 75 pages).
- **Docs link:** production (`handsontable.com/docs`, v18.0) where the example is already released — 223 examples. The remaining 17 exist only on `develop` and are linked to the staging build (`handsontable-docs-staging.pages.dev`), marked *(dev)*.
- **Sandbox:** sandboxes are not static URLs — each example generates its StackBlitz project on the fly and POSTs it to `stackblitz.com/run`. To verify a sandbox, open the docs link and click the ⚡ **Edit on StackBlitz** button on that example.
- **How to check:** Docs OK = the example renders and works on the docs page. Sandbox OK = StackBlitz opens, installs, and runs without errors.


## Getting started


### Demo

| Demo | Docs link | Docs OK | Sandbox (StackBlitz) | Sandbox OK |
|---|---|:---:|---|:---:|
| Demo (`example1`) | [demo/#example1](https://handsontable.com/docs/angular-data-grid/demo/#example1) | ☐ | ⚡ button on the example | ☐ |

### Installation

| Demo | Docs link | Docs OK | Sandbox (StackBlitz) | Sandbox OK |
|---|---|:---:|---|:---:|
| Preview the result (`(no id)`) | [installation/](https://handsontable.com/docs/angular-data-grid/installation/) | ☐ | ⚡ button on the example | ☐ |

### Configuration options

| Demo | Docs link | Docs OK | Sandbox (StackBlitz) | Sandbox OK |
|---|---|:---:|---|:---:|
| Example (`example1`) | [configuration-options/#example1](https://handsontable.com/docs/angular-data-grid/configuration-options/#example1) | ☐ | ⚡ button on the example | ☐ |
| Example (`example2`) | [configuration-options/#example2](https://handsontable.com/docs/angular-data-grid/configuration-options/#example2) | ☐ | ⚡ button on the example | ☐ |
| Example (`example3`) | [configuration-options/#example3](https://handsontable.com/docs/angular-data-grid/configuration-options/#example3) | ☐ | ⚡ button on the example | ☐ |
| Example (`example4`) | [configuration-options/#example4](https://handsontable.com/docs/angular-data-grid/configuration-options/#example4) | ☐ | ⚡ button on the example | ☐ |
| Solution (`example6`) | [configuration-options/#example6](https://handsontable.com/docs/angular-data-grid/configuration-options/#example6) | ☐ | ⚡ button on the example | ☐ |

### Grid size

| Demo | Docs link | Docs OK | Sandbox (StackBlitz) | Sandbox OK |
|---|---|:---:|---|:---:|
| Compare size units (`example2`) | [grid-size/#example2](https://handsontable-docs-staging.pages.dev/docs/angular-data-grid/grid-size/#example2) *(dev)* | ☐ | ⚡ button on the example | ☐ |
| Manual resizing (`example`) | [grid-size/#example](https://handsontable.com/docs/angular-data-grid/grid-size/#example) | ☐ | ⚡ button on the example | ☐ |

### Custom ID, class, and style

| Demo | Docs link | Docs OK | Sandbox (StackBlitz) | Sandbox OK |
|---|---|:---:|---|:---:|
| Set the id, class, and style (`example1`) | [custom-id-class-style/#example1](https://handsontable.com/docs/angular-data-grid/custom-id-class-style/#example1) | ☐ | ⚡ button on the example | ☐ |

### Instance access

| Demo | Docs link | Docs OK | Sandbox (StackBlitz) | Sandbox OK |
|---|---|:---:|---|:---:|
| Use Handsontable's API (`example1`) | [instance-access/#example1](https://handsontable.com/docs/angular-data-grid/instance-access/#example1) | ☐ | ⚡ button on the example | ☐ |

## Styling


### Themes

| Demo | Docs link | Docs OK | Sandbox (StackBlitz) | Sandbox OK |
|---|---|:---:|---|:---:|
| Built-in themes (`example1`) | [themes/#example1](https://handsontable.com/docs/angular-data-grid/themes/#example1) | ☐ | ⚡ button on the example | ☐ |

### Theme Customization

| Demo | Docs link | Docs OK | Sandbox (StackBlitz) | Sandbox OK |
|---|---|:---:|---|:---:|
| Theme API example (`example2`) | [theme-customization/#example2](https://handsontable.com/docs/angular-data-grid/theme-customization/#example2) | ☐ | ⚡ button on the example | ☐ |
| Option 3: Override CSS variables (`example1`) | [theme-customization/#example1](https://handsontable.com/docs/angular-data-grid/theme-customization/#example1) | ☐ | ⚡ button on the example | ☐ |

## Columns


### Column headers

| Demo | Docs link | Docs OK | Sandbox (StackBlitz) | Sandbox OK |
|---|---|:---:|---|:---:|
| Default headers (`example1`) | [column-header/#example1](https://handsontable.com/docs/angular-data-grid/column-header/#example1) | ☐ | ⚡ button on the example | ☐ |
| Header labels as an array (`example2`) | [column-header/#example2](https://handsontable.com/docs/angular-data-grid/column-header/#example2) | ☐ | ⚡ button on the example | ☐ |
| Header labels as a function (`example3`) | [column-header/#example3](https://handsontable.com/docs/angular-data-grid/column-header/#example3) | ☐ | ⚡ button on the example | ☐ |
| Header labels in the columns option (`example6`) | [column-header/#example6](https://handsontable-docs-staging.pages.dev/docs/angular-data-grid/column-header/#example6) *(dev)* | ☐ | ⚡ button on the example | ☐ |
| Customize column headers (`example4`) | [column-header/#example4](https://handsontable.com/docs/angular-data-grid/column-header/#example4) | ☐ | ⚡ button on the example | ☐ |
| Customize column headers (`example5`) | [column-header/#example5](https://handsontable.com/docs/angular-data-grid/column-header/#example5) | ☐ | ⚡ button on the example | ☐ |
| Column header height (`example7`) | [column-header/#example7](https://handsontable-docs-staging.pages.dev/docs/angular-data-grid/column-header/#example7) *(dev)* | ☐ | ⚡ button on the example | ☐ |

### Column groups

| Demo | Docs link | Docs OK | Sandbox (StackBlitz) | Sandbox OK |
|---|---|:---:|---|:---:|
| Example (`example1`) | [column-groups/#example1](https://handsontable.com/docs/angular-data-grid/column-groups/#example1) | ☐ | ⚡ button on the example | ☐ |
| Example (`example2`) | [column-groups/#example2](https://handsontable.com/docs/angular-data-grid/column-groups/#example2) | ☐ | ⚡ button on the example | ☐ |
| Choose which columns stay visible when collapsed (`example3`) | [column-groups/#example3](https://handsontable.com/docs/angular-data-grid/column-groups/#example3) | ☐ | ⚡ button on the example | ☐ |
| Keep a group cohesive or let it split (`example4`) | [column-groups/#example4](https://handsontable-docs-staging.pages.dev/docs/angular-data-grid/column-groups/#example4) *(dev)* | ☐ | ⚡ button on the example | ☐ |

### Column hiding

| Demo | Docs link | Docs OK | Sandbox (StackBlitz) | Sandbox OK |
|---|---|:---:|---|:---:|
| Enable column hiding (`example1`) | [column-hiding/#example1](https://handsontable.com/docs/angular-data-grid/column-hiding/#example1) | ☐ | ⚡ button on the example | ☐ |
| Step 1: Specify columns hidden by default (`example2`) | [column-hiding/#example2](https://handsontable.com/docs/angular-data-grid/column-hiding/#example2) | ☐ | ⚡ button on the example | ☐ |
| Step 2: Show UI indicators (`example3`) | [column-hiding/#example3](https://handsontable.com/docs/angular-data-grid/column-hiding/#example3) | ☐ | ⚡ button on the example | ☐ |
| Step 3: Set up context menu items (`example4`) | [column-hiding/#example4](https://handsontable.com/docs/angular-data-grid/column-hiding/#example4) | ☐ | ⚡ button on the example | ☐ |
| Step 3: Set up context menu items (`example5`) | [column-hiding/#example5](https://handsontable.com/docs/angular-data-grid/column-hiding/#example5) | ☐ | ⚡ button on the example | ☐ |
| Step 4: Set up copy and paste behavior (`example6`) | [column-hiding/#example6](https://handsontable.com/docs/angular-data-grid/column-hiding/#example6) | ☐ | ⚡ button on the example | ☐ |

### Adding and removing columns

| Demo | Docs link | Docs OK | Sandbox (StackBlitz) | Sandbox OK |
|---|---|:---:|---|:---:|
| Insert and remove columns with the API (`example1`) | [column-adding/#example1](https://handsontable-docs-staging.pages.dev/docs/angular-data-grid/column-adding/#example1) *(dev)* | ☐ | ⚡ button on the example | ☐ |
| Add and remove columns from the context menu (`example2`) | [column-adding/#example2](https://handsontable-docs-staging.pages.dev/docs/angular-data-grid/column-adding/#example2) *(dev)* | ☐ | ⚡ button on the example | ☐ |

### Column moving

| Demo | Docs link | Docs OK | Sandbox (StackBlitz) | Sandbox OK |
|---|---|:---:|---|:---:|
| Enable the plugin (`example1`) | [column-moving/#example1](https://handsontable.com/docs/angular-data-grid/column-moving/#example1) | ☐ | ⚡ button on the example | ☐ |
| Move column headers (`example2`) | [column-moving/#example2](https://handsontable.com/docs/angular-data-grid/column-moving/#example2) | ☐ | ⚡ button on the example | ☐ |
| Move column headers (`example3`) | [column-moving/#example3](https://handsontable.com/docs/angular-data-grid/column-moving/#example3) | ☐ | ⚡ button on the example | ☐ |

### Column freezing

| Demo | Docs link | Docs OK | Sandbox (StackBlitz) | Sandbox OK |
|---|---|:---:|---|:---:|
| Freeze columns at initialization (`example1`) | [column-freezing/#example1](https://handsontable.com/docs/angular-data-grid/column-freezing/#example1) | ☐ | ⚡ button on the example | ☐ |
| User-triggered freeze (`example2`) | [column-freezing/#example2](https://handsontable.com/docs/angular-data-grid/column-freezing/#example2) | ☐ | ⚡ button on the example | ☐ |

### Column widths

| Demo | Docs link | Docs OK | Sandbox (StackBlitz) | Sandbox OK |
|---|---|:---:|---|:---:|
| Set the column width as a constant (`example1`) | [column-width/#example1](https://handsontable.com/docs/angular-data-grid/column-width/#example1) | ☐ | ⚡ button on the example | ☐ |
| Set the column width in an array (`example2`) | [column-width/#example2](https://handsontable.com/docs/angular-data-grid/column-width/#example2) | ☐ | ⚡ button on the example | ☐ |
| Set the column width using a function (`example3`) | [column-width/#example3](https://handsontable.com/docs/angular-data-grid/column-width/#example3) | ☐ | ⚡ button on the example | ☐ |
| Set a dynamic maximum column width (`example7`) | [column-width/#example7](https://handsontable-docs-staging.pages.dev/docs/angular-data-grid/column-width/#example7) *(dev)* | ☐ | ⚡ button on the example | ☐ |
| Adjust the column width manually (`example4`) | [column-width/#example4](https://handsontable.com/docs/angular-data-grid/column-width/#example4) | ☐ | ⚡ button on the example | ☐ |
| Fit all columns equally (`example5`) | [column-width/#example5](https://handsontable.com/docs/angular-data-grid/column-width/#example5) | ☐ | ⚡ button on the example | ☐ |
| Stretch only the last column (`example6`) | [column-width/#example6](https://handsontable.com/docs/angular-data-grid/column-width/#example6) | ☐ | ⚡ button on the example | ☐ |

### Column summary

| Demo | Docs link | Docs OK | Sandbox (StackBlitz) | Sandbox OK |
|---|---|:---:|---|:---:|
| Column summary example (`example1`) | [column-summary/#example1](https://handsontable.com/docs/angular-data-grid/column-summary/#example1) | ☐ | ⚡ button on the example | ☐ |
| Step 5: Make room for the destination cell (`example2`) | [column-summary/#example2](https://handsontable.com/docs/angular-data-grid/column-summary/#example2) | ☐ | ⚡ button on the example | ☐ |
| Set up column summaries, using a function (`example3`) | [column-summary/#example3](https://handsontable.com/docs/angular-data-grid/column-summary/#example3) | ☐ | ⚡ button on the example | ☐ |
| Set up column summaries, using a function (`example4`) | [column-summary/#example4](https://handsontable.com/docs/angular-data-grid/column-summary/#example4) | ☐ | ⚡ button on the example | ☐ |
| Implement a custom summary function (`example5`) | [column-summary/#example5](https://handsontable.com/docs/angular-data-grid/column-summary/#example5) | ☐ | ⚡ button on the example | ☐ |
| Round a column summary result (`example6`) | [column-summary/#example6](https://handsontable.com/docs/angular-data-grid/column-summary/#example6) | ☐ | ⚡ button on the example | ☐ |
| Force numeric values (`example7`) | [column-summary/#example7](https://handsontable.com/docs/angular-data-grid/column-summary/#example7) | ☐ | ⚡ button on the example | ☐ |
| Throw data type errors (`example8`) | [column-summary/#example8](https://handsontable.com/docs/angular-data-grid/column-summary/#example8) | ☐ | ⚡ button on the example | ☐ |

### Column virtualization

| Demo | Docs link | Docs OK | Sandbox (StackBlitz) | Sandbox OK |
|---|---|:---:|---|:---:|
| Configure the column virtualization (`example1`) | [column-virtualization/#example1](https://handsontable.com/docs/angular-data-grid/column-virtualization/#example1) | ☐ | ⚡ button on the example | ☐ |

### Column filter

| Demo | Docs link | Docs OK | Sandbox (StackBlitz) | Sandbox OK |
|---|---|:---:|---|:---:|
| Filtering demo (`example1`) | [column-filter/#example1](https://handsontable.com/docs/angular-data-grid/column-filter/#example1) | ☐ | ⚡ button on the example | ☐ |
| Enable filtering (`example2`) | [column-filter/#example2](https://handsontable.com/docs/angular-data-grid/column-filter/#example2) | ☐ | ⚡ button on the example | ☐ |
| Enable filtering for individual columns (`example3`) | [column-filter/#example3](https://handsontable.com/docs/angular-data-grid/column-filter/#example3) | ☐ | ⚡ button on the example | ☐ |
| Enable filtering within already filtered results (`example12`) | [column-filter/#example12](https://handsontable.com/docs/angular-data-grid/column-filter/#example12) | ☐ | ⚡ button on the example | ☐ |
| Filter different types of data (`example4`) | [column-filter/#example4](https://handsontable.com/docs/angular-data-grid/column-filter/#example4) | ☐ | ⚡ button on the example | ☐ |
| Filter data on initialization (`example5`) | [column-filter/#example5](https://handsontable.com/docs/angular-data-grid/column-filter/#example5) | ☐ | ⚡ button on the example | ☐ |
| External quick filter (`example6`) | [column-filter/#example6](https://handsontable.com/docs/angular-data-grid/column-filter/#example6) | ☐ | ⚡ button on the example | ☐ |
| Customize the filter button (`example7`) | [column-filter/#example7](https://handsontable.com/docs/angular-data-grid/column-filter/#example7) | ☐ | ⚡ button on the example | ☐ |
| Customize the filter button (`example8`) | [column-filter/#example8](https://handsontable.com/docs/angular-data-grid/column-filter/#example8) | ☐ | ⚡ button on the example | ☐ |
| Exclude rows from filtering (`example9`) | [column-filter/#example9](https://handsontable.com/docs/angular-data-grid/column-filter/#example9) | ☐ | ⚡ button on the example | ☐ |
| Server-side filtering (`example10`) | [column-filter/#example10](https://handsontable.com/docs/angular-data-grid/column-filter/#example10) | ☐ | ⚡ button on the example | ☐ |
| Filter data programmatically (`example11`) | [column-filter/#example11](https://handsontable.com/docs/angular-data-grid/column-filter/#example11) | ☐ | ⚡ button on the example | ☐ |
| Save and restore filter settings (`example13`) | [column-filter/#example13](https://handsontable-docs-staging.pages.dev/docs/angular-data-grid/column-filter/#example13) *(dev)* | ☐ | ⚡ button on the example | ☐ |
| Get filtered data (`example14`) | [column-filter/#example14](https://handsontable-docs-staging.pages.dev/docs/angular-data-grid/column-filter/#example14) *(dev)* | ☐ | ⚡ button on the example | ☐ |

## Rows


### Row headers

| Demo | Docs link | Docs OK | Sandbox (StackBlitz) | Sandbox OK |
|---|---|:---:|---|:---:|
| Row headers as an array (`example2`) | [row-header/#example2](https://handsontable-docs-staging.pages.dev/docs/angular-data-grid/row-header/#example2) *(dev)* | ☐ | ⚡ button on the example | ☐ |
| Row headers as a function (`example3`) | [row-header/#example3](https://handsontable-docs-staging.pages.dev/docs/angular-data-grid/row-header/#example3) *(dev)* | ☐ | ⚡ button on the example | ☐ |
| Basic example (`example1`) | [row-header/#example1](https://handsontable.com/docs/angular-data-grid/row-header/#example1) | ☐ | ⚡ button on the example | ☐ |

### Row parent-child

| Demo | Docs link | Docs OK | Sandbox (StackBlitz) | Sandbox OK |
|---|---|:---:|---|:---:|
| Prepare the data source (`example1`) | [row-parent-child/#example1](https://handsontable.com/docs/angular-data-grid/row-parent-child/#example1) | ☐ | ⚡ button on the example | ☐ |

### Row hiding

| Demo | Docs link | Docs OK | Sandbox (StackBlitz) | Sandbox OK |
|---|---|:---:|---|:---:|
| Enable row hiding (`example1`) | [row-hiding/#example1](https://handsontable.com/docs/angular-data-grid/row-hiding/#example1) | ☐ | ⚡ button on the example | ☐ |
| Step 1: Specify rows hidden by default (`example2`) | [row-hiding/#example2](https://handsontable.com/docs/angular-data-grid/row-hiding/#example2) | ☐ | ⚡ button on the example | ☐ |
| Step 2: Show UI indicators (`example3`) | [row-hiding/#example3](https://handsontable.com/docs/angular-data-grid/row-hiding/#example3) | ☐ | ⚡ button on the example | ☐ |
| Step 3: Set up context menu items (`example4`) | [row-hiding/#example4](https://handsontable.com/docs/angular-data-grid/row-hiding/#example4) | ☐ | ⚡ button on the example | ☐ |
| Step 3: Set up context menu items (`example5`) | [row-hiding/#example5](https://handsontable.com/docs/angular-data-grid/row-hiding/#example5) | ☐ | ⚡ button on the example | ☐ |
| Step 4: Set up copy and paste behavior (`example6`) | [row-hiding/#example6](https://handsontable.com/docs/angular-data-grid/row-hiding/#example6) | ☐ | ⚡ button on the example | ☐ |

### Row moving

| Demo | Docs link | Docs OK | Sandbox (StackBlitz) | Sandbox OK |
|---|---|:---:|---|:---:|
| Enable the `ManualRowMove` plugin (`example1`) | [row-moving/#example1](https://handsontable.com/docs/angular-data-grid/row-moving/#example1) | ☐ | ⚡ button on the example | ☐ |

### Row freezing

| Demo | Docs link | Docs OK | Sandbox (StackBlitz) | Sandbox OK |
|---|---|:---:|---|:---:|
| Example (`example1`) | [row-freezing/#example1](https://handsontable.com/docs/angular-data-grid/row-freezing/#example1) | ☐ | ⚡ button on the example | ☐ |

### Row heights

| Demo | Docs link | Docs OK | Sandbox (StackBlitz) | Sandbox OK |
|---|---|:---:|---|:---:|
| Set row heights to a number (`example1`) | [row-height/#example1](https://handsontable.com/docs/angular-data-grid/row-height/#example1) | ☐ | ⚡ button on the example | ☐ |
| Set row heights with an array (`example2`) | [row-height/#example2](https://handsontable.com/docs/angular-data-grid/row-height/#example2) | ☐ | ⚡ button on the example | ☐ |
| Set row heights with a function (`example3`) | [row-height/#example3](https://handsontable.com/docs/angular-data-grid/row-height/#example3) | ☐ | ⚡ button on the example | ☐ |
| Adjust row heights manually (`example4`) | [row-height/#example4](https://handsontable.com/docs/angular-data-grid/row-height/#example4) | ☐ | ⚡ button on the example | ☐ |

### Row virtualization

| Demo | Docs link | Docs OK | Sandbox (StackBlitz) | Sandbox OK |
|---|---|:---:|---|:---:|
| Configuring row virtualization (`example1`) | [row-virtualization/#example1](https://handsontable.com/docs/angular-data-grid/row-virtualization/#example1) | ☐ | ⚡ button on the example | ☐ |

### Rows sorting

| Demo | Docs link | Docs OK | Sandbox (StackBlitz) | Sandbox OK |
|---|---|:---:|---|:---:|
| Sorting demo (`example1`) | [rows-sorting/#example1](https://handsontable.com/docs/angular-data-grid/rows-sorting/#example1) | ☐ | ⚡ button on the example | ☐ |
| Enable sorting (`example2`) | [rows-sorting/#example2](https://handsontable.com/docs/angular-data-grid/rows-sorting/#example2) | ☐ | ⚡ button on the example | ☐ |
| Sort different types of data (`example3`) | [rows-sorting/#example3](https://handsontable.com/docs/angular-data-grid/rows-sorting/#example3) | ☐ | ⚡ button on the example | ☐ |
| Use sorting hooks (`example11`) | [rows-sorting/#example11](https://handsontable-docs-staging.pages.dev/docs/angular-data-grid/rows-sorting/#example11) *(dev)* | ☐ | ⚡ button on the example | ☐ |
| Exclude rows from sorting (`example8`) | [rows-sorting/#example8](https://handsontable.com/docs/angular-data-grid/rows-sorting/#example8) | ☐ | ⚡ button on the example | ☐ |
| Sort data programmatically (`example9`) | [rows-sorting/#example9](https://handsontable.com/docs/angular-data-grid/rows-sorting/#example9) | ☐ | ⚡ button on the example | ☐ |
| Sort by multiple columns (`example4`) | [rows-sorting/#example4](https://handsontable.com/docs/angular-data-grid/rows-sorting/#example4) | ☐ | ⚡ button on the example | ☐ |
| Set an initial multi-column sort order (`example5`) | [rows-sorting/#example5](https://handsontable.com/docs/angular-data-grid/rows-sorting/#example5) | ☐ | ⚡ button on the example | ☐ |
| Sort by multiple columns programmatically (`example10`) | [rows-sorting/#example10](https://handsontable.com/docs/angular-data-grid/rows-sorting/#example10) | ☐ | ⚡ button on the example | ☐ |
| Add custom sort icons (`example6`) | [rows-sorting/#example6](https://handsontable.com/docs/angular-data-grid/rows-sorting/#example6) | ☐ | ⚡ button on the example | ☐ |
| Add custom sort icons (`example7`) | [rows-sorting/#example7](https://handsontable.com/docs/angular-data-grid/rows-sorting/#example7) | ☐ | ⚡ button on the example | ☐ |

### Rows pagination

| Demo | Docs link | Docs OK | Sandbox (StackBlitz) | Sandbox OK |
|---|---|:---:|---|:---:|
| Pagination demo (`example1`) | [rows-pagination/#example1](https://handsontable.com/docs/angular-data-grid/rows-pagination/#example1) | ☐ | ⚡ button on the example | ☐ |
| Configure pagination (`example2`) | [rows-pagination/#example2](https://handsontable.com/docs/angular-data-grid/rows-pagination/#example2) | ☐ | ⚡ button on the example | ☐ |
| Control pagination programmatically (`example3`) | [rows-pagination/#example3](https://handsontable.com/docs/angular-data-grid/rows-pagination/#example3) | ☐ | ⚡ button on the example | ☐ |
| Choose where to display the pagination UI (`example4`) | [rows-pagination/#example4](https://handsontable.com/docs/angular-data-grid/rows-pagination/#example4) | ☐ | ⚡ button on the example | ☐ |
| Modify paged data (`example5`) | [rows-pagination/#example5](https://handsontable.com/docs/angular-data-grid/rows-pagination/#example5) | ☐ | ⚡ button on the example | ☐ |
| Localize pagination (`example6`) | [rows-pagination/#example6](https://handsontable.com/docs/angular-data-grid/rows-pagination/#example6) | ☐ | ⚡ button on the example | ☐ |

### Row trimming

| Demo | Docs link | Docs OK | Sandbox (StackBlitz) | Sandbox OK |
|---|---|:---:|---|:---:|
| Example (`example1`) | [row-trimming/#example1](https://handsontable.com/docs/angular-data-grid/row-trimming/#example1) | ☐ | ⚡ button on the example | ☐ |

### Row pre-populating

| Demo | Docs link | Docs OK | Sandbox (StackBlitz) | Sandbox OK |
|---|---|:---:|---|:---:|
| Basic spare rows (`example1`) | [row-prepopulating/#example1](https://handsontable.com/docs/angular-data-grid/row-prepopulating/#example1) | ☐ | ⚡ button on the example | ☐ |
| Spare rows with placeholder styling (`example2`) | [row-prepopulating/#example2](https://handsontable.com/docs/angular-data-grid/row-prepopulating/#example2) | ☐ | ⚡ button on the example | ☐ |
| Auto-populating with template values (`example3`) | [row-prepopulating/#example3](https://handsontable.com/docs/angular-data-grid/row-prepopulating/#example3) | ☐ | ⚡ button on the example | ☐ |

## Cell features


### Selection

| Demo | Docs link | Docs OK | Sandbox (StackBlitz) | Sandbox OK |
|---|---|:---:|---|:---:|
| Select ranges (`example1`) | [selection/#example1](https://handsontable.com/docs/angular-data-grid/selection/#example1) | ☐ | ⚡ button on the example | ☐ |
| Get data from the selected ranges (`example2`) | [selection/#example2](https://handsontable.com/docs/angular-data-grid/selection/#example2) | ☐ | ⚡ button on the example | ☐ |
| Modify the selected cells (`example3`) | [selection/#example3](https://handsontable.com/docs/angular-data-grid/selection/#example3) | ☐ | ⚡ button on the example | ☐ |
| Style the selection area (`example4`) | [selection/#example4](https://handsontable.com/docs/angular-data-grid/selection/#example4) | ☐ | ⚡ button on the example | ☐ |
| Select cells programmatically (`example5`) | [selection/#example5](https://handsontable.com/docs/angular-data-grid/selection/#example5) | ☐ | ⚡ button on the example | ☐ |
| Jump across horizontal edges (`example6`) | [selection/#example6](https://handsontable-docs-staging.pages.dev/docs/angular-data-grid/selection/#example6) *(dev)* | ☐ | ⚡ button on the example | ☐ |

### Merge cells

| Demo | Docs link | Docs OK | Sandbox (StackBlitz) | Sandbox OK |
|---|---|:---:|---|:---:|
| How to merge cells (`example1`) | [merge-cells/#example1](https://handsontable.com/docs/angular-data-grid/merge-cells/#example1) | ☐ | ⚡ button on the example | ☐ |
| Optimizing rendering of the wide/tall merged cells (`example2`) | [merge-cells/#example2](https://handsontable.com/docs/angular-data-grid/merge-cells/#example2) | ☐ | ⚡ button on the example | ☐ |

### Conditional formatting

| Demo | Docs link | Docs OK | Sandbox (StackBlitz) | Sandbox OK |
|---|---|:---:|---|:---:|
| Example of conditional formatting (`example1`) | [conditional-formatting/#example1](https://handsontable.com/docs/angular-data-grid/conditional-formatting/#example1) | ☐ | ⚡ button on the example | ☐ |

### Text alignment

| Demo | Docs link | Docs OK | Sandbox (StackBlitz) | Sandbox OK |
|---|---|:---:|---|:---:|
| Basic example (`example1`) | [text-alignment/#example1](https://handsontable.com/docs/angular-data-grid/text-alignment/#example1) | ☐ | ⚡ button on the example | ☐ |

### Disabled cells

| Demo | Docs link | Docs OK | Sandbox (StackBlitz) | Sandbox OK |
|---|---|:---:|---|:---:|
| To disable a cell (`exampleReadOnlyGrid`) | [disabled-cells/#exampleReadOnlyGrid](https://handsontable.com/docs/angular-data-grid/disabled-cells/#exampleReadOnlyGrid) | ☐ | ⚡ button on the example | ☐ |
| To disable a column (`example1`) | [disabled-cells/#example1](https://handsontable.com/docs/angular-data-grid/disabled-cells/#example1) | ☐ | ⚡ button on the example | ☐ |
| To disable a row (`example2`) | [disabled-cells/#example2](https://handsontable.com/docs/angular-data-grid/disabled-cells/#example2) | ☐ | ⚡ button on the example | ☐ |
| To disable a column (non-editable) (`example3`) | [disabled-cells/#example3](https://handsontable.com/docs/angular-data-grid/disabled-cells/#example3) | ☐ | ⚡ button on the example | ☐ |
| To disable a cell (`example4`) | [disabled-cells/#example4](https://handsontable.com/docs/angular-data-grid/disabled-cells/#example4) | ☐ | ⚡ button on the example | ☐ |

### Comments

| Demo | Docs link | Docs OK | Sandbox (StackBlitz) | Sandbox OK |
|---|---|:---:|---|:---:|
| Basic example (`example1`) | [comments/#example1](https://handsontable.com/docs/angular-data-grid/comments/#example1) | ☐ | ⚡ button on the example | ☐ |
| Make a comment read-only (`example2`) | [comments/#example2](https://handsontable.com/docs/angular-data-grid/comments/#example2) | ☐ | ⚡ button on the example | ☐ |
| Set a comment box's size (`example3`) | [comments/#example3](https://handsontable.com/docs/angular-data-grid/comments/#example3) | ☐ | ⚡ button on the example | ☐ |
| Set a delay for displaying comments (`example4`) | [comments/#example4](https://handsontable.com/docs/angular-data-grid/comments/#example4) | ☐ | ⚡ button on the example | ☐ |

### Autofill values

| Demo | Docs link | Docs OK | Sandbox (StackBlitz) | Sandbox OK |
|---|---|:---:|---|:---:|
| How double-click autofill determines the range (`example1`) | [autofill-values/#example1](https://handsontable.com/docs/angular-data-grid/autofill-values/#example1) | ☐ | ⚡ button on the example | ☐ |
| Autofill in a vertical direction only and creating new rows (`example2`) | [autofill-values/#example2](https://handsontable.com/docs/angular-data-grid/autofill-values/#example2) | ☐ | ⚡ button on the example | ☐ |

### Formatting cells

| Demo | Docs link | Docs OK | Sandbox (StackBlitz) | Sandbox OK |
|---|---|:---:|---|:---:|
| Apply custom CSS class styles (`example1`) | [formatting-cells/#example1](https://handsontable.com/docs/angular-data-grid/formatting-cells/#example1) | ☐ | ⚡ button on the example | ☐ |
| Apply inline styles (`example2`) | [formatting-cells/#example2](https://handsontable.com/docs/angular-data-grid/formatting-cells/#example2) | ☐ | ⚡ button on the example | ☐ |
| Custom cell borders (`example3`) | [formatting-cells/#example3](https://handsontable.com/docs/angular-data-grid/formatting-cells/#example3) | ☐ | ⚡ button on the example | ☐ |

## Cell functions


### Cell functions

| Demo | Docs link | Docs OK | Sandbox (StackBlitz) | Sandbox OK |
|---|---|:---:|---|:---:|
| Mixing renderer, editor, and validator (`example1`) | [cell-function/#example1](https://handsontable.com/docs/angular-data-grid/cell-function/#example1) | ☐ | ⚡ button on the example | ☐ |

### Cell renderer

| Demo | Docs link | Docs OK | Sandbox (StackBlitz) | Sandbox OK |
|---|---|:---:|---|:---:|
| Declare a custom renderer as a component (`example1`) | [cell-renderer/#example1](https://handsontable.com/docs/angular-data-grid/cell-renderer/#example1) | ☐ | ⚡ button on the example | ☐ |
| Declare a custom renderer as a component (`example3`) | [cell-renderer/#example3](https://handsontable.com/docs/angular-data-grid/cell-renderer/#example3) | ☐ | ⚡ button on the example | ☐ |
| Declare a custom renderer as an Angular Template (`example2`) | [cell-renderer/#example2](https://handsontable.com/docs/angular-data-grid/cell-renderer/#example2) | ☐ | ⚡ button on the example | ☐ |
| Declare a custom renderer as a function (`example4`) | [cell-renderer/#example4](https://handsontable.com/docs/angular-data-grid/cell-renderer/#example4) | ☐ | ⚡ button on the example | ☐ |
| Render custom HTML in cells (`example5`) | [cell-renderer/#example5](https://handsontable.com/docs/angular-data-grid/cell-renderer/#example5) | ☐ | ⚡ button on the example | ☐ |
| Render custom HTML in header (`example6`) | [cell-renderer/#example6](https://handsontable.com/docs/angular-data-grid/cell-renderer/#example6) | ☐ | ⚡ button on the example | ☐ |

### Cell editor

| Demo | Docs link | Docs OK | Sandbox (StackBlitz) | Sandbox OK |
|---|---|:---:|---|:---:|
| Component-based editors (`example1`) | [cell-editor/#example1](https://handsontable.com/docs/angular-data-grid/cell-editor/#example1) | ☐ | ⚡ button on the example | ☐ |
| Class-based editors (`example2`) | [cell-editor/#example2](https://handsontable.com/docs/angular-data-grid/cell-editor/#example2) | ☐ | ⚡ button on the example | ☐ |
| Extending an existing editor (`example3`) | [cell-editor/#example3](https://handsontable.com/docs/angular-data-grid/cell-editor/#example3) | ☐ | ⚡ button on the example | ☐ |

### Cell validator

| Demo | Docs link | Docs OK | Sandbox (StackBlitz) | Sandbox OK |
|---|---|:---:|---|:---:|
| Full featured example (`example1`) | [cell-validator/#example1](https://handsontable.com/docs/angular-data-grid/cell-validator/#example1) | ☐ | ⚡ button on the example | ☐ |

## Cell types


### Cell type

| Demo | Docs link | Docs OK | Sandbox (StackBlitz) | Sandbox OK |
|---|---|:---:|---|:---:|
| Built-in cell types example (`example1`) | [cell-type/#example1](https://handsontable.com/docs/angular-data-grid/cell-type/#example1) | ☐ | ⚡ button on the example | ☐ |
| Empty cells (`example2`) | [cell-type/#example2](https://handsontable.com/docs/angular-data-grid/cell-type/#example2) | ☐ | ⚡ button on the example | ☐ |

### Numeric cell type

| Demo | Docs link | Docs OK | Sandbox (StackBlitz) | Sandbox OK |
|---|---|:---:|---|:---:|
| Numeric cell type demo (`example1`) | [numeric-cell-type/#example1](https://handsontable.com/docs/angular-data-grid/numeric-cell-type/#example1) | ☐ | ⚡ button on the example | ☐ |

### Date cell type

| Demo | Docs link | Docs OK | Sandbox (StackBlitz) | Sandbox OK |
|---|---|:---:|---|:---:|
| Date cell type demo (`example1`) | [date-cell-type/#example1](https://handsontable.com/docs/angular-data-grid/date-cell-type/#example1) | ☐ | ⚡ button on the example | ☐ |

### Time cell type

| Demo | Docs link | Docs OK | Sandbox (StackBlitz) | Sandbox OK |
|---|---|:---:|---|:---:|
| Time cell type demo (`example1`) | [time-cell-type/#example1](https://handsontable.com/docs/angular-data-grid/time-cell-type/#example1) | ☐ | ⚡ button on the example | ☐ |

### Checkbox cell type

| Demo | Docs link | Docs OK | Sandbox (StackBlitz) | Sandbox OK |
|---|---|:---:|---|:---:|
| Checkbox true/false values (`example1`) | [checkbox-cell-type/#example1](https://handsontable.com/docs/angular-data-grid/checkbox-cell-type/#example1) | ☐ | ⚡ button on the example | ☐ |
| Checkbox template (`example2`) | [checkbox-cell-type/#example2](https://handsontable.com/docs/angular-data-grid/checkbox-cell-type/#example2) | ☐ | ⚡ button on the example | ☐ |
| Checkbox labels (`example3`) | [checkbox-cell-type/#example3](https://handsontable.com/docs/angular-data-grid/checkbox-cell-type/#example3) | ☐ | ⚡ button on the example | ☐ |
| Label value as a function (`example4`) | [checkbox-cell-type/#example4](https://handsontable.com/docs/angular-data-grid/checkbox-cell-type/#example4) | ☐ | ⚡ button on the example | ☐ |

### Select cell type

| Demo | Docs link | Docs OK | Sandbox (StackBlitz) | Sandbox OK |
|---|---|:---:|---|:---:|
| Usage (`example1`) | [select-cell-type/#example1](https://handsontable.com/docs/angular-data-grid/select-cell-type/#example1) | ☐ | ⚡ button on the example | ☐ |

### Dropdown cell type

| Demo | Docs link | Docs OK | Sandbox (StackBlitz) | Sandbox OK |
|---|---|:---:|---|:---:|
| Usage (`example1`) | [dropdown-cell-type/#example1](https://handsontable.com/docs/angular-data-grid/dropdown-cell-type/#example1) | ☐ | ⚡ button on the example | ☐ |
| Array of values (`example2`) | [dropdown-cell-type/#example2](https://handsontable.com/docs/angular-data-grid/dropdown-cell-type/#example2) | ☐ | ⚡ button on the example | ☐ |
| Array of objects (`example3`) | [dropdown-cell-type/#example3](https://handsontable.com/docs/angular-data-grid/dropdown-cell-type/#example3) | ☐ | ⚡ button on the example | ☐ |
| Set the dropdown width (`example4`) | [dropdown-cell-type/#example4](https://handsontable-docs-staging.pages.dev/docs/angular-data-grid/dropdown-cell-type/#example4) *(dev)* | ☐ | ⚡ button on the example | ☐ |
| Set the dropdown height (`example5`) | [dropdown-cell-type/#example5](https://handsontable-docs-staging.pages.dev/docs/angular-data-grid/dropdown-cell-type/#example5) *(dev)* | ☐ | ⚡ button on the example | ☐ |

### Autocomplete cell type

| Demo | Docs link | Docs OK | Sandbox (StackBlitz) | Sandbox OK |
|---|---|:---:|---|:---:|
| Autocomplete flexible mode (`example1`) | [autocomplete-cell-type/#example1](https://handsontable.com/docs/angular-data-grid/autocomplete-cell-type/#example1) | ☐ | ⚡ button on the example | ☐ |
| Autocomplete strict mode (`example2`) | [autocomplete-cell-type/#example2](https://handsontable.com/docs/angular-data-grid/autocomplete-cell-type/#example2) | ☐ | ⚡ button on the example | ☐ |
| Autocomplete strict mode with asynchronous data (`example3`) | [autocomplete-cell-type/#example3](https://handsontable.com/docs/angular-data-grid/autocomplete-cell-type/#example3) | ☐ | ⚡ button on the example | ☐ |
| Array of values (`example4`) | [autocomplete-cell-type/#example4](https://handsontable.com/docs/angular-data-grid/autocomplete-cell-type/#example4) | ☐ | ⚡ button on the example | ☐ |
| Array of objects (`example5`) | [autocomplete-cell-type/#example5](https://handsontable.com/docs/angular-data-grid/autocomplete-cell-type/#example5) | ☐ | ⚡ button on the example | ☐ |
| The `filter` option (`example6`) | [autocomplete-cell-type/#example6](https://handsontable.com/docs/angular-data-grid/autocomplete-cell-type/#example6) | ☐ | ⚡ button on the example | ☐ |
| The `filteringCaseSensitive` option (`example7`) | [autocomplete-cell-type/#example7](https://handsontable.com/docs/angular-data-grid/autocomplete-cell-type/#example7) | ☐ | ⚡ button on the example | ☐ |

### MultiSelect cell type

| Demo | Docs link | Docs OK | Sandbox (StackBlitz) | Sandbox OK |
|---|---|:---:|---|:---:|
| Array of values (`example1`) | [multiselect-cell-type/#example1](https://handsontable.com/docs/angular-data-grid/multiselect-cell-type/#example1) | ☐ | ⚡ button on the example | ☐ |
| Array of objects (`example2`) | [multiselect-cell-type/#example2](https://handsontable.com/docs/angular-data-grid/multiselect-cell-type/#example2) | ☐ | ⚡ button on the example | ☐ |
| Other options (`example3`) | [multiselect-cell-type/#example3](https://handsontable.com/docs/angular-data-grid/multiselect-cell-type/#example3) | ☐ | ⚡ button on the example | ☐ |

### Password cell type

| Demo | Docs link | Docs OK | Sandbox (StackBlitz) | Sandbox OK |
|---|---|:---:|---|:---:|
| Overview (`example1`) | [password-cell-type/#example1](https://handsontable.com/docs/angular-data-grid/password-cell-type/#example1) | ☐ | ⚡ button on the example | ☐ |
| Fixed hash length (`example2`) | [password-cell-type/#example2](https://handsontable.com/docs/angular-data-grid/password-cell-type/#example2) | ☐ | ⚡ button on the example | ☐ |
| Custom hash symbol (`example3`) | [password-cell-type/#example3](https://handsontable.com/docs/angular-data-grid/password-cell-type/#example3) | ☐ | ⚡ button on the example | ☐ |
| Reveal delay (`example4`) | [password-cell-type/#example4](https://handsontable.com/docs/angular-data-grid/password-cell-type/#example4) | ☐ | ⚡ button on the example | ☐ |

### Handsontable cell type

| Demo | Docs link | Docs OK | Sandbox (StackBlitz) | Sandbox OK |
|---|---|:---:|---|:---:|
| Basic example (`example1`) | [handsontable-cell-type/#example1](https://handsontable.com/docs/angular-data-grid/handsontable-cell-type/#example1) | ☐ | ⚡ button on the example | ☐ |

## Formulas


### Formula calculation

| Demo | Docs link | Docs OK | Sandbox (StackBlitz) | Sandbox OK |
|---|---|:---:|---|:---:|
| Basic multi-sheet example (`example1`) | [formula-calculation/#example1](https://handsontable.com/docs/angular-data-grid/formula-calculation/#example1) | ☐ | ⚡ button on the example | ☐ |
| Data grid example (`example2`) | [formula-calculation/#example2](https://handsontable.com/docs/angular-data-grid/formula-calculation/#example2) | ☐ | ⚡ button on the example | ☐ |
| Demo: plain-value named expression (`example3`) | [formula-calculation/#example3](https://handsontable.com/docs/angular-data-grid/formula-calculation/#example3) | ☐ | ⚡ button on the example | ☐ |
| Demo: formula-based named expressions (`example4`) | [formula-calculation/#example4](https://handsontable.com/docs/angular-data-grid/formula-calculation/#example4) | ☐ | ⚡ button on the example | ☐ |
| Demo: custom COMMISSION function (`example5`) | [formula-calculation/#example5](https://handsontable-docs-staging.pages.dev/docs/angular-data-grid/formula-calculation/#example5) *(dev)* | ☐ | ⚡ button on the example | ☐ |

## Server-side data


### Server-side data

| Demo | Docs link | Docs OK | Sandbox (StackBlitz) | Sandbox OK |
|---|---|:---:|---|:---:|
| Demo (`example1`) | [server-side-data/#example1](https://handsontable.com/docs/angular-data-grid/server-side-data/#example1) | ☐ | ⚡ button on the example | ☐ |

## Data management


### Binding to data

| Demo | Docs link | Docs OK | Sandbox (StackBlitz) | Sandbox OK |
|---|---|:---:|---|:---:|
| Array of arrays (`example1`) | [binding-to-data/#example1](https://handsontable.com/docs/angular-data-grid/binding-to-data/#example1) | ☐ | ⚡ button on the example | ☐ |
| Array of arrays with a selective display of columns (`example2`) | [binding-to-data/#example2](https://handsontable.com/docs/angular-data-grid/binding-to-data/#example2) | ☐ | ⚡ button on the example | ☐ |
| Array of objects (`example3`) | [binding-to-data/#example3](https://handsontable.com/docs/angular-data-grid/binding-to-data/#example3) | ☐ | ⚡ button on the example | ☐ |
| Array of objects with column as a function (`example4`) | [binding-to-data/#example4](https://handsontable.com/docs/angular-data-grid/binding-to-data/#example4) | ☐ | ⚡ button on the example | ☐ |
| Array of objects with column mapping (`example5`) | [binding-to-data/#example5](https://handsontable.com/docs/angular-data-grid/binding-to-data/#example5) | ☐ | ⚡ button on the example | ☐ |
| Array of objects with custom data schema (`example6`) | [binding-to-data/#example6](https://handsontable.com/docs/angular-data-grid/binding-to-data/#example6) | ☐ | ⚡ button on the example | ☐ |
| Function data source and schema (`example7`) | [binding-to-data/#example7](https://handsontable.com/docs/angular-data-grid/binding-to-data/#example7) | ☐ | ⚡ button on the example | ☐ |
| No data (`example9`) | [binding-to-data/#example9](https://handsontable.com/docs/angular-data-grid/binding-to-data/#example9) | ☐ | ⚡ button on the example | ☐ |
| Understand binding as a reference (`example10`) | [binding-to-data/#example10](https://handsontable.com/docs/angular-data-grid/binding-to-data/#example10) | ☐ | ⚡ button on the example | ☐ |
| Working with a copy of data (`example11`) | [binding-to-data/#example11](https://handsontable.com/docs/angular-data-grid/binding-to-data/#example11) | ☐ | ⚡ button on the example | ☐ |

### Saving data

| Demo | Docs link | Docs OK | Sandbox (StackBlitz) | Sandbox OK |
|---|---|:---:|---|:---:|
| Save changes using a callback (`example1`) | [saving-data/#example1](https://handsontable.com/docs/angular-data-grid/saving-data/#example1) | ☐ | ⚡ button on the example | ☐ |

### Events and hooks

| Demo | Docs link | Docs OK | Sandbox (StackBlitz) | Sandbox OK |
|---|---|:---:|---|:---:|
| External control (`example3`) | [events-and-hooks/#example3](https://handsontable.com/docs/angular-data-grid/events-and-hooks/#example3) | ☐ | ⚡ button on the example | ☐ |
| The [`beforeKeyDown`](@/api/hooks.md#beforekeydown) callback (`example2`) | [events-and-hooks/#example2](https://handsontable.com/docs/angular-data-grid/events-and-hooks/#example2) | ☐ | ⚡ button on the example | ☐ |

### Export to Excel

| Demo | Docs link | Docs OK | Sandbox (StackBlitz) | Sandbox OK |
|---|---|:---:|---|:---:|
| Example (`example1`) | [export-to-excel/#example1](https://handsontable.com/docs/angular-data-grid/export-to-excel/#example1) | ☐ | ⚡ button on the example | ☐ |
| Multi-sheet export (`example2`) | [export-to-excel/#example2](https://handsontable.com/docs/angular-data-grid/export-to-excel/#example2) | ☐ | ⚡ button on the example | ☐ |
| Context menu (`example3`) | [export-to-excel/#example3](https://handsontable.com/docs/angular-data-grid/export-to-excel/#example3) | ☐ | ⚡ button on the example | ☐ |

### Export to CSV

| Demo | Docs link | Docs OK | Sandbox (StackBlitz) | Sandbox OK |
|---|---|:---:|---|:---:|
| Export to file (`example1`) | [export-to-csv/#example1](https://handsontable.com/docs/angular-data-grid/export-to-csv/#example1) | ☐ | ⚡ button on the example | ☐ |
| Export as a JavaScript Blob object (`example2`) | [export-to-csv/#example2](https://handsontable.com/docs/angular-data-grid/export-to-csv/#example2) | ☐ | ⚡ button on the example | ☐ |
| Export as a string (`example3`) | [export-to-csv/#example3](https://handsontable.com/docs/angular-data-grid/export-to-csv/#example3) | ☐ | ⚡ button on the example | ☐ |
| Prevent CSV Injection attack (`example4`) | [export-to-csv/#example4](https://handsontable.com/docs/angular-data-grid/export-to-csv/#example4) | ☐ | ⚡ button on the example | ☐ |

### Clipboard

| Demo | Docs link | Docs OK | Sandbox (StackBlitz) | Sandbox OK |
|---|---|:---:|---|:---:|
| Context menu (`example1`) | [basic-clipboard/#example1](https://handsontable.com/docs/angular-data-grid/basic-clipboard/#example1) | ☐ | ⚡ button on the example | ☐ |
| Trigger copy & cut programmatically (`example3`) | [basic-clipboard/#example3](https://handsontable.com/docs/angular-data-grid/basic-clipboard/#example3) | ☐ | ⚡ button on the example | ☐ |
| Copy with headers (`example2`) | [basic-clipboard/#example2](https://handsontable.com/docs/angular-data-grid/basic-clipboard/#example2) | ☐ | ⚡ button on the example | ☐ |

### Handling collaboration and simultaneous editing

| Demo | Docs link | Docs OK | Sandbox (StackBlitz) | Sandbox OK |
|---|---|:---:|---|:---:|
| Avoid overwriting a cell that's being edited (`example1`) | [collaboration/#example1](https://handsontable-docs-staging.pages.dev/docs/angular-data-grid/collaboration/#example1) *(dev)* | ☐ | ⚡ button on the example | ☐ |

## Accessories and menus


### Context menu

| Demo | Docs link | Docs OK | Sandbox (StackBlitz) | Sandbox OK |
|---|---|:---:|---|:---:|
| Context menu with default options (`example1`) | [context-menu/#example1](https://handsontable.com/docs/angular-data-grid/context-menu/#example1) | ☐ | ⚡ button on the example | ☐ |
| Context menu with selected options (`example2`) | [context-menu/#example2](https://handsontable.com/docs/angular-data-grid/context-menu/#example2) | ☐ | ⚡ button on the example | ☐ |
| Menu item configuration options (`example3`) | [context-menu/#example3](https://handsontable.com/docs/angular-data-grid/context-menu/#example3) | ☐ | ⚡ button on the example | ☐ |

### Column menu

| Demo | Docs link | Docs OK | Sandbox (StackBlitz) | Sandbox OK |
|---|---|:---:|---|:---:|
| Quick setup (`example1`) | [column-menu/#example1](https://handsontable.com/docs/angular-data-grid/column-menu/#example1) | ☐ | ⚡ button on the example | ☐ |
| Plugin configuration (`example2`) | [column-menu/#example2](https://handsontable.com/docs/angular-data-grid/column-menu/#example2) | ☐ | ⚡ button on the example | ☐ |

### Drag to scroll

| Demo | Docs link | Docs OK | Sandbox (StackBlitz) | Sandbox OK |
|---|---|:---:|---|:---:|
| Enable drag to scroll (`example1`) | [drag-to-scroll/#example1](https://handsontable.com/docs/angular-data-grid/drag-to-scroll/#example1) | ☐ | ⚡ button on the example | ☐ |
| Configure scroll speed (`example2`) | [drag-to-scroll/#example2](https://handsontable.com/docs/angular-data-grid/drag-to-scroll/#example2) | ☐ | ⚡ button on the example | ☐ |

### Undo and redo

| Demo | Docs link | Docs OK | Sandbox (StackBlitz) | Sandbox OK |
|---|---|:---:|---|:---:|
| Basic demo (`example1`) | [undo-redo/#example1](https://handsontable.com/docs/angular-data-grid/undo-redo/#example1) | ☐ | ⚡ button on the example | ☐ |

### Empty Data State

| Demo | Docs link | Docs OK | Sandbox (StackBlitz) | Sandbox OK |
|---|---|:---:|---|:---:|
| Basic configuration (`example1`) | [empty-data-state/#example1](https://handsontable.com/docs/angular-data-grid/empty-data-state/#example1) | ☐ | ⚡ button on the example | ☐ |
| Custom configuration (`example2`) | [empty-data-state/#example2](https://handsontable.com/docs/angular-data-grid/empty-data-state/#example2) | ☐ | ⚡ button on the example | ☐ |
| Dynamic messages based on source (`example3`) | [empty-data-state/#example3](https://handsontable.com/docs/angular-data-grid/empty-data-state/#example3) | ☐ | ⚡ button on the example | ☐ |

### Dialog

| Demo | Docs link | Docs OK | Sandbox (StackBlitz) | Sandbox OK |
|---|---|:---:|---|:---:|
| Basic configuration (`example1`) | [dialog/#example1](https://handsontable.com/docs/angular-data-grid/dialog/#example1) | ☐ | ⚡ button on the example | ☐ |
| Plain text content (`example2`) | [dialog/#example2](https://handsontable.com/docs/angular-data-grid/dialog/#example2) | ☐ | ⚡ button on the example | ☐ |
| HTML content (`example3`) | [dialog/#example3](https://handsontable.com/docs/angular-data-grid/dialog/#example3) | ☐ | ⚡ button on the example | ☐ |
| Template types (`example4`) | [dialog/#example4](https://handsontable.com/docs/angular-data-grid/dialog/#example4) | ☐ | ⚡ button on the example | ☐ |
| Background variants (`example5`) | [dialog/#example5](https://handsontable.com/docs/angular-data-grid/dialog/#example5) | ☐ | ⚡ button on the example | ☐ |
| Content background (`example6`) | [dialog/#example6](https://handsontable.com/docs/angular-data-grid/dialog/#example6) | ☐ | ⚡ button on the example | ☐ |
| Dialog accessibility (`example7`) | [dialog/#example7](https://handsontable.com/docs/angular-data-grid/dialog/#example7) | ☐ | ⚡ button on the example | ☐ |
| Show and hide dialog (`example8`) | [dialog/#example8](https://handsontable.com/docs/angular-data-grid/dialog/#example8) | ☐ | ⚡ button on the example | ☐ |

### Loading

| Demo | Docs link | Docs OK | Sandbox (StackBlitz) | Sandbox OK |
|---|---|:---:|---|:---:|
| Basic configuration (`example1`) | [loading/#example1](https://handsontable.com/docs/angular-data-grid/loading/#example1) | ☐ | ⚡ button on the example | ☐ |
| Custom configuration (`example2`) | [loading/#example2](https://handsontable.com/docs/angular-data-grid/loading/#example2) | ☐ | ⚡ button on the example | ☐ |
| Real-world usage (`example3`) | [loading/#example3](https://handsontable.com/docs/angular-data-grid/loading/#example3) | ☐ | ⚡ button on the example | ☐ |
| Loading with Pagination plugin (`example4`) | [loading/#example4](https://handsontable.com/docs/angular-data-grid/loading/#example4) | ☐ | ⚡ button on the example | ☐ |

### Notification

| Demo | Docs link | Docs OK | Sandbox (StackBlitz) | Sandbox OK |
|---|---|:---:|---|:---:|
| Basic configuration (`example1`) | [notification/#example1](https://handsontable.com/docs/angular-data-grid/notification/#example1) | ☐ | ⚡ button on the example | ☐ |
| Toolbar actions (inventory-style) (`example2`) | [notification/#example2](https://handsontable.com/docs/angular-data-grid/notification/#example2) | ☐ | ⚡ button on the example | ☐ |

## Internationalization


### Language

| Demo | Docs link | Docs OK | Sandbox (StackBlitz) | Sandbox OK |
|---|---|:---:|---|:---:|
| Demo (`example1`) | [language/#example1](https://handsontable.com/docs/angular-data-grid/language/#example1) | ☐ | ⚡ button on the example | ☐ |

### Layout direction

| Demo | Docs link | Docs OK | Sandbox (StackBlitz) | Sandbox OK |
|---|---|:---:|---|:---:|
| RTL demo (`example1`) | [layout-direction/#example1](https://handsontable.com/docs/angular-data-grid/layout-direction/#example1) | ☐ | ⚡ button on the example | ☐ |
| Set the layout direction automatically (`example2`) | [layout-direction/#example2](https://handsontable.com/docs/angular-data-grid/layout-direction/#example2) | ☐ | ⚡ button on the example | ☐ |
| Set the layout direction to RTL (`example3`) | [layout-direction/#example3](https://handsontable.com/docs/angular-data-grid/layout-direction/#example3) | ☐ | ⚡ button on the example | ☐ |
| Set the layout direction to LTR (`example4`) | [layout-direction/#example4](https://handsontable.com/docs/angular-data-grid/layout-direction/#example4) | ☐ | ⚡ button on the example | ☐ |
| Set the horizontal text alignment (`example5`) | [layout-direction/#example5](https://handsontable.com/docs/angular-data-grid/layout-direction/#example5) | ☐ | ⚡ button on the example | ☐ |

## Accessibility and navigation


### Focus scopes

| Demo | Docs link | Docs OK | Sandbox (StackBlitz) | Sandbox OK |
|---|---|:---:|---|:---:|
| Inline scopes (`example1`) | [focus-scopes/#example1](https://handsontable.com/docs/angular-data-grid/focus-scopes/#example1) | ☐ | ⚡ button on the example | ☐ |
| Modal scopes (`example2`) | [focus-scopes/#example2](https://handsontable.com/docs/angular-data-grid/focus-scopes/#example2) | ☐ | ⚡ button on the example | ☐ |

### Searching values

| Demo | Docs link | Docs OK | Sandbox (StackBlitz) | Sandbox OK |
|---|---|:---:|---|:---:|
| Simplest use case (`example1`) | [searching-values/#example1](https://handsontable.com/docs/angular-data-grid/searching-values/#example1) | ☐ | ⚡ button on the example | ☐ |
| Custom search result class (`example2`) | [searching-values/#example2](https://handsontable.com/docs/angular-data-grid/searching-values/#example2) | ☐ | ⚡ button on the example | ☐ |
| Custom query method (`example3`) | [searching-values/#example3](https://handsontable.com/docs/angular-data-grid/searching-values/#example3) | ☐ | ⚡ button on the example | ☐ |
| Custom callback (`example4`) | [searching-values/#example4](https://handsontable.com/docs/angular-data-grid/searching-values/#example4) | ☐ | ⚡ button on the example | ☐ |

### Accessibility

| Demo | Docs link | Docs OK | Sandbox (StackBlitz) | Sandbox OK |
|---|---|:---:|---|:---:|
| Accessible data grid demo (`example1`) | [accessibility/#example1](https://handsontable.com/docs/angular-data-grid/accessibility/#example1) | ☐ | ⚡ button on the example | ☐ |

## Optimization


### Batch operations

| Demo | Docs link | Docs OK | Sandbox (StackBlitz) | Sandbox OK |
|---|---|:---:|---|:---:|
| Live demo of the suspend feature (`example1`) | [batch-operations/#example1](https://handsontable.com/docs/angular-data-grid/batch-operations/#example1) | ☐ | ⚡ button on the example | ☐ |
