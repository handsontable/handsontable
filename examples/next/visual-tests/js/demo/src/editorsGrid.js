import Handsontable from 'handsontable';
import 'handsontable/dist/handsontable.css';
import '@handsontable/pikaday/css/pikaday.css';

const root = document.getElementById('root');
const example = document.createElement('div');

root.appendChild(example);

export function initializeEditorsGrid() {
  new Handsontable(example, {
    data: [
      { brand: 'Mercedes', model: 'A 160', year: 2017, price_usd: 7000, sell_date: '01/01/2021' },
      { brand: 'Citroen', model: 'C4', year: 2018, price_usd: 8330, sell_date: '04/12/2020' },
      { brand: 'Audi', model: 'A4', year: 2019, price_usd: 33900, sell_date: '11/04/2022' },
      { brand: 'Opel', model: 'Astra', year: 2020, price_usd: 5000, sell_date: '21/08/2024' },
      { brand: 'BMW', model: '320i', year: 2021, price_usd: 30500, sell_date: '03/06/2021' },
    ],
    height: 350,
    colHeaders: true,
    columns: [
      { data: 'brand', type: 'dropdown', source: ['Mercedes', 'Citroen', 'Audi', 'Opel', 'BMW'] },
      { data: 'model', type: 'autocomplete', source: ['A 160', 'C4', 'A4', 'Astra', '320i'] },
      { data: 'year', type: 'select', selectOptions: [2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024] },
      { data: 'price_usd', type: 'numeric' },
      { data: 'sell_date', type: 'date', dateFormat: 'DD/MM/YYYY' },
    ],
    navigableHeaders: true,
    rowHeaders: true,
    autoWrapCol: true,
    autoWrapRow: true,
    licenseKey: 'non-commercial-and-evaluation',
  });

  console.log(
    `Handsontable: v${Handsontable.version} (${Handsontable.buildDate})`
  );
}
