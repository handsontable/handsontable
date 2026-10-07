/* file: app.component.ts */
import { Component } from '@angular/core';
import { GridSettings, HotTableModule} from '@handsontable/angular-wrapper';

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

const ALLOWED_TAGS = ['BR', 'TABLE', 'THEAD', 'TBODY', 'TR', 'TD', 'TH'];
const ALLOWED_ATTRIBUTES = ['colspan', 'rowspan'];
const DROPPED_TAGS = ['SCRIPT', 'STYLE', 'TEXTAREA', 'TITLE'];

// Handsontable has no built-in sanitizer since v18.0, and `sanitizer` is grid-level:
// it also filters pasted HTML, so the table tags have to survive -- otherwise pasting
// a range degrades to plain text. In production, use a vetted library such as DOMPurify.
// See https://handsontable.com/docs/security/
const sanitizeHeader = (html: string): string => {
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

@Component({
  selector: 'example2-autocomplete-cell-type',
  standalone: true,
  imports: [HotTableModule],
  template: ` <div>
    <hot-table [data]="data" [settings]="gridSettings"></hot-table>
  </div>`,
})
export class AppComponent {

  readonly data = [
    ['Harbor Goods', 'SKU-4821', 'Seattle', 'Stainless Steel Water Bottle'],
    ['Alpine Supply Co.', 'SKU-0093', 'Denver', 'Wireless Mouse'],
    ['Cascade Distributors', 'SKU-1170', 'Portland', 'Ergonomic Office Chair'],
    ['Summit Trading', 'SKU-2208', 'Austin', 'USB-C Charging Cable'],
    ['Northgate Wholesale', 'SKU-3341', 'Minneapolis', 'Aluminum Water Filter'],
  ];

  readonly gridSettings: GridSettings = {
    height: 'auto',
    sanitizer: sanitizeHeader,
    colHeaders: [
      'Supplier<br>(allowInvalid false)',
      'SKU',
      'Warehouse',
      'Product<br>(allowInvalid true)',
    ],
    autoWrapRow: true,
    autoWrapCol: true,
    columns: [
      {
        type: 'autocomplete',
        source: [
          'Harbor Goods',
          'Alpine Supply Co.',
          'Cascade Distributors',
          'Summit Trading',
          'Northgate Wholesale',
          'Nordic Traders',
        ],
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
    ]
  };
}
/* end-file */



/* file: app.config.ts */
import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { registerAllModules } from 'handsontable/registry';
import { HOT_GLOBAL_CONFIG, HotGlobalConfig, NON_COMMERCIAL_LICENSE } from '@handsontable/angular-wrapper';

// register Handsontable's modules
registerAllModules();

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    {
      provide: HOT_GLOBAL_CONFIG,
      useValue: { license: NON_COMMERCIAL_LICENSE } as HotGlobalConfig,
    },
  ],
};
/* end-file */
