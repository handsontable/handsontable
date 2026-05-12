/* file: app.component.ts */
import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { GridSettings, HotTableModule} from '@handsontable/angular-wrapper';
import Handsontable from 'handsontable/base';

// Custom renderer: visualizes stock level as a progress bar with a numeric label.
// Demonstrates using a renderer independently from the editor and validator.
const stockRenderer = (
  hotInstance: Handsontable.Core,
  td: HTMLTableCellElement,
  _row: number,
  _col: number,
  _prop: string | number,
  value: Handsontable.CellValue
): HTMLTableCellElement => {
  const num = parseInt(value as string, 10);
  const valid = !isNaN(num) && num >= 0;
  const pct = valid ? Math.min(100, (num / 1000) * 100) : 0;
  const color = pct > 60 ? '#22c55e' : pct > 20 ? '#f59e0b' : '#ef4444';

  td.innerText = '';

  const wrapper = hotInstance.rootDocument.createElement('div');

  wrapper.className = 'htStockBar';

  const track = hotInstance.rootDocument.createElement('div');

  track.className = 'htStockBarTrack';

  const fill = hotInstance.rootDocument.createElement('div');

  fill.className = 'htStockBarFill';
  fill.style.width = `${pct}%`;
  fill.style.background = color;

  const label = hotInstance.rootDocument.createElement('span');

  label.className = 'htStockBarLabel';
  label.innerText = valid ? `${num}` : '—';
  track.appendChild(fill);
  wrapper.appendChild(track);
  wrapper.appendChild(label);
  td.appendChild(wrapper);

  return td;
};

// Custom validator: accepts integers in the range 0–1000.
// Demonstrates using a validator independently from the renderer and editor.
const stockValidator = (value: Handsontable.CellValue, callback: (valid: boolean) => void): void => {
  const num = Number(value);

  callback(Number.isInteger(num) && num >= 0 && num <= 1000);
};

@Component({
  selector: 'app-example1',
  template: `
    <hot-table [settings]="hotSettings!" [data]="hotData"></hot-table>
  `,
  // ViewEncapsulation.None makes these styles global so they apply to DOM
  // elements created by the Handsontable renderer outside Angular's component tree.
  styles: [`
    .htStockBar {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 0 4px;
      height: 100%;
      box-sizing: border-box;
    }
    .htStockBarTrack {
      flex: 1;
      height: 8px;
      background: var(--ht-background-secondary-color);
      border-radius: 4px;
      overflow: hidden;
    }
    .htStockBarFill {
      height: 100%;
      border-radius: 4px;
      min-width: 2px;
    }
    .htStockBarLabel {
      font-size: 11px;
      font-variant-numeric: tabular-nums;
      min-width: 28px;
      text-align: right;
      white-space: nowrap;
    }
  `],
  encapsulation: ViewEncapsulation.None,
  standalone: true,
  imports: [HotTableModule],
})
export class AppComponent implements OnInit {
  readonly hotData = [
    ['Apple', 1.2, 820],
    ['Banana', 0.5, 280],
    ['Cherry', 3.0, 45],
    ['Mango', 2.5, 960],
    ['Pear', 0.8, 170],
    ['Blueberry', 4.5, 15],
  ];

  hotSettings!: GridSettings;

  ngOnInit() {
    this.hotSettings = {
      colHeaders: ['Product', 'Price', 'Stock'],
      columns: [
        // Built-in type bundles renderer + editor + no validator
        { type: 'text' },
        // Built-in type bundles renderer + editor + validator with custom format
        { type: 'numeric', locale: 'en-US', numericFormat: { style: 'currency', currency: 'USD', minimumFractionDigits: 2 } },
        // Mixed: custom renderer, built-in numeric editor, custom validator
        {
          renderer: stockRenderer,
          editor: 'numeric',
          validator: stockValidator,
          allowInvalid: false,
        },
      ],
      colWidths: [120, 90, 200],
      rowHeaders: true,
      height: 'auto',
      autoWrapRow: true,
      autoWrapCol: true,
    };
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
