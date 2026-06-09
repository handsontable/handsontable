/* file: app.component.ts */
import { AfterViewInit, Component, ViewChild, ViewEncapsulation } from '@angular/core';
import { GridSettings, HotTableComponent, HotTableModule} from '@handsontable/angular-wrapper';

@Component({
  standalone: true,
  imports: [HotTableModule],
  selector: 'app-example3',
  encapsulation: ViewEncapsulation.None,
  template: `
    <div class="example-controls-container">
      <div class="controls">
        <button
          type="button"
          [disabled]="isLoading"
          (click)="loadData()"
          [innerHTML]="buttonText">
        </button>
      </div>
    </div>
    <hot-table
      #hotTable
      [settings]="hotSettings!"
      [data]="hotData"
    >
    </hot-table>
  `,
})
export class AppComponent implements AfterViewInit {
  @ViewChild('hotTable') hotTable!: HotTableComponent;

  hotData: any[] = [];
  isLoading = false;  
  buttonText = 'Load Data';

  readonly hotSettings: GridSettings = {
    columns: [
      {
        title: 'Model',
        type: 'text',
        data: 'model',
        width: 150,
        headerClassName: 'htLeft',
      },
      {
        title: 'Price',
        type: 'numeric',
        data: 'price',
        width: 80,
        locale: 'en-US',
        numericFormat: {
          style: 'currency',
          currency: 'USD',
          minimumFractionDigits: 2,
        },
        className: 'htRight',
        headerClassName: 'htRight',
      },
      {
        title: 'Date',
        type: 'intl-date',
        data: 'sellDate',
        width: 130,
        locale: 'en-US',
        dateFormat: { month: 'short', day: 'numeric', year: 'numeric' },
        className: 'htRight',
        headerClassName: 'htRight',
      },
      {
        title: 'Time',
        type: 'intl-time',
        data: 'sellTime',
        width: 90,
        locale: 'en-US',
        timeFormat: { hour: '2-digit', minute: '2-digit', hour12: true },
        className: 'htRight',
        headerClassName: 'htRight',
      },
      {
        title: 'In stock',
        type: 'checkbox',
        data: 'inStock',
        className: 'htCenter',
        headerClassName: 'htCenter',
      },
    ],
    width: '100%',
    height: 300,
    stretchH: 'all',
    contextMenu: true,
    rowHeaders: true,
    colHeaders: true,
    autoWrapRow: true,
    autoWrapCol: true,
    autoRowSize: true,
    loading: true,
  };

  ngAfterViewInit() {
    // Component is ready, but we'll load data on button click
  }

  async loadData(): Promise<void> {
    const hotInstance = this.hotTable.hotInstance;

    if (!hotInstance) {
      return;
    }

    // Get loading plugin instance
    const loadingPlugin = hotInstance.getPlugin('loading');

    // Show loading dialog
    loadingPlugin.show();

    this.isLoading = true;

    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Simulated data
      const data = [
        { model: 'Trail Helmet', price: 1298.14, sellDate: '2025-08-31', sellTime: '14:12', inStock: true },
        { model: 'Windbreaker Jacket', price: 178.9, sellDate: '2025-05-10', sellTime: '22:26', inStock: false },
        { model: 'Cycling Cap', price: 288.1, sellDate: '2025-09-15', sellTime: '09:37', inStock: true },
        { model: 'HL Mountain Frame', price: 94.49, sellDate: '2025-01-17', sellTime: '14:19', inStock: false },
        { model: 'Racing Socks', price: 430.38, sellDate: '2025-05-10', sellTime: '13:42', inStock: true },
        { model: 'Racing Socks', price: 138.85, sellDate: '2025-09-20', sellTime: '14:48', inStock: true },
        { model: 'HL Mountain Frame', price: 1909.63, sellDate: '2025-09-05', sellTime: '09:35', inStock: false },
        { model: 'Carbon Handlebar', price: 1080.7, sellDate: '2025-10-24', sellTime: '22:58', inStock: false },
        { model: 'Aero Bottle', price: 1571.13, sellDate: '2025-05-24', sellTime: '00:24', inStock: true },
        { model: 'Windbreaker Jacket', price: 919.09, sellDate: '2025-07-16', sellTime: '19:11', inStock: true },
      ];

      // Load data into the table
      hotInstance.loadData(data);

      // Hide loading dialog
      loadingPlugin.hide();

      this.isLoading = false;
      this.buttonText = 'Reload Data';

    } catch (error) {
      // Handle error
      setTimeout(() => {
        loadingPlugin.hide();
        this.isLoading = false;
      }, 2000);
    }
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
