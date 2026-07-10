import Handsontable from 'handsontable/base';
import { registerAllModules } from 'handsontable/registry';
import { BaseRenderer, registerRenderer } from 'handsontable/renderers';
import { textRenderer } from 'handsontable/renderers/textRenderer';

// register Handsontable's modules
registerAllModules();

const data = [
  ['Acme Corp', 4.2, 5.1, -1.3, 6.8],
  ['Vertex Industries', 12.5, 11.9, 13.2, 14],
  ['Harbor Analytics', -2.4, 0.8, 2.1, 3.5],
  ['Summit Logistics', 8.7, -3.2, 4.4, 5.9],
  ['Pioneer Foods', 1.1, 1.4, 0.9, -0.5],
  ['Meridian Retail', 6, 7.3, 8.1, 9.4],
];

const values = data.flatMap((row) => row.slice(1) as number[]);
const min = Math.min(...values);
const max = Math.max(...values);

// shade the background from red (low) to green (high); the value stays visible
const heatmapRenderer: BaseRenderer = (instance, td, row, col, prop, value, cellProperties) => {
  textRenderer(instance, td, row, col, prop, value, cellProperties);

  const amount = Number(value);

  if (Number.isFinite(amount)) {
    const ratio = (amount - min) / (max - min);
    const hue = Math.round(ratio * 120);

    td.style.background = `hsl(${hue}, 75%, 85%)`;
  }
};

registerRenderer('heatmapRenderer', heatmapRenderer);

const container = document.querySelector('#example3')!;

new Handsontable(container, {
  data,
  colHeaders: ['Company', 'Q1', 'Q2', 'Q3', 'Q4'],
  licenseKey: 'non-commercial-and-evaluation',
  height: 'auto',
  columns: [
    {},
    { renderer: 'heatmapRenderer' },
    { renderer: 'heatmapRenderer' },
    { renderer: 'heatmapRenderer' },
    { renderer: 'heatmapRenderer' },
  ],
});
