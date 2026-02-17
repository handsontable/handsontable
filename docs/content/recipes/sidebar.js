const cellTypesItems = [
  { path: 'cell-types/color-picker/color-picker', title: 'Color picker', onlyFor: ['javascript'] },
  { path: 'cell-types/feedback-react/feedback-react', title: 'Simple Feedback', onlyFor: ['react'] },
  { path: 'cell-types/feedback/feedback', title: 'Simple Feedback', onlyFor: ['javascript'] },
  { path: 'cell-types/flatpickr/flatpickr', title: 'Datetime `flatpickr` picker', onlyFor: ['javascript'] },
  { path: 'cell-types/moment-date/moment-date', title: 'Moment.js-based date', onlyFor: ['javascript'] },
  { path: 'cell-types/moment-time/moment-time', title: 'Moment.js-based time', onlyFor: ['javascript'] },
  { path: 'cell-types/numbro/numbro', title: 'Numbro', onlyFor: ['javascript'] },
  { path: 'cell-types/pikaday/pikaday', title: 'Date picker pikaday', onlyFor: ['javascript'] },
  { path: 'cell-types/rating/rating', title: 'Stars Rating', onlyFor: ['javascript'] },
  { path: 'cell-types/select-multiple/select-multiple', title: 'Multiple Select Dropdown', onlyFor: ['javascript'] },
  { path: 'cell-types/guide-feedback-angular/guide-feedback', title: 'Simple Feedback', onlyFor: ['angular'] },
  { path: 'cell-types/guide-rating-angular/guide-rating', title: 'Stars Rating', onlyFor: ['angular'] },
  { path: 'cell-types/guide-color-picker-angular/guide-color-picker', title: 'Color picker', onlyFor: ['angular'] },
  { path: 'cell-types/guide-datepicker-angular/guide-datepicker', title: 'Datetime picker', onlyFor: ['angular'] },
  { path: 'cell-types/guide-select-multiple-angular/guide-select-multiple', title: 'Multiple Select Dropdown', onlyFor: ['angular'] },
  { path: 'cell-types/guide-checkbox-angular/guide-checkbox', title: 'Checkbox Editor', onlyFor: ['angular'] }

];

const themesItems = [
  { path: 'themes/custom-theme/custom-theme', title: 'Handsontable with shadcn/ui', onlyFor: ['react', 'javascript', 'angular'] },
];

module.exports = {
  sidebar: [
    'introduction',
    { title: 'Cell Types', path: 'cell-types', children: cellTypesItems, collapsable: false, onlyFor: ['react', 'javascript', 'angular'] },
    { title: 'Themes', path: 'themes', children: themesItems, collapsable: false, onlyFor: ['react', 'javascript', 'angular'] },
  ],
};
