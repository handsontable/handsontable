const cellsItems = [
  { path: 'cells/guide-input-date/guide-input-date', title: 'Native Date Input' },
  { path: 'cells/guide-color-picker/guide-color-picker', title: 'Color picker', collapsable: false },
  { path: 'cells/guide-flatpickr/guide-flatpickr' , title: 'Datetime `flatpickr` picker'},
  { path: 'cells/guide-input-range/guide-input-range', title: 'Range Slider Input' },
  { path: 'cells/guide-select-multiple/guide-select-multiple', title: 'Multiple Select Dropdown' },
];
module.exports = {
    sidebar: [
        'introduction',
      { title: 'Cell Definitions', path: 'cells', children: cellsItems, collapsable: false  },
    ],
  };
  