/**
 * Placeholder rows. Real eval data arrives through window.nlView.loadData.
 * Column order is the schema order, then any extra keys on the loaded rows.
 */

export const ORDERS_COLUMNS = Object.freeze([
  'order_id', 'customer', 'country', 'region', 'product', 'category',
  'quantity', 'unit_price', 'total', 'status', 'order_date', 'ship_date',
  'priority', 'rep',
]);

export const TICKETS_COLUMNS = Object.freeze([
  'id', 'title', 'assignee', 'status', 'priority', 'type', 'created_at',
  'due_date', 'story_points', 'component', 'reporter', 'tags',
]);

/**
 * @param {string} name
 * @returns {{ name: string, rows: object[] }}
 */
export function placeholderDataset(name) {
  if (name === 'tickets') {
    return { name: 'tickets', rows: ticketRows() };
  }

  return { name: 'orders', rows: orderRows() };
}

/**
 * @param {string} name
 * @param {object[]} rows
 * @returns {string[]}
 */
export function columnProps(name, rows) {
  const known = name === 'tickets' ? TICKETS_COLUMNS : name === 'orders' ? ORDERS_COLUMNS : [];
  const seen = new Set(known);
  const extra = [];

  rows.forEach((row) => {
    if (!row || typeof row !== 'object' || Array.isArray(row)) {
      return;
    }

    Object.keys(row).forEach((key) => {
      if (!seen.has(key)) {
        seen.add(key);
        extra.push(key);
      }
    });
  });

  return known.length ? known.concat(extra) : extra;
}

/**
 * @param {string} id
 * @param {string} customer
 * @param {string} country
 * @param {string} region
 * @param {string} product
 * @param {string} category
 * @param {number} quantity
 * @param {number} unitPrice
 * @param {string} status
 * @param {string} orderDate
 * @param {string|null} shipDate
 * @param {string} priority
 * @param {string} rep
 * @returns {object}
 */
function order(id, customer, country, region, product, category, quantity, unitPrice, status, orderDate, shipDate, priority, rep) {
  return {
    order_id: id,
    customer,
    country,
    region,
    product,
    category,
    quantity,
    unit_price: unitPrice,
    total: Math.round(quantity * unitPrice * 100) / 100,
    status,
    order_date: orderDate,
    ship_date: shipDate,
    priority,
    rep,
  };
}

/**
 * @returns {object[]}
 */
function orderRows() {
  return [
    order('o-1001', 'Ada Klein', 'Germany', 'EMEA', 'Widget', 'hardware', 4, 12.5, 'paid', '2026-10-20', '2026-10-21', 'high', 'Ivy'),
    order('o-1002', 'Bao Nguyen', 'Japan', 'APAC', 'Gadget', 'hardware', 12, 40, 'shipped', '2026-10-19', '2026-10-20', 'normal', 'Noah'),
    order('o-1003', 'Carmen Diaz', 'Brazil', 'AMER', 'Cable', 'accessory', 30, 3.5, 'paid', '2026-10-18', '2026-10-19', 'low', 'Ivy'),
    order('o-1004', 'Diego Rossi', 'Italy', 'EMEA', 'Widget', 'hardware', 2, 12.5, 'pending', '2026-10-14', null, 'high', 'Sara'),
    order('o-1005', 'Elena Petrova', 'Poland', 'EMEA', 'Sensor', 'hardware', 8, 22, 'cancelled', '2026-10-13', null, 'normal', 'Noah'),
    order('o-1006', 'Farid Hassan', 'UAE', 'EMEA', 'License', 'software', 1, 240, 'paid', '2026-10-01', '2026-10-03', 'high', 'Sara'),
    order('o-1007', 'Grace Owens', 'USA', 'AMER', 'Gadget', 'hardware', 15, 40, 'refunded', '2026-09-15', '2026-09-18', 'low', 'Maya'),
    order('o-1008', 'Hiro Tanaka', 'Japan', 'APAC', 'Sensor', 'hardware', 6, 22, 'shipped', '2026-09-02', '2026-09-06', 'normal', 'Noah'),
    order('o-1009', 'Ines Moreau', 'France', 'EMEA', 'Cable', 'accessory', 50, 3.5, 'paid', '2026-01-10', '2026-01-14', 'low', 'Ivy'),
    order('o-1010', 'Jonah Blake', 'Canada', 'AMER', 'Widget', 'hardware', 9, 12.5, 'pending', '2025-12-01', null, 'normal', 'Maya'),
    order('o-1011', 'Kira Novak', 'Germany', 'EMEA', 'License', 'software', 3, 80, 'paid', '2026-10-20', '2026-10-22', 'normal', 'Sara'),
    order('o-1012', 'Leo Martins', 'Brazil', 'AMER', 'Gadget', 'hardware', 1, 40, 'shipped', '2026-10-17', '2026-10-19', 'high', 'Maya'),
    order('o-1013', 'Mina Cho', 'South Korea', 'APAC', 'Sensor', 'hardware', 20, 22, 'paid', '2026-11-02', '2026-11-05', 'low', 'Noah'),
    order('o-1014', 'Noah Keller', 'USA', 'AMER', 'Cable', 'accessory', 7, 3.5, 'cancelled', '2026-10-19', null, 'low', 'Ivy'),
    order('o-1015', 'Olga Ivanova', 'Germany', 'EMEA', 'Widget', 'hardware', 11, 12.5, 'refunded', '2026-08-20', '2026-08-25', 'high', 'Sara'),
    order('o-1016', 'Priya Shah', 'India', 'APAC', 'License', 'software', 5, 80, 'pending', '2026-10-16', null, 'normal', 'Noah'),
    order('o-1017', 'Quinn Adler', 'UK', 'EMEA', 'Gadget', 'hardware', 14, 40, 'paid', '2026-10-08', '2026-10-10', 'high', 'Ivy'),
    order('o-1018', 'Rosa Alvarez', 'Spain', 'EMEA', 'Sensor', 'hardware', 3, 22, 'shipped', '2026-07-01', '2026-07-04', 'low', 'Sara'),
    order('o-1019', 'Sam Carter', 'USA', 'AMER', 'Widget', 'hardware', 25, 12.5, 'paid', '2026-10-20', '2026-10-21', 'normal', 'Maya'),
    order('o-1020', 'Tina Berg', 'Sweden', 'EMEA', 'Cable', 'accessory', 18, 3.5, 'pending', '2026-09-28', null, 'high', 'Ivy'),
    order('o-1021', 'Uma Desai', 'Australia', 'APAC', 'License', 'software', 2, 240, 'paid', '2026-03-12', '2026-03-15', 'normal', 'Noah'),
    order('o-1022', 'Victor Lange', 'France', 'EMEA', 'Gadget', 'hardware', 6, 40, 'shipped', '2026-10-02', '2026-10-04', 'low', 'Sara'),
    order('o-1023', 'Wendy Cho', 'Canada', 'AMER', 'Sensor', 'hardware', 40, 22, 'cancelled', '2026-05-19', null, 'high', 'Maya'),
    order('o-1024', 'Yusuf Demir', 'Turkey', 'EMEA', 'Widget', 'hardware', 8, 12.5, 'paid', '2026-10-11', '2026-10-13', 'normal', 'Ivy'),
  ];
}

/**
 * @param {string} id
 * @param {string} title
 * @param {string|null} assignee
 * @param {string} status
 * @param {string} priority
 * @param {string} type
 * @param {string} createdAt
 * @param {string|null} dueDate
 * @param {number} storyPoints
 * @param {string} component
 * @param {string} reporter
 * @param {string} tags
 * @returns {object}
 */
function ticket(id, title, assignee, status, priority, type, createdAt, dueDate, storyPoints, component, reporter, tags) {
  return {
    id,
    title,
    assignee,
    status,
    priority,
    type,
    created_at: createdAt,
    due_date: dueDate,
    story_points: storyPoints,
    component,
    reporter,
    tags,
  };
}

/**
 * @returns {object[]}
 */
function ticketRows() {
  return [
    ticket('t-501', 'Filter menu steals focus', 'Ada', 'open', 'P0', 'bug', '2026-10-18', '2026-10-20', 5, 'filters', 'Sam', 'ui,regression'),
    ticket('t-502', 'Sort indicator stuck', 'Bao', 'in_progress', 'P1', 'bug', '2026-10-12', '2026-10-22', 3, 'sorting', 'Grace', 'ui'),
    ticket('t-503', 'Column type inference', 'Carmen', 'review', 'P2', 'feature', '2026-09-30', '2026-10-25', 8, 'import', 'Jonah', 'api'),
    ticket('t-504', 'Drop legacy spec runner', null, 'open', 'P3', 'chore', '2026-10-01', null, 2, 'tests', 'Priya', 'ci'),
    ticket('t-505', 'Undo merges two prompts', 'Diego', 'done', 'P0', 'bug', '2026-08-02', '2026-08-09', 5, 'undo', 'Elena', 'undo,regression'),
    ticket('t-506', 'Theme token export', 'Elena', 'wontfix', 'P2', 'feature', '2026-01-15', '2026-02-01', 13, 'themes', 'Ada', 'css'),
    ticket('t-507', 'Blank assignee crash', 'Farid', 'open', 'P0', 'bug', '2026-10-20', '2026-10-21', 3, 'filters', 'Tina', 'crash'),
    ticket('t-508', 'Date between is exclusive', null, 'review', 'P1', 'bug', '2026-10-09', '2026-10-28', 5, 'filters', 'Quinn', 'dates'),
    ticket('t-509', 'Keyboard row move', 'Grace', 'in_progress', 'P2', 'feature', '2026-09-15', '2026-11-02', 8, 'selection', 'Rosa', 'a11y'),
    ticket('t-510', 'Rename changelog script', 'Hiro', 'done', 'P3', 'chore', '2026-07-07', '2026-07-08', 1, 'tooling', 'Sam', 'ci'),
    ticket('t-511', 'P0 outage banner', 'Ivy', 'open', 'P0', 'bug', '2026-10-19', '2026-10-20', 2, 'dialog', 'Farid', 'ui,crash'),
    ticket('t-512', 'Story point rollup', 'Jonah', 'wontfix', 'P1', 'feature', '2025-12-12', null, 13, 'summary', 'Bao', 'aggregate'),
    ticket('t-513', 'Hidden column copy', null, 'in_progress', 'P2', 'bug', '2026-10-05', '2026-10-30', 5, 'hidden', 'Uma', 'clipboard'),
    ticket('t-514', 'Docs example drift', 'Kira', 'review', 'P3', 'chore', '2026-10-14', '2026-10-18', 2, 'docs', 'Leo', 'docs'),
    ticket('t-515', 'Multi-sort stability', 'Leo', 'done', 'P1', 'bug', '2026-03-03', '2026-03-20', 8, 'sorting', 'Mina', 'sorting'),
    ticket('t-516', 'Tag editor', 'Mina', 'open', 'P2', 'feature', '2026-10-16', '2026-11-15', 5, 'editors', 'Kira', 'ui,tags'),
  ];
}
