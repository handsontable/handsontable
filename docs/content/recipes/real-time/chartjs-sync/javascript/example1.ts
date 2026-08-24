import Handsontable from 'handsontable/base';
import { registerAllModules } from 'handsontable/registry';
import { Chart, registerables, ChartConfiguration } from 'chart.js';

registerAllModules();
Chart.register(...registerables);

/* start:skip-in-preview */
interface CampaignRow {
  campaign: string;
  q1Budget: number;
  q1Revenue: number;
  q2Budget: number;
  q2Revenue: number;
}

const data: CampaignRow[] = [
  { campaign: 'Spring Sale 2025', q1Budget: 12000, q1Revenue: 34500, q2Budget: 15000, q2Revenue: 41200 },
  { campaign: 'Brand Awareness Q1', q1Budget: 8000, q1Revenue: 11300, q2Budget: 9500, q2Revenue: 13800 },
  { campaign: 'Summer Promo', q1Budget: 5000, q1Revenue: 6200, q2Budget: 18000, q2Revenue: 52400 },
  { campaign: 'Email Retargeting', q1Budget: 3500, q1Revenue: 9800, q2Budget: 4200, q2Revenue: 11600 },
  { campaign: 'Influencer Campaign', q1Budget: 20000, q1Revenue: 38700, q2Budget: 22000, q2Revenue: 44100 },
  { campaign: 'SEO Push Q2', q1Budget: 6000, q1Revenue: 7400, q2Budget: 9000, q2Revenue: 21300 },
  { campaign: 'Holiday Countdown', q1Budget: 4500, q1Revenue: 5100, q2Budget: 25000, q2Revenue: 68900 },
  { campaign: 'Brand Awareness Q3', q1Budget: 11000, q1Revenue: 16800, q2Budget: 13500, q2Revenue: 19400 },
];
/* end:skip-in-preview */

const container = document.querySelector<HTMLDivElement>('#example1')!;
const canvas = document.querySelector<HTMLCanvasElement>('#chart-canvas')!;

const chartConfig: ChartConfiguration<'bar'> = {
  type: 'bar',
  data: {
    labels: ['Select rows above to compare campaigns'],
    datasets: [
      {
        label: 'Q1 Revenue ($)',
        data: [0],
        backgroundColor: 'rgba(54, 162, 235, 0.7)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1,
      },
      {
        label: 'Q2 Revenue ($)',
        data: [0],
        backgroundColor: 'rgba(255, 99, 132, 0.7)',
        borderColor: 'rgba(255, 99, 132, 1)',
        borderWidth: 1,
      },
    ],
  },
  options: {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top' },
      title: { display: true, text: 'Campaign Revenue Comparison' },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: (value) => `$${Number(value).toLocaleString()}`,
        },
      },
    },
  },
};

const chart = new Chart(canvas, chartConfig);

function updateChart(hot: Handsontable): void {
  const selected = hot.getSelected();

  if (!selected || selected.length === 0) {
    chart.data.labels = ['Select rows above to compare campaigns'];
    chart.data.datasets[0].data = [0];
    chart.data.datasets[1].data = [0];
    chart.update();

    return;
  }

  const rowSet = new Set<number>();

  for (const [r1, , r2] of selected) {
    const minRow = Math.min(r1, r2);
    const maxRow = Math.max(r1, r2);

    for (let row = minRow; row <= maxRow; row++) {
      rowSet.add(row);
    }
  }

  const rows = [...rowSet].sort((a, b) => a - b);
  const labels: string[] = [];
  const q1Values: number[] = [];
  const q2Values: number[] = [];

  for (const row of rows) {
    const rowData = hot.getDataAtRow(row);

    labels.push(rowData[0] as string);
    q1Values.push(rowData[2] as number);
    q2Values.push(rowData[4] as number);
  }

  chart.data.labels = labels;
  chart.data.datasets[0].data = q1Values;
  chart.data.datasets[1].data = q2Values;
  chart.update();
}

// eslint-disable-next-line no-unused-vars
const hot = new Handsontable(container, {
  data,
  colHeaders: ['Campaign', 'Q1 Budget ($)', 'Q1 Revenue ($)', 'Q2 Budget ($)', 'Q2 Revenue ($)'],
  columns: [
    { data: 'campaign', type: 'text', width: 200 },
    { data: 'q1Budget', type: 'numeric', numericFormat: { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }, width: 120 },
    { data: 'q1Revenue', type: 'numeric', numericFormat: { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }, width: 120 },
    { data: 'q2Budget', type: 'numeric', numericFormat: { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }, width: 120 },
    { data: 'q2Revenue', type: 'numeric', numericFormat: { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }, width: 120 },
  ],
  rowHeaders: true,
  selectionMode: 'range',
  height: 'auto',
  width: '100%',
  autoWrapRow: true,
  afterSelectionEnd() {
    updateChart(this);
  },
  afterDeselect() {
    updateChart(this);
  },
  licenseKey: 'non-commercial-and-evaluation',
});
