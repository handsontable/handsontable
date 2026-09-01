import React from 'react';
import { HotTable } from '../src/hotTable';
import {
  createSpreadsheetData,
  mockElementDimensions,
  mountComponentWithRef,
  sleep,
} from './_helpers';
import { HotRendererProps, HotTableRef } from '../src/types';

// Regression tests for issue #9063: Handsontable draws a cell of a fixed column
// twice — once in the master table and once in the inline-start overlay — and
// each draw gets its own TD. The wrapper cached one portal container per
// (row, col), so both draws shared a container, it moved into whichever table
// rendered last, and the other table's cell was left empty. The two tables then
// sized their rows from different content and stopped lining up.
describe('Component-based renderers in fixed columns', () => {
  const CELL_TEXT = 'rendered-by-component';

  function Cell(props: HotRendererProps) {
    return <span className="cell-marker">{`${CELL_TEXT}:${props.row}-${props.col}`}</span>;
  }

  /**
   * Read the cell of the first column out of one of the rendered tables.
   *
   * @param {String} tableSelector Selector of the table holder to read from.
   * @param {Number} row Row index of the cell to read.
   * @returns {HTMLTableCellElement} The cell element.
   */
  function firstColumnCell(tableSelector: string, row: number): HTMLTableCellElement {
    const rows = document.querySelectorAll(`${tableSelector} tbody tr`);

    return rows[row].querySelectorAll('td')[0] as HTMLTableCellElement;
  }

  it('should render the component into both the master table and the inline-start overlay', async () => {
    mountComponentWithRef<HotTableRef>((
      <HotTable licenseKey="non-commercial-and-evaluation"
                id="test-hot"
                data={createSpreadsheetData(5, 4)}
                width={300}
                height={300}
                rowHeights={23}
                colWidths={50}
                fixedColumnsStart={1}
                autoRowSize={false}
                autoColumnSize={false}
                init={function () {
                  mockElementDimensions(this.rootElement, 300, 300);
                }}
                renderer={(props) => <Cell {...props} />}
      />
    ), false);

    await sleep(100);

    const masterCell = firstColumnCell('.ht_master', 0);
    const overlayCell = firstColumnCell('.ht_clone_inline_start', 0);

    // Both tables must hold their own copy of the rendered content. Before the
    // fix one of them was empty, which is what made the rows drift apart.
    expect(masterCell.textContent).toBe(`${CELL_TEXT}:0-0`);
    expect(overlayCell.textContent).toBe(`${CELL_TEXT}:0-0`);

    // Separate containers, not one container shared between the two tables.
    expect(masterCell.firstElementChild).not.toBe(overlayCell.firstElementChild);
  });

  it('should render the component into both the master table and the top overlay', async () => {
    mountComponentWithRef<HotTableRef>((
      <HotTable licenseKey="non-commercial-and-evaluation"
                id="test-hot"
                data={createSpreadsheetData(5, 4)}
                width={300}
                height={300}
                rowHeights={23}
                colWidths={50}
                fixedRowsTop={1}
                autoRowSize={false}
                autoColumnSize={false}
                init={function () {
                  mockElementDimensions(this.rootElement, 300, 300);
                }}
                renderer={(props) => <Cell {...props} />}
      />
    ), false);

    await sleep(100);

    // A frozen row splits the same cell across two tables just like a frozen
    // column does, so it needs its own container too.
    expect(firstColumnCell('.ht_master', 0).textContent).toBe(`${CELL_TEXT}:0-0`);
    expect(firstColumnCell('.ht_clone_top', 0).textContent).toBe(`${CELL_TEXT}:0-0`);
  });

  it('should keep both copies of a fixed cell after a re-render', async () => {
    const hotInstance = mountComponentWithRef<HotTableRef>((
      <HotTable licenseKey="non-commercial-and-evaluation"
                id="test-hot"
                data={createSpreadsheetData(5, 4)}
                width={300}
                height={300}
                rowHeights={23}
                colWidths={50}
                fixedColumnsStart={1}
                autoRowSize={false}
                autoColumnSize={false}
                init={function () {
                  mockElementDimensions(this.rootElement, 300, 300);
                }}
                renderer={(props) => <Cell {...props} />}
      />
    ), false).hotInstance!;

    await sleep(100);

    hotInstance.render();

    await sleep(100);

    // A re-render must not hand one table's container to the other one.
    expect(firstColumnCell('.ht_master', 1).textContent).toBe(`${CELL_TEXT}:1-0`);
    expect(firstColumnCell('.ht_clone_inline_start', 1).textContent).toBe(`${CELL_TEXT}:1-0`);
  });
});
