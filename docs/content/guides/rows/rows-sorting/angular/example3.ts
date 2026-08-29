/* file: app.component.ts */
import { Component } from '@angular/core';
import { GridSettings, HotTableModule} from '@handsontable/angular-wrapper';

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
  selector: 'app-example3',
  template: `
    <hot-table
      [settings]="hotSettings!" [data]="hotData">
    </hot-table>
  `,
  standalone: true,
  imports: [HotTableModule],
})
export class AppComponent {

  readonly hotData = [
    {
      model: 'Racing Socks',
      size: 'S',
      price: 30,
      sellDate: '2023-10-11',
      sellTime: '01:23',
      inStock: false,
      color: 'Black',
      email: '8576@all.xyz',
    },
    {
      model: 'HL Mountain Shirt',
      size: 'XS',
      price: 1890.9,
      sellDate: '2023-05-03',
      sellTime: '11:27',
      inStock: false,
      color: 'White',
      email: 'tayn@all.xyz',
    },
    {
      model: 'Cycling Cap',
      size: 'L',
      price: 130.1,
      sellDate: '2023-03-27',
      sellTime: '03:17',
      inStock: true,
      color: 'Green',
      email: '6lights@far.com',
    },
    {
      model: 'Ski Jacket',
      size: 'M',
      price: 59,
      sellDate: '2023-08-28',
      sellTime: '08:01',
      inStock: true,
      color: 'Blue',
      email: 'raj@fq1my2c.com',
    },
    {
      model: 'HL Goggles',
      size: 'XL',
      price: 279.99,
      sellDate: '2023-10-02',
      sellTime: '13:23',
      inStock: true,
      color: 'Black',
      email: 'da@pdc.ga',
    },
  ];

  readonly hotSettings: GridSettings = {
    columns: [
      {
        title: 'Model<br>(text)',
        // set the type of the 'Model' column
        type: 'text',
        data: 'model',
      },
      {
        title: 'Price<br>(numeric)',
        // set the type of the 'Price' column
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
        title: 'Sold on<br>(date)',
        // set the type of the 'Date' column
        type: 'intl-date',
        data: 'sellDate',
        locale: 'en-US',
        dateFormat: { month: 'short', day: 'numeric', year: 'numeric' },
        className: 'htRight',
      },
      {
        title: 'Time<br>(time)',
        // set the type of the 'Time' column
        type: 'intl-time',
        data: 'sellTime',
        locale: 'en-US',
        timeFormat: { hour: '2-digit', minute: '2-digit', hour12: true },
        className: 'htRight',
      },
      {
        title: 'In stock<br>(checkbox)',
        // set the type of the 'In stock' column
        type: 'checkbox',
        data: 'inStock',
        className: 'htCenter',
      },
      {
        title: 'Size<br>(dropdown)',
        // set the type of the 'Size' column
        type: 'dropdown',
        data: 'size',
        source: ['XS', 'S', 'M', 'L', 'XL'],
        className: 'htCenter',
      },
      {
        title: 'Color<br>(autocomplete)',
        // set the type of the 'Size' column
        type: 'autocomplete',
        data: 'color',
        source: ['White', 'Black', 'Yellow', 'Blue', 'Green'],
        className: 'htCenter',
      },
      {
        title: 'Email<br>(password)',
        // set the type of the 'Email' column
        type: 'password',
        data: 'email',
      },
    ],
    columnSorting: true,
    height: 'auto',
    stretchH: 'all',
    autoWrapRow: true,
    autoWrapCol: true,
    sanitizer: sanitizeHeader,
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
