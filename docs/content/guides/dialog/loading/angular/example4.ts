/* file: app.component.ts */
import { AfterViewInit, Component, ViewChild, ViewEncapsulation } from '@angular/core';
import { GridSettings, HotTableComponent } from '@handsontable/angular-wrapper';

@Component({
  selector: 'app-example4',
  styles: `
  #example4-pagination {
    position: relative;
  }

  #example4-pagination.overlay .ht-pagination::before {
    content: "";
    display: block;
    width: 100%;
    height: 100%;
    background-color: var(--ht-dialog-semi-transparent-background-color);
    position: absolute;
    inset: 0;
    z-index: 1000;
  }
  `,
  template: `
    <hot-table
      #hotTable
      [settings]="hotSettings!"
      [data]="hotData"
    >
    </hot-table>
    <div style="margin-top: 16px; display: flex; gap: 10px">
      <button 
        [disabled]="isLoading" 
        (click)="loadData()"
        [innerHTML]="buttonText">
      </button>
    </div>
    <div style="margin-top: 16px;">
      <p style="padding: 0;">This is a demonstration of how to use the Loading plugin with pagination in external container. You need to create pagination overlay manually, after that you can use the \`afterLoadingShow\` and \`afterLoadingHide\` hooks to show and hide the pagination container overlay.</p>
    </div>  
    <div style="margin-top: 16px;">
      <div id="example4-pagination"></div>
    </div>
  `,
  encapsulation: ViewEncapsulation.None,
  standalone: false
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
        numericFormat: {
          pattern: '$0,0.00',
          culture: 'en-US',
        },
        className: 'htRight',
        headerClassName: 'htRight',
      },
      {
        title: 'Date',
        type: 'date',
        data: 'sellDate',
        width: 130,
        dateFormat: 'MMM D, YYYY',
        correctFormat: true,
        className: 'htRight',
        headerClassName: 'htRight',
      },
      {
        title: 'Time',
        type: 'time',
        data: 'sellTime',
        width: 90,
        timeFormat: 'hh:mm A',
        correctFormat: true,
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
    const hot = this.hotTable.hotInstance;
    const paginationContainer = document.getElementById('example4-pagination');


    if (!hot || !paginationContainer) {
      return;
    }

    hot.updateSettings({
      pagination: {
        uiContainer: paginationContainer,
      },
    });

    // Add hooks to show and hide the pagination container overlay
    hot.addHook("afterLoadingShow", () => {
      paginationContainer.classList.add("overlay");
    });

    hot.addHook("afterLoadingHide", () => {
      paginationContainer.classList.remove("overlay");
    });
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
        { model: 'Trail Helmet', price: 1298.14, sellDate: 'Aug 31, 2025', sellTime: '02:12 PM', inStock: true },
        { model: 'Windbreaker Jacket', price: 178.9, sellDate: 'May 10, 2025', sellTime: '10:26 PM', inStock: false },
        { model: 'Cycling Cap', price: 288.1, sellDate: 'Sep 15, 2025', sellTime: '09:37 AM', inStock: true },
        { model: 'HL Mountain Frame', price: 94.49, sellDate: 'Jan 17, 2025', sellTime: '02:19 PM', inStock: false },
        { model: 'Racing Socks', price: 430.38, sellDate: 'May 10, 2025', sellTime: '01:42 PM', inStock: true },
        { model: 'Racing Socks', price: 138.85, sellDate: 'Sep 20, 2025', sellTime: '02:48 PM', inStock: true },
        { model: 'HL Mountain Frame', price: 1909.63, sellDate: 'Sep 5, 2025', sellTime: '09:35 AM', inStock: false },
        { model: 'Carbon Handlebar', price: 1080.7, sellDate: 'Oct 24, 2025', sellTime: '10:58 PM', inStock: false },
        { model: 'Aero Bottle', price: 1571.13, sellDate: 'May 24, 2025', sellTime: '12:24 AM', inStock: true },
        { model: 'Windbreaker Jacket', price: 919.09, sellDate: 'Jul 16, 2025', sellTime: '07:11 PM', inStock: true },
        { model: 'LED Bike Light', price: 1012.5, sellDate: 'May 1, 2025', sellTime: '05:30 PM', inStock: false },
        { model: 'Windbreaker Jacket', price: 635.37, sellDate: 'May 14, 2025', sellTime: '09:05 AM', inStock: true },
        { model: 'Road Tire Tube', price: 1421.27, sellDate: 'Jan 31, 2025', sellTime: '01:33 PM', inStock: true },
        { model: 'Action Camera', price: 1019.05, sellDate: 'Dec 7, 2025', sellTime: '01:26 AM', inStock: false },
        { model: 'Carbon Handlebar', price: 603.96, sellDate: 'Sep 13, 2025', sellTime: '04:10 AM', inStock: false },
        { model: 'Aero Bottle', price: 1334.03, sellDate: 'Jan 24, 2025', sellTime: '03:29 AM', inStock: false },
        { model: 'Road Tire Tube', price: 1841.17, sellDate: 'May 22, 2025', sellTime: '01:45 AM', inStock: false },
        { model: 'Aero Bottle', price: 1622.05, sellDate: 'Jan 13, 2025', sellTime: '08:30 AM', inStock: true },
        { model: 'Comfort Saddle', price: 1456.24, sellDate: 'Jul 20, 2025', sellTime: '03:39 AM', inStock: false },
        { model: 'Windbreaker Jacket', price: 1736.96, sellDate: 'Sep 25, 2025', sellTime: '12:43 AM', inStock: true },
        { model: 'Fitness Watch', price: 1075.31, sellDate: 'Nov 7, 2025', sellTime: '05:47 PM', inStock: true },
        { model: 'Cycling Cap', price: 726.01, sellDate: 'Oct 28, 2025', sellTime: '12:44 PM', inStock: true },
        { model: 'Road Tire Tube', price: 601.99, sellDate: 'Sep 22, 2025', sellTime: '12:26 AM', inStock: true },
        { model: 'Speed Gloves', price: 1758.26, sellDate: 'Oct 4, 2025', sellTime: '04:59 AM', inStock: true },
        { model: 'Speed Gloves', price: 564.35, sellDate: 'Jul 10, 2025', sellTime: '06:21 PM', inStock: true },
        { model: 'Hydration Pack', price: 954.84, sellDate: 'Nov 2, 2025', sellTime: '12:59 AM', inStock: false },
        { model: 'Cycling Cap', price: 1511.5, sellDate: 'Feb 11, 2025', sellTime: '02:38 AM', inStock: false },
        { model: 'HL Road Tire', price: 269.6, sellDate: 'Jun 18, 2025', sellTime: '04:58 AM', inStock: false },
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


/* file: app.module.ts */
import { NgModule, ApplicationConfig } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { registerAllModules } from 'handsontable/registry';
import { HOT_GLOBAL_CONFIG, HotGlobalConfig, HotTableModule } from '@handsontable/angular-wrapper';
import { CommonModule } from '@angular/common';
import { NON_COMMERCIAL_LICENSE } from '@handsontable/angular-wrapper';

/* start:skip-in-compilation */
import { AppComponent } from './app.component';
/* end:skip-in-compilation */

// register Handsontable's modules
registerAllModules();

export const appConfig: ApplicationConfig = {
  providers: [
    {
      provide: HOT_GLOBAL_CONFIG,
      useValue: {
        themeName: 'ht-theme-main',
        license: NON_COMMERCIAL_LICENSE,
      } as HotGlobalConfig
    }
  ],
};

@NgModule({
  imports: [ BrowserModule, HotTableModule, CommonModule ],
  declarations: [ AppComponent ],
  providers: [...appConfig.providers],
  bootstrap: [ AppComponent ]
})

export class AppModule { }
/* end-file */
