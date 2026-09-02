import { SelectionScanner } from '../../../src/selection/scanner';
import type Selection from '../../../src/selection/selection';

describe('SelectionScanner', () => {
  describe('scan()', () => {
    /**
     * Builds a scanner with a stubbed active selection of the given type and spies
     * on every per-kind scan method.
     *
     * @param {string} selectionType The selection type under test.
     * @returns {{ scanner: SelectionScanner, spies: Record<string, jest.SpyInstance> }}
     */
    function makeScanner(selectionType: string) {
      const scanner = new SelectionScanner();

      scanner.setActiveSelection({ settings: { selectionType } } as unknown as Selection);

      const spies = {
        cells: jest.spyOn(scanner, 'scanCellsRange').mockImplementation(() => undefined),
        columnHeaders: jest.spyOn(scanner, 'scanColumnsInHeadersRange').mockImplementation(() => undefined),
        rowHeaders: jest.spyOn(scanner, 'scanRowsInHeadersRange').mockImplementation(() => undefined),
        rowCells: jest.spyOn(scanner, 'scanRowsInCellsRange').mockImplementation(() => undefined),
        columnCells: jest.spyOn(scanner, 'scanColumnsInCellsRange').mockImplementation(() => undefined),
      };

      return { scanner, spies };
    }

    it('scans only the cells range for the `custom-selection` type', () => {
      const { scanner, spies } = makeScanner('custom-selection');

      scanner.scan();

      expect(spies.cells).toHaveBeenCalledTimes(1);
      expect(spies.columnHeaders).not.toHaveBeenCalled();
      expect(spies.rowHeaders).not.toHaveBeenCalled();
      expect(spies.rowCells).not.toHaveBeenCalled();
      expect(spies.columnCells).not.toHaveBeenCalled();
    });

    it('scans nothing for an unknown selection type', () => {
      const { scanner, spies } = makeScanner('unknown-type');

      scanner.scan();

      expect(spies.cells).not.toHaveBeenCalled();
      expect(spies.columnHeaders).not.toHaveBeenCalled();
      expect(spies.rowHeaders).not.toHaveBeenCalled();
      expect(spies.rowCells).not.toHaveBeenCalled();
      expect(spies.columnCells).not.toHaveBeenCalled();
    });
  });
});
