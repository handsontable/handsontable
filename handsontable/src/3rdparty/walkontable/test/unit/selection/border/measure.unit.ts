import Border from 'walkontable/selection/border/border';

describe('Border#measure', () => {
  const createBorder = () => {
    const border = Object.create(Border.prototype);

    border.disabled = false;
    border.disappear = jest.fn();

    return border as Border;
  };

  it('should answer null for a header-only selection without hiding the border', () => {
    // Hiding writes a style, and a write between two measurements brings back one layout per border.
    const border = createBorder();

    expect(border.measure([-1, 0, -1, 3])).toBeNull();
    expect(border.disappear).not.toHaveBeenCalled();
  });

  it('should answer null for a disabled border', () => {
    const border = createBorder();

    (border as unknown as { disabled: boolean }).disabled = true;

    expect(border.measure([0, 0, 1, 1])).toBeNull();
    expect(border.disappear).not.toHaveBeenCalled();
  });

  describe('with a rendered range', () => {
    // A table that renders rows 0-9 and columns 0-4. `getCell()` answers a negative number for any
    // cell that is not rendered, as `Table#getCell` does.
    const createBorderOnTable = ({
      firstRow = 0,
      lastRow = 9,
      firstColumn = 0,
      lastColumn = 4,
      getCell = () => -1,
    }: {
      firstRow?: number, lastRow?: number, firstColumn?: number, lastColumn?: number,
      getCell?: (coords: { row: number, col: number }) => HTMLElement | number,
    } = {}) => {
      const border = createBorder();

      (border as unknown as { wot: unknown }).wot = {
        rootWindow: window,
        domBindings: { geometryReader: {} },
        createCellCoords: (row: number, col: number) => ({ row, col }),
        wtTable: {
          getFirstRenderedRow: () => firstRow,
          getLastRenderedRow: () => lastRow,
          getFirstRenderedColumn: () => firstColumn,
          getLastRenderedColumn: () => lastColumn,
          getCell: jest.fn(getCell),
        },
      };

      return border;
    };

    it('should answer null without hiding the border when the overlay rendered only headers', () => {
      const border = createBorderOnTable({ firstRow: -1, lastRow: -1 });

      expect(border.measure([0, 0, 1, 1])).toBeNull();
      expect(border.disappear).not.toHaveBeenCalled();
    });

    it('should answer null without hiding the border when a range lies outside the rendered range', () => {
      const border = createBorderOnTable();

      expect(border.measure([2, 6, 4, 8])).toBeNull();
      expect(border.disappear).not.toHaveBeenCalled();
    });

    it('should answer null without hiding the border when the start cell of a range is not rendered', () => {
      const border = createBorderOnTable();

      expect(border.measure([1, 1, 3, 3])).toBeNull();
      expect(border.disappear).not.toHaveBeenCalled();
    });

    it('should answer null without hiding the border when a single cell is not rendered', () => {
      const border = createBorderOnTable();

      expect(border.measure([2, 2, 2, 2])).toBeNull();
      expect(border.disappear).not.toHaveBeenCalled();
    });
  });

  it('should hide the border in paint when the measurement is empty', () => {
    const border = createBorder();

    border.drawFrozenBoundaryEdge = jest.fn(() => false);
    border.paint([-1, 0, -1, 3], null);

    expect(border.disappear).toHaveBeenCalledTimes(1);
  });
});
