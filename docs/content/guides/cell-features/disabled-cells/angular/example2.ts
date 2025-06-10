/* file: app.component.ts */
import { AfterViewInit, Component, ViewChild } from '@angular/core';
import { GridSettings, HotTableComponent } from '@handsontable/angular-wrapper';

@Component({
  selector: 'example2-disabled-cells',
  standalone: false,
  template: ` <div>
    <hot-table [data]="data" [settings]="gridSettings"></hot-table>
  </div>`,
})
export class Example2DisabledCellsComponent implements AfterViewInit {
  @ViewChild(HotTableComponent, { static: false }) readonly hotTable!: HotTableComponent;

  readonly data = [
    { car: 'Tesla', year: 2017, chassis: 'black', bumper: 'black' },
    { car: 'Nissan', year: 2018, chassis: 'blue', bumper: 'blue' },
    { car: 'Chrysler', year: 2019, chassis: 'yellow', bumper: 'black' },
    { car: 'Volvo', year: 2020, chassis: 'white', bumper: 'gray' },
  ];

  readonly gridSettings: GridSettings ={
    height: 'auto',
    colHeaders: ['Car', 'Year', 'Chassis color', 'Bumper color'],
    autoWrapRow: true,
    autoWrapCol: true
  };

  ngAfterViewInit(): void {
    const hot = this.hotTable?.hotInstance;

    hot?.updateSettings({
      cells: (row: number, col: number, _: any) => {
        if (hot.getData()[row][col] === 'Nissan') {
          return { readOnly: true };
        }

        return {};
      },
    });
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
import { Example2DisabledCellsComponent } from './app.component';
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
  declarations: [ Example2DisabledCellsComponent ],
  providers: [...appConfig.providers],
  bootstrap: [ Example2DisabledCellsComponent ]
})

export class AppModule { }
/* end-file */
