import Handsontable from 'handsontable/base';
import {
  registerPlugin, AutoRowSize, MergeCells, HiddenRows, HiddenColumns, UndoRedo, ColumnSorting,
} from 'handsontable/plugins';
import { createSpreadsheetData } from '../../../helpers/data';
import { TEST_LICENSE_KEY } from '../../../../test/helpers/licenseKey';

registerPlugin(AutoRowSize);
registerPlugin(MergeCells);
registerPlugin(HiddenRows);
registerPlugin(HiddenColumns);
registerPlugin(UndoRedo);
registerPlugin(ColumnSorting);

const BLOCK = { row: 1, col: 4, rowspan: 2, colspan: 2 };

/**
 * Builds a grid with AutoRowSize and a merge over 10 x 10 data, and writes the merge's text.
 *
 * @param {object} settings Settings merged over the defaults.
 * @returns {object} The Handsontable instance.
 */
function buildGrid(settings: Record<string, unknown> = {}) {
  const hot = new Handsontable(document.createElement('div'), {
    data: createSpreadsheetData(10, 10),
    autoRowSize: true,
    mergeCells: [BLOCK],
    licenseKey: TEST_LICENSE_KEY,
    ...settings,
  });

  hot.setDataAtCell(1, 4, 'merged text');

  return hot;
}

/**
 * What the sampler of the AutoRowSize plugin returns for a cell.
 *
 * @param {object} hot The Handsontable instance.
 * @param {number} row Visual row index.
 * @param {number} column Visual column index.
 * @returns {*} The sampler's answer.
 */
function sampleOf(hot: ReturnType<typeof buildGrid>, row: number, column: number) {
  const { samplesGenerator } = hot.getPlugin('autoRowSize');

  return samplesGenerator.dataFactory!(row, column, samplesGenerator);
}

describe('MergeCells#getBlockDrawnOn', () => {
  it('should answer `null` for every cell when no row or column of the block is hidden', () => {
    const hot = buildGrid();
    const mergeCells = hot.getPlugin('mergeCells');

    [[1, 4], [1, 5], [2, 4], [2, 5], [0, 0], [3, 4]].forEach(([row, column]) => {
      expect(mergeCells.getBlockDrawnOn(row, column)).toBeNull();
    });

    hot.destroy();
  });

  it('should name the block on the first shown row when its first row is hidden', () => {
    const hot = buildGrid({ hiddenRows: { rows: [1] } });
    const mergeCells = hot.getPlugin('mergeCells');

    expect(mergeCells.getBlockDrawnOn(2, 4)).toEqual({ row: 1, col: 4, colspan: 2 });
    // The block's own top-left cell, the covered cells beside the drawn one, and a cell outside it.
    expect(mergeCells.getBlockDrawnOn(1, 4)).toBeNull();
    expect(mergeCells.getBlockDrawnOn(2, 5)).toBeNull();
    expect(mergeCells.getBlockDrawnOn(3, 4)).toBeNull();

    hot.destroy();
  });

  it('should count the width of the block from the first shown column when its first column is hidden', () => {
    const hot = buildGrid({ hiddenColumns: { columns: [4] } });
    const mergeCells = hot.getPlugin('mergeCells');

    expect(mergeCells.getBlockDrawnOn(1, 5)).toEqual({ row: 1, col: 4, colspan: 1 });
    expect(mergeCells.getBlockDrawnOn(2, 5)).toBeNull();

    hot.destroy();
  });

  it('should name the block on the first shown row and column when both are hidden', () => {
    const hot = buildGrid({ hiddenRows: { rows: [1] }, hiddenColumns: { columns: [4] } });

    expect(hot.getPlugin('mergeCells').getBlockDrawnOn(2, 5)).toEqual({ row: 1, col: 4, colspan: 1 });

    hot.destroy();
  });

  it('should answer `null` when every row of the block is hidden', () => {
    const hot = buildGrid({ hiddenRows: { rows: [1, 2] } });
    const mergeCells = hot.getPlugin('mergeCells');

    [[1, 4], [2, 4], [3, 4]].forEach(([row, column]) => {
      expect(mergeCells.getBlockDrawnOn(row, column)).toBeNull();
    });

    hot.destroy();
  });
});

describe('AutoRowSize sampling of a merged block drawn on a covered cell', () => {
  it('should skip the covered cells of a block whose top-left cell is shown', () => {
    const hot = buildGrid();

    expect(sampleOf(hot, 1, 4)).toMatchObject({ value: 'merged text' });
    expect(sampleOf(hot, 1, 4)).not.toHaveProperty('block');
    expect(sampleOf(hot, 2, 4)).toBe(false);
    expect(sampleOf(hot, 2, 5)).toBe(false);

    hot.destroy();
  });

  it('should sample the text of a block with a hidden first row on the cell it is drawn on', () => {
    const hot = buildGrid({ hiddenRows: { rows: [1] } });

    expect(sampleOf(hot, 2, 4)).toMatchObject({ value: 'merged text', block: { row: 1, col: 4, colspan: 2 } });
    // The other covered cell of the block is still skipped, and a plain cell carries no block.
    expect(sampleOf(hot, 2, 5)).toBe(false);
    expect(sampleOf(hot, 2, 3)).toEqual({ value: 'D3' });

    hot.destroy();
  });

  it('should sample the text of a block with a hidden first column on the cell it is drawn on', () => {
    const hot = buildGrid({ hiddenColumns: { columns: [4] } });

    expect(sampleOf(hot, 1, 5)).toMatchObject({ value: 'merged text', block: { row: 1, col: 4, colspan: 1 } });

    hot.destroy();
  });

  it('should keep the text of the block among the strings sampled for its row, with the block attached', () => {
    // A bucket holds a few strings of each length and skips a value it has already seen, so the text of the
    // block could be left out of the measurement by the other cells of its row.
    const hot = buildGrid({ hiddenRows: { rows: [1] } });
    const samples = hot.getPlugin('autoRowSize').samplesGenerator.generateRowSamples(2, { from: 0, to: 9 });
    const strings = Array.from(samples.get(2) as Map<string, { strings: Array<Record<string, unknown>> }>)
      .flatMap(([, sample]) => sample.strings);

    expect(strings).toContainEqual({
      value: 'merged text',
      col: 4,
      block: { row: 1, col: 4, colspan: 2 },
    });

    hot.destroy();
  });

  it('should still sample a cell beside the block that holds the same text', () => {
    // The block's text is not listed as sampled, or the cell with the same text would count as a duplicate.
    const hot = buildGrid({ hiddenRows: { rows: [1] } });

    hot.setDataAtCell(2, 3, 'merged text');

    const samples = hot.getPlugin('autoRowSize').samplesGenerator.generateRowSamples(2, { from: 0, to: 9 });
    const strings = Array.from(samples.get(2) as Map<string, { strings: Array<Record<string, unknown>> }>)
      .flatMap(([, sample]) => sample.strings);

    expect(strings.filter(({ value }) => value === 'merged text').map(({ col }) => col).sort()).toEqual([3, 4]);

    hot.destroy();
  });

  it('should measure the cell of the block at the width of the whole block in the ghost table', () => {
    const hot = buildGrid({ hiddenRows: { rows: [1] } });
    const { ghostTable } = hot.getPlugin('autoRowSize');

    // A covered cell has no `colspan` of its own, so the sample's block is what widens the column.
    expect(ghostTable.createColElement(4, 2, 2).style.width).toBe(`${hot.getColWidth(4) + hot.getColWidth(5)}px`);
    expect(ghostTable.createColElement(4, 2).style.width).toBe(`${hot.getColWidth(4)}px`);

    hot.destroy();
  });
});

describe('MergeCells#getCellsBlocksAreDrawnOn', () => {
  it('should list nothing while the top-left cell of every block is shown', () => {
    const hot = buildGrid();

    expect(hot.getPlugin('mergeCells').getCellsBlocksAreDrawnOn()).toEqual([]);

    hot.destroy();
  });

  it('should list the cell a block is drawn on, with the width of the block from it', () => {
    const hot = buildGrid({ hiddenRows: { rows: [1] }, hiddenColumns: { columns: [4] } });

    expect(hot.getPlugin('mergeCells').getCellsBlocksAreDrawnOn()).toEqual([
      { row: 2, col: 5, colspan: 1, originRow: 1, originCol: 4 },
    ]);

    hot.destroy();
  });

  it('should list nothing for a block whose rows are all hidden', () => {
    const hot = buildGrid({ hiddenRows: { rows: [1, 2] } });

    expect(hot.getPlugin('mergeCells').getCellsBlocksAreDrawnOn()).toEqual([]);

    hot.destroy();
  });
});

describe('AutoRowSize heights of the rows a merged block is drawn on', () => {
  const STALE = 777;

  it('should drop the height cached for the row a block starts to be drawn on', () => {
    const hot = buildGrid({ hiddenRows: true });
    const { rowHeightsMap } = hot.getPlugin('autoRowSize');

    rowHeightsMap.setValueAtIndex(2, STALE);
    hot.getPlugin('hiddenRows').hideRows([1]);
    hot.render();

    expect(rowHeightsMap.getValueAtIndex(2)).not.toBe(STALE);

    hot.destroy();
  });

  it('should drop the height cached for the row a block stops being drawn on', () => {
    const hot = buildGrid({ hiddenRows: { rows: [1] } });
    const { rowHeightsMap } = hot.getPlugin('autoRowSize');

    rowHeightsMap.setValueAtIndex(2, STALE);
    hot.getPlugin('hiddenRows').showRows([1]);
    hot.render();

    expect(rowHeightsMap.getValueAtIndex(2)).not.toBe(STALE);

    hot.destroy();
  });

  it('should drop the height cached for the row a block is drawn on again after an undo', () => {
    // Undo and redo restore merges without a merge hook.
    const hot = buildGrid({ hiddenRows: { rows: [1] }, undo: true });
    const { rowHeightsMap } = hot.getPlugin('autoRowSize');

    hot.getPlugin('mergeCells').unmerge(1, 4, 2, 5);
    hot.render();
    rowHeightsMap.setValueAtIndex(2, STALE);
    hot.getPlugin('undoRedo').undo();

    expect(hot.getPlugin('mergeCells').getCellsBlocksAreDrawnOn()).toEqual([
      { row: 2, col: 4, colspan: 2, originRow: 1, originCol: 4 },
    ]);
    expect(rowHeightsMap.getValueAtIndex(2)).not.toBe(STALE);

    hot.destroy();
  });

  it('should drop the height cached for the row a block was drawn on after a settings update removed it', () => {
    // Replacing the merges through `updateSettings()` drops the old ones without a merge hook.
    const hot = buildGrid({ hiddenRows: { rows: [1] } });
    const { rowHeightsMap } = hot.getPlugin('autoRowSize');

    rowHeightsMap.setValueAtIndex(2, STALE);
    hot.updateSettings({ mergeCells: [] });

    expect(rowHeightsMap.getValueAtIndex(2)).not.toBe(STALE);

    hot.destroy();
  });

  it('should not measure the row a block is drawn on again for an edit that leaves the block alone', () => {
    const hot = buildGrid({ hiddenRows: { rows: [1] } });
    const { rowHeightsMap } = hot.getPlugin('autoRowSize');

    rowHeightsMap.setValueAtIndex(2, STALE);
    hot.setDataAtCell(5, 0, 'x');

    expect(rowHeightsMap.getValueAtIndex(2)).toBe(STALE);

    // The top-left cell of the block holds the text the row is measured to.
    hot.setDataAtCell(1, 4, 'a new text of the block');

    expect(rowHeightsMap.getValueAtIndex(2)).not.toBe(STALE);

    hot.destroy();
  });

  it('should find the row of a block whose top-left cell is read through a data accessor function', () => {
    // The change names the column by the function, not by an index.
    const accessor = (rowData: string[], value?: string) => {
      if (value === undefined) {
        return rowData[4];
      }

      rowData[4] = value;

      return undefined;
    };
    const columns = Array.from({ length: 10 }, (_, index) => ({ data: index === 4 ? accessor : index }));
    const hot = buildGrid({ hiddenRows: { rows: [1] }, columns });
    const { rowHeightsMap } = hot.getPlugin('autoRowSize');

    rowHeightsMap.setValueAtIndex(2, STALE);
    hot.setDataAtCell(5, 0, 'x');

    expect(rowHeightsMap.getValueAtIndex(2)).toBe(STALE);

    hot.setDataAtCell(1, 4, 'a new text of the block');

    expect(rowHeightsMap.getValueAtIndex(2)).not.toBe(STALE);

    hot.destroy();
  });

  it('should leave the row a block was drawn on unmeasured while it is hidden, and measure it once shown', () => {
    const hot = buildGrid({ hiddenRows: { rows: [1] } });
    const { rowHeightsMap } = hot.getPlugin('autoRowSize');

    hot.getPlugin('hiddenRows').hideRows([2]);
    hot.render();

    expect(rowHeightsMap.getValueAtIndex(2)).toBeNull();

    hot.getPlugin('hiddenRows').showRows([2]);
    hot.render();

    expect(rowHeightsMap.getValueAtIndex(2)).not.toBeNull();

    hot.destroy();
  });

  it('should drop the height cached for the row a block is drawn on when a sort moves the block', () => {
    const hot = buildGrid({ hiddenRows: { rows: [1] }, columnSorting: true });
    const { rowHeightsMap } = hot.getPlugin('autoRowSize');

    rowHeightsMap.setValueAtIndex(2, STALE);
    hot.getPlugin('columnSorting').sort({ column: 0, sortOrder: 'desc' });

    expect(hot.getPlugin('mergeCells').getCellsBlocksAreDrawnOn()).not.toEqual([
      expect.objectContaining({ row: 2, col: 4 }),
    ]);
    expect(rowHeightsMap.getValueAtIndex(2)).not.toBe(STALE);

    hot.destroy();
  });

  it('should keep the heights when a settings update hides nothing new', () => {
    // The hiding map is registered again by every update of HiddenRows, which reports a change of the hidden
    // indexes. Nothing moved, so the React and Angular wrappers, which send the settings on every commit,
    // must not make every merged row be measured again.
    const hot = buildGrid({ hiddenRows: { rows: [1] } });
    const { rowHeightsMap } = hot.getPlugin('autoRowSize');

    rowHeightsMap.setValueAtIndex(2, STALE);
    hot.updateSettings({ hiddenRows: { rows: [1] } });
    hot.render();

    expect(rowHeightsMap.getValueAtIndex(2)).toBe(STALE);

    hot.destroy();
  });
});
