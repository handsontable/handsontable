const columnManagementItems = [
  { path: 'column-management/column-visibility/column-visibility', title: 'Dynamic column visibility', onlyFor: ['javascript'] },
];

const dataManagementItems = [
  { path: 'data-management/load-data-rest-api/load-data-rest-api', title: 'Load data from a REST API', onlyFor: ['javascript', 'react', 'angular'] },
  { path: 'data-management/sync-two-grids/sync-two-grids', title: 'Sync two grids', onlyFor: ['javascript'] },
  { path: 'data-management/undo-redo-custom-ui/undo-redo-custom-ui', title: 'Undo / redo with a custom UI', onlyFor: ['javascript'] },
  { path: 'data-management/auto-save-backend/auto-save-backend', title: 'Auto-save changes to a backend', onlyFor: ['javascript'] },
  { path: 'data-management/server-side-django/server-side-django', title: 'Server-side data with Django', onlyFor: ['javascript'] },
  { path: 'data-management/server-side-laravel/server-side-laravel', title: 'Server-side data with Laravel', onlyFor: ['javascript'] },
  { path: 'data-management/server-side-nestjs/server-side-nestjs', title: 'Server-side data with NestJS', onlyFor: ['javascript'] },
  { path: 'data-management/server-side-rails/server-side-rails', title: 'Server-side data with Ruby on Rails', onlyFor: ['javascript'] },
  { path: 'data-management/server-side-spring/server-side-spring', title: 'Server-side data with Spring Boot', onlyFor: ['javascript'] },
];

const cellTypesItems = [
  { path: 'cell-types/color-picker/color-picker', title: 'Color picker', onlyFor: ['javascript'] },
  { path: 'cell-types/feedback-react/feedback-react', title: 'Simple Feedback', onlyFor: ['react'] },
  { path: 'cell-types/colorful-picker/colorful-picker', title: 'Colorful Picker', onlyFor: ['react'] },
  { path: 'cell-types/react-rating/react-rating', title: 'Star Rating', onlyFor: ['react'] },
  { path: 'cell-types/feedback/feedback', title: 'Simple Feedback', onlyFor: ['javascript'] },
  { path: 'cell-types/flatpickr/flatpickr', title: 'Datetime `flatpickr` picker', onlyFor: ['javascript'] },
  { path: 'cell-types/moment-date/moment-date', title: 'Moment.js-based date', onlyFor: ['javascript'] },
  { path: 'cell-types/moment-time/moment-time', title: 'Moment.js-based time', onlyFor: ['javascript'] },
  { path: 'cell-types/numbro/numbro', title: 'Numbro', onlyFor: ['javascript'] },
  { path: 'cell-types/pikaday/pikaday', title: 'Date picker pikaday', onlyFor: ['javascript'] },
  { path: 'cell-types/rating/rating', title: 'Stars Rating', onlyFor: ['javascript'] },
  { path: 'cell-types/guide-feedback-angular/guide-feedback', title: 'Simple Feedback', onlyFor: ['angular'] },
  { path: 'cell-types/guide-rating-angular/guide-rating', title: 'Stars Rating', onlyFor: ['angular'] },
  { path: 'cell-types/guide-color-picker-angular/guide-color-picker', title: 'Color picker', onlyFor: ['angular'] },
  { path: 'cell-types/guide-datepicker-angular/guide-datepicker', title: 'Datetime picker', onlyFor: ['angular'] },
];

const renderingStylingItems = [
  {
    path: 'rendering-styling/frozen-summary-row/frozen-summary-row',
    title: 'Frozen summary row',
    onlyFor: ['javascript'],
  },
  {
    path: 'rendering-styling/sparkline-cell-renderer/sparkline-cell-renderer',
    title: 'Sparkline cell renderer',
    onlyFor: ['javascript'],
  },
  {
    path: 'rendering-styling/conditional-row-coloring/conditional-row-coloring',
    title: 'Conditional row coloring',
    onlyFor: ['javascript'],
  },
];

const importExportItems = [
  {
    path: 'import-export/export-to-pdf/export-to-pdf',
    title: 'Export to PDF',
    onlyFor: ['javascript'],
  },
  { path: 'import-export/import-csv-excel/import-csv-excel', title: 'Import from CSV or Excel', onlyFor: ['javascript'] },
];

const filteringAndSearchItems = [
  { path: 'filtering-and-search/external-search-box/external-search-box', title: 'Global Search', onlyFor: ['javascript'] },
  {
    path: 'filtering-and-search/highlight-search-matches/highlight-search-matches',
    title: 'Highlight search matches',
    onlyFor: ['javascript'],
  },
];

const themesItems = [
  { path: 'themes/base-theme/base-theme', title: 'Handsontable with Base Web', onlyFor: ['react', 'javascript', 'angular'] },
  { path: 'themes/custom-theme/custom-theme', title: 'Handsontable with shadcn/ui', onlyFor: ['react', 'javascript', 'angular'] },
  { path: 'themes/ant-design/ant-design', title: 'Handsontable with Ant Design', onlyFor: ['react', 'javascript', 'angular'] },
  { path: 'themes/fluent-ui/fluent-ui', title: 'Handsontable with Fluent UI', onlyFor: ['react'] },
  { path: 'themes/mui-theme/mui-theme', title: 'Handsontable with MUI', onlyFor: ['react', 'javascript', 'angular'] },
];

const editingValidationItems = [
  {
    path: 'editing-validation/dependent-dropdowns/dependent-dropdowns',
    title: 'Dependent dropdowns',
    onlyFor: ['javascript'],
  },
  {
    path: 'editing-validation/row-validation-error-summary/row-validation-error-summary',
    title: 'Row validation with error summary',
    onlyFor: ['javascript'],
  },
];

module.exports = {
  sidebar: [
    'introduction',
    { title: 'Column Management', path: 'column-management', children: columnManagementItems, collapsable: false, onlyFor: ['javascript'] },
    { title: 'Data Management', path: 'data-management', children: dataManagementItems, collapsable: false, onlyFor: ['react', 'javascript', 'angular'] },
    { title: 'Cell Types', path: 'cell-types', children: cellTypesItems, collapsable: false, onlyFor: ['react', 'javascript', 'angular'] },
    {
      title: 'Editing and Validation',
      path: 'editing-validation',
      children: editingValidationItems,
      collapsable: false,
      onlyFor: ['javascript'],
    },
    {
      title: 'Import and Export',
      path: 'import-export',
      children: importExportItems,
      collapsable: false,
      onlyFor: ['javascript'],
    },
    {
      title: 'Filtering and Search',
      path: 'filtering-and-search',
      children: [
        ...filteringAndSearchItems,
        { path: 'filtering-search/multi-column-filter-panel/multi-column-filter-panel', title: 'Multi-column filter panel', onlyFor: ['javascript'] },
      ],
      collapsable: false,
      onlyFor: ['javascript'],
    },
    {
      title: 'Rendering and styling',
      path: 'rendering-styling',
      children: renderingStylingItems,
      collapsable: false,
      onlyFor: ['javascript'],
    },
    { title: 'Themes', path: 'themes', children: themesItems, collapsable: false, onlyFor: ['react', 'javascript', 'angular'] },
  ],
};
