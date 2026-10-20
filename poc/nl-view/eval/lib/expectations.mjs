/**
 * Row sets the gold states must produce. The harness applies each state with
 * setViewState and checks the visible ids against these predicates.
 */

const OPEN = new Set(['open', 'in_progress', 'review']);

const between = (value, start, end) => value >= start && value <= end;

const PREDICATES = {
  'ord-paid': (row) => row.status === 'paid',
  'ord-germany': (row) => row.country === 'Germany',
  'ord-high': (row) => row.priority === 'high',
  'ord-north': (row) => String(row.customer).toLowerCase().startsWith('north'),
  'ord-shipdate': (row) => row.ship_date != null && row.ship_date !== '',
  'ord-emea-paid': (row) => row.region === 'EMEA' && row.status === 'paid',
  'ord-qty': (row) => row.category === 'Electronics' && row.quantity > 5 && row.quantity < 20,
  'ord-status-set': (row) => row.status === 'shipped' || row.status === 'refunded',
  'ord-regions': (row) => row.region === 'AMER' || row.region === 'APAC',
  'ord-total': (row) => typeof row.total === 'number' && row.total >= 100 && row.total <= 500,
  'ord-qty20': (row) => typeof row.quantity === 'number' && row.quantity >= 20,
  'ord-last-month': (row) => between(row.order_date, '2026-09-01', '2026-09-30'),
  'ord-quarter': (row) => between(row.order_date, '2026-10-01', '2026-12-31'),
  'ord-sort-total': () => true,
  'ord-sort-multi': () => true,
  'ord-hide': () => true,
  'ord-show': () => true,
  'ord-combined': (row) => row.region === 'EMEA' && row.status === 'shipped',
  'ord-clear': () => true,
  'ord-recent': (row) => between(row.order_date, '2026-09-20', '2026-10-20'),
  'tix-open': (row) => row.status === 'open',
  'tix-p0': (row) => row.priority === 'P0',
  'tix-unassigned': (row) => row.assignee == null || row.assignee === '',
  'tix-crash': (row) => String(row.title).toLowerCase().startsWith('crash'),
  'tix-bug-review': (row) => row.type === 'bug' && row.status === 'review',
  'tix-core': (row) => row.component === 'Core' && row.type === 'bug' && (row.priority === 'P1' || row.priority === 'P2'),
  'tix-closed': (row) => row.status === 'done' || row.status === 'wontfix',
  'tix-people': (row) => row.assignee === 'Anna Kowalska' || row.assignee === 'Ben Ortiz',
  'tix-points': (row) => typeof row.story_points === 'number' && row.story_points >= 3 && row.story_points <= 8,
  'tix-points-gt': (row) => typeof row.story_points === 'number' && row.story_points > 5,
  'tix-overdue': (row) => row.due_date != null && row.due_date < '2026-10-20' && OPEN.has(row.status),
  'tix-month': (row) => between(row.created_at, '2026-10-01', '2026-10-31'),
  'tix-sort': () => true,
  'tix-sort-multi': () => true,
  'tix-hide': () => true,
  'tix-show': () => true,
  'tix-combined': (row) => row.type === 'bug' && row.status === 'open',
  'tix-clear': () => true,
};

const ACCEPTABLE = {
  'ord-status-set': [
    (row) => row.status === 'shipped' || row.status === 'refunded',
  ],
  'ord-regions': [
    (row) => row.region === 'AMER' || row.region === 'APAC',
  ],
  'ord-last-month': [
    (row) => between(row.order_date, '2026-09-20', '2026-10-20'),
  ],
  'ord-recent': [
    (row) => between(row.order_date, '2026-10-01', '2026-10-31'),
    (row) => between(row.order_date, '2026-10-14', '2026-10-20'),
  ],
  'tix-open': [
    (row) => OPEN.has(row.status),
  ],
  'tix-core': [
    (row) => row.component === 'Core' && row.type === 'bug' && (row.priority === 'P1' || row.priority === 'P2'),
  ],
  'tix-closed': [
    (row) => row.status === 'done' || row.status === 'wontfix',
  ],
  'tix-people': [
    (row) => row.assignee === 'Anna Kowalska' || row.assignee === 'Ben Ortiz',
  ],
  'tix-overdue': [
    (row) => row.due_date != null && row.due_date < '2026-10-20',
  ],
};

const SORT = {
  'ord-sort-total': [{ column: 'total', sortOrder: 'desc' }],
  'ord-sort-multi': [
    { column: 'country', sortOrder: 'asc' },
    { column: 'order_date', sortOrder: 'desc' },
  ],
  'ord-combined': [{ column: 'total', sortOrder: 'desc' }],
  'tix-sort': [{ column: 'due_date', sortOrder: 'asc' }],
  'tix-sort-multi': [
    { column: 'priority', sortOrder: 'asc' },
    { column: 'story_points', sortOrder: 'desc' },
  ],
  'tix-combined': [{ column: 'priority', sortOrder: 'asc' }],
};

const HIDDEN = {
  'ord-hide': ['ship_date', 'unit_price'],
  'ord-show': [
    'category', 'country', 'order_date', 'order_id', 'priority',
    'quantity', 'region', 'rep', 'ship_date', 'unit_price',
  ],
  'ord-combined': ['rep'],
  'tix-hide': ['reporter', 'tags'],
  'tix-show': ['component', 'created_at', 'due_date', 'reporter', 'story_points', 'tags', 'type'],
  'tix-combined': ['story_points'],
};

/**
 * @param {string} id Prompt id.
 * @returns {(row: object) => boolean}
 */
export function rowPredicate(id) {
  const predicate = PREDICATES[id];

  if (!predicate) {
    throw new Error(`no row predicate for ${id}`);
  }

  return predicate;
}

/**
 * @param {string} id Prompt id.
 * @returns {Array<(row: object) => boolean>}
 */
export function acceptablePredicates(id) {
  return ACCEPTABLE[id] ?? [];
}

/**
 * @param {string} id Prompt id.
 * @returns {Array<{ column: string, sortOrder: string }>}
 */
export function expectedSort(id) {
  return SORT[id] ?? [];
}

/**
 * @param {string} id Prompt id.
 * @returns {string[]}
 */
export function expectedHidden(id) {
  return HIDDEN[id] ?? [];
}
