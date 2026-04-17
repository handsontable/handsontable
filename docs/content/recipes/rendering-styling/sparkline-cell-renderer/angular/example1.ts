/* file: app.component.ts */
import { Component } from '@angular/core';
import { GridSettings } from '@handsontable/angular-wrapper';
import { BaseRenderer, registerRenderer, baseRenderer } from 'handsontable/renderers';

const SLOT = 10;
const GAP = 2;
const VIEW_HEIGHT = 100;
const WEEK_KEYS = ['w1', 'w2', 'w3', 'w4', 'w5'] as const;

function toNumbers(rowData: Record<string, unknown> | null): number[] {
  return WEEK_KEYS.map((key) => rowData?.[key])
    .map((value) => (typeof value === 'number' ? value : Number(value)))
    .filter((n) => Number.isFinite(n));
}

// Inline SVG bars generated from the row values in w1-w5.
const sparklineRenderer: BaseRenderer = (
  instance,
  td,
  row,
  col,
  prop,
  value,
  cellProperties,
) => {
  baseRenderer(instance, td, row, col, prop, value, cellProperties);

  const sourceRow = instance.getSourceDataAtRow(row) as Record<string, unknown> | null;
  const numbers = toNumbers(sourceRow);
  const max = numbers.reduce((m, n) => Math.max(m, Math.abs(n)), 0);

  if (numbers.length === 0 || max === 0) {
    td.textContent = '\u2014';
    td.title = numbers.length === 0 ? 'No data' : 'All values are zero';

    return;
  }

  const average = numbers.reduce((sum, n) => sum + n, 0) / numbers.length;
  const viewWidth = numbers.length * SLOT - GAP;
  const rects = numbers
    .map((n, i) => {
      const barHeight = (Math.abs(n) / max) * VIEW_HEIGHT;
      const x = i * SLOT;
      const y = VIEW_HEIGHT - barHeight;
      const w = SLOT - GAP;
      const fill = n >= average ? '#16a34a' : '#dc2626';

      return `<rect x="${x}" y="${y}" width="${w}" height="${barHeight}" fill="${fill}"/>`;
    })
    .join('');

  td.innerHTML = `<svg width="100%" height="100%" viewBox="0 0 ${viewWidth} ${VIEW_HEIGHT}" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${rects}</svg>`;
  td.removeAttribute('title');
};

registerRenderer('sparklineBar', sparklineRenderer);

@Component({
  selector: 'example1-sparkline-cell-renderer',
  standalone: false,
  template: `
    <div>
      <hot-table [data]="data" [settings]="gridSettings"></hot-table>
    </div>
  `,
})
export class Example1SparklineCellRendererComponent {
  readonly data = [
    { product: 'Desk lamp', w1: 4, w2: 8, w3: 2, w4: 9, w5: 5 },
    { product: 'Monitor arm', w1: 1, w2: 1, w3: 0, w4: 0, w5: 0 },
    { product: 'USB hub', w1: null, w2: null, w3: null, w4: null, w5: null },
    { product: 'Mouse', w1: undefined, w2: undefined, w3: 3, w4: 5, w5: 2 },
    { product: 'Keyboard', w1: 3, w2: 6, w3: 7, w4: 4, w5: 8 },
    { product: 'Webcam', w1: 0, w2: 0, w3: 0, w4: 0, w5: 0 },
  ];

  readonly gridSettings: GridSettings = {
    rowHeaders: true,
    rowHeights: 44,
    colHeaders: ['Product', 'W1', 'W2', 'W3', 'W4', 'W5', 'Sparkline'],
    height: 'auto',
    width: '100%',
    columns: [
      { data: 'product', type: 'text', width: 140, readOnly: true },
      { data: 'w1', type: 'numeric', width: 65 },
      { data: 'w2', type: 'numeric', width: 65 },
      { data: 'w3', type: 'numeric', width: 65 },
      { data: 'w4', type: 'numeric', width: 65 },
      { data: 'w5', type: 'numeric', width: 65 },
      {
        data: null,
        width: 220,
        renderer: 'sparklineBar',
        className: 'htMiddle sparkline-cell',
        readOnly: true,
      },
    ],
  };
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
import { Example1SparklineCellRendererComponent } from './app.component';
/* end:skip-in-compilation */

// register Handsontable's modules
registerAllModules();

export const appConfig: ApplicationConfig = {
  providers: [
    {
      provide: HOT_GLOBAL_CONFIG,
      useValue: {
        license: NON_COMMERCIAL_LICENSE,
      } as HotGlobalConfig,
    },
  ],
};

@NgModule({
  imports: [BrowserModule, HotTableModule, CommonModule],
  declarations: [Example1SparklineCellRendererComponent],
  providers: [...appConfig.providers],
  bootstrap: [Example1SparklineCellRendererComponent],
})
export class AppModule {}
/* end-file */
