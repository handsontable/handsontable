/* file: app.component.ts */
import {Component, OnInit, ViewChild} from '@angular/core';
import {GridSettings, HotTableComponent, HotTableModule} from '@handsontable/angular-wrapper';
import { RowObject } from 'handsontable/common';

@Component({
  selector: 'app-example1',
  standalone: true,
  imports: [HotTableModule],
  template: `
    <hot-table
      [settings]="hotSettings!" [data]="hotData">
    </hot-table>
  `,
})
export class AppComponent implements OnInit {
  @ViewChild(HotTableComponent, {static: false}) hotTable!: HotTableComponent;

  hotData: RowObject[] = [];

  hotSettings!: GridSettings;

  ngOnInit() {
    const products = [
      {
        companyName: 'Hodkiewicz - Hintz',
        productName: 'Rustic Soft Ball',
        sellDate: '2023-07-05',
        inStock: false,
        qty: 82,
        orderId: '16-3974628',
        country: 'United Kingdom',
      },
      {
        companyName: 'Rath LLC',
        productName: 'Small Frozen Tuna',
        sellDate: '2023-05-31',
        inStock: false,
        qty: 459,
        orderId: '77-7839351',
        country: 'Costa Rica',
      },
      {
        companyName: 'Reichert LLC',
        productName: 'Rustic Soft Ball',
        sellDate: '2023-03-16',
        inStock: false,
        qty: 318,
        orderId: '75-6343150',
        country: 'United States of America',
      },
      {
        companyName: 'Kozey Inc',
        productName: 'Sleek Wooden Bacon',
        sellDate: '2023-04-24',
        inStock: true,
        qty: 177,
        orderId: '56-3608689',
        country: 'Pitcairn Islands',
      },
      {
        companyName: 'Nader - Fritsch',
        productName: 'Awesome Wooden Hat',
        sellDate: '2023-04-29',
        inStock: true,
        qty: 51,
        orderId: '58-1204318',
        country: 'Argentina',
      },
      {
        companyName: 'Gerhold - Rowe',
        productName: 'Tasty Frozen Table',
        sellDate: '2023-03-27',
        inStock: false,
        qty: 439,
        orderId: '62-6066132',
        country: 'Senegal',
      },
      {
        companyName: 'Rath LLC',
        productName: 'Awesome Wooden Hat',
        sellDate: '2022-11-24',
        inStock: false,
        qty: 493,
        orderId: '76-7785471',
        country: 'Cyprus',
      },
      {
        companyName: 'Kozey Inc',
        productName: 'Rustic Soft Ball',
        sellDate: '2023-08-11',
        inStock: false,
        qty: 225,
        orderId: '34-3551159',
        country: 'Saint Martin',
      },
      {
        companyName: 'Hodkiewicz - Hintz',
        productName: 'Awesome Wooden Hat',
        sellDate: '2023-02-07',
        inStock: false,
        qty: 261,
        orderId: '77-1112514',
        country: 'Chile',
      },
      {
        companyName: 'Hegmann Inc',
        productName: 'Tasty Frozen Table',
        sellDate: '2023-05-06',
        inStock: false,
        qty: 439,
        orderId: '12-3252385',
        country: 'Switzerland',
      },
      {
        companyName: 'Weber Inc',
        productName: 'Awesome Wooden Hat',
        sellDate: '2023-04-22',
        inStock: true,
        qty: 235,
        orderId: '71-7639998',
        country: 'Brazil',
      },
      {
        companyName: 'Jacobi - Kutch',
        productName: 'Sleek Wooden Bacon',
        sellDate: '2022-12-13',
        inStock: true,
        qty: 163,
        orderId: '68-1588829',
        country: 'Burkina Faso',
      },
      {
        companyName: 'Jenkins LLC',
        productName: 'Small Rubber Shoes',
        sellDate: '2023-03-26',
        inStock: true,
        qty: 8,
        orderId: '61-6324553',
        country: 'Virgin Islands, U.S.',
      },
      {
        companyName: 'Koepp and Sons',
        productName: 'Sleek Wooden Bacon',
        sellDate: '2023-05-04',
        inStock: true,
        qty: 355,
        orderId: '74-6985005',
        country: 'Mozambique',
      },
      {
        companyName: 'Doyle Group',
        productName: 'Awesome Wooden Hat',
        sellDate: '2023-08-01',
        inStock: false,
        qty: 186,
        orderId: '84-4370131',
        country: 'Cocos (Keeling) Islands',
      },
      {
        companyName: 'Rempel - Durgan',
        productName: 'Tasty Frozen Table',
        sellDate: '2023-09-30',
        inStock: false,
        qty: 284,
        orderId: '13-6461825',
        country: 'Monaco',
      },
      {
        companyName: 'Lesch - Jakubowski',
        productName: 'Small Fresh Bacon',
        sellDate: '2023-09-26',
        inStock: true,
        qty: 492,
        orderId: '13-9465439',
        country: 'Iran',
      },
      {
        companyName: 'Jacobi - Kutch',
        productName: 'Rustic Cotton Ball',
        sellDate: '2023-05-04',
        inStock: true,
        qty: 300,
        orderId: '76-5194058',
        country: 'Indonesia',
      },
      {
        companyName: 'Gerhold - Rowe',
        productName: 'Rustic Cotton Ball',
        sellDate: '2023-07-07',
        inStock: true,
        qty: 493,
        orderId: '61-8600792',
        country: 'Norfolk Island',
      },
      {
        companyName: 'Johnston - Wisozk',
        productName: 'Small Fresh Fish',
        sellDate: '2023-07-14',
        inStock: false,
        qty: 304,
        orderId: '10-6007287',
        country: 'Romania',
      },
      {
        companyName: 'Gutkowski Inc',
        productName: 'Small Fresh Bacon',
        sellDate: '2023-01-10',
        inStock: true,
        qty: 375,
        orderId: '25-1164132',
        country: 'Afghanistan',
      },
      {
        companyName: 'Koepp and Sons',
        productName: 'Small Fresh Fish',
        sellDate: '2023-03-30',
        inStock: false,
        qty: 365,
        orderId: '75-7975820',
        country: 'Germany',
      },
      {
        companyName: 'Zboncak and Sons',
        productName: 'Small Fresh Fish',
        sellDate: '2023-08-17',
        inStock: false,
        qty: 308,
        orderId: '59-6251875',
        country: 'Tajikistan',
      },
      {
        companyName: 'Mills Group',
        productName: 'Rustic Soft Ball',
        sellDate: '2023-09-30',
        inStock: false,
        qty: 191,
        orderId: '67-7521441',
        country: 'Puerto Rico',
      },
      {
        companyName: 'Zboncak and Sons',
        productName: 'Awesome Wooden Hat',
        sellDate: '2023-03-18',
        inStock: false,
        qty: 208,
        orderId: '19-4264192',
        country: 'Bolivia',
      },
      {
        companyName: 'Rath LLC',
        productName: 'Rustic Soft Ball',
        sellDate: '2023-06-14',
        inStock: true,
        qty: 191,
        orderId: '78-5742060',
        country: 'Benin',
      },
      {
        companyName: 'Upton - Reichert',
        productName: 'Tasty Frozen Table',
        sellDate: '2023-02-27',
        inStock: false,
        qty: 45,
        orderId: '26-6191298',
        country: 'Tunisia',
      },
      {
        companyName: 'Carroll Group',
        productName: 'Rustic Soft Ball',
        sellDate: '2022-12-12',
        inStock: true,
        qty: 385,
        orderId: '13-7828353',
        country: 'French Southern Territories',
      },
      {
        companyName: 'Reichel Group',
        productName: 'Small Frozen Tuna',
        sellDate: '2022-12-12',
        inStock: true,
        qty: 117,
        orderId: '67-9643738',
        country: 'Mongolia',
      },
      {
        companyName: 'Kozey Inc',
        productName: 'Rustic Soft Ball',
        sellDate: '2023-03-24',
        inStock: false,
        qty: 335,
        orderId: '78-1331653',
        country: 'Angola',
      },
      {
        companyName: 'Brown LLC',
        productName: 'Small Rubber Shoes',
        sellDate: '2023-06-13',
        inStock: true,
        qty: 305,
        orderId: '63-2315723',
        country: 'French Southern Territories',
      },
      {
        companyName: 'Weber Inc',
        productName: 'Rustic Cotton Ball',
        sellDate: '2023-09-07',
        inStock: true,
        qty: 409,
        orderId: '53-6782557',
        country: 'Indonesia',
      },
      {
        companyName: 'OReilly LLC',
        productName: 'Tasty Frozen Table',
        sellDate: '2023-05-18',
        inStock: true,
        qty: 318,
        orderId: '91-7787675',
        country: 'Mayotte',
      },
      {
        companyName: 'Weber Inc',
        productName: 'Sleek Wooden Bacon',
        sellDate: '2023-04-20',
        inStock: false,
        qty: 234,
        orderId: '41-3560672',
        country: 'Switzerland',
      },
      {
        companyName: 'Hodkiewicz Inc',
        productName: 'Tasty Frozen Table',
        sellDate: '2023-10-19',
        inStock: true,
        qty: 136,
        orderId: '48-6028776',
        country: 'Peru',
      },
      {
        companyName: 'Lesch and Sons',
        productName: 'Rustic Cotton Ball',
        sellDate: '2023-09-29',
        inStock: false,
        qty: 187,
        orderId: '84-3770456',
        country: 'Central African Republic',
      },
      {
        companyName: 'Pouros - Brakus',
        productName: 'Small Frozen Tuna',
        sellDate: '2023-01-29',
        inStock: false,
        qty: 350,
        orderId: '08-4844950',
        country: 'Isle of Man',
      },
      {
        companyName: 'Batz - Rice',
        productName: 'Small Rubber Shoes',
        sellDate: '2023-11-06',
        inStock: false,
        qty: 252,
        orderId: '88-4899852',
        country: 'Burundi',
      },
      {
        companyName: 'Kub Inc',
        productName: 'Small Fresh Fish',
        sellDate: '2023-09-05',
        inStock: true,
        qty: 306,
        orderId: '06-5022461',
        country: 'Mauritius',
      },
      {
        companyName: 'Hills and Sons',
        productName: 'Small Frozen Tuna',
        sellDate: '2023-11-07',
        inStock: false,
        qty: 435,
        orderId: '99-5539911',
        country: 'Somalia',
      },
      {
        companyName: 'Shanahan - Boyle',
        productName: 'Small Frozen Tuna',
        sellDate: '2023-06-19',
        inStock: true,
        qty: 171,
        orderId: '82-8162453',
        country: 'Virgin Islands, U.S.',
      },
      {
        companyName: 'Luettgen Inc',
        productName: 'Awesome Wooden Hat',
        sellDate: '2023-09-30',
        inStock: false,
        qty: 6,
        orderId: '02-8118250',
        country: 'Colombia',
      },
      {
        companyName: 'Hegmann Inc',
        productName: 'Small Rubber Shoes',
        sellDate: '2023-02-16',
        inStock: true,
        qty: 278,
        orderId: '07-9773343',
        country: 'Central African Republic',
      },
      {
        companyName: 'Kub Inc',
        productName: 'Small Frozen Tuna',
        sellDate: '2023-08-08',
        inStock: false,
        qty: 264,
        orderId: '66-4470479',
        country: 'Norfolk Island',
      },
      {
        companyName: 'Kub Inc',
        productName: 'Tasty Frozen Table',
        sellDate: '2023-06-06',
        inStock: true,
        qty: 494,
        orderId: '13-1175339',
        country: 'Liechtenstein',
      },
      {
        companyName: 'Hahn - Welch',
        productName: 'Small Frozen Tuna',
        sellDate: '2023-06-12',
        inStock: false,
        qty: 485,
        orderId: '32-9127309',
        country: 'Bahrain',
      },
      {
        companyName: 'Nader - Fritsch',
        productName: 'Small Frozen Tuna',
        sellDate: '2023-04-08',
        inStock: true,
        qty: 332,
        orderId: '41-3774568',
        country: 'Montserrat',
      },
      {
        companyName: 'Crona and Sons',
        productName: 'Small Fresh Bacon',
        sellDate: '2023-06-21',
        inStock: true,
        qty: 104,
        orderId: '48-9995090',
        country: 'Syrian Arab Republic',
      },
      {
        companyName: 'Lind Group',
        productName: 'Rustic Cotton Ball',
        sellDate: '2023-08-17',
        inStock: false,
        qty: 51,
        orderId: '68-9599400',
        country: 'Czech Republic',
      },
      {
        companyName: 'Labadie LLC',
        productName: 'Small Fresh Bacon',
        sellDate: '2023-04-20',
        inStock: true,
        qty: 155,
        orderId: '52-4334332',
        country: 'Croatia',
      },
      {
        companyName: 'Doyle Group',
        productName: 'Sleek Wooden Bacon',
        sellDate: '2023-07-23',
        inStock: false,
        qty: 465,
        orderId: '63-8894526',
        country: 'Indonesia',
      },
    ];

    const countries = products.reduce((acc, curr) => {
      if (acc.includes(curr.country)) {
        return acc;
      }

      return [...acc, curr.country];
    }, [] as string[]);

    this.hotData = [...products];

    this.hotSettings = {
      height: 464,
      colWidths: [160, 165, 130, 100, 100, 110, 216],
      autoRowSize: true,
      colHeaders: [
        'Company name',
        'Product name',
        'Sell date',
        'In stock',
        'Qty',
        'Order ID',
        'Country',
      ],
      columns: [
        { data: 'companyName', type: 'text' },
        { data: 'productName', type: 'text' },
        {
          data: 'sellDate',
          type: 'intl-date',
          locale: 'en-GB',
          dateFormat: { day: '2-digit', month: '2-digit', year: 'numeric' } as unknown as string,
        },
        {
          data: 'inStock',
          type: 'checkbox',
          className: 'htCenter',
          headerClassName: 'htCenter',
        },
        {
          data: 'qty',
          type: 'numeric',
          headerClassName: 'htRight',
        },
        {
          data: 'orderId',
          type: 'text',
        },
        {
          data: 'country',
          type: 'dropdown',
          source: countries,
        },
      ],
      dropdownMenu: true,
      hiddenColumns: {
        indicators: true,
      },
      contextMenu: true,
      navigableHeaders: true,
      tabNavigation: true,
      autoWrapRow: true,
      autoWrapCol: true,
      multiColumnSorting: true,
      filters: true,
      rowHeaders: true,
      manualRowMove: true,
      headerClassName: 'htLeft',
    }

    // Initialize the Handsontable instance with the specified configuration options

    const setupCheckbox = (element: HTMLInputElement | null, callback: (checked: boolean) => void) =>
      element?.addEventListener('click', () => callback(element.checked));

    // Set up event listeners for various checkboxes to update Handsontable settings.
    // This allows us to change the Handsontable settings from the UI, showcasing
    // the flexibility of Handsontable in configuring according to your needs.
    // Checkbox: Enable/Disable Tab Navigation
    setupCheckbox(document.querySelector<HTMLInputElement>('#enable-tab-navigation'), (checked: boolean) => {
      this.hotSettings.tabNavigation = checked;
      this.hotTable.hotInstance!.updateSettings({
        tabNavigation: this.hotSettings.tabNavigation,
      });
      console.log(
        'Updated setting: tabNavigation to',
        this.hotTable.hotInstance!.getSettings().tabNavigation
    );
    });
    // Checkbox: Enable/Disable Header Navigation
    setupCheckbox(
      document.querySelector<HTMLInputElement>('#enable-header-navigation'),
      (checked: boolean) => {
        this.hotSettings.navigableHeaders = checked;
        this.hotTable.hotInstance!.updateSettings({
          navigableHeaders: this.hotSettings.navigableHeaders,
        });
        console.log(
          'Updated setting: navigableHeaders to',
          this.hotTable.hotInstance!.getSettings().navigableHeaders
      );
      }
    );

    // Checkbox: Enable/Disable Cell Virtualization
    setupCheckbox(
      document.querySelector<HTMLInputElement>('#enable-cell-virtualization'),
      (checked: boolean) => {
        this.hotTable.hotInstance!.updateSettings({
          renderAllRows: !checked,
          renderAllColumns: !checked,
        });
        console.log('Updated virtualization settings:', {
          renderAllRows: this.hotTable.hotInstance!.getSettings().renderAllRows,
          renderAllColumns: this.hotTable.hotInstance!.getSettings().renderAllColumns,
        });
      }
    );
    // Checkbox: Enable/Disable Cell Enter Editing
    setupCheckbox(
      document.querySelector<HTMLInputElement>('#enable-cell-enter-editing'),
      (checked: boolean) => {
        this.hotSettings.enterBeginsEditing = checked;
        this.hotTable.hotInstance!.updateSettings({
          enterBeginsEditing: this.hotSettings.enterBeginsEditing,
        });
        console.log(
          'Updated setting: enable-cell-enter-editing to',
          this.hotTable.hotInstance!.getSettings().enterBeginsEditing
      );
      }
    );
    // Checkbox: Enable/Disable Arrow Navigation for First/Last Row
    setupCheckbox(
      document.querySelector<HTMLInputElement>('#enable-arrow-rl-first-last-column'),
      (checked: boolean) => {
        this.hotSettings.autoWrapRow = checked;
        this.hotTable.hotInstance!.updateSettings({
          autoWrapRow: this.hotSettings.autoWrapRow,
        });
        console.log(
          'Updated setting: autoWrapRow to',
          this.hotTable.hotInstance!.getSettings().autoWrapRow
      );
      }
    );
    // Checkbox: Enable/Disable Arrow Navigation for First/Last Column
    setupCheckbox(
      document.querySelector<HTMLInputElement>('#enable-arrow-td-first-last-column'),
      (checked: boolean) => {
        this.hotSettings.autoWrapCol = checked;
        this.hotTable.hotInstance!.updateSettings({
          autoWrapCol: this.hotSettings.autoWrapCol,
        });
        console.log(
          'Updated setting: autoWrapCol to',
          this.hotTable.hotInstance!.getSettings().autoWrapCol
      );
      }
    );
    // Checkbox: Enable/Disable Enter Key Focus for Editing
    setupCheckbox(
      document.querySelector<HTMLInputElement>('#enable-enter-focus-editing'),
      (checked: boolean) => {
        this.hotSettings.enterMoves = checked ? { col: 0, row: 1 } : { col: 0, row: 0 };
        this.hotTable.hotInstance!.updateSettings({
          enterMoves: this.hotSettings.enterMoves,
        });
        console.log('Updated setting: enterMoves to', this.hotTable.hotInstance!.getSettings().enterMoves);
      }
    );
  }
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
