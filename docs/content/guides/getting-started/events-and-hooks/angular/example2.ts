/* file: app.component.ts */
import { AfterViewInit, Component, ViewChild } from '@angular/core';
import { GridSettings, HotTableComponent, HotTableModule} from '@handsontable/angular-wrapper';

@Component({
  selector: 'example2-events-hooks',
  standalone: true,
  imports: [HotTableModule],
  template: ` <div>
    <hot-table [data]="data" [settings]="gridSettings"></hot-table>
  </div>`,
})
export class AppComponent implements AfterViewInit {
  @ViewChild(HotTableComponent, { static: false }) readonly hotTable!: HotTableComponent;

  lastChange: string | any[] | null = null;

  data = [
    ['Tesla', 2017, 'black', 'black'],
    ['Nissan', 2018, 'blue', 'blue'],
    ['Chrysler', 2019, 'yellow', 'black'],
    ['Volvo', 2020, 'yellow', 'gray'],
  ];

  readonly gridSettings: GridSettings = {
    colHeaders: true,
    rowHeaders: true,
    height: 'auto',
    minSpareRows: 1,
    beforeChange: (changes: any, source: any) => {
      this.lastChange = changes;
    },
    autoWrapRow: true,
    autoWrapCol: true
  };

  ngAfterViewInit(): void {
    const hot = this.hotTable?.hotInstance;

    hot?.updateSettings({
      beforeKeyDown: (e) => {
        const selection = hot?.getSelected()?.[0];

        if (!selection) return undefined;

        // Ignore header and corner selections (row or column index < 0)
        if (selection[0] < 0 || selection[1] < 0) return undefined;

        console.log(selection);

        // BACKSPACE or DELETE
        if (e.keyCode === 8 || e.keyCode === 46) {
          // remove data at cell, shift the cells below it up
          const column = hot.getDataAtCol(selection[1]);
          const shiftedUp = column.slice(selection[0] + 1);
          shiftedUp.push(null);
          hot.populateFromArray(selection[0], selection[1], shiftedUp.map(value => [value]));
          e.preventDefault();
          this.lastChange = null;

          // block the default deletion behavior
          return false;
        }

        // ENTER
        if (e.keyCode === 13) {
          // if last change affected a single cell and did not change it's values
          if (
            this.lastChange &&
            this.lastChange.length === 1 &&
            this.lastChange[0][2] == this.lastChange[0][3]
          ) {
            // insert an empty cell, shift the cells below it down
            const column = hot.getDataAtCol(selection[1]);
            const shiftedDown = ['', ...column.slice(selection[0])];
            hot.populateFromArray(selection[0], selection[1], shiftedDown.map(value => [value]));
            // add new cell
            hot.selectCell(selection[0], selection[1]);
            // select new cell
            this.lastChange = null;

            // block the default Enter behavior
            return false;
          }
        }

        this.lastChange = null;

        return undefined;
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
