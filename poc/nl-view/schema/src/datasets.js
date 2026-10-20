import { addDays, formatIso } from './dates.js';

export const DATASETS = {
  orders: [
    'order_id', 'customer', 'country', 'region', 'product', 'category',
    'quantity', 'unit_price', 'total', 'status', 'order_date', 'ship_date',
    'priority', 'rep',
  ],
  tickets: [
    'id', 'title', 'assignee', 'status', 'priority', 'type', 'created_at',
    'due_date', 'story_points', 'component', 'reporter', 'tags',
  ],
};

const COUNTRIES = [
  ['Germany', 'EMEA'],
  ['France', 'EMEA'],
  ['United Kingdom', 'EMEA'],
  ['Poland', 'EMEA'],
  ['Spain', 'EMEA'],
  ['United States', 'AMER'],
  ['Canada', 'AMER'],
  ['Brazil', 'AMER'],
  ['Japan', 'APAC'],
  ['Australia', 'APAC'],
  ['Singapore', 'APAC'],
];
const CUSTOMERS = ['Acme', 'Globex', 'Initech', 'Umbrella', 'Hooli', 'Stark', 'Wayne', 'Wonka'];
const PRODUCTS = [
  ['Widget', 'Hardware'],
  ['Gadget', 'Hardware'],
  ['License', 'Software'],
  ['Seat', 'Software'],
  ['Support', 'Services'],
  ['Training', 'Services'],
];
const STATUSES = ['pending', 'paid', 'shipped', 'cancelled', 'refunded'];
const PRIORITIES = ['low', 'normal', 'high'];
const REPS = ['Ada', 'Ben', 'Chen', 'Dana', 'Eli'];

function orderDate(index) {
  if (index < 8) {
    return formatIso(2026, 10, 13 + index);
  }

  if (index < 20) {
    return formatIso(2026, 10, (index % 12) + 1);
  }

  return formatIso(2026, 9, (index % 27) + 1);
}

export function ordersRows() {
  const rows = [];

  for (let index = 0; index < 36; index += 1) {
    const [country, region] = COUNTRIES[index % COUNTRIES.length];
    const [product, category] = PRODUCTS[index % PRODUCTS.length];
    const quantity = (index % 12) + 1;
    const unitPrice = [12.5, 19, 40, 7.25, 99, 15][index % 6];
    const status = STATUSES[index % STATUSES.length];
    const orderDateValue = orderDate(index);
    const shipDate = status === 'pending' || status === 'cancelled'
      ? null
      : addDays(orderDateValue, 2);

    rows.push({
      order_id: `ORD-${1001 + index}`,
      customer: CUSTOMERS[index % CUSTOMERS.length],
      country,
      region,
      product,
      category,
      quantity,
      unit_price: unitPrice,
      total: Math.round(quantity * unitPrice * 100) / 100,
      status,
      order_date: orderDateValue,
      ship_date: shipDate,
      priority: PRIORITIES[index % PRIORITIES.length],
      rep: REPS[index % REPS.length],
    });
  }

  rows[1].status = 'paid';
  rows[1].country = 'Germany';
  rows[1].region = 'EMEA';
  rows[1].priority = 'high';
  rows[1].order_date = '2026-10-18';
  rows[1].ship_date = '2026-10-20';
  rows[6].status = 'paid';
  rows[6].country = 'France';
  rows[6].region = 'EMEA';
  rows[6].priority = 'high';
  rows[6].order_date = '2026-10-16';
  rows[6].ship_date = '2026-10-19';
  rows[12].status = 'paid';
  rows[12].country = 'Poland';
  rows[12].region = 'EMEA';
  rows[12].order_date = '2026-10-02';
  rows[12].ship_date = '2026-10-04';

  return rows;
}

const TICKET_STATUSES = ['open', 'in_progress', 'review', 'done', 'wontfix'];
const TICKET_PRIORITIES = ['P0', 'P1', 'P2', 'P3'];
const TICKET_TYPES = ['bug', 'feature', 'chore'];
const COMPONENTS = ['grid', 'filters', 'editor', 'docs', 'build'];
const REPORTERS = ['Maya', 'Omar', 'Priya', 'Luis'];
const ASSIGNEES = ['Ada', 'Ben', 'Chen', 'Dana', 'Eli'];

export function ticketsRows() {
  const rows = [];

  for (let index = 0; index < 32; index += 1) {
    const created = index < 12
      ? formatIso(2026, 10, 9 + (index % 12))
      : formatIso(2026, 9, (index % 27) + 1);
    const type = TICKET_TYPES[index % TICKET_TYPES.length];
    const component = COMPONENTS[index % COMPONENTS.length];

    rows.push({
      id: `T-${200 + index}`,
      title: `Issue ${index + 1}: ${type} in ${component}`,
      assignee: index % 6 === 5 ? null : ASSIGNEES[index % ASSIGNEES.length],
      status: TICKET_STATUSES[index % TICKET_STATUSES.length],
      priority: TICKET_PRIORITIES[index % TICKET_PRIORITIES.length],
      type,
      created_at: created,
      due_date: index % 4 === 0 ? null : addDays(created, 7),
      story_points: [1, 2, 3, 5, 8][index % 5],
      component,
      reporter: REPORTERS[index % REPORTERS.length],
      tags: `${type},${component}`,
    });
  }

  rows[0].status = 'open';
  rows[0].priority = 'P0';
  rows[0].type = 'bug';
  rows[0].assignee = 'Ada';
  rows[0].created_at = '2026-10-12';
  rows[1].status = 'open';
  rows[1].priority = 'P0';
  rows[1].type = 'bug';
  rows[1].assignee = null;
  rows[1].created_at = '2026-10-18';
  rows[2].status = 'open';
  rows[2].priority = 'P1';
  rows[2].type = 'bug';
  rows[2].created_at = '2026-10-05';
  rows[3].status = 'in_progress';
  rows[3].priority = 'P0';
  rows[3].type = 'bug';
  rows[4].assignee = null;
  rows[4].status = 'open';
  rows[4].priority = 'P2';

  return rows;
}

const PLACEHOLDERS = {
  orders: ordersRows,
  tickets: ticketsRows,
};

export function placeholderRows(name) {
  const factory = PLACEHOLDERS[name];

  if (!factory) {
    throw new Error(`unknown dataset ${name}`);
  }

  return factory();
}

/**
 * Accepts object rows, or arrays zipped onto the known column list.
 */
export function normalizeRows(name, rows) {
  const known = DATASETS[name];

  if (!Array.isArray(rows)) {
    throw new Error('rows must be an array');
  }

  if (rows.length === 0) {
    return { props: known ? known.slice() : [], rows: [] };
  }

  if (Array.isArray(rows[0])) {
    const props = known ? known.slice() : rows[0].map((_, index) => `col_${index}`);

    return {
      props,
      rows: rows.map(row => Object.fromEntries(props.map((prop, index) => [prop, row[index] ?? null]))),
    };
  }

  const props = known ? known.slice() : Object.keys(rows[0]);

  return { props, rows };
}
