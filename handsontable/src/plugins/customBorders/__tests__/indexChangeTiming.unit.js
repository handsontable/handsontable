import Handsontable from '../../../index';

/**
 * Review round 12 (PR #13634): the model rebuild that a trim or a filter defers, and the progressive
 * load it flushes, must run while the coordinates still describe the rows they were set for, and
 * every trimming source must defer it.
 */
describe('CustomBorders and the timing of index changes', () => {
  let container;
  let hot;
  const TOP = { width: 2, color: '#FF0000' };

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    hot?.destroy();
    hot = null;
    container.remove();
  });

  /**
   * Rows holding their own index in column 0.
   *
   * @param {number} count The number of rows.
   * @returns {Array[]}
   */
  function rows(count) {
    return Array.from({ length: count }, (_, row) => [row, `r${row}`]);
  }

  /**
   * The records (column 0 values) whose cell in column 0 carries a border, read from the visible
   * rows through `getBorders()`.
   *
   * @returns {number[]}
   */
  function borderedRecords() {
    return hot.getPlugin('customBorders').getBorders()
      .map(({ row }) => hot.getDataAtCell(row, 0))
      .sort((a, b) => a - b);
  }

  /**
   * The physical rows whose meta carries a border.
   *
   * @returns {number[]}
   */
  function borderedMetaRows() {
    return hot._getMetaManager().getUserDefinedCellMetas()
      .filter(({ key }) => key === 'borders')
      .map(({ physicalRow }) => physicalRow)
      .sort((a, b) => a - b);
  }

  /**
   * Waits for every progressive batch the plugin scheduled.
   */
  async function drainTimers() {
    for (let i = 0; i < 20; i++) {
      // eslint-disable-next-line no-await-in-loop
      await new Promise(resolve => setTimeout(resolve, 0));
    }
  }

  it('should keep a border through trimRow and loadData in one task, where it was drawn, as loadData alone does', () => {
    // `loadData` keeps the model (the borders the user sees) and the core drops the meta. A rebuild
    // the trim deferred ran after that drop, read no meta and emptied the model.
    const create = () => new Handsontable(container, {
      data: rows(10),
      trimRows: true,
      customBorders: [{ row: 2, col: 0, top: TOP }],
      licenseKey: 'non-commercial-and-evaluation',
    });
    const drawnRows = () => hot.getPlugin('customBorders').getBorders().map(({ row }) => row);

    hot = create();
    hot.loadData(rows(10));

    expect(drawnRows()).toEqual([2]);

    hot.destroy();
    hot = create();
    // Nothing may read the model between the two calls: a read runs the deferred rebuild, which is
    // exactly what the fix moves into `beforeLoadData`.
    hot.getPlugin('trimRows').trimRow(0);
    hot.loadData(rows(10));

    // The border stays where it was drawn after the trim, row 1, as a same-size `loadData` keeps it.
    expect(drawnRows()).toEqual([1]);
  });

  it('should apply the pending batches of a progressive load to the rows they were configured for', async() => {
    hot = new Handsontable(container, {
      data: rows(10),
      trimRows: true,
      customBorders: Array.from({ length: 10 }, (_, row) => ({ row, col: 0, top: TOP })),
      customBordersProgressive: { chunkSize: 2 },
      licenseKey: 'non-commercial-and-evaluation',
    });

    await new Promise(resolve => setTimeout(resolve, 0));
    hot.getPlugin('trimRows').trimRow(0);
    await drainTimers();

    expect(borderedMetaRows()).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
    expect(borderedRecords()).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
  });

  it('should move a border to its record\'s new row when updateSettings trims rows', () => {
    hot = new Handsontable(container, {
      data: rows(10),
      trimRows: true,
      customBorders: true,
      licenseKey: 'non-commercial-and-evaluation',
    });

    hot.getPlugin('customBorders').setBorders([[8, 0, 8, 0]], { top: TOP });
    hot.updateSettings({ trimRows: [0, 1] });

    expect(hot.getPlugin('customBorders').getBorders().map(({ row }) => row)).toEqual([6]);
    expect(borderedRecords()).toEqual([8]);
  });
});
