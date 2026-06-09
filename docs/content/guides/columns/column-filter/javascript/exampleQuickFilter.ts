import Handsontable from 'handsontable/base';
import { registerAllModules } from 'handsontable/registry';
import { Filters } from 'handsontable/plugins';

// Register all Handsontable's modules.
registerAllModules();

const container = document.querySelector('#exampleQuickFilter')!;
const filterField = document.querySelector('#filterField')!;

// Custom dropdown logic
const trigger = document.getElementById('filterTrigger')!;
const menu = document.getElementById('filterMenu')!;
const label = document.getElementById('filterTriggerLabel')!;
let selectedColumn: string = '0';

trigger.addEventListener('click', () => {
  const open = trigger.getAttribute('aria-expanded') === 'true';

  trigger.setAttribute('aria-expanded', String(!open));
  (menu as HTMLElement).hidden = open;
});

menu.addEventListener('click', (e: Event) => {
  const li = (e.target as HTMLElement).closest('li[data-value]') as HTMLElement | null;

  if (!li) return;

  menu.querySelectorAll('li').forEach((el) => el.removeAttribute('aria-selected'));
  li.setAttribute('aria-selected', 'true');
  selectedColumn = li.dataset.value!;
  label.textContent = li.textContent!.trim();
  trigger.setAttribute('aria-expanded', 'false');
  (menu as HTMLElement).hidden = true;
});

document.addEventListener('click', (e: Event) => {
  if (!(e.target as HTMLElement).closest('#filterDropdown')) {
    trigger.setAttribute('aria-expanded', 'false');
    (menu as HTMLElement).hidden = true;
  }
});

const hot = new Handsontable(container, {
  data: [
    {
      brand: 'Jetpulse',
      model: 'Racing Socks',
      price: 30,
      sellDate: '2023-10-11',
      sellTime: '01:23',
      inStock: false,
    },
    {
      brand: 'Gigabox',
      model: 'HL Mountain Frame',
      price: 1890.9,
      sellDate: '2023-05-03',
      sellTime: '11:27',
      inStock: false,
    },
    {
      brand: 'Camido',
      model: 'Cycling Cap',
      price: 130.1,
      sellDate: '2023-03-27',
      sellTime: '03:17',
      inStock: true,
    },
    {
      brand: 'Chatterpoint',
      model: 'Road Tire Tube',
      price: 59,
      sellDate: '2023-08-28',
      sellTime: '08:01',
      inStock: true,
    },
    {
      brand: 'Eidel',
      model: 'HL Road Tire',
      price: 279.99,
      sellDate: '2023-10-02',
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
      locale: 'en-US',
      numericFormat: {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
      },
    },
    {
      title: 'Date',
      type: 'intl-date',
      data: 'sellDate',
      className: 'htRight',
    },
    {
      title: 'Time',
      type: 'intl-time',
      data: 'sellTime',
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
  const filters: Filters = hot.getPlugin('filters');

  filters.removeConditions(selectedColumn as unknown as number);
  filters.addCondition(selectedColumn as unknown as number, 'contains', [(event.target as HTMLInputElement).value]);
  filters.filter();
  hot.render();
});
