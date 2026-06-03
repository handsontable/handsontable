/* file: app.component.ts */
import { Component } from '@angular/core';
import { GridSettings, HotTableModule } from '@handsontable/angular-wrapper';

// Build column headers: 'Cost Center' + 49 monthly labels (Jan 2021 … Jan 2025)
const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const colHeaders: string[] = ['Cost Center'];
let year = 2021;
let monthIndex = 0;

while (colHeaders.length < 50) {
  colHeaders.push(`${months[monthIndex]} ${year}`);
  monthIndex += 1;

  if (monthIndex >= months.length) {
    monthIndex = 0;
    year += 1;
  }
}

// Build 50 rows of budget data
const tableData: (string | number)[][] = [];

for (let row = 0; row < 50; row++) {
  const rowData: (string | number)[] = [`CC-${1000 + row}`];

  for (let col = 0; col < 49; col++) {
    rowData.push(2000 + row * 100 + col * 50);
  }

  tableData.push(rowData);
}

@Component({
  selector: 'app-example2',
  standalone: true,
  imports: [HotTableModule],
  template: `
    <div>
      <div style="display:flex;gap:28px;flex-wrap:wrap;margin-bottom:16px;font:13px/1.4 sans-serif;color:#334155;">
        <label style="display:flex;flex-direction:column;gap:4px;">
          <b style="font-family:monospace">interval.min: {{ intervalMin }} ms</b>
          <input type="range" min="10" max="200" step="10" [value]="intervalMin"
            (input)="onSliderChange($event, 'intervalMin')" style="width:200px;cursor:pointer;">
        </label>
        <label style="display:flex;flex-direction:column;gap:4px;">
          <b style="font-family:monospace">interval.max: {{ intervalMax }} ms</b>
          <input type="range" min="100" max="1000" step="50" [value]="intervalMax"
            (input)="onSliderChange($event, 'intervalMax')" style="width:200px;cursor:pointer;">
        </label>
        <label style="display:flex;flex-direction:column;gap:4px;">
          <b style="font-family:monospace">rampDistance: {{ rampDistance }} px</b>
          <input type="range" min="20" max="300" step="10" [value]="rampDistance"
            (input)="onSliderChange($event, 'rampDistance')" style="width:200px;cursor:pointer;">
        </label>
      </div>
      <hot-table [settings]="hotSettings" [data]="hotData"></hot-table>
    </div>
  `,
})
export class AppComponent {
  readonly hotData = tableData;

  intervalMin = 20;
  intervalMax = 500;
  rampDistance = 120;

  hotSettings: GridSettings = {
    colHeaders,
    width: 500,
    height: 220,
    rowHeaders: true,
    // Configurable `interval`/`rampDistance` for `dragToScroll` is not available in 17.1.0, where
    // the option is typed as `boolean`. The cast keeps the example compiling against 17.1.0; at
    // runtime the object is truthy, so drag-to-scroll is enabled (the custom speed is ignored there).
    dragToScroll: {
      interval: { min: this.intervalMin, max: this.intervalMax },
      rampDistance: this.rampDistance,
    } as unknown as GridSettings['dragToScroll'],
  };

  onSliderChange(event: Event, field: 'intervalMin' | 'intervalMax' | 'rampDistance'): void {
    this[field] = Number((event.target as HTMLInputElement).value);
    this.sync();
  }

  sync(): void {
    this.hotSettings = {
      ...this.hotSettings,
      dragToScroll: {
        interval: { min: this.intervalMin, max: this.intervalMax },
        rampDistance: this.rampDistance,
      } as unknown as GridSettings['dragToScroll'],
    };
  }
}
/* end-file */


/* file: app.config.ts */
import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { registerAllModules } from 'handsontable/registry';
import {
  HOT_GLOBAL_CONFIG,
  HotGlobalConfig,
  NON_COMMERCIAL_LICENSE,
} from '@handsontable/angular-wrapper';

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
