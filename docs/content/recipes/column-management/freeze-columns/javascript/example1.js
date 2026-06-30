import Handsontable from 'handsontable/base';
import { registerAllModules } from 'handsontable/registry';

registerAllModules();

/* start:skip-in-preview */
const data = [
  { campaign: 'Spring Sale', channel: 'Email', impressions: 120000, clicks: 4800, conversions: 320, cpc: 0.42, revenue: 9600, roi: 2.28 },
  { campaign: 'Summer Push', channel: 'Paid Search', impressions: 85000, clicks: 3100, conversions: 210, cpc: 1.15, revenue: 6300, roi: 1.82 },
  { campaign: 'Back to School', channel: 'Social', impressions: 200000, clicks: 7200, conversions: 540, cpc: 0.31, revenue: 16200, roi: 3.10 },
  { campaign: 'Black Friday', channel: 'Display', impressions: 450000, clicks: 9000, conversions: 720, cpc: 0.65, revenue: 28800, roi: 2.94 },
  { campaign: 'Holiday Deals', channel: 'Email', impressions: 310000, clicks: 11200, conversions: 890, cpc: 0.28, revenue: 35600, roi: 4.12 },
  { campaign: 'New Year Offer', channel: 'Paid Search', impressions: 95000, clicks: 3800, conversions: 290, cpc: 1.22, revenue: 8700, roi: 1.65 },
  { campaign: 'Valentine Push', channel: 'Social', impressions: 140000, clicks: 5600, conversions: 410, cpc: 0.38, revenue: 12300, roi: 2.56 },
  { campaign: 'Spring Relaunch', channel: 'Display', impressions: 175000, clicks: 6300, conversions: 480, cpc: 0.55, revenue: 14400, roi: 2.18 },
];
/* end:skip-in-preview */

// Number of columns currently frozen. Starts at 0 (no frozen columns).
let frozenCount = 0;

const colHeaders = ['Campaign', 'Channel', 'Impressions', 'Clicks', 'Conversions', 'CPC ($)', 'Revenue ($)', 'ROI'];

const container = document.querySelector('#example1');

const toolbar = document.createElement('div');

toolbar.classList.add('example-controls-container');

const freezeRow = document.createElement('div');

freezeRow.className = 'controls';

const unfreezeRow = document.createElement('div');

unfreezeRow.className = 'controls';

const statusEl = document.createElement('span');

statusEl.className = 'freeze-status';

toolbar.appendChild(freezeRow);
toolbar.appendChild(unfreezeRow);
container.before(toolbar);

const hot = new Handsontable(container, {
  data,
  colHeaders,
  columns: [
    { data: 'campaign', type: 'text' },
    { data: 'channel', type: 'text' },
    { data: 'impressions', type: 'numeric', numericFormat: { useGrouping: true, maximumFractionDigits: 0 } },
    { data: 'clicks', type: 'numeric', numericFormat: { useGrouping: true, maximumFractionDigits: 0 } },
    { data: 'conversions', type: 'numeric', numericFormat: { useGrouping: true, maximumFractionDigits: 0 } },
    { data: 'cpc', type: 'numeric', numericFormat: { minimumFractionDigits: 2, maximumFractionDigits: 2 } },
    { data: 'revenue', type: 'numeric', numericFormat: { style: 'currency', currency: 'USD', maximumFractionDigits: 0 } },
    { data: 'roi', type: 'numeric', numericFormat: { minimumFractionDigits: 2, maximumFractionDigits: 2 } },
  ],
  fixedColumnsStart: 0,
  manualColumnMove: true,
  rowHeaders: true,
  height: 'auto',
  width: '100%',
  autoWrapRow: true,
  licenseKey: 'non-commercial-and-evaluation',
});

// Updates the status indicator to reflect the current frozen column count.
function updateStatus() {
  statusEl.textContent = frozenCount === 0
    ? 'No columns frozen'
    : `${frozenCount} column${frozenCount > 1 ? 's' : ''} frozen`;
}

// Applies the freeze boundary and refreshes the status indicator.
function freezeUpTo(n) {
  const total = hot.countCols();

  // Guard: clamp to the number of columns actually present in the grid.
  frozenCount = Math.min(n, total);
  hot.updateSettings({ fixedColumnsStart: frozenCount });
  updateStatus();
}

// Generates one "Freeze up to column N" button for each column.
colHeaders.forEach((header, index) => {
  const btn = document.createElement('button');

  btn.type = 'button';
  btn.textContent = `Freeze up to "${header}"`;

  btn.addEventListener('click', () => {
    freezeUpTo(index + 1);
  });

  freezeRow.appendChild(btn);
});

// "Unfreeze all" resets fixedColumnsStart to 0.
const unfreezeBtn = document.createElement('button');

unfreezeBtn.type = 'button';
unfreezeBtn.textContent = 'Unfreeze all';

unfreezeBtn.addEventListener('click', () => {
  frozenCount = 0;
  hot.updateSettings({ fixedColumnsStart: 0 });
  updateStatus();
});

unfreezeRow.appendChild(unfreezeBtn);
unfreezeRow.appendChild(statusEl);

updateStatus();
