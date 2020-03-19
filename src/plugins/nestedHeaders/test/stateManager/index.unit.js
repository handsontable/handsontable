import StateManager from 'handsontable/plugins/nestedHeaders/stateManager';

describe('StateManager', () => {
  describe('setState', () => {
    it('should generate headers matrix when the nested headers settings are correct', () => {
      /**
       * The column headers visualisation:
       *   +----+----+----+----+----+----+----+
       *   | A1 | A2                | A3      |
       *   +----+----+----+----+----+----+----+
       *   | B1 | B2                | B3      |
       *   +----+----+----+----+----+----+----+
       *   | C1 | C2 | C3           | C4      |
       *   +----+----+----+----+----+----+----+
       *   | D1 | D2 | D3 | D4 | D5 | D6      |
       *   +----+----+----+----+----+----+----+
       */
      const state = new StateManager();

      const isError = state.setState([
        ['A1', { label: 'A2', colspan: 4 }, { label: 'A3', colspan: 2 }],
        ['B1', { label: 'B2', colspan: 4 }, { label: 'B3', colspan: 2 }],
        ['C1', 'C2', { label: 'C3', colspan: 3 }, { label: 'C4', colspan: 2 }],
        ['D1', 'D2', 'D3', 'D4', 'D5', { label: 'D6', colspan: 2 }],
      ]);

      expect(isError).toBe(false);
      expect(state.getHeaderSettings(0, 0)).toEqual({
        label: 'A1', colspan: 1, origColspan: 1, hidden: false, isCollapsed: false, collapsible: false
      });
      expect(state.getHeaderSettings(0, 1)).toEqual({
        label: 'A2', colspan: 4, origColspan: 4, hidden: false, isCollapsed: false, collapsible: false
      });
      expect(state.getHeaderSettings(0, 2)).toEqual({
        label: '', colspan: 1, origColspan: 1, hidden: true, isCollapsed: false, collapsible: false
      });
      expect(state.getHeaderSettings(-1, 1)).toEqual({
        label: 'D2', colspan: 1, origColspan: 1, hidden: false, isCollapsed: false, collapsible: false
      });
      expect(state.getLayersCount()).toBe(4);
      expect(state.getColumnsCount()).toBe(7);
    });

    it('should reset internal state when the configuration includes overlapping headers', () => {
      /**
       * The column headers visualisation:
       *   +----+----+----+----+----+----+----+
       *   | A1 | A2                     | A3 |
       *   +----+----+----+----+----+----+----+
       *   | B1 | B2                | B3      |
       *   +----+----+----+----+----+----+----+
       *   | C1 | C2 | C3           | C4      |
       *   +----+----+----+----+----+----+----+
       *   | D1 | D2 | D3 | D4 | D5 | D6      |
       *   +----+----+----+----+----+----+----+
       */
      const state = new StateManager();

      const isError = state.setState([
        ['A1', { label: 'A2', colspan: 5 }, 'A3'],
        ['B1', { label: 'B2', colspan: 4 }, { label: 'B3', colspan: 2 }],
        ['C1', 'C2', { label: 'C3', colspan: 3 }, { label: 'C4', colspan: 2 }],
        ['D1', 'D2', 'D3', 'D4', 'D5', { label: 'D6', colspan: 2 }],
      ]);

      expect(isError).toBe(true);
      expect(state.getHeaderSettings(0, 0)).toBe(null);
      expect(state.getHeaderSettings(1, 0)).toBe(null);
      expect(state.getHeaderSettings(2, 0)).toBe(null);
      expect(state.getHeaderSettings(1, 3)).toBe(null);
      expect(state.getLayersCount()).toBe(0);
      expect(state.getColumnsCount()).toBe(0);
    });
  });

  describe('mergeStateWith', () => {
    it('TODO', () => {

    });
  });

  describe('mapState', () => {
    it('TODO', () => {

    });
  });

  describe('mapNodes', () => {
    it('TODO', () => {

    });
  });

  describe('triggerNodeModification', () => {
    it('TODO', () => {

    });
  });

  describe('rowCoordsToLevel', () => {
    it('should translate row coords into header level', () => {
      /**
       * The column headers visualisation:
       *   +----+----+----+----+----+----+----+
       *   | A1 | A2                | A3      |
       *   +----+----+----+----+----+----+----+
       *   | B1 | B2                | B3      |
       *   +----+----+----+----+----+----+----+
       *   | C1 | C2 | C3           | C4      |
       *   +----+----+----+----+----+----+----+
       *   | D1 | D2 | D3 | D4 | D5 | D6      |
       *   +----+----+----+----+----+----+----+
       */
      const state = new StateManager();

      state.setState([
        ['A1', { label: 'A2', colspan: 4 }, { label: 'A3', colspan: 2 }],
        ['B1', { label: 'B2', colspan: 4 }, { label: 'B3', colspan: 2 }],
        ['C1', 'C2', { label: 'C3', colspan: 3 }, { label: 'C4', colspan: 2 }],
        ['D1', 'D2', 'D3', 'D4', 'D5', { label: 'D6', colspan: 2 }],
      ]);

      expect(state.rowCoordsToLevel(10)).toBe(3);
      expect(state.rowCoordsToLevel(0)).toBe(3);
      expect(state.rowCoordsToLevel(-1)).toBe(3);
      expect(state.rowCoordsToLevel(-2)).toBe(2);
      expect(state.rowCoordsToLevel(-3)).toBe(1);
      expect(state.rowCoordsToLevel(-4)).toBe(0);
      expect(state.rowCoordsToLevel(-5)).toBe(0);
      expect(state.rowCoordsToLevel(-10)).toBe(0);
    });
  });

  describe('levelToRowCoords', () => {
    it('should translate header level into row coords', () => {
      /**
       * The column headers visualisation:
       *   +----+----+----+----+----+----+----+
       *   | A1 | A2                | A3      |
       *   +----+----+----+----+----+----+----+
       *   | B1 | B2                | B3      |
       *   +----+----+----+----+----+----+----+
       *   | C1 | C2 | C3           | C4      |
       *   +----+----+----+----+----+----+----+
       *   | D1 | D2 | D3 | D4 | D5 | D6      |
       *   +----+----+----+----+----+----+----+
       */
      const state = new StateManager();

      state.setState([
        ['A1', { label: 'A2', colspan: 4 }, { label: 'A3', colspan: 2 }],
        ['B1', { label: 'B2', colspan: 4 }, { label: 'B3', colspan: 2 }],
        ['C1', 'C2', { label: 'C3', colspan: 3 }, { label: 'C4', colspan: 2 }],
        ['D1', 'D2', 'D3', 'D4', 'D5', { label: 'D6', colspan: 2 }],
      ]);

      expect(state.levelToRowCoords(-10)).toBe(-4);
      expect(state.levelToRowCoords(0)).toBe(-4);
      expect(state.levelToRowCoords(1)).toBe(-3);
      expect(state.levelToRowCoords(2)).toBe(-2);
      expect(state.levelToRowCoords(3)).toBe(-1);
      expect(state.levelToRowCoords(4)).toBe(-1);
      expect(state.levelToRowCoords(5)).toBe(-1);
      expect(state.levelToRowCoords(10)).toBe(-1);
    });
  });

  describe('getHeaderSettings', () => {
    it('should return proper header settings using negative and positive header levels', () => {
      /**
       * The column headers visualisation:
       *   +----+----+----+----+----+----+----+
       *   | A1 | A2                | A3      |
       *   +----+----+----+----+----+----+----+
       *   | B1 | B2                | B3      |
       *   +----+----+----+----+----+----+----+
       *   | C1 | C2 | C3           | C4      |
       *   +----+----+----+----+----+----+----+
       *   | D1 | D2 | D3 | D4 | D5 | D6      |
       *   +----+----+----+----+----+----+----+
       */
      const state = new StateManager();

      state.setState([
        ['A1', { label: 'A2', colspan: 4 }, { label: 'A3', colspan: 2 }],
        ['B1', { label: 'B2', colspan: 4 }, { label: 'B3', colspan: 2 }],
        ['C1', 'C2', { label: 'C3', colspan: 3 }, { label: 'C4', colspan: 2 }],
        ['D1', 'D2', 'D3', 'D4', 'D5', { label: 'D6', colspan: 2 }],
      ]);

      {
        const headerSettings = { label: 'A1', colspan: 1, origColspan: 1, hidden: false, isCollapsed: false, collapsible: false };

        expect(state.getHeaderSettings(0, 0)).toEqual(headerSettings);
        expect(state.getHeaderSettings(-4, 0)).toEqual(headerSettings);
      }
      {
        const headerSettings = { label: 'A2', colspan: 4, origColspan: 4, hidden: false, isCollapsed: false, collapsible: false };

        expect(state.getHeaderSettings(0, 1)).toEqual(headerSettings);
        expect(state.getHeaderSettings(-4, 1)).toEqual(headerSettings);
      }
      {
        const headerSettings = { label: '', colspan: 1, origColspan: 1, hidden: true, isCollapsed: false, collapsible: false };

        expect(state.getHeaderSettings(0, 2)).toEqual(headerSettings);
        expect(state.getHeaderSettings(-4, 2)).toEqual(headerSettings);
      }
      {
        const headerSettings = { label: 'D2', colspan: 1, origColspan: 1, hidden: false, isCollapsed: false, collapsible: false };

        expect(state.getHeaderSettings(3, 1)).toEqual(headerSettings);
        expect(state.getHeaderSettings(-1, 1)).toEqual(headerSettings);
      }
    });

    it('should return null when header level is higher than passed nested header configuration', () => {
      const state = new StateManager();

      state.setState([
        ['A1', { label: 'A2', colspan: 4 }, { label: 'A3', colspan: 2 }],
        ['B1', { label: 'B2', colspan: 4 }, { label: 'B3', colspan: 2 }],
        ['C1', 'C2', { label: 'C3', colspan: 3 }, { label: 'C4', colspan: 2 }],
        ['D1', 'D2', 'D3', 'D4', 'D5', { label: 'D6', colspan: 2 }],
      ]);

      expect(state.getHeaderSettings(4, 0)).toBe(null);
    });

    it('should return default settings when column index exceeds total columns defined in the nested header configuration', () => {
      const state = new StateManager();

      state.setState([
        ['A1', { label: 'A2', colspan: 4 }, { label: 'A3', colspan: 2 }],
        ['B1', { label: 'B2', colspan: 4 }, { label: 'B3', colspan: 2 }],
        ['C1', 'C2', { label: 'C3', colspan: 3 }, { label: 'C4', colspan: 2 }],
        ['D1', 'D2', 'D3', 'D4', 'D5', { label: 'D6', colspan: 2 }],
      ]);

      const columnSettings = state.getHeaderSettings(0, 100);

      expect(columnSettings).toEqual({ label: '', colspan: 1, origColspan: 1, hidden: false, isCollapsed: false, collapsible: false });
      expect(state.getHeaderSettings(0, 101)).toEqual({ label: '', colspan: 1, origColspan: 1, hidden: false, isCollapsed: false, collapsible: false });
      expect(state.getHeaderSettings(0, 101)).not.toBe(columnSettings);
    });
  });

  describe('findLeftMostColumnIndex', () => {
    it('should return proper column index', () => {
      /**
       * The column headers visualisation:
       *   +----+----+----+----+----+----+----+
       *   | A1 | A2                | A3      |
       *   +----+----+----+----+----+----+----+
       *   | B1 | B2                | B3      |
       *   +----+----+----+----+----+----+----+
       *   | C1 | C2 | C3           | C4      |
       *   +----+----+----+----+----+----+----+
       *   | D1 | D2 | D3 | D4 | D5 | D6      |
       *   +----+----+----+----+----+----+----+
       */
      const state = new StateManager();

      state.setState([
        ['A1', { label: 'A2', colspan: 4 }, { label: 'A3', colspan: 2 }],
        ['B1', { label: 'B2', colspan: 4 }, { label: 'B3', colspan: 2 }],
        ['C1', 'C2', { label: 'C3', colspan: 3 }, { label: 'C4', colspan: 2 }],
        ['D1', 'D2', 'D3', 'D4', 'D5', { label: 'D6', colspan: 2 }],
      ]);

      // header level = 0
      expect(state.findLeftMostColumnIndex(0, 0)).toBe(0);

      expect(state.findLeftMostColumnIndex(0, 1)).toBe(1);
      expect(state.findLeftMostColumnIndex(0, 2)).toBe(1);
      expect(state.findLeftMostColumnIndex(0, 3)).toBe(1);
      expect(state.findLeftMostColumnIndex(0, 4)).toBe(1);

      expect(state.findLeftMostColumnIndex(0, 5)).toBe(5);
      expect(state.findLeftMostColumnIndex(0, 6)).toBe(5);

      // header level = 1
      expect(state.findLeftMostColumnIndex(1, 0)).toBe(0);

      expect(state.findLeftMostColumnIndex(1, 1)).toBe(1);
      expect(state.findLeftMostColumnIndex(1, 2)).toBe(1);
      expect(state.findLeftMostColumnIndex(1, 3)).toBe(1);
      expect(state.findLeftMostColumnIndex(1, 4)).toBe(1);

      expect(state.findLeftMostColumnIndex(1, 5)).toBe(5);
      expect(state.findLeftMostColumnIndex(1, 6)).toBe(5);

      // header level = 2
      expect(state.findLeftMostColumnIndex(2, 0)).toBe(0);

      expect(state.findLeftMostColumnIndex(2, 1)).toBe(1);

      expect(state.findLeftMostColumnIndex(2, 2)).toBe(2);
      expect(state.findLeftMostColumnIndex(2, 3)).toBe(2);
      expect(state.findLeftMostColumnIndex(2, 4)).toBe(2);

      expect(state.findLeftMostColumnIndex(2, 5)).toBe(5);
      expect(state.findLeftMostColumnIndex(2, 6)).toBe(5);

      // header level = 3
      expect(state.findLeftMostColumnIndex(3, 0)).toBe(0);
      expect(state.findLeftMostColumnIndex(3, 1)).toBe(1);
      expect(state.findLeftMostColumnIndex(3, 2)).toBe(2);
      expect(state.findLeftMostColumnIndex(3, 3)).toBe(3);
      expect(state.findLeftMostColumnIndex(3, 4)).toBe(4);

      expect(state.findLeftMostColumnIndex(3, 5)).toBe(5);
      expect(state.findLeftMostColumnIndex(3, 6)).toBe(5);
    });
  });

  describe('getLayersCount', () => {
    it('should return proper layers count based on user-defined settings', () => {
      /**
       * The column headers visualisation:
       *   +----+----+----+----+----+----+----+
       *   | A1 | A2                | A3      |
       *   +----+----+----+----+----+----+----+
       *   | B1 | B2                | B3      |
       *   +----+----+----+----+----+----+----+
       *   | C1 | C2 | C3           | C4      |
       *   +----+----+----+----+----+----+----+
       *   | D1 | D2 | D3 | D4 | D5 | D6      |
       *   +----+----+----+----+----+----+----+
       */
      const state = new StateManager();

      state.setState([
        ['A1', { label: 'A2', colspan: 4 }, { label: 'A3', colspan: 2 }],
        ['B1', { label: 'B2', colspan: 4 }, { label: 'B3', colspan: 2 }],
        ['C1', 'C2', { label: 'C3', colspan: 3 }, { label: 'C4', colspan: 2 }],
        ['D1', 'D2', 'D3', 'D4', 'D5', { label: 'D6', colspan: 2 }],
      ]);

      expect(state.getLayersCount()).toBe(4);
    });
  });

  describe('getColumnsCount', () => {
    it('should return proper columns count based on user-defined settings', () => {
      /**
       * The column headers visualisation:
       *   +----+----+----+----+----+----+----+
       *   | A1 | A2                | A3      |
       *   +----+----+----+----+----+----+----+
       *   | B1 | B2                | B3      |
       *   +----+----+----+----+----+----+----+
       *   | C1 | C2 | C3           | C4      |
       *   +----+----+----+----+----+----+----+
       *   | D1 | D2 | D3 | D4 | D5 | D6      |
       *   +----+----+----+----+----+----+----+
       */
      const state = new StateManager();

      state.setState([
        ['A1', { label: 'A2', colspan: 4 }, { label: 'A3', colspan: 2 }],
        ['B1', { label: 'B2', colspan: 4 }, { label: 'B3', colspan: 2 }],
        ['C1', 'C2', { label: 'C3', colspan: 3 }, { label: 'C4', colspan: 2 }],
        ['D1', 'D2', 'D3', 'D4', 'D5', { label: 'D6', colspan: 2 }],
      ]);

      expect(state.getColumnsCount()).toBe(7);
    });
  });

  describe('clear', () => {
    it('should clear the data', () => {
      /**
       * The column headers visualisation:
       *   +----+----+----+----+----+----+----+
       *   | A1 | A2                | A3      |
       *   +----+----+----+----+----+----+----+
       *   | B1 | B2                | B3      |
       *   +----+----+----+----+----+----+----+
       *   | C1 | C2 | C3           | C4      |
       *   +----+----+----+----+----+----+----+
       *   | D1 | D2 | D3 | D4 | D5 | D6      |
       *   +----+----+----+----+----+----+----+
       */
      const state = new StateManager();

      state.setState([
        ['A1', { label: 'A2', colspan: 4 }, { label: 'A3', colspan: 2 }],
        ['B1', { label: 'B2', colspan: 4 }, { label: 'B3', colspan: 2 }],
        ['C1', 'C2', { label: 'C3', colspan: 3 }, { label: 'C4', colspan: 2 }],
        ['D1', 'D2', 'D3', 'D4', 'D5', { label: 'D6', colspan: 2 }],
      ]);

      state.clear();

      expect(state.getHeaderSettings(0, 0)).toBe(null);
      expect(state.getLayersCount()).toBe(0);
      expect(state.getColumnsCount()).toBe(0);
    });
  });
});
