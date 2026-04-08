import Handsontable from 'handsontable/base';
import { registerAllModules } from 'handsontable/registry';

// Register all Handsontable's modules.
registerAllModules();

const container = document.querySelector('#example1')!;
const dropdown = document.querySelector('#localeDropdown')!;
const trigger = document.querySelector('#localeTrigger')!;
const menu = document.querySelector('#localeMenu')!;
const label = document.querySelector('#localeLabel')!;
const data = [
  {
    car: 'Mercedes A 160',
    product_date: '2002-06-15',
    payment_date: '2002-05-20',
    registration_date: '2002-07-01',
  },
  {
    car: 'Citroën C4 Coupe',
    product_date: '2007-03-22',
    payment_date: '2007-02-28',
    registration_date: '2007-04-10',
  },
  {
    car: 'Audi A4 Avant',
    product_date: '2011-09-08',
    payment_date: '2011-08-15',
    registration_date: '2011-09-20',
  },
  {
    car: 'Opel Astra',
    product_date: '2012-01-30',
    payment_date: '2012-01-10',
    registration_date: '2012-02-14',
  },
  {
    car: 'BMW 320i Coupe',
    product_date: '2004-11-12',
    payment_date: '2004-10-20',
    registration_date: '2004-12-01',
  },
];

const hot = new Handsontable(container, {
  data,
  colHeaders: ['Car', 'Product date', 'Payment date', 'Registration date'],
  columns: [
    {
      type: 'text',
      data: 'car',
    },
    {
      type: 'intl-date',
      data: 'product_date',
      dateFormat: {
        dateStyle: 'short',
      },
    },
    {
      type: 'intl-date',
      data: 'payment_date',
      dateFormat: {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      },
    },
    {
      type: 'intl-date',
      data: 'registration_date',
      dateFormat: {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      },
    },
  ],
  columnSorting: true,
  filters: true,
  dropdownMenu: true,
  height: 'auto',
  licenseKey: 'non-commercial-and-evaluation',
  autoWrapRow: true,
  autoWrapCol: true,
});

// Handle dropdown toggle
trigger.addEventListener('click', () => {
  const isOpen = !menu.hidden;

  menu.hidden = isOpen;
  trigger.setAttribute('aria-expanded', String(!isOpen));
});

// Handle locale selection
menu.addEventListener('click', (e) => {
  const item = (e.target as HTMLElement).closest('li[data-value]') as HTMLLIElement | null;

  if (item) {
    label.textContent = item.textContent!.trim();
    menu.querySelectorAll('li').forEach((li) => li.setAttribute('aria-selected', 'false'));
    item.setAttribute('aria-selected', 'true');
    menu.hidden = true;
    trigger.setAttribute('aria-expanded', 'false');
    hot.updateSettings({ locale: item.dataset.value });
  }
});

// Close dropdown when clicking outside
document.addEventListener('click', (e) => {
  if (!dropdown.contains(e.target as Node)) {
    menu.hidden = true;
    trigger.setAttribute('aria-expanded', 'false');
  }
});

// Close dropdown on Escape key
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !menu.hidden) {
    menu.hidden = true;
    trigger.setAttribute('aria-expanded', 'false');
    trigger.focus();
  }
});
