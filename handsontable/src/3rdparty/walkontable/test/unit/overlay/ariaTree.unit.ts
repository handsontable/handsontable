import { getRowGroupId, stampRowGroupsInReadingOrder } from 'walkontable/overlay/ariaTree';
import type { AriaTreeTable } from 'walkontable/overlay/ariaTree';

const GUID = 'ht_1';

/**
 * Builds a table with a head and a body section, each a row group or not.
 *
 * @param {string} name The table's name.
 * @param {boolean} headIsGroup Whether the head carries the `rowgroup` role.
 * @param {boolean} bodyIsGroup Whether the body carries the `rowgroup` role.
 * @returns {AriaTreeTable}
 */
function table(name: string, headIsGroup: boolean, bodyIsGroup: boolean): AriaTreeTable {
  const THEAD = document.createElement('thead');
  const TBODY = document.createElement('tbody');

  if (headIsGroup) {
    THEAD.setAttribute('role', 'rowgroup');
  }
  if (bodyIsGroup) {
    TBODY.setAttribute('role', 'rowgroup');
  }

  return { name, THEAD, TBODY };
}

/**
 * Shortens the ids to `<table>-<section>`.
 *
 * @param {string[]} ids The ids.
 * @returns {string[]}
 */
function short(ids: string[]): string[] {
  return ids.map(id => id.replace(`${GUID}-rowgroup-`, ''));
}

describe('stampRowGroupsInReadingOrder', () => {
  it('reads the column headers before the rows of a grid with headers and no frozen track', () => {
    // The DOM order: the master first, then the clones.
    const tables = [
      table('master', true, true),
      table('top', true, false),
      table('inline_start', true, true),
      table('top_inline_start_corner', true, false),
    ];

    expect(short(stampRowGroupsInReadingOrder(tables, GUID))).toEqual([
      'top_inline_start_corner-head',
      'top-head',
      'inline_start-body',
      'master-body',
    ]);
  });

  it('reads the headers, the frozen top rows, the rows between, then the frozen bottom rows', () => {
    const tables = [
      'master', 'top', 'bottom', 'inline_start', 'inline_end', 'top_inline_start_corner',
      'bottom_inline_start_corner', 'top_inline_end_corner', 'bottom_inline_end_corner',
    ].map(name => table(name, !name.startsWith('bottom'), true));

    expect(short(stampRowGroupsInReadingOrder(tables, GUID))).toEqual([
      'top_inline_start_corner-head',
      'top-head',
      'top_inline_end_corner-head',
      'top_inline_start_corner-body',
      'top-body',
      'top_inline_end_corner-body',
      'inline_start-body',
      'master-body',
      'inline_end-body',
      'bottom_inline_start_corner-body',
      'bottom-body',
      'bottom_inline_end_corner-body',
    ]);
  });

  it('leaves out the head sections the stylesheet hides: the master\'s and the side clones\'', () => {
    const ids = short(stampRowGroupsInReadingOrder([
      table('master', true, true), table('inline_start', true, true), table('inline_end', true, true),
    ], GUID));

    expect(ids).toEqual(['inline_start-body', 'master-body', 'inline_end-body']);
  });

  it('leaves out a section that is not a row group in this draw, and gives it no id', () => {
    const top = table('top', true, false);

    top.TBODY!.setAttribute('role', 'presentation');

    expect(short(stampRowGroupsInReadingOrder([top], GUID))).toEqual(['top-head']);
    expect(top.TBODY!.id).toBe('');
  });

  it('writes the id on each listed section, unique per grid', () => {
    const master = table('master', false, true);

    expect(stampRowGroupsInReadingOrder([master], 'ht_a')).toEqual(['ht_a-rowgroup-master-body']);
    expect(master.TBODY!.id).toBe(getRowGroupId('ht_a', 'master', 'body'));
    expect(getRowGroupId('ht_a', 'master', 'body')).not.toBe(getRowGroupId('ht_b', 'master', 'body'));
  });

  it('copes with a table that has no section elements yet', () => {
    expect(stampRowGroupsInReadingOrder([{ name: 'master', THEAD: null, TBODY: null }], GUID)).toEqual([]);
  });
});
