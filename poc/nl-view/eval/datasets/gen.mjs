/**
 * Seeded generator for the nl-view eval datasets.
 *
 * `node datasets/gen.mjs` writes orders.json and tickets.json.
 * `node datasets/gen.mjs --check` exits 1 when the files on disk differ.
 *
 * The seed is fixed. Forced index ranges exist so the hand-checked prompts
 * hit a non-empty proper subset, and so the accepted readings of "last month",
 * "recent", and "overdue" do not collapse onto the same rows.
 */

import { writeFileSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const SEED = 20261020;
const ORDER_COUNT = 300;
const TICKET_COUNT = 250;
const HERE = dirname(fileURLToPath(import.meta.url));

const COUNTRIES = [
  ['Germany', 'EMEA'],
  ['France', 'EMEA'],
  ['Poland', 'EMEA'],
  ['United Kingdom', 'EMEA'],
  ['Netherlands', 'EMEA'],
  ['United States', 'AMER'],
  ['Canada', 'AMER'],
  ['Brazil', 'AMER'],
  ['Japan', 'APAC'],
  ['Australia', 'APAC'],
  ['Singapore', 'APAC'],
  ['India', 'APAC'],
];

const CATEGORIES = {
  Electronics: ['Laptop 14', 'Wireless Mouse', 'USB-C Hub', 'Monitor 27'],
  Furniture: ['Desk Chair', 'Standing Desk', 'Bookshelf', 'Filing Cabinet'],
  Office: ['Notebook Pack', 'Ballpoint Pens', 'Stapler', 'Whiteboard'],
  Apparel: ['Fleece Jacket', 'Work Gloves', 'Safety Vest', 'Cap'],
  Grocery: ['Coffee Beans', 'Sparkling Water', 'Granola Box', 'Tea Assortment'],
  Industrial: ['Hex Bolt Kit', 'Cable Tie Roll', 'Pallet Wrap', 'Work Lamp'],
};

const CUSTOMERS = [
  'Acme Supply', 'Blue Harbor Ltd', 'Cedar & Co', 'Delta Wholesale',
  'Eastwind Retail', 'Fjord Markets', 'Greenfield Buying', 'Harbor Point',
  'Iris Commerce', 'Juniper Goods', 'Kepler Stores', 'Lumen Outlet',
  'Maple Trade', 'Northwind Traders', 'Northern Lights Co', 'Oak Street Co',
  'Pioneer Retail', 'Quartz Buying', 'Red Kite Ltd', 'Summit Goods',
];

const REPS = [
  'Nina Vogel', 'Omar Farouk', 'Pia Nowak', 'Quinn Adler',
  'Rosa Mendes', 'Samir Shah', 'Tina Berg', 'Will Carter',
];

const ORDER_STATUSES = ['pending', 'paid', 'shipped', 'cancelled', 'refunded'];
const PRIORITIES = ['low', 'normal', 'normal', 'normal', 'high', 'high'];
const PRICES = [4.5, 9, 12.5, 19.99, 25, 40, 75, 120, 250, 499];

const ASSIGNEES = [
  'Anna Kowalska', 'Ben Ortiz', 'Chen Wei', 'Dana Idris',
  'Evan Brooks', 'Fatima Noor', 'Greg Hale', 'Hana Sato',
];
const TICKET_STATUSES = ['open', 'in_progress', 'review', 'done', 'wontfix'];
const TICKET_PRIORITIES = ['P0', 'P1', 'P2', 'P3'];
const TYPES = ['bug', 'feature', 'chore'];
const COMPONENTS = ['Core', 'Filters', 'Plugins', 'Wrappers', 'Docs', 'Build'];
const REPORTERS = [
  'Ivan Petrov', 'Jules Martin', 'Kai Okonkwo', 'Leah Berg',
  'Milo Costa', 'Noor Elamin', 'Owen Blake', 'Priya Shah',
];
const TAGS = ['regression', 'ui', 'api', 'perf', 'a11y', 'docs', 'i18n', 'mobile'];
const POINTS = [1, 2, 3, 5, 8, 13];
const TITLE_STEMS = [
  'Dropdown closes on scroll',
  'Copy skips hidden columns',
  'Paste loses the date',
  'Sort ignores empty cells',
  'Filter menu clips the edge',
  'Undo drops the last edit',
  'Column resize sticks',
  'IME commit inserts twice',
  'RTL header overlaps',
  'Context menu misses the row',
  'Validator runs twice',
  'Export writes the wrong sheet',
];

function mulberry32(seed) {
  let state = seed >>> 0;

  return function next() {
    state = (state + 0x6D2B79F5) >>> 0;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function pick(rng, list) {
  return list[Math.floor(rng() * list.length)];
}

function intBetween(rng, min, max) {
  return min + Math.floor(rng() * (max - min + 1));
}

function addDays(iso, days) {
  const [year, month, day] = iso.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCDate(date.getUTCDate() + days);
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function randomIso(rng) {
  // 2025-01-01 through 2026-10-31 inclusive is 669 days (2025 is not a leap year).
  return addDays('2025-01-01', Math.floor(rng() * 669));
}

function money(quantity, price) {
  if (quantity == null || price == null) {
    return null;
  }
  return Math.round(quantity * price * 100) / 100;
}

function makeOrders(rng) {
  const rows = [];

  for (let i = 0; i < ORDER_COUNT; i += 1) {
    const [country, region] = pick(rng, COUNTRIES);
    const category = pick(rng, Object.keys(CATEGORIES));
    const quantity = rng() < 0.04 ? null : intBetween(rng, 1, 30);
    const unitPrice = pick(rng, PRICES);
    const orderDate = randomIso(rng);
    const shipDate = rng() < 0.12 ? null : addDays(orderDate, intBetween(rng, 1, 14));

    rows.push({
      order_id: `ORD-${1001 + i}`,
      customer: rng() < 0.02 ? '' : pick(rng, CUSTOMERS),
      country,
      region,
      product: pick(rng, CATEGORIES[category]),
      category,
      quantity,
      unit_price: unitPrice,
      total: money(quantity, unitPrice),
      status: pick(rng, ORDER_STATUSES),
      order_date: orderDate,
      ship_date: shipDate,
      priority: pick(rng, PRIORITIES),
      rep: rng() < 0.015 ? null : pick(rng, REPS),
    });
  }

  const patch = (index, fields) => {
    const row = rows[index];
    Object.assign(row, fields);
    if (!Object.prototype.hasOwnProperty.call(fields, 'total')) {
      row.total = money(row.quantity, row.unit_price);
    }
  };

  const forceDate = (index, iso) => {
    patch(index, { order_date: iso, ship_date: addDays(iso, 3) });
  };

  for (let i = 0; i <= 7; i += 1) {
    forceDate(i, `2026-09-${String(1 + i).padStart(2, '0')}`);
  }
  for (let i = 8; i <= 15; i += 1) {
    forceDate(i, `2026-09-${String(20 + (i - 8)).padStart(2, '0')}`);
  }
  for (let i = 16; i <= 23; i += 1) {
    forceDate(i, `2026-10-${String(1 + (i - 16)).padStart(2, '0')}`);
  }
  for (let i = 24; i <= 31; i += 1) {
    forceDate(i, `2026-10-${String(14 + (i - 24)).padStart(2, '0')}`);
  }
  for (let i = 32; i <= 41; i += 1) {
    forceDate(i, `2026-10-${String(21 + (i - 32)).padStart(2, '0')}`);
  }
  // Extra late-September rows so the trailing-30 window stays distinct from October.
  for (let i = 42; i <= 49; i += 1) {
    forceDate(i, `2026-09-${String(22 + (i - 42)).padStart(2, '0')}`);
  }

  for (let i = 50; i <= 64; i += 1) {
    const country = i % 2 === 0 ? 'Germany' : 'France';
    patch(i, { country, region: 'EMEA', status: 'paid' });
  }
  for (let i = 65; i <= 79; i += 1) {
    const quantity = 7 + (i % 12);
    patch(i, { category: 'Electronics', product: 'Laptop 14', quantity });
  }
  for (let i = 80; i <= 94; i += 1) {
    patch(i, { quantity: 20 + (i - 80) });
  }
  for (let i = 95; i <= 114; i += 1) {
    patch(i, { quantity: 4, unit_price: 75 });
  }
  for (let i = 115; i <= 122; i += 1) {
    patch(i, { customer: i % 2 === 0 ? 'Northwind Traders' : 'Northern Lights Co' });
  }
  for (let i = 123; i <= 134; i += 1) {
    patch(i, { ship_date: null });
  }
  for (let i = 135; i <= 140; i += 1) {
    patch(i, { quantity: null, total: null });
  }
  for (let i = 141; i <= 144; i += 1) {
    patch(i, { customer: '' });
  }
  for (let i = 145; i <= 154; i += 1) {
    patch(i, { country: 'Germany', region: 'EMEA' });
  }
  for (let i = 155; i <= 166; i += 1) {
    patch(i, { priority: 'high' });
  }
  for (let i = 167; i <= 176; i += 1) {
    patch(i, { status: 'refunded' });
  }
  for (let i = 177; i <= 188; i += 1) {
    patch(i, { status: 'shipped' });
  }
  for (let i = 189; i <= 192; i += 1) {
    if (typeof rows[i].total === 'number') {
      rows[i].total = Math.round((rows[i].total + 3) * 100) / 100;
    }
  }

  return rows;
}

function makeTickets(rng) {
  const rows = [];

  for (let i = 0; i < TICKET_COUNT; i += 1) {
    const created = randomIso(rng);
    const tagCount = 1 + Math.floor(rng() * 3);
    const tags = [];
    for (let t = 0; t < tagCount; t += 1) {
      tags.push(pick(rng, TAGS));
    }
    const due = rng() < 0.18 ? null : addDays(created, intBetween(rng, -5, 40));

    rows.push({
      id: `HOT-${1001 + i}`,
      title: pick(rng, TITLE_STEMS),
      assignee: rng() < 0.08 ? null : pick(rng, ASSIGNEES),
      status: pick(rng, TICKET_STATUSES),
      priority: pick(rng, TICKET_PRIORITIES),
      type: pick(rng, TYPES),
      created_at: created,
      due_date: due,
      story_points: rng() < 0.08 ? null : pick(rng, POINTS),
      component: pick(rng, COMPONENTS),
      reporter: pick(rng, REPORTERS),
      tags: rng() < 0.04 ? '' : [...new Set(tags)].join(', '),
    });
  }

  const patch = (index, fields) => {
    Object.assign(rows[index], fields);
  };

  for (let i = 0; i <= 11; i += 1) {
    const status = ['open', 'in_progress', 'review'][i % 3];
    patch(i, {
      due_date: `2026-09-${String(2 + i).padStart(2, '0')}`,
      status,
      created_at: '2026-08-01',
    });
  }
  for (let i = 12; i <= 19; i += 1) {
    patch(i, {
      due_date: `2026-08-${String(10 + (i - 12)).padStart(2, '0')}`,
      status: i % 2 === 0 ? 'done' : 'wontfix',
      created_at: '2026-07-01',
    });
  }
  for (let i = 20; i <= 31; i += 1) {
    patch(i, {
      created_at: `2026-10-${String(1 + (i - 20)).padStart(2, '0')}`,
      due_date: i % 3 === 0 ? null : '2026-10-25',
    });
  }
  for (let i = 32; i <= 41; i += 1) {
    patch(i, { priority: 'P0' });
  }
  for (let i = 42; i <= 53; i += 1) {
    patch(i, { assignee: null });
  }
  for (let i = 54; i <= 63; i += 1) {
    patch(i, { type: 'bug', status: 'review' });
  }
  for (let i = 64; i <= 73; i += 1) {
    patch(i, {
      component: 'Core',
      type: 'bug',
      priority: i % 2 === 0 ? 'P1' : 'P2',
    });
  }
  for (let i = 74; i <= 83; i += 1) {
    patch(i, { assignee: 'Anna Kowalska' });
  }
  for (let i = 84; i <= 93; i += 1) {
    patch(i, { assignee: 'Ben Ortiz' });
  }
  for (let i = 94; i <= 101; i += 1) {
    patch(i, { title: 'Crash when sorting null dates' });
  }
  for (let i = 102; i <= 111; i += 1) {
    patch(i, { story_points: i % 2 === 0 ? 8 : 13 });
  }
  for (let i = 112; i <= 121; i += 1) {
    patch(i, { story_points: i % 2 === 0 ? 3 : 5 });
  }
  for (let i = 122; i <= 129; i += 1) {
    patch(i, { tags: 'regression, ui' });
  }
  for (let i = 130; i <= 137; i += 1) {
    patch(i, { status: 'done' });
  }
  for (let i = 138; i <= 145; i += 1) {
    patch(i, { status: 'wontfix' });
  }
  for (let i = 146; i <= 147; i += 1) {
    patch(i, { title: '' });
  }
  for (let i = 148; i <= 155; i += 1) {
    patch(i, { story_points: null });
  }

  return rows;
}

function count(rows, predicate) {
  return rows.filter(predicate).length;
}

function assertBucket(label, value, minimum) {
  if (value < minimum) {
    throw new Error(`${label} has ${value} rows, wanted at least ${minimum}`);
  }
}

function audit(orders, tickets) {
  const inRange = (iso, start, end) => iso >= start && iso <= end;
  const september = count(orders, (row) => inRange(row.order_date, '2026-09-01', '2026-09-30'));
  const rolling = count(orders, (row) => inRange(row.order_date, '2026-09-20', '2026-10-20'));
  const october = count(orders, (row) => inRange(row.order_date, '2026-10-01', '2026-10-31'));
  const last7 = count(orders, (row) => inRange(row.order_date, '2026-10-14', '2026-10-20'));
  const quarter = count(orders, (row) => inRange(row.order_date, '2026-10-01', '2026-12-31'));

  assertBucket('paid', count(orders, (row) => row.status === 'paid'), 8);
  assertBucket('Germany', count(orders, (row) => row.country === 'Germany'), 8);
  assertBucket('high', count(orders, (row) => row.priority === 'high'), 8);
  assertBucket('EMEA paid', count(orders, (row) => row.region === 'EMEA' && row.status === 'paid'), 8);
  assertBucket(
    'electronics qty window',
    count(orders, (row) => row.category === 'Electronics' && row.quantity > 5 && row.quantity < 20),
    8,
  );
  assertBucket(
    'shipped or refunded',
    count(orders, (row) => row.status === 'shipped' || row.status === 'refunded'),
    10,
  );
  assertBucket('AMER or APAC', count(orders, (row) => row.region === 'AMER' || row.region === 'APAC'), 20);
  assertBucket('total 100-500', count(orders, (row) => row.total >= 100 && row.total <= 500), 15);
  assertBucket('qty >= 20', count(orders, (row) => row.quantity >= 20), 10);
  assertBucket('North*', count(orders, (row) => String(row.customer).startsWith('North')), 5);
  assertBucket('ship date present', count(orders, (row) => row.ship_date != null && row.ship_date !== ''), 20);
  assertBucket('ship date empty', count(orders, (row) => row.ship_date == null || row.ship_date === ''), 5);
  assertBucket('blank customer', count(orders, (row) => row.customer === ''), 2);
  assertBucket('null quantity', count(orders, (row) => row.quantity == null), 2);
  assertBucket('September', september, 5);
  assertBucket('rolling 30', rolling, 5);
  assertBucket('October', october, 5);
  assertBucket('last 7', last7, 5);

  if (new Set([september, rolling, october, last7]).size !== 4) {
    throw new Error(
      `date windows collided: september=${september} rolling=${rolling} october=${october} last7=${last7}`,
    );
  }
  if (quarter !== october) {
    throw new Error(`quarter ${quarter} differs from October ${october}; the documented collision broke`);
  }
  if (september === ORDER_COUNT || rolling === ORDER_COUNT || october === ORDER_COUNT) {
    throw new Error('a date window matches every order');
  }

  const openStatuses = new Set(['open', 'in_progress', 'review']);
  const overdueStrict = count(tickets, (row) => row.due_date != null && row.due_date < '2026-10-20' && openStatuses.has(row.status));
  const overdueWide = count(tickets, (row) => row.due_date != null && row.due_date < '2026-10-20');

  assertBucket('open', count(tickets, (row) => row.status === 'open'), 10);
  assertBucket('P0', count(tickets, (row) => row.priority === 'P0'), 8);
  assertBucket('unassigned', count(tickets, (row) => row.assignee == null || row.assignee === ''), 8);
  assertBucket('bug in review', count(tickets, (row) => row.type === 'bug' && row.status === 'review'), 5);
  assertBucket(
    'core P1/P2 bugs',
    count(tickets, (row) => row.component === 'Core' && row.type === 'bug' && (row.priority === 'P1' || row.priority === 'P2')),
    5,
  );
  assertBucket('done or wontfix', count(tickets, (row) => row.status === 'done' || row.status === 'wontfix'), 10);
  assertBucket(
    'Anna or Ben',
    count(tickets, (row) => row.assignee === 'Anna Kowalska' || row.assignee === 'Ben Ortiz'),
    8,
  );
  assertBucket(
    'points 3-8',
    count(tickets, (row) => row.story_points >= 3 && row.story_points <= 8),
    10,
  );
  assertBucket('points > 5', count(tickets, (row) => row.story_points > 5), 8);
  assertBucket('overdue strict', overdueStrict, 8);
  assertBucket('created in October', count(tickets, (row) => inRange(row.created_at, '2026-10-01', '2026-10-31')), 8);
  assertBucket('Crash*', count(tickets, (row) => String(row.title).startsWith('Crash')), 5);
  assertBucket('regression tag', count(tickets, (row) => String(row.tags).includes('regression')), 8);
  assertBucket('blank title', count(tickets, (row) => row.title === ''), 2);
  assertBucket('null points', count(tickets, (row) => row.story_points == null), 2);

  if (overdueWide <= overdueStrict) {
    throw new Error(`overdue wide ${overdueWide} is not a strict superset of strict ${overdueStrict}`);
  }
  if (overdueWide === TICKET_COUNT || overdueStrict === TICKET_COUNT) {
    throw new Error('overdue matches every ticket');
  }

  const summary = {
    orders: ORDER_COUNT,
    tickets: TICKET_COUNT,
    september,
    rolling,
    october,
    last7,
    quarter,
    overdueStrict,
    overdueWide,
  };
  return summary;
}

function serialize(rows) {
  return `${JSON.stringify(rows, null, 2)}\n`;
}

function build() {
  const orders = makeOrders(mulberry32(SEED));
  const tickets = makeTickets(mulberry32(SEED + 1));
  const summary = audit(orders, tickets);
  return { orders, tickets, summary };
}

const { orders, tickets, summary } = build();
const ordersPath = join(HERE, 'orders.json');
const ticketsPath = join(HERE, 'tickets.json');
const ordersText = serialize(orders);
const ticketsText = serialize(tickets);

if (process.argv.includes('--check')) {
  const ordersDisk = readFileSync(ordersPath, 'utf8');
  const ticketsDisk = readFileSync(ticketsPath, 'utf8');
  if (ordersDisk !== ordersText || ticketsDisk !== ticketsText) {
    console.error('datasets differ from the seeded generator');
    process.exit(1);
  }
  console.log('datasets match the seeded generator');
} else {
  writeFileSync(ordersPath, ordersText);
  writeFileSync(ticketsPath, ticketsText);
  console.log(`wrote ${ordersPath}`);
  console.log(`wrote ${ticketsPath}`);
}

console.log(JSON.stringify(summary));
