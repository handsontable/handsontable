const realTimeItems = [
  { path: 'real-time/websocket-updates/websocket-updates', title: 'Real-time updates via WebSocket', onlyFor: ['javascript', 'react', 'angular'] },
  { path: 'real-time/chartjs-sync/chartjs-sync', title: 'Sync rows to Chart.js', onlyFor: ['javascript', 'react', 'angular', 'vue'] },
];

const columnManagementItems = [
  { path: 'column-management/column-visibility/column-visibility', title: 'Dynamic column visibility', onlyFor: ['javascript', 'angular', 'react'] },
  { path: 'column-management/freeze-columns/freeze-columns', title: 'Freeze columns at runtime', onlyFor: ['javascript', 'angular', 'react'] },
];

const contextMenuItems = [
  { path: 'context-menu/custom-context-menu/custom-context-menu', title: 'Custom context menu actions', onlyFor: ['javascript', 'react', 'angular', 'vue'] },
  { path: 'context-menu/row-operations/row-operations', title: 'Programmatic row operations', onlyFor: ['javascript', 'react', 'angular', 'vue'] },
];

const dataManagementItems = [
  { path: 'data-management/load-data-rest-api/load-data-rest-api', title: 'Load data from a REST API', onlyFor: ['javascript', 'react', 'angular'] },
  { path: 'data-management/load-data-graphql/load-data-graphql', title: 'Load data from a GraphQL API', onlyFor: ['javascript', 'react', 'angular', 'vue'] },
  { path: 'data-management/sync-two-grids/sync-two-grids', title: 'Sync two grids', onlyFor: ['javascript', 'angular', 'react'] },
  { path: 'data-management/undo-redo-custom-ui/undo-redo-custom-ui', title: 'Undo / redo with a custom UI', onlyFor: ['javascript', 'angular', 'react', 'vue'] },
  { path: 'data-management/auto-save-backend/auto-save-backend', title: 'Auto-save changes to a backend', onlyFor: ['javascript', 'angular', 'react', 'vue'] },
  { path: 'data-management/server-side-django/server-side-django', title: 'Server-side data with Django', onlyFor: ['javascript', 'angular', 'react', 'vue'] },
  { path: 'data-management/server-side-expressjs/server-side-expressjs', title: 'Server-side data with Express.js', onlyFor: ['javascript', 'angular', 'react', 'vue'] },
  { path: 'data-management/server-side-laravel/server-side-laravel', title: 'Server-side data with Laravel', onlyFor: ['javascript', 'angular', 'react', 'vue'] },
  { path: 'data-management/server-side-nestjs/server-side-nestjs', title: 'Server-side data with NestJS', onlyFor: ['javascript', 'angular', 'react'] },
  { path: 'data-management/server-side-rails/server-side-rails', title: 'Server-side data with Ruby on Rails', onlyFor: ['javascript', 'angular', 'react'] },
  { path: 'data-management/server-side-spring/server-side-spring', title: 'Server-side data with Spring Boot', onlyFor: ['javascript', 'angular', 'react'] },
  { path: 'data-management/server-side-supabase/server-side-supabase', title: 'Server-side data with Supabase', onlyFor: ['react'] },
  { path: 'data-management/server-side-symfony/server-side-symfony', title: 'Server-side data with Symfony', onlyFor: ['javascript', 'angular', 'react'] },
];

const cellTypesItems = [
  // JavaScript + Angular + Vue (shared multi-framework pages)
  { path: 'cell-types/color-picker/color-picker', title: 'Color picker', onlyFor: ['javascript', 'angular', 'vue'] },
  { path: 'cell-types/feedback/feedback', title: 'Feedback', onlyFor: ['javascript', 'angular', 'vue'] },
  { path: 'cell-types/rating/rating', title: 'Star Rating', onlyFor: ['javascript', 'angular', 'vue'] },
  { path: 'cell-types/radio/radio', title: 'Radio buttons', onlyFor: ['javascript', 'react', 'angular', 'vue'] },
  // JavaScript + Vue only
  { path: 'cell-types/flatpickr/flatpickr', title: 'Flatpickr', onlyFor: ['javascript', 'vue'] },
  { path: 'cell-types/moment-date/moment-date', title: 'Moment.js-based date', onlyFor: ['javascript', 'vue'] },
  { path: 'cell-types/moment-time/moment-time', title: 'Moment.js-based time', onlyFor: ['javascript', 'vue'] },
  { path: 'cell-types/numbro/numbro', title: 'Numbro', onlyFor: ['javascript', 'vue'] },
  { path: 'cell-types/pikaday/pikaday', title: 'Pikaday', onlyFor: ['javascript', 'vue'] },
  // React only
  { path: 'cell-types/feedback-react/feedback-react', title: 'Feedback', onlyFor: ['react'] },
  { path: 'cell-types/colorful-picker/colorful-picker', title: 'Colorful Picker', onlyFor: ['react'] },
  { path: 'cell-types/react-rating/react-rating', title: 'Star Rating', onlyFor: ['react'] },
  // Angular only
  { path: 'cell-types/guide-datepicker-angular/guide-datepicker', title: 'Date picker', onlyFor: ['angular'] },
];

const performanceItems = [
  { path: 'performance/lazy-loading/lazy-loading', title: 'Lazy loading with pagination', onlyFor: ['javascript', 'react', 'angular', 'vue'] },
  { path: 'performance/persist-column-layout/persist-column-layout', title: 'Persist column layout', onlyFor: ['javascript', 'angular', 'react'] },
];

const renderingStylingItems = [
  {
    path: 'rendering-styling/frozen-summary-row/frozen-summary-row',
    title: 'Frozen summary row',
    onlyFor: ['javascript', 'angular', 'react', 'vue'],
  },
  {
    path: 'rendering-styling/sparkline-cell-renderer/sparkline-cell-renderer',
    title: 'Sparkline cell renderer',
    onlyFor: ['javascript', 'angular', 'react', 'vue'],
  },
  {
    path: 'rendering-styling/conditional-row-coloring/conditional-row-coloring',
    title: 'Conditional row coloring',
    onlyFor: ['javascript', 'angular', 'react', 'vue'],
  },
];

const importExportItems = [
  {
    path: 'import-export/export-to-pdf/export-to-pdf',
    title: 'Export to PDF',
    onlyFor: ['javascript', 'angular', 'react', 'vue'],
  },
  { path: 'import-export/import-csv-excel/import-csv-excel', title: 'Import from CSV or Excel', onlyFor: ['javascript', 'angular', 'react'] },
];

const filteringAndSearchItems = [
  { path: 'filtering-and-search/external-search-box/external-search-box', title: 'Global Search', onlyFor: ['javascript', 'angular', 'react'] },
  {
    path: 'filtering-and-search/highlight-search-matches/highlight-search-matches',
    title: 'Highlight search matches',
    onlyFor: ['javascript', 'angular', 'react'],
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
    onlyFor: ['javascript', 'angular', 'react', 'vue'],
  },
  {
    path: 'editing-validation/row-validation-error-summary/row-validation-error-summary',
    title: 'Row validation with error summary',
    onlyFor: ['javascript', 'angular', 'react', 'vue'],
  },
];

const accessibilityItems = [
  { path: 'accessibility/keyboard-shortcuts/keyboard-shortcuts', title: 'Custom keyboard shortcuts', onlyFor: ['javascript', 'react', 'angular'] },
  { path: 'accessibility/aria-grid/aria-grid', title: 'ARIA grid', onlyFor: ['javascript', 'angular', 'react'] },
];

module.exports = {
  sidebar: [
    'introduction',
    { title: 'Accessibility & UX', path: 'accessibility', children: accessibilityItems, collapsable: false, onlyFor: ['javascript', 'react', 'angular'] },
    { title: 'Real-time & Integrations', path: 'real-time', children: realTimeItems, collapsable: false, onlyFor: ['javascript', 'react', 'angular', 'vue'] },
    { title: 'Column Management', path: 'column-management', children: columnManagementItems, collapsable: false, onlyFor: ['javascript', 'angular', 'react'] },
    { title: 'Data Management', path: 'data-management', children: dataManagementItems, collapsable: false, onlyFor: ['javascript', 'angular', 'react', 'vue'] },
    { title: 'Cell Types', path: 'cell-types', children: cellTypesItems, collapsable: false, onlyFor: ['react', 'javascript', 'angular', 'vue'] },
    { title: 'Context Menu', path: 'context-menu', children: contextMenuItems, collapsable: false, onlyFor: ['javascript', 'react', 'angular', 'vue'] },
    {
      title: 'Editing and Validation',
      path: 'editing-validation',
      children: editingValidationItems,
      collapsable: false,
      onlyFor: ['javascript', 'angular', 'react', 'vue'],
    },
    {
      title: 'Import and Export',
      path: 'import-export',
      children: importExportItems,
      collapsable: false,
      onlyFor: ['javascript', 'angular', 'react', 'vue'],
    },
    {
      title: 'Filtering and Search',
      path: 'filtering-and-search',
      children: [
        ...filteringAndSearchItems,
        { path: 'filtering-search/multi-column-filter-panel/multi-column-filter-panel', title: 'Multi-column filter panel', onlyFor: ['javascript', 'angular', 'react', 'vue'] },
      ],
      collapsable: false,
      onlyFor: ['javascript', 'angular', 'react', 'vue'],
    },
    {
      title: 'Rendering and styling',
      path: 'rendering-styling',
      children: renderingStylingItems,
      collapsable: false,
      onlyFor: ['javascript', 'angular', 'react', 'vue'],
    },
    { title: 'Performance', path: 'performance', children: performanceItems, collapsable: false, onlyFor: ['javascript', 'react', 'angular', 'vue'] },
    { title: 'Themes', path: 'themes', children: themesItems, collapsable: false, onlyFor: ['react', 'javascript', 'angular'] },
  ],
};
