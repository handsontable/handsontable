import GhostTable from '../ghostTable';

/**
 * Runs `buildWidthsMap` and returns the ghost container element after it is detached.
 * The container is still referenced in memory after `buildWidthsMap` removes it from the document.
 *
 * @param {GhostTable} ghostTable Ghost table instance.
 * @param {number} layersCount Layer count for `setLayersCount`.
 * @returns {HTMLElement}
 */
function getDetachedGhostContainerAfterBuild(ghostTable, layersCount) {
  let captured;

  const spy = jest.spyOn(document.body, 'appendChild').mockImplementation(function mockAppendChild(node) {
    captured = node;

    return HTMLElement.prototype.appendChild.call(this, node);
  });

  ghostTable.setLayersCount(layersCount);
  ghostTable.buildWidthsMap();
  spy.mockRestore();

  return captured;
}

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
    const headersStateManager = {
      getHeaderSettings: (row, column) => getHeaderSettings(row, column),
      getHeaderTreeNode: () => null,
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
        isHidden: () => false,
      },
    };
    const ghostTable = new GhostTable({ hot: hotMock, headersStateManager });

    ghostTable.setLayersCount(2);
    ghostTable.buildWidthsMap();

    expect(ghostTable.widthsMap.getValueAtIndex(0)).toBeDefined();
    expect(ghostTable.widthsMap.getValueAtIndex(1)).toBeDefined();
    expect(ghostTable.widthsMap.getValueAtIndex(2)).toBeDefined();
  });

  it('should render the dropdown button in all header rows of the rendered ghost table', () => {
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
    const getHeaderSettings = (row, column) => {
      // Row 0: parent header spanning 2 columns
      if (row === 0 && column === 0) {
        return {
          label: 'Parent',
          colspan: 2,
          rowspan: 1,
          origColspan: 2,
          isPlaceholder: false,
          isHidden: false,
          isRowspanPlaceholder: false,
        };
      }

      if (row === 0 && column === 1) {
        return {
          label: '',
          isPlaceholder: true,
          isHidden: false,
          isRowspanPlaceholder: false,
        };
      }

      // Row 1: two leaf columns
      if (row === 1 && column === 0) {
        return {
          label: 'A',
          colspan: 1,
          rowspan: 1,
          isPlaceholder: false,
          isHidden: false,
          isRowspanPlaceholder: false,
        };
      }

      if (row === 1 && column === 1) {
        return {
          label: 'B',
          colspan: 1,
          rowspan: 1,
          isPlaceholder: false,
          isHidden: false,
          isRowspanPlaceholder: false,
        };
      }

      return undefined;
    };
    const headersStateManager = {
      getHeaderSettings: (row, column) => getHeaderSettings(row, column),
      getHeaderTreeNode: () => null,
    };
    const hotMock = {
      rootDocument: document,
      rootWindow: window,
      getCurrentThemeName: () => '',
      countCols: () => 2,
      toPhysicalColumn: visualColumn => visualColumn,
      getSettings: () => ({ dropdownMenu: true }),
      columnIndexMapper: {
        createAndRegisterIndexMap: () => widthsMapMock,
        isHidden: () => false,
      },
    };
    const ghostTable = new GhostTable({ hot: hotMock, headersStateManager });
    const container = getDetachedGhostContainerAfterBuild(ghostTable, 2);
    const renderedTable = container.querySelector('[data-ghost-table="rendered"]');
    const rows = renderedTable.querySelectorAll('tr');

    // Row 0 (parent header) SHOULD have a dropdown button. The ghost table includes
    // the button on all rows to account for the width it adds to spanning headers, ensuring
    // child columns are wide enough.
    expect(rows[0].querySelector('button.changeType')).not.toBeNull();

    // Row 1 (leaf/bottom row) SHOULD also have dropdown buttons.
    const bottomRowButtons = rows[1].querySelectorAll('button.changeType');

    expect(bottomRowButtons.length).toBe(2);
  });

  it('should add both dropdown and collapsible controls to ghost headers when needed', () => {
    const createHotMock = (isCollapsibleColumnsEnabled) => {
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

      return {
        hot: {
          rootDocument: document,
          rootWindow: window,
          getCurrentThemeName: () => '',
          countCols: () => 1,
          toPhysicalColumn: visualColumn => visualColumn,
          getSettings: () => ({
            dropdownMenu: true,
            collapsibleColumns: isCollapsibleColumnsEnabled,
          }),
          view: {
            countRenderableColumns: () => 1,
          },
          columnIndexMapper: {
            createAndRegisterIndexMap: () => widthsMapMock,
            getRenderableIndexesLength: () => 1,
            getVisualFromRenderableIndex: renderableColumn => renderableColumn,
            getRenderableFromVisualIndex: visualColumn => visualColumn,
            isHidden: () => false,
          },
        },
        widthsMapMock,
      };
    };
    const getHeaderSettings = (row, column) => {
      if (row === 0 && column === 0) {
        return {
          label: 'D/E',
          colspan: 1,
          origColspan: 2,
          rowspan: 1,
          isCollapsed: false,
          isPlaceholder: false,
          isHidden: false,
        };
      }

      return undefined;
    };
    const headersStateManager = {
      getHeaderSettings,
      getHeaderTreeNode: () => null,
    };
    const { hot: hotWithoutCollapsible } = createHotMock(false);
    const { hot: hotWithCollapsible } = createHotMock(true);
    const ghostTableWithoutCollapsible = new GhostTable({
      hot: hotWithoutCollapsible,
      headersStateManager,
    });
    const ghostTableWithCollapsible = new GhostTable({
      hot: hotWithCollapsible,
      headersStateManager,
    });
    const containerWithoutCollapsible = getDetachedGhostContainerAfterBuild(ghostTableWithoutCollapsible, 1);
    const containerWithCollapsible = getDetachedGhostContainerAfterBuild(ghostTableWithCollapsible, 1);

    expect(containerWithoutCollapsible.querySelector('button.changeType')).not.toBeNull();
    expect(containerWithoutCollapsible.querySelector('.collapsibleIndicator')).toBeNull();
    expect(containerWithCollapsible.querySelector('button.changeType')).not.toBeNull();
    expect(containerWithCollapsible.querySelector('.collapsibleIndicator')).not.toBeNull();
  });
});
