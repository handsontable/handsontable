import Handsontable from 'handsontable/base';
import { registerAllModules } from 'handsontable/registry';

// Register all Handsontable's modules.
registerAllModules();

const warehouses = [
  'Seattle',
  'Denver',
  'Portland',
  'Austin',
  'Minneapolis',
  'Boston',
  'Chicago',
  'Phoenix',
  'Atlanta',
  'Dallas',
  'San Jose',
  'Columbus',
];
const products = [
  'Stainless Steel Water Bottle',
  'Wireless Mouse',
  'Ergonomic Office Chair',
  'USB-C Charging Cable',
  'Aluminum Water Filter',
  'Canvas Tote Bag',
  'USB-C Hub',
  'Ceramic Mug Set',
  'Desk Lamp',
  'Laptop Stand',
  'Bluetooth Speaker',
  'Standing Desk',
];

const suppliers = [
  'Harbor Goods',
  'Alpine Supply Co.',
  'Cascade Distributors',
  'Summit Trading',
  'Northgate Wholesale',
  'Nordic Traders',
];
const ALLOWED_TAGS = ['BR', 'TABLE', 'THEAD', 'TBODY', 'TR', 'TD', 'TH'];
const ALLOWED_ATTRIBUTES = ['colspan', 'rowspan'];
const DROPPED_TAGS = ['SCRIPT', 'STYLE', 'TEXTAREA', 'TITLE'];

// Handsontable has no built-in sanitizer since v18.0, and `sanitizer` is grid-level:
// it also filters pasted HTML, so the table tags have to survive -- otherwise pasting
// a range degrades to plain text. In production, use a vetted library such as DOMPurify.
// See https://handsontable.com/docs/security/
const sanitizeHeader = (html) => {
  const template = document.createElement('template');

  template.innerHTML = html;

  template.content.querySelectorAll('*').forEach((element) => {
    if (DROPPED_TAGS.includes(element.tagName)) {
      // Unwrapping these would promote their source text into the output
      element.remove();
    } else if (ALLOWED_TAGS.includes(element.tagName)) {
      Array.from(element.attributes).forEach((attribute) => {
        if (!ALLOWED_ATTRIBUTES.includes(attribute.name)) {
          element.removeAttribute(attribute.name);
        }
      });
    } else {
      // Unwrap a disallowed element, keeping its text content
      element.replaceWith(...Array.from(element.childNodes));
    }
  });

  return template.innerHTML;
};

const container = document.querySelector('#example2');

new Handsontable(container, {
  height: 'auto',
  licenseKey: 'non-commercial-and-evaluation',
  sanitizer: sanitizeHeader,
  data: [
    ['Harbor Goods', 'SKU-4821', 'Seattle', 'Stainless Steel Water Bottle'],
    ['Alpine Supply Co.', 'SKU-0093', 'Denver', 'Wireless Mouse'],
    ['Cascade Distributors', 'SKU-1170', 'Portland', 'Ergonomic Office Chair'],
    ['Summit Trading', 'SKU-2208', 'Austin', 'USB-C Charging Cable'],
    ['Northgate Wholesale', 'SKU-3341', 'Minneapolis', 'Aluminum Water Filter'],
  ],
  colHeaders: ['Supplier<br>(allowInvalid false)', 'SKU', 'Warehouse', 'Product<br>(allowInvalid true)'],
  columns: [
    {
      type: 'autocomplete',
      source: suppliers,
      strict: true,
      allowInvalid: false,
    },
    {},
    {
      type: 'autocomplete',
      source: warehouses,
      strict: true,
    },
    {
      type: 'autocomplete',
      source: products,
      strict: true,
      allowInvalid: true, // true is default
    },
  ],
  autoWrapRow: true,
  autoWrapCol: true,
});
