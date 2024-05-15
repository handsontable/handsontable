import Handsontable from 'handsontable';
import 'handsontable/dist/handsontable.full.min.css';

const container = document.querySelector('#example3');
const hot: Handsontable.Core = new Handsontable(container, {
  licenseKey: 'non-commercial-and-evaluation',
  data: [
    ['BMW', 2017, 'black', 'black'],
    ['Nissan', 2018, 'blue', 'blue'],
    ['Chrysler', 2019, 'yellow', 'black'],
    ['Volvo', 2020, 'white', 'gray']
  ],
  colHeaders: ['Car', 'Year', 'Chassis color', 'Bumper color'],
  licenseKey: 'non-commercial-and-evaluation',
  columns: [
    {
      type: 'autocomplete',
      source(query, process) {
        fetch('{{$basePath}}/scripts/json/autocomplete.json')
          .then(response => response.json())
          .then(response => process(response.data));
      },
      strict: true
    },
    {}, // Year is a default text column
    {}, // Chassis color is a default text column
    {} // Bumper color is a default text column
  ],
  autoWrapRow: true,
  autoWrapCol: true,
  height: 'auto'
});
