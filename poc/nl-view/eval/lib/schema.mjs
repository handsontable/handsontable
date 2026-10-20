/**
 * Canonical columns for the nl-view eval grids.
 *
 * Types are the ones these values infer as, and the ones Filters conditions need:
 * ISO dates are `date`, quantities and money are `numeric`, everything else is
 * `text`. Low-cardinality text may infer as `dropdown`; that type uses the same
 * text condition list, and the oracle keeps it as text so the gold is stable.
 */

export const TODAY = '2026-10-20';

/**
 * @param {string} data Column property.
 * @param {'text' | 'numeric' | 'date'} type Cell type.
 * @returns {object}
 */
function column(data, type) {
  const descriptor = { data, type };

  if (type === 'numeric' || type === 'date') {
    descriptor.allowEmpty = true;
  }

  return descriptor;
}

export const ORDER_COLUMNS = [
  column('order_id', 'text'),
  column('customer', 'text'),
  column('country', 'text'),
  column('region', 'text'),
  column('product', 'text'),
  column('category', 'text'),
  column('quantity', 'numeric'),
  column('unit_price', 'numeric'),
  column('total', 'numeric'),
  column('status', 'text'),
  column('order_date', 'date'),
  column('ship_date', 'date'),
  column('priority', 'text'),
  column('rep', 'text'),
];

export const TICKET_COLUMNS = [
  column('id', 'text'),
  column('title', 'text'),
  column('assignee', 'text'),
  column('status', 'text'),
  column('priority', 'text'),
  column('type', 'text'),
  column('created_at', 'date'),
  column('due_date', 'date'),
  column('story_points', 'numeric'),
  column('component', 'text'),
  column('reporter', 'text'),
  column('tags', 'text'),
];

export const ORDER_ID = 'order_id';
export const TICKET_ID = 'id';
