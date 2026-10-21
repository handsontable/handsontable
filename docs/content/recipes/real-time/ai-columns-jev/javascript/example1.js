import Handsontable from 'handsontable/base';
import { registerAllModules } from 'handsontable/registry';
import { textRenderer } from 'handsontable/renderers';

registerAllModules();

// The columns to add. `type` is the Jev question type: noul (yes or no),
// score (one of ordered levels), choice (one option from a list).
const AI_COLUMNS = [
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
const reviews = [
  {
    id: 1,
    product: 'Wireless earbuds',
    review:
      "Crisp sound, the case charges fast, and they pair instantly with my laptop. Easily the best pair I've owned under $100.",
  },
  {
    id: 2,
    product: 'Wireless earbuds',
    review:
      "Left bud died after nine days. Support sent a replacement without fuss, but I shouldn't have needed one this soon.",
  },
  {
    id: 3,
    product: 'Standing desk',
    review:
      "Motor is whisper quiet and the frame doesn't wobble at full height. Assembly took 40 minutes with clear instructions.",
  },
  {
    id: 4,
    product: 'Standing desk',
    review: 'Great desk but shipping took 3 weeks and support never replied to my two emails asking where it was.',
  },
  {
    id: 5,
    product: 'Coffee grinder',
    review: "Grind is consistent from espresso to French press. It's loud, but every burr grinder is.",
  },
  {
    id: 6,
    product: 'Coffee grinder',
    review: 'Stopped working after two months. The hopper lid also cracked. Expected more for $180.',
  },
  {
    id: 7,
    product: 'Running shoes',
    review:
      'Light, breathable, and the fit is true to size. Ran a half marathon in them the second week with no blisters.',
  },
  {
    id: 8,
    product: 'Running shoes',
    review:
      'Comfortable shoe, but the sole started separating at the toe after 60 miles. Returned it, refund took 3 weeks.',
  },
  {
    id: 14,
    product: 'Mechanical keyboard',
    review: "Two keys arrived dead. Support fixed it fast with a replacement, so I'm happy now, but the QA worries me.",
  },
  {
    id: 24,
    product: 'Electric kettle',
    review: 'The kettle is good. The box arrived crushed and the lid was dented. Kept it anyway because it works.',
  },
];

// Jev's answers for the rows above, recorded from the API on 2026-10-08.
// Keyed "<column key>:<review id>". Score probabilities are per level index.
const RECORDED = {
  'sentiment:1': { type: 'score', score: 4.0, confidence: 1.0, probabilities: { 0: 0, 1: 0, 2: 0, 3: 0, 4: 1 } },
  'sentiment:2': {
    type: 'score',
    score: 1.66,
    confidence: 0.72,
    probabilities: { 0: 0, 1: 0.33, 2: 0.67, 3: 0, 4: 0 },
  },
  'sentiment:3': {
    type: 'score',
    score: 3.95,
    confidence: 0.96,
    probabilities: { 0: 0, 1: 0, 2: 0, 3: 0.04, 4: 0.96 },
  },
  'sentiment:4': {
    type: 'score',
    score: 1.95,
    confidence: 0.96,
    probabilities: { 0: 0, 1: 0.05, 2: 0.95, 3: 0, 4: 0 },
  },
  'sentiment:5': {
    type: 'score',
    score: 3.05,
    confidence: 0.95,
    probabilities: { 0: 0, 1: 0, 2: 0.01, 3: 0.93, 4: 0.06 },
  },
  'sentiment:6': { type: 'score', score: 0.2, confidence: 0.83, probabilities: { 0: 0.8, 1: 0.2, 2: 0, 3: 0, 4: 0 } },
  'sentiment:7': {
    type: 'score',
    score: 3.98,
    confidence: 0.98,
    probabilities: { 0: 0, 1: 0, 2: 0, 3: 0.02, 4: 0.98 },
  },
  'sentiment:8': {
    type: 'score',
    score: 1.21,
    confidence: 0.81,
    probabilities: { 0: 0.01, 1: 0.77, 2: 0.22, 3: 0, 4: 0 },
  },
  'sentiment:14': {
    type: 'score',
    score: 2.04,
    confidence: 0.97,
    probabilities: { 0: 0, 1: 0, 2: 0.96, 3: 0.04, 4: 0 },
  },
  'sentiment:24': {
    type: 'score',
    score: 2.06,
    confidence: 0.94,
    probabilities: { 0: 0, 1: 0.01, 2: 0.92, 3: 0.07, 4: 0 },
  },
  'category:1': { type: 'choice', choice: 'quality', confidence: 0.52 },
  'category:2': { type: 'choice', choice: 'quality', confidence: 1.0 },
  'category:3': { type: 'choice', choice: 'quality', confidence: 0.79 },
  'category:4': { type: 'choice', choice: 'shipping', confidence: 0.86 },
  'category:5': { type: 'choice', choice: 'usability', confidence: 0.62 },
  'category:6': { type: 'choice', choice: 'quality', confidence: 1.0 },
  'category:7': { type: 'choice', choice: 'usability', confidence: 0.46 },
  'category:8': { type: 'choice', choice: 'quality', confidence: 1.0 },
  'category:14': { type: 'choice', choice: 'quality', confidence: 1.0 },
  'category:24': { type: 'choice', choice: 'shipping', confidence: 0.99 },
  'needsReply:1': { type: 'noul', noul: 0.12 },
  'needsReply:2': { type: 'noul', noul: 0.7 },
  'needsReply:3': { type: 'noul', noul: 0.12 },
  'needsReply:4': { type: 'noul', noul: 0.9 },
  'needsReply:5': { type: 'noul', noul: 0.12 },
  'needsReply:6': { type: 'noul', noul: 0.88 },
  'needsReply:7': { type: 'noul', noul: 0.12 },
  'needsReply:8': { type: 'noul', noul: 0.79 },
  'needsReply:14': { type: 'noul', noul: 0.65 },
  'needsReply:24': { type: 'noul', noul: 0.69 },
};
/* end:skip-in-preview */

// Stand-in for the model: a recorded answer after a short delay, so the page
// needs no backend. For the real model, send `{ type, prompt, options, row }`
// to a proxy that holds your key (see Step 5 on the page).
function classify(row, column) {
  const answer = RECORDED[`${column.key}:${row.id}`];

  return new Promise((resolve, reject) => {
    setTimeout(
      () => {
        if (answer) {
          resolve(answer);
        } else {
          reject(new Error('No answer'));
        }
      },
      150 + Math.random() * 250,
    );
  });
}

// Which of Jev's fields go into the cells. A Noul is a single probability and
// has no confidence field, so a Noul column gets no confidence column.
function toCells(column, answer) {
  switch (answer.type) {
    case 'noul':
      return { value: answer.noul };
    case 'score': {
      // The level with the highest probability; `probabilities` is keyed by level index.
      const [best] = Object.entries(answer.probabilities).sort(([, a], [, b]) => b - a)[0];

      return { value: column.options?.[Number(best)] ?? String(answer.score), confidence: answer.confidence };
    }
    case 'choice':
      return { value: answer.choice, confidence: answer.confidence };
    default:
      return { value: '' };
  }
}

// Per-cell state, keyed "<column key>:<review id>" so it survives sorting.
const pending = new Set();
const failed = new Map();

function cellKey(instance, visualRow, column) {
  const row = instance.getSourceDataAtRow(instance.toPhysicalRow(visualRow));

  return `${column.key}:${row.id}`;
}

const valueRenderer = (column) => (instance, td, row, col, prop, value, cellProperties) => {
  const text = typeof value === 'number' ? value.toFixed(2) : (value ?? '');

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

const confidenceRenderer = (column) => (instance, td, row, col, prop, value, cellProperties) => {
  const text = typeof value === 'number' ? `${Math.round(value * 100)}%` : '';

  textRenderer(instance, td, row, col, prop, text, cellProperties);

  const key = cellKey(instance, row, column);

  td.classList.toggle('ai-pending', pending.has(key));
  td.classList.toggle('ai-low', typeof value === 'number' && value < 0.6);
  td.classList.toggle('ai-high', typeof value === 'number' && value > 0.85);
};

const rootContainer = document.querySelector('#example1');

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

const button = rootContainer.querySelector('.ai-classify');
const status = rootContainer.querySelector('.ai-status');

const columns = [
  { data: 'id', readOnly: true, width: 50, className: 'htRight' },
  { data: 'product', readOnly: true, width: 140 },
  { data: 'review', readOnly: true, width: 380 },
];
const headers = ['ID', 'Product', 'Review'];

const hot = new Handsontable(rootContainer.querySelector('.ai-columns-grid'), {
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
async function runPool(items, limit, worker) {
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

  // 1. Add a value column per definition, a confidence column where Jev
  //    returns one, and mark every new cell as pending.
  AI_COLUMNS.forEach((column) => {
    columns.push({
      data: column.key,
      readOnly: true,
      renderer: valueRenderer(column),
      width: 130,
      className: column.type === 'noul' ? 'htRight' : '',
    });
    headers.push(column.name);

    if (column.type !== 'noul') {
      columns.push({
        data: `${column.key}Confidence`,
        readOnly: true,
        renderer: confidenceRenderer(column),
        width: 125,
        className: 'htRight',
      });
      headers.push(`${column.name} conf.`);
    }

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
      const cells = toCells(column, await classify(row, column));

      hot.setSourceDataAtCell(physicalRow, column.key, cells.value);

      if (cells.confidence !== undefined) {
        hot.setSourceDataAtCell(physicalRow, `${column.key}Confidence`, cells.confidence);
      }
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
