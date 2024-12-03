import Handsontable from 'handsontable';
import 'handsontable/styles/handsontable.css';
import 'handsontable/styles/ht-theme-main.css';

const container = document.querySelector('#example3');

new Handsontable(container, {
  licenseKey: 'non-commercial-and-evaluation',
  data: [
    ['BMW', 2017, 'black', 'black'],
    ['Nissan', 2018, 'blue', 'blue'],
    ['Chrysler', 2019, 'yellow', 'black'],
    ['Volvo', 2020, 'white', 'gray'],
  ],
  colHeaders: ['Car', 'Year', 'Chassis color', 'Bumper color'],
  columns: [
    {
      type: 'autocomplete',
      source(_query, process) {
        fetch('{{$basePath}}/scripts/json/autocomplete.json')
          .then((response) => response.json())
          .then((response) => process(response.data));
      },
      strict: true,
    },
    {},
    {},
    {},
  ],
  autoWrapRow: true,
  autoWrapCol: true,
});
