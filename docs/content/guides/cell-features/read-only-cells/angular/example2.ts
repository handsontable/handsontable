/* file: app.component.ts */
import { AfterViewInit, Component, ViewChild } from '@angular/core';
import { GridSettings, HotTableComponent, HotTableModule } from '@handsontable/angular-wrapper';

@Component({
  selector: 'example2-read-only-cells',
  standalone: true,
  imports: [HotTableModule],
  template: ` <div>
    <hot-table [data]="data" [settings]="gridSettings"></hot-table>
  </div>`,
})
export class AppComponent implements AfterViewInit {
  @ViewChild(HotTableComponent, { static: false }) readonly hotTable!: HotTableComponent;

  readonly data = [
    { name: 'Hydrogen', symbol: 'H', atomicNumber: 1, atomicMass: 1.008 },
    { name: 'Helium', symbol: 'He', atomicNumber: 2, atomicMass: 4.003 },
    { name: 'Lithium', symbol: 'Li', atomicNumber: 3, atomicMass: 6.94 },
    { name: 'Beryllium', symbol: 'Be', atomicNumber: 4, atomicMass: 9.012 },
    { name: 'Boron', symbol: 'B', atomicNumber: 5, atomicMass: 10.81 },
  ];

  readonly gridSettings: GridSettings ={
    height: 'auto',
    colHeaders: ['Name', 'Symbol', 'Atomic number', 'Atomic mass'],
    autoWrapRow: true,
    autoWrapCol: true
  };

  ngAfterViewInit(): void {
    const hot = this.hotTable?.hotInstance;

    hot?.updateSettings({
      cells: (row: number, col: number, _: any) => {
        if (hot.getData()[row][col] === 'Helium') {
          return { readOnly: true };
        }

        return {};
      },
    });
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
