const cellsItems = [
  { path: 'cells/guide-feedback-react/guide-feedback', title: 'Simple Feedback', onlyFor: ['react'] },
  { path: 'cells/guide-feedback/guide-feedback', title: 'Simple Feedback', onlyFor: ['javascript'] },
  { path: 'cells/guide-rating/guide-rating', title: 'Stars Rating', onlyFor: ['javascript'] },
  { path: 'cells/guide-color-picker/guide-color-picker', title: 'Color picker', onlyFor: ['javascript'] },
  { path: 'cells/guide-flatpickr/guide-flatpickr', title: 'Datetime `flatpickr` picker', onlyFor: ['javascript'] },
  { path: 'cells/guide-select-multiple/guide-select-multiple', title: 'Multiple Select Dropdown', onlyFor: ['javascript'] },
  { path: 'cells/guide-pikaday/guide-pikaday', title: 'Date picker pikaday', onlyFor: ['javascript'] },
];

module.exports = {
  sidebar: [
    //{ title: 'introduction', path: 'introduction', children: [] },
    'introduction',
    { title: 'Cell Definitions', path: 'cells', children: cellsItems, collapsable: false, onlyFor: ['react', 'javascript'] },
  ],
};
