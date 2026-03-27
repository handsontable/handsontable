import Handsontable from 'handsontable/base';
import { registerAllModules } from 'handsontable/registry';

// Register all Handsontable's modules.
registerAllModules();

const container = document.querySelector('#exampleQuickFilter');
const filterField = document.querySelector('#filterField');

// Custom dropdown logic
const trigger = document.getElementById('filterTrigger');
const menu = document.getElementById('filterMenu');
const label = document.getElementById('filterTriggerLabel');
let selectedColumn = '0';

trigger.addEventListener('click', () => {
  const open = trigger.getAttribute('aria-expanded') === 'true';

  trigger.setAttribute('aria-expanded', String(!open));
  menu.hidden = open;
});

menu.addEventListener('click', (e) => {
  const li = e.target.closest('li[data-value]');

  if (!li) return;

  menu.querySelectorAll('li').forEach((el) => el.removeAttribute('aria-selected'));
  li.setAttribute('aria-selected', 'true');
  selectedColumn = li.dataset.value;
  label.textContent = li.textContent.trim();
  trigger.setAttribute('aria-expanded', 'false');
  menu.hidden = true;
});

document.addEventListener('click', (e) => {
  if (!e.target.closest('#filterDropdown')) {
    trigger.setAttribute('aria-expanded', 'false');
    menu.hidden = true;
  }
});

const hot = new Handsontable(container, {
  data: [
    {
      brand: 'Jetpulse',
      model: 'Racing Socks',
      price: 30,
      sellDate: '11/10/2023',
      sellTime: '01:23',
      inStock: false,
    },
    {
      brand: 'Gigabox',
      model: 'HL Mountain Frame',
      price: 1890.9,
      sellDate: '03/05/2023',
      sellTime: '11:27',
      inStock: false,
    },
    {
      brand: 'Camido',
      model: 'Cycling Cap',
      price: 130.1,
      sellDate: '27/03/2023',
      sellTime: '03:17',
      inStock: true,
    },
    {
      brand: 'Chatterpoint',
      model: 'Road Tire Tube',
      price: 59,
      sellDate: '28/08/2023',
      sellTime: '08:01',
      inStock: true,
    },
    {
      brand: 'Eidel',
      model: 'HL Road Tire',
      price: 279.99,
      sellDate: '02/10/2023',
      sellTime: '13:23',
      inStock: true,
    },
  ],
  columns: [
    {
      title: 'Brand',
      type: 'text',
      data: 'brand',
    },
    {
      title: 'Model',
      type: 'text',
      data: 'model',
    },
    {
      title: 'Price',
      type: 'numeric',
      data: 'price',
      numericFormat: {
        pattern: '$0,0.00',
        culture: 'en-US',
      },
    },
    {
      title: 'Date',
      type: 'date',
      data: 'sellDate',
      className: 'htRight',
    },
    {
      title: 'Time',
      type: 'time',
      data: 'sellTime',
      correctFormat: true,
      className: 'htRight',
    },
    {
      title: 'In stock',
      type: 'checkbox',
      data: 'inStock',
      className: 'htCenter',
    },
  ],
  colHeaders: true,
  height: 'auto',
  filters: true,
  className: 'exampleQuickFilter',
  autoWrapRow: true,
  autoWrapCol: true,
  licenseKey: 'non-commercial-and-evaluation',
});

// add a filter input listener
filterField.addEventListener('keyup', (event) => {
  const filters = hot.getPlugin('filters');

  filters.removeConditions(selectedColumn);
  filters.addCondition(selectedColumn, 'contains', [event.target.value]);
  filters.filter();
  hot.render();
});
