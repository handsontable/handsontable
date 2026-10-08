import Handsontable from 'handsontable/base';
import { registerAllModules } from 'handsontable/registry';
import { textRenderer } from 'handsontable/renderers';
import type { BaseRenderer } from 'handsontable/renderers';
import type { ColumnSettings } from 'handsontable/settings';

registerAllModules();

type Row = {
  id: number;
  product: string;
  review: string;
  [aiColumn: string]: string | number | null;
};

type AiColumn = {
  key: string;
  name: string;
  type: 'noul' | 'score' | 'choice';
  prompt: string;
  options?: string[];
};

type Answer = { value: string | number; confidence: number };

// The columns to add. `type` is the Jev question type: noul (yes or no),
// score (one of ordered levels), choice (one option from a list).
const AI_COLUMNS: AiColumn[] = [
  {
    key: 'sentiment',
    name: 'Sentiment',
    type: 'score',
    prompt: 'How positive is this review overall?',
    options: ['Very negative', 'Negative', 'Mixed', 'Positive', 'Very positive'],
  },
  {
    key: 'category',
    name: 'Category',
    type: 'choice',
    prompt: 'Which category best fits the main issue in this review?',
    options: ['quality', 'shipping', 'price', 'support', 'usability'],
  },
  {
    key: 'needsReply',
    name: 'Needs reply',
    type: 'noul',
    prompt: 'Does this review warrant a reply from customer support?',
  },
];

/* start:skip-in-preview */
const reviews: Row[] = [
  { id: 1, product: 'Wireless earbuds', review: "Crisp sound, the case charges fast, and they pair instantly with my laptop. Easily the best pair I've owned under $100." },
  { id: 2, product: 'Wireless earbuds', review: "Left bud died after nine days. Support sent a replacement without fuss, but I shouldn't have needed one this soon." },
  { id: 3, product: 'Standing desk', review: "Motor is whisper quiet and the frame doesn't wobble at full height. Assembly took 40 minutes with clear instructions." },
  { id: 4, product: 'Standing desk', review: 'Great desk but shipping took 3 weeks and support never replied to my two emails asking where it was.' },
  { id: 5, product: 'Coffee grinder', review: "Grind is consistent from espresso to French press. It's loud, but every burr grinder is." },
  { id: 6, product: 'Coffee grinder', review: 'Stopped working after two months. The hopper lid also cracked. Expected more for $180.' },
  { id: 7, product: 'Running shoes', review: 'Light, breathable, and the fit is true to size. Ran a half marathon in them the second week with no blisters.' },
  { id: 8, product: 'Running shoes', review: 'Comfortable shoe, but the sole started separating at the toe after 60 miles. Returned it, refund took 3 weeks.' },
  { id: 14, product: 'Mechanical keyboard', review: "Two keys arrived dead. Support fixed it fast with a replacement, so I'm happy now, but the QA worries me." },
  { id: 24, product: 'Electric kettle', review: 'The kettle is good. The box arrived crushed and the lid was dented. Kept it anyway because it works.' },
];

// Real Jev answers for the rows above, recorded on 2026-10-08. Keyed "<column key>:<review id>".
const RECORDED: Record<string, Answer> = {
  'sentiment:1': { value: 'Very positive (1.00)', confidence: 1 },
  'sentiment:2': { value: 'Mixed (0.42)', confidence: 0.75 },
  'sentiment:3': { value: 'Very positive (0.99)', confidence: 0.97 },
  'sentiment:4': { value: 'Mixed (0.49)', confidence: 0.97 },
  'sentiment:5': { value: 'Positive (0.76)', confidence: 0.94 },
  'sentiment:6': { value: 'Very negative (0.04)', confidence: 0.88 },
  'sentiment:7': { value: 'Very positive (0.99)', confidence: 0.98 },
  'sentiment:8': { value: 'Negative (0.32)', confidence: 0.77 },
  'sentiment:14': { value: 'Mixed (0.51)', confidence: 0.97 },
  'sentiment:24': { value: 'Mixed (0.52)', confidence: 0.93 },
  'category:1': { value: 'quality', confidence: 0.52 },
  'category:2': { value: 'quality', confidence: 1 },
  'category:3': { value: 'quality', confidence: 0.79 },
  'category:4': { value: 'shipping', confidence: 0.86 },
  'category:5': { value: 'usability', confidence: 0.66 },
  'category:6': { value: 'quality', confidence: 1 },
  'category:7': { value: 'usability', confidence: 0.5 },
  'category:8': { value: 'quality', confidence: 1 },
  'category:14': { value: 'quality', confidence: 1 },
  'category:24': { value: 'shipping', confidence: 0.98 },
  'needsReply:1': { value: 0.12, confidence: 0.76 },
  'needsReply:2': { value: 0.7, confidence: 0.4 },
  'needsReply:3': { value: 0.12, confidence: 0.76 },
  'needsReply:4': { value: 0.9, confidence: 0.8 },
  'needsReply:5': { value: 0.12, confidence: 0.76 },
  'needsReply:6': { value: 0.89, confidence: 0.78 },
  'needsReply:7': { value: 0.13, confidence: 0.74 },
  'needsReply:8': { value: 0.78, confidence: 0.56 },
  'needsReply:14': { value: 0.64, confidence: 0.28 },
  'needsReply:24': { value: 0.7, confidence: 0.4 },
};
/* end:skip-in-preview */

// Stand-in for the model: a recorded answer after a short delay, so the page
// needs no backend. For the real model, send `{ type, prompt, options, row }`
// to a proxy that holds your key (see Step 5 on the page).
function classify(row: Row, column: AiColumn): Promise<Answer> {
  const answer = RECORDED[`${column.key}:${row.id}`];

  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (answer) {
        resolve(answer);
      } else {
        reject(new Error('No answer'));
      }
    }, 150 + Math.random() * 250);
  });
}

// Per-cell state, keyed "<column key>:<review id>" so it survives sorting.
const pending = new Set<string>();
const failed = new Map<string, string>();

function cellKey(instance: Handsontable, visualRow: number, column: AiColumn): string {
  const row = instance.getSourceDataAtRow(instance.toPhysicalRow(visualRow)) as Row;

  return `${column.key}:${row.id}`;
}

const valueRenderer = (column: AiColumn): BaseRenderer => (instance, td, row, col, prop, value, cellProperties) => {
  const text = typeof value === 'number' ? value.toFixed(2) : value ?? '';

  textRenderer(instance, td, row, col, prop, text, cellProperties);

  const key = cellKey(instance, row, column);

  td.classList.toggle('ai-pending', pending.has(key));
  td.classList.toggle('ai-error', failed.has(key));

  if (failed.has(key)) {
    td.textContent = 'err';
    td.title = failed.get(key) ?? '';
  } else {
    td.removeAttribute('title');
  }
};

const confidenceRenderer = (column: AiColumn): BaseRenderer => (instance, td, row, col, prop, value, cellProperties) => {
  const text = typeof value === 'number' ? `${Math.round(value * 100)}%` : '';

  textRenderer(instance, td, row, col, prop, text, cellProperties);

  const key = cellKey(instance, row, column);

  td.classList.toggle('ai-pending', pending.has(key));
  td.classList.toggle('ai-low', typeof value === 'number' && value < 0.6);
  td.classList.toggle('ai-high', typeof value === 'number' && value > 0.85);
};

const rootContainer = document.querySelector<HTMLElement>('#example1')!;

// Inject the controls row and the grid mount point inside #example1.
rootContainer.innerHTML = `
  <div class="example-controls-container">
    <div class="controls">
      <button class="ai-classify" type="button">Classify reviews</button>
      <span class="ai-status"></span>
    </div>
  </div>
  <div class="ai-columns-grid"></div>
`;

const button = rootContainer.querySelector<HTMLButtonElement>('.ai-classify')!;
const status = rootContainer.querySelector<HTMLElement>('.ai-status')!;

const columns: ColumnSettings[] = [
  { data: 'id', readOnly: true, width: 50, className: 'htRight' },
  { data: 'product', readOnly: true, width: 140 },
  { data: 'review', readOnly: true, width: 380 },
];
const headers = ['ID', 'Product', 'Review'];

const hot = new Handsontable(rootContainer.querySelector<HTMLElement>('.ai-columns-grid')!, {
  data: reviews,
  columns,
  colHeaders: headers,
  columnSorting: true,
  height: 'auto',
  width: '100%',
  autoWrapRow: true,
  licenseKey: 'non-commercial-and-evaluation',
});

// Runs `worker` over `items` with at most `limit` in flight.
async function runPool<T>(items: T[], limit: number, worker: (item: T) => Promise<void>): Promise<void> {
  let next = 0;

  const lanes = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (next < items.length) {
      const item = items[next];

      next += 1;
      await worker(item);
    }
  });

  await Promise.all(lanes);
}

button.addEventListener('click', async () => {
  button.disabled = true;

  // 1. Add an empty value column and confidence column per definition,
  //    and mark every new cell as pending.
  AI_COLUMNS.forEach((column) => {
    columns.push({ data: column.key, readOnly: true, renderer: valueRenderer(column), width: 150 });
    columns.push({
      data: `${column.key}Confidence`,
      readOnly: true,
      renderer: confidenceRenderer(column),
      width: 100,
      className: 'htRight',
    });
    headers.push(column.name, `${column.name} conf.`);
    reviews.forEach((row) => pending.add(`${column.key}:${row.id}`));
  });
  hot.updateSettings({ columns: [...columns], colHeaders: [...headers] });

  // 2. One request per cell, a few at a time. Results are written by physical
  //    row, so a sort applied mid-fill cannot misplace them.
  const jobs = AI_COLUMNS.flatMap((column) => reviews.map((row) => ({ column, row })));
  let done = 0;

  await runPool(jobs, 4, async ({ column, row }) => {
    const key = `${column.key}:${row.id}`;
    const physicalRow = reviews.indexOf(row);

    try {
      const answer = await classify(row, column);

      hot.setSourceDataAtCell(physicalRow, column.key, answer.value);
      hot.setSourceDataAtCell(physicalRow, `${column.key}Confidence`, answer.confidence);
    } catch (error) {
      failed.set(key, error instanceof Error ? error.message : 'Request failed');
    } finally {
      pending.delete(key);
      done += 1;
      status.textContent = `${done} of ${jobs.length} answers`;
      hot.render();
    }
  });

  status.textContent = `Classified ${reviews.length} reviews.`;
});
