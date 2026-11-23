import { A11Y_ROWGROUP } from '../../../../helpers/a11y';
import {
  CLONE_BOTTOM,
  CLONE_BOTTOM_INLINE_END_CORNER,
  CLONE_BOTTOM_INLINE_START_CORNER,
  CLONE_INLINE_END,
  CLONE_INLINE_START,
  CLONE_TOP,
  CLONE_TOP_INLINE_END_CORNER,
  CLONE_TOP_INLINE_START_CORNER,
} from './constants';
import { MASTER_TABLE } from './overlayOwnership';

const [ROLE, ROWGROUP] = A11Y_ROWGROUP();
const HEAD = 'head';
const BODY = 'body';

type SectionName = typeof HEAD | typeof BODY;

/**
 * The sections of one table (the master or an overlay clone) that can be a row group.
 */
export interface AriaTreeTable {
  name: string;
  THEAD: HTMLElement | null;
  TBODY: HTMLElement | null;
}

/**
 * The order a screen reader should meet the grid's row groups in: the column headers, then the frozen
 * top rows, then the rows between the frozen ones, then the frozen bottom rows; within each band from
 * the inline start to the inline end. The DOM order is the master first and every clone after it, which
 * reads the data before the headers that label it.
 *
 * The head sections of the master and of the two side clones are left out: the stylesheet hides them
 * (`visibility: hidden` in `styles/base/_base.scss`), so they are not in the accessibility tree.
 */
const READING_ORDER: ReadonlyArray<readonly [string, SectionName]> = [
  [CLONE_TOP_INLINE_START_CORNER, HEAD],
  [CLONE_TOP, HEAD],
  [CLONE_TOP_INLINE_END_CORNER, HEAD],
  [CLONE_TOP_INLINE_START_CORNER, BODY],
  [CLONE_TOP, BODY],
  [CLONE_TOP_INLINE_END_CORNER, BODY],
  [CLONE_INLINE_START, BODY],
  [MASTER_TABLE, BODY],
  [CLONE_INLINE_END, BODY],
  [CLONE_BOTTOM_INLINE_START_CORNER, BODY],
  [CLONE_BOTTOM, BODY],
  [CLONE_BOTTOM_INLINE_END_CORNER, BODY],
];

/**
 * Returns the id a row group of the given table and section carries.
 *
 * @param {string} guid The grid's instance id.
 * @param {string} tableName The table's name: `master` or a clone type.
 * @param {string} section `head` or `body`.
 * @returns {string}
 */
export function getRowGroupId(guid: string, tableName: string, section: SectionName): string {
  return `${guid}-rowgroup-${tableName}-${section}`;
}

/**
 * Gives every row group of the grid an id and returns the ids in reading order, for the `aria-owns` of the
 * grid's root. A section that is not a row group in this draw (its rows hold no cells, or another module took
 * its role) is left out, and loses the id an earlier draw gave it. An id is written only when it differs, and
 * an id set by someone else is replaced: the list has to name the section.
 *
 * @param {AriaTreeTable[]} tables The master table and the overlay clones' tables, in any order.
 * @param {string} guid The grid's instance id, which makes the ids unique on a page with several grids.
 * @returns {string[]} The ids of the row groups, in reading order.
 */
export function stampRowGroupsInReadingOrder(tables: AriaTreeTable[], guid: string): string[] {
  const byName = new Map(tables.map(table => [table.name, table]));
  const ids: string[] = [];

  for (let i = 0; i < READING_ORDER.length; i++) {
    const [tableName, section] = READING_ORDER[i];
    const table = byName.get(tableName);
    const element = section === HEAD ? table?.THEAD : table?.TBODY;

    const id = getRowGroupId(guid, tableName, section);

    if (element && element.getAttribute(ROLE) === ROWGROUP) {
      if (element.id !== id) {
        element.id = id;
      }
      ids.push(id);

    } else if (element && element.id === id) {
      // The section was listed by an earlier draw and is no row group in this one.
      element.removeAttribute('id');
    }
  }

  return ids;
}
