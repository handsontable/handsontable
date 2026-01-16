const cellsItems = [
  { path: 'cells/guide-feedback-react/guide-feedback', title: 'Simple Feedback', onlyFor: ['react'] },
  { path: 'cells/guide-feedback-angular/guide-feedback', title: 'Simple Feedback', onlyFor: ['angular'] },
  { path: 'cells/guide-feedback/guide-feedback', title: 'Simple Feedback', onlyFor: ['javascript'] },
  { path: 'cells/guide-rating/guide-rating', title: 'Stars Rating', onlyFor: ['javascript'] },
  { path: 'cells/guide-rating-angular/guide-rating', title: 'Stars Rating', onlyFor: ['angular'] },
  { path: 'cells/guide-color-picker/guide-color-picker', title: 'Color picker', onlyFor: ['javascript'] },
  { path: 'cells/guide-color-picker-angular/guide-color-picker', title: 'Color picker', onlyFor: ['angular'] },
  { path: 'cells/guide-flatpickr/guide-flatpickr', title: 'Datetime `flatpickr` picker', onlyFor: ['javascript'] },
  { path: 'cells/guide-datepicker-angular/guide-datepicker', title: 'Datetime picker', onlyFor: ['angular'] },
  { path: 'cells/guide-select-multiple/guide-select-multiple', title: 'Multiple Select Dropdown', onlyFor: ['javascript'] },
  { path: 'cells/guide-select-multiple-angular/guide-select-multiple', title: 'Multiple Select Dropdown', onlyFor: ['angular'] },
  { path: 'cells/guide-pikaday/guide-pikaday', title: 'Date picker pikaday', onlyFor: ['javascript'] },
  { path: 'cells/guide-boolean-angular/guide-boolean', title: 'Boolean Editor', onlyFor: ['angular'] },
];

module.exports = {
  sidebar: [
    //{ title: 'introduction', path: 'introduction', children: [] },
    'introduction',
    { title: 'Cell Definitions', path: 'cells', children: cellsItems, collapsable: false, onlyFor: ['react', 'javascript', 'angular'] },
  ],
};
