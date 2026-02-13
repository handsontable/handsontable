const cellTypesItems = [
  { path: 'cell-types/color-picker/color-picker', title: 'Color picker', onlyFor: ['javascript'] },
  { path: 'cell-types/feedback-react/feedback-react', title: 'Simple Feedback', onlyFor: ['react'] },
  { path: 'cell-types/colorful-picker/colorful-picker', title: 'Colorful Picker', onlyFor: ['react'] },
  { path: 'cell-types/react-rating/react-rating', title: 'Star Rating', onlyFor: ['react'] },
  { path: 'cell-types/feedback/feedback', title: 'Simple Feedback', onlyFor: ['javascript'] },
  { path: 'cell-types/flatpickr/flatpickr', title: 'Datetime `flatpickr` picker', onlyFor: ['javascript'] },
  { path: 'cell-types/select-multiple/select-multiple', title: 'Multiple Select Dropdown', onlyFor: ['javascript'] },
  { path: 'cell-types/numbro/numbro', title: 'Numbro', onlyFor: ['javascript'] },
  { path: 'cell-types/pikaday/pikaday', title: 'Date picker pikaday', onlyFor: ['javascript'] },
  { path: 'cell-types/rating/rating', title: 'Stars Rating', onlyFor: ['javascript'] },
];

module.exports = {
  sidebar: [
    'introduction',
    { title: 'Cell Types', path: 'cell-types', children: cellTypesItems, collapsable: false, onlyFor: ['react', 'javascript'] },
  ],
};
