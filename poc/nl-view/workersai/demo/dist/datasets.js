/**
 * Placeholder rows for the demo. Real eval sets arrive later through loadData.
 * Column order is the order these keys are created.
 */

const ORDER_COLUMNS = [
  'order_id', 'customer', 'country', 'region', 'product', 'category',
  'quantity', 'unit_price', 'total', 'status', 'order_date', 'ship_date',
  'priority', 'rep',
];

const TICKET_COLUMNS = [
  'id', 'title', 'assignee', 'status', 'priority', 'type', 'created_at',
  'due_date', 'story_points', 'component', 'reporter', 'tags',
];

const ORDER_STATUS = ['pending', 'paid', 'shipped', 'cancelled', 'refunded'];
const REGIONS = ['EMEA', 'AMER', 'APAC'];
const ORDER_PRIORITY = ['low', 'normal', 'high'];
const COUNTRIES = {
  EMEA: ['Germany', 'France', 'Poland', 'Spain'],
  AMER: ['United States', 'Canada', 'Brazil', 'Mexico'],
  APAC: ['Japan', 'Australia', 'Singapore', 'India'],
};
const PRODUCTS = [
  ['Widget', 'hardware'],
  ['Gasket', 'hardware'],
  ['License', 'software'],
  ['Support', 'service'],
  ['Sensor', 'hardware'],
  ['Seat', 'service'],
];
const REPS = ['Ada', 'Bao', 'Chen', 'Dara', 'Eli'];
const CUSTOMERS = ['Northwind', 'Initech', 'Hooli', 'Acme', 'Globex', 'Umbrella', 'Stark', 'Wayne'];

const TICKET_STATUS = ['open', 'in_progress', 'review', 'done', 'wontfix'];
const TICKET_PRIORITY = ['P0', 'P1', 'P2', 'P3'];
const TICKET_TYPE = ['bug', 'feature', 'chore'];
const ASSIGNEES = ['Ada', 'Bao', null, 'Chen', 'Dara'];
const COMPONENTS = ['grid', 'filters', 'editor', 'export'];
const REPORTERS = ['sam', 'rita', 'jon', 'mia'];
const TAGS = ['regression', 'ui, a11y', 'api', 'docs', 'perf, grid', 'customer'];
const POINTS = [1, 2, 3, 5, 8];

/**
 * @param {string[]} columns
 * @param {unknown[]} values
 * @returns {object}
 */
function record(columns, values) {
  const row = {};

  columns.forEach((column, index) => {
    row[column] = values[index];
  });

  return row;
}

/**
 * @param {string} iso
 * @param {number} days
 * @returns {string}
 */
function addDays(iso, days) {
  const [year, month, day] = iso.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day + days));

  return date.toISOString().slice(0, 10);
}

function orders() {
  const rows = [];

  for (let i = 0; i < 40; i++) {
    const region = REGIONS[i % REGIONS.length];
    const status = ORDER_STATUS[i % ORDER_STATUS.length];
    const quantity = (i % 9) + 1;
    const unitPrice = Math.round((8 + (i % 7) * 3.5) * 100) / 100;
    const orderDate = addDays('2026-10-20', -((i * 3) % 50));
    const shipDate = status === 'pending' || status === 'cancelled'
      ? null
      : addDays(orderDate, 2 + (i % 4));
    const product = PRODUCTS[i % PRODUCTS.length];

    rows.push(record(ORDER_COLUMNS, [
      `ORD-${1000 + i}`,
      CUSTOMERS[i % CUSTOMERS.length],
      COUNTRIES[region][i % 4],
      region,
      product[0],
      product[1],
      quantity,
      unitPrice,
      Math.round(quantity * unitPrice * 100) / 100,
      status,
      orderDate,
      shipDate,
      ORDER_PRIORITY[i % ORDER_PRIORITY.length],
      REPS[i % REPS.length],
    ]));
  }

  return rows;
}

function tickets() {
  const rows = [];

  for (let i = 0; i < 40; i++) {
    const status = TICKET_STATUS[i % TICKET_STATUS.length];
    const created = addDays('2026-10-20', -((i * 2) % 40));
    const due = status === 'done' || status === 'wontfix' ? null : addDays(created, 7 + (i % 10));

    rows.push(record(TICKET_COLUMNS, [
      `T-${200 + i}`,
      `Ticket ${i + 1}: ${TICKET_TYPE[i % TICKET_TYPE.length]} in ${COMPONENTS[i % COMPONENTS.length]}`,
      ASSIGNEES[i % ASSIGNEES.length],
      status,
      TICKET_PRIORITY[i % TICKET_PRIORITY.length],
      TICKET_TYPE[i % TICKET_TYPE.length],
      created,
      due,
      POINTS[i % POINTS.length],
      COMPONENTS[i % COMPONENTS.length],
      REPORTERS[i % REPORTERS.length],
      TAGS[i % TAGS.length],
    ]));
  }

  return rows;
}

export const DATASETS = {
  orders: orders(),
  tickets: tickets(),
};

export const DATASET_NAMES = ['orders', 'tickets'];
