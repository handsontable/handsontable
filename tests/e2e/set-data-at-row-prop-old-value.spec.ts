import { test, expect } from '../fixtures/test';
import { SetDataAtRowPropPage } from '../fixtures/pages/SetDataAtRowPropPage';

/**
 * `setDataAtRowProp()` and `setSourceDataAtCell()` are addressed by PROP — a key for object data,
 * a source index for array data. Both used to read the previous value through
 * `dataSource.getAtCell()`, which takes a VISUAL COLUMN INDEX and resolves it with `colToProp()`.
 * A numeric prop was translated a second time, so the old value reported to `beforeChange` /
 * `afterChange` came from a different column, while the write itself landed correctly
 * (DEV-2721, GitHub #4118).
 *
 * Because `colToProp()` returns non-integers unchanged, string props were never affected — only
 * array-shaped data. Undo then wrote the wrong old value back into the source data, which is the
 * costliest symptom and the reason the undo assertions below matter.
 *
 * Cell values are `r<row>c<col>`, so a wrong old value names the column it actually came from.
 */
test.describe('setDataAtRowProp old value', () => {
  let grid: SetDataAtRowPropPage;

  test.beforeEach(async ({ page, theme }) => {
    grid = new SetDataAtRowPropPage(page, theme);
    await grid.goto();
  });

  test('reads the old value from the addressed source index when columns[].data offsets them', async () => {
    // columns[].data maps visual 0..9 onto source 5..14, so prop 5 is shown at visual column 0.
    // Resolving prop 5 as a visual index would land on source 10 instead.
    const result = await grid.setDataAtRowProp({
      columns: Array.from({ length: 10 }, (_, i) => ({ data: i + 5 })),
      prop: 5,
    });

    expect(result.oldValue).toBe('r1c5');
    expect((result.after as unknown[])[5]).toBe('NEW');
  });

  test('reads the old value from the addressed source index when columns[].data reorders them', async () => {
    const result = await grid.setDataAtRowProp({
      columns: [{ data: 2 }, { data: 0 }, { data: 1 }],
      prop: 0,
    });

    expect(result.oldValue).toBe('r1c0');
    expect((result.after as unknown[])[0]).toBe('NEW');
  });

  test('reads the old value from the addressed source index when columns are moved', async () => {
    // The move makes visual 1 hold physical 3, so resolving prop 3 as a visual index reads source 1.
    const result = await grid.setDataAtRowProp({
      manualColumnMove: [4, 3, 2, 1, 0],
      prop: 3,
    });

    expect(result.oldValue).toBe('r1c3');
    expect((result.after as unknown[])[3]).toBe('NEW');
  });

  test('restores the original row on undo when columns[].data offsets the source indexes', async () => {
    const result = await grid.setDataAtRowProp({
      columns: Array.from({ length: 10 }, (_, i) => ({ data: i + 5 })),
      prop: 5,
    });

    // The write has to have happened, or "restored" would pass on a grid nothing ever changed.
    expect(result.after).not.toEqual(result.before);
    expect(result.undone).toEqual(result.before);
  });

  test('restores the original row on undo when columns are moved', async () => {
    const result = await grid.setDataAtRowProp({
      manualColumnMove: [4, 3, 2, 1, 0],
      prop: 3,
    });

    expect(result.after).not.toEqual(result.before);
    expect(result.undone).toEqual(result.before);
  });

  test('keeps reading the addressed index when nothing remaps the columns', async () => {
    const result = await grid.setDataAtRowProp({ prop: 3 });

    expect(result.oldValue).toBe('r1c3');
    expect((result.after as unknown[])[3]).toBe('NEW');
    expect(result.undone).toEqual(result.before);
  });

  test('keeps reading the addressed index when columns are only hidden', async () => {
    // Hiding does not renumber physical columns, so this case was never broken — it guards the
    // fix against a regression that would start translating where nothing needs translating.
    const result = await grid.setDataAtRowProp({ hiddenColumns: [0, 1], prop: 3 });

    expect(result.oldValue).toBe('r1c3');
    expect((result.after as unknown[])[3]).toBe('NEW');
  });

  test('keeps string props working on object data', async () => {
    const result = await grid.setDataAtRowProp({
      dataKind: 'object',
      manualColumnMove: [4, 3, 2, 1, 0],
      prop: 'p3',
    });

    expect(result.oldValue).toBe('r1c3');
    expect((result.after as Record<string, unknown>).p3).toBe('NEW');
    expect(result.undone).toEqual(result.before);
  });

  test('keeps string props working when columns[].data selects a subset', async () => {
    const result = await grid.setDataAtRowProp({
      dataKind: 'object',
      columns: [{ data: 'p3' }, { data: 'p4' }, { data: 'p5' }, { data: 'p6' }],
      prop: 'p5',
    });

    expect(result.oldValue).toBe('r1c5');
    expect((result.after as Record<string, unknown>).p5).toBe('NEW');
  });
});

test.describe('setSourceDataAtCell old value', () => {
  let grid: SetDataAtRowPropPage;

  test.beforeEach(async ({ page, theme }) => {
    grid = new SetDataAtRowPropPage(page, theme);
    await grid.goto();
  });

  test('reports the previous value of the addressed index when columns[].data offsets them', async () => {
    const result = await grid.setSourceDataAtCell({
      columns: Array.from({ length: 10 }, (_, i) => ({ data: i + 5 })),
      prop: 5,
    });

    expect(result.oldValue).toBe('r1c5');
    expect((result.after as unknown[])[5]).toBe('NEW');
  });

  test('reports the previous value of the addressed index when nothing remaps the columns', async () => {
    const result = await grid.setSourceDataAtCell({ prop: 3 });

    expect(result.oldValue).toBe('r1c3');
    expect((result.after as unknown[])[3]).toBe('NEW');
  });
});
