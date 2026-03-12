import { SelectionManager } from '../manager';

let mockScannedElements = [];

jest.mock('../scanner', () => ({
  SelectionScanner: jest.fn().mockImplementation(() => ({
    setActiveOverlay() {
      return this;
    },
    setActiveSelection() {
      return this;
    },
    scan() {
      return mockScannedElements;
    },
  })),
}));

function createSelectionsController(selection) {
  return {
    options: {},
    getFocus() {
      return selection;
    },
    createLayeredArea() {
      return selection;
    },
    [Symbol.iterator]: function* iterator() {
      yield selection;
    },
  };
}

describe('SelectionManager', () => {
  it('should not remove class names from cells that were not tracked by the manager', () => {
    const selectedCell = document.createElement('td');
    const untouchedCell = document.createElement('td');
    const row = document.createElement('tr');
    const tbody = document.createElement('tbody');
    const table = document.createElement('table');

    selectedCell.classList.add('current');
    untouchedCell.classList.add('current');
    row.appendChild(selectedCell);
    row.appendChild(untouchedCell);
    tbody.appendChild(row);
    table.appendChild(tbody);

    mockScannedElements = [selectedCell];

    const selection = {
      settings: {
        className: 'current',
        selectionType: 'focus',
      },
      addLocalHook: jest.fn(),
      isEmpty: () => false,
      getCorners: () => [0, 0, 0, 0],
    };

    const manager = new SelectionManager(createSelectionsController(selection));
    const activeOverlay = {
      wtTable: { TABLE: table },
      wtSettings: {
        getSetting: jest.fn().mockReturnValue(null),
      },
      getSetting: jest.fn(),
    };

    manager.setActiveOverlay(activeOverlay);
    manager.render(false);
    manager.render(true);

    expect(selectedCell.classList.contains('current')).toBe(true);
    expect(untouchedCell.classList.contains('current')).toBe(true);
  });
});
