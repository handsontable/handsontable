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
  { path: 'cell-types/guide-datepicker-angular/guide-datepicker', title: 'Datetime picker', onlyFor: ['angular'] }
];


const renderingStylingItems = [
  {
    path: 'rendering-styling/frozen-summary-row/frozen-summary-row',
    title: 'Frozen summary row',
    onlyFor: ['javascript'],
  },
];

const themesItems = [
  { path: 'themes/base-theme/base-theme', title: 'Handsontable with Base Web', onlyFor: ['react', 'javascript', 'angular'] },
  { path: 'themes/custom-theme/custom-theme', title: 'Handsontable with shadcn/ui', onlyFor: ['react', 'javascript', 'angular'] },
  { path: 'themes/mui-theme/mui-theme', title: 'Handsontable with MUI', onlyFor: ['react', 'javascript', 'angular'] },
];

module.exports = {
  sidebar: [
    'introduction',
    { title: 'Cell Types', path: 'cell-types', children: cellTypesItems, collapsable: false, onlyFor: ['react', 'javascript', 'angular'] },
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
