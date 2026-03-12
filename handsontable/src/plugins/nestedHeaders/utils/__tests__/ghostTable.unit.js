import GhostTable from '../ghostTable';

describe('GhostTable', () => {
  it('should build widths map for all renderable columns when rowspan placeholders are omitted', () => {
    const widthsMapMock = {
      data: new Map(),
      setValueAtIndex(index, value) {
        this.data.set(index, value);
      },
      getValueAtIndex(index) {
        return this.data.get(index);
      },
      clear() {
        this.data.clear();
      },
    };
    const hotMock = {
      rootDocument: document,
      rootWindow: window,
      getCurrentThemeName: () => '',
      countCols: () => 3,
      toPhysicalColumn: visualColumn => visualColumn,
      getSettings: () => ({ dropdownMenu: true }),
      view: {
        countRenderableColumns: () => 3,
      },
      columnIndexMapper: {
        createAndRegisterIndexMap: () => widthsMapMock,
        getRenderableIndexesLength: () => 3,
        getVisualFromRenderableIndex: renderableColumn => renderableColumn,
        getRenderableFromVisualIndex: visualColumn => visualColumn,
      },
    };
    const getHeaderSettings = (row, column) => {
      if (row === 0 && column === 0) {
        return {
          label: 'This is a very long header title',
          colspan: 1,
          rowspan: 2,
          isPlaceholder: false,
          isHidden: false,
        };
      }

      if (row === 0 && column === 1) {
        return {
          label: 'B',
          colspan: 1,
          rowspan: 1,
          isPlaceholder: false,
          isHidden: false,
        };
      }

      if (row === 0 && column === 2) {
        return {
          label: 'C',
          colspan: 1,
          rowspan: 1,
          isPlaceholder: false,
          isHidden: false,
        };
      }

      if (row === 1 && column === 0) {
        return {
          label: '',
          isPlaceholder: true,
          isRowspanPlaceholder: true,
          isHidden: false,
        };
      }

      if (row === 1 && column === 1) {
        return {
          label: 'B2',
          colspan: 1,
          rowspan: 1,
          isPlaceholder: false,
          isHidden: false,
        };
      }

      if (row === 1 && column === 2) {
        return {
          label: 'C2',
          colspan: 1,
          rowspan: 1,
          isPlaceholder: false,
          isHidden: false,
        };
      }

      return undefined;
    };
    const ghostTable = new GhostTable(hotMock, getHeaderSettings);

    ghostTable.setLayersCount(2);
    ghostTable.buildWidthsMap();

    expect(ghostTable.widthsMap.getValueAtIndex(0)).toBeDefined();
    expect(ghostTable.widthsMap.getValueAtIndex(1)).toBeDefined();
    expect(ghostTable.widthsMap.getValueAtIndex(2)).toBeDefined();
  });
});
