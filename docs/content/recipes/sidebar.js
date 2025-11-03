const cellsItems = [
  { path: 'cells/guide-feedback/guide-feedback', title: 'Simple Feedback' },
  { path: 'cells/guide-rating/guide-rating', title: 'Stars Rating' },
  { path: 'cells/guide-color-picker/guide-color-picker', title: 'Color picker' },
  { path: 'cells/guide-flatpickr/guide-flatpickr', title: 'Datetime `flatpickr` picker' },
  { path: 'cells/guide-select-multiple/guide-select-multiple', title: 'Multiple Select Dropdown' },
  { path: 'cells/guide-input-date/guide-input-date', title: 'Native Date Input' },
];

module.exports = {
  sidebar: [
    'introduction',
    { title: 'Cell Definitions', path: 'cells', children: cellsItems, collapsable: false },
  ],
};
