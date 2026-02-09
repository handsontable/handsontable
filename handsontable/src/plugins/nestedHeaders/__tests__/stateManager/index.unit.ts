import {
  createColspanSettings,
  createPlaceholder,
} from 'handsontable/plugins/nestedHeaders/__tests__/helpers';
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
      expect(state.getHeaderSettings(0, 0)).toEqual(createColspanSettings({
        label: 'A1',
      }));
      expect(state.getHeaderSettings(0, 1)).toEqual(createColspanSettings({
        label: 'A2',
        colspan: 4,
        origColspan: 4,
      }));
      expect(state.getHeaderSettings(0, 2)).toEqual(createPlaceholder());
      expect(state.getHeaderSettings(-1, 1)).toEqual(createColspanSettings({
        label: 'D2',
      }));
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
      expect(state.getHeaderSettings(3, 3)).toBe(null);
      expect(state.getLayersCount()).toBe(0);
      expect(state.getColumnsCount()).toBe(0);
    });
  });

  describe('mergeStateWith', () => {
    it('should merge additional settings using negative and positive header levels', () => {
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

      state.mergeStateWith([
        { row: -4, col: 0, collapsible: 'test-a' },
        { row: 1, col: 1, test1: 'test-b' },
        { row: 2, col: 2, test2: 'test-c', test3: 'test-d' },
        { row: -2, col: 1, test4: 'test-e' },
        { row: 3, col: 1, collapsible: 'test-d' },
      ]);

      expect(state.getHeaderSettings(0, 0)).toEqual(expect.objectContaining({
        label: 'A1',
        collapsible: 'test-a',
      }));
      expect(state.getHeaderSettings(1, 1)).toEqual(expect.not.objectContaining({
        test1: 'test-b',
      }));
      expect(state.getHeaderSettings(2, 2)).toEqual(expect.not.objectContaining({
        test2: 'test-c',
        test3: 'test-d',
      }));
      expect(state.getHeaderSettings(2, 1)).toEqual(expect.not.objectContaining({
        test4: 'test-e',
      }));
      expect(state.getHeaderSettings(3, 1)).toEqual(expect.objectContaining({
        label: 'D2',
        collapsible: 'test-d',
      }));
    });
  });

  describe('mapState', () => {
    it('should merge additional settings', () => {
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
      const mapSpy = jasmine.createSpy();
      const state = new StateManager();

      state.setState([
        ['A1', { label: 'A2', colspan: 4 }, { label: 'A3', colspan: 2 }],
        ['B1', { label: 'B2', colspan: 4 }, { label: 'B3', colspan: 2 }],
        ['C1', 'C2', { label: 'C3', colspan: 3 }, { label: 'C4', colspan: 2 }],
        ['D1', 'D2', 'D3', 'D4', 'D5', { label: 'D6', colspan: 2 }],
      ]);

      mapSpy.and.callFake((headerSettings) => {
        if (headerSettings.label === 'A1') {
          return { test: 'test-a', collapsible: 'test-b' };
        }
      });
      state.mapState(mapSpy);

      expect(mapSpy).toHaveBeenCalledTimes(28);
      expect(state.getHeaderSettings(0, 0)).toEqual(expect.objectContaining({
        label: 'A1',
        collapsible: 'test-b',
      }));
      expect(state.getHeaderSettings(0, 0)).toEqual(expect.not.objectContaining({
        test: 'test-a',
      }));
    });
  });

  describe('mapNodes', () => {
    it('should map all tree nodes', () => {
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
      const mapSpy = jasmine.createSpy();
      const state = new StateManager();

      state.setState([
        ['A1', { label: 'A2', colspan: 4 }, { label: 'A3', colspan: 2 }],
        ['B1', { label: 'B2', colspan: 4 }, { label: 'B3', colspan: 2 }],
        ['C1', 'C2', { label: 'C3', colspan: 3 }, { label: 'C4', colspan: 2 }],
        ['D1', 'D2', 'D3', 'D4', 'D5', { label: 'D6', colspan: 2 }],
      ]);

      mapSpy.and.callFake(treeData => treeData.label);

      const nodesData = state.mapNodes(mapSpy);

      expect(mapSpy).toHaveBeenCalledTimes(16);
      expect(nodesData).toEqual([
        /* root 1 */ 'A1', 'B1', 'C1', 'D1',
        /* root 2 */ 'A2', 'B2', 'C2', 'C3', 'D2', 'D3', 'D4', 'D5',
        /* root 3 */ 'A3', 'B3', 'C4', 'D6',
      ]);
    });
  });

  describe('triggerNodeModification', () => {
    it('should update the matrix after collapsing', () => {
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

      const modResult = state.triggerNodeModification('collapse', 0, 1);

      expect(modResult).toEqual({
        affectedColumns: [2, 3, 4],
        colspanCompensation: 3,
        rollbackModification: jasmine.any(Function),
      });
      expect(state.getHeaderSettings(0, 1)).toEqual(expect.objectContaining({
        label: 'A2',
        colspan: 1,
        origColspan: 4,
        isCollapsed: true,
        isHidden: false,
      }));
      expect(state.getHeaderSettings(1, 1)).toEqual(expect.objectContaining({
        label: 'B2',
        colspan: 1,
        origColspan: 4,
        isCollapsed: true,
        isHidden: false,
      }));
      expect(state.getHeaderSettings(2, 2)).toEqual(expect.objectContaining({
        label: 'C3',
        colspan: 3,
        origColspan: 3,
        isCollapsed: false,
        isHidden: true,
      }));
    });

    it('should update the matrix after expanding', () => {
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

      state.triggerNodeModification('collapse', 0, 1);

      const modResult = state.triggerNodeModification('expand', 0, 1);

      expect(modResult).toEqual({
        affectedColumns: [2, 3, 4],
        colspanCompensation: 3,
        rollbackModification: jasmine.any(Function),
      });
      expect(state.getHeaderSettings(0, 1)).toEqual(expect.objectContaining({
        label: 'A2',
        colspan: 4,
        origColspan: 4,
        isCollapsed: false,
        isHidden: false,
      }));
      expect(state.getHeaderSettings(1, 1)).toEqual(expect.objectContaining({
        label: 'B2',
        colspan: 4,
        origColspan: 4,
        isCollapsed: false,
        isHidden: false,
      }));
      expect(state.getHeaderSettings(2, 2)).toEqual(expect.objectContaining({
        label: 'C3',
        colspan: 3,
        origColspan: 3,
        isCollapsed: false,
        isHidden: false,
      }));
    });
  });

  describe('triggerColumnModification', () => {
    it('should internally call "triggerNodeModification" method', () => {
      const state = new StateManager();

      spyOn(state, 'triggerNodeModification').and.returnValue('test');

      const modResult = state.triggerColumnModification('collapse', 15);

      expect(modResult).toBe('test');
      expect(state.triggerNodeModification).toHaveBeenCalledTimes(1);
      expect(state.triggerNodeModification).toHaveBeenCalledWith('collapse', -1, 15);
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

      expect(state.rowCoordsToLevel(10)).toBe(null);
      expect(state.rowCoordsToLevel(4)).toBe(null);
      expect(state.rowCoordsToLevel(3)).toBe(null);
      expect(state.rowCoordsToLevel(2)).toBe(null);
      expect(state.rowCoordsToLevel(1)).toBe(null);
      expect(state.rowCoordsToLevel(0)).toBe(null);
      expect(state.rowCoordsToLevel(-1)).toBe(3);
      expect(state.rowCoordsToLevel(-2)).toBe(2);
      expect(state.rowCoordsToLevel(-3)).toBe(1);
      expect(state.rowCoordsToLevel(-4)).toBe(0);
      expect(state.rowCoordsToLevel(-5)).toBe(null);
      expect(state.rowCoordsToLevel(-10)).toBe(null);
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

      expect(state.levelToRowCoords(-10)).toBe(null);
      expect(state.levelToRowCoords(-4)).toBe(null);
      expect(state.levelToRowCoords(-3)).toBe(null);
      expect(state.levelToRowCoords(-2)).toBe(null);
      expect(state.levelToRowCoords(-1)).toBe(null);
      expect(state.levelToRowCoords(0)).toBe(-4);
      expect(state.levelToRowCoords(1)).toBe(-3);
      expect(state.levelToRowCoords(2)).toBe(-2);
      expect(state.levelToRowCoords(3)).toBe(-1);
      expect(state.levelToRowCoords(4)).toBe(null);
      expect(state.levelToRowCoords(5)).toBe(null);
      expect(state.levelToRowCoords(10)).toBe(null);
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

      expect(state.getHeaderSettings(0, 0)).toEqual(createColspanSettings({
        label: 'A1',
      }));
      expect(state.getHeaderSettings(-4, 0)).toEqual(createColspanSettings({
        label: 'A1',
      }));
      expect(state.getHeaderSettings(0, 1)).toEqual(createColspanSettings({
        label: 'A2',
        colspan: 4,
        origColspan: 4,
      }));
      expect(state.getHeaderSettings(-4, 1)).toEqual(createColspanSettings({
        label: 'A2',
        colspan: 4,
        origColspan: 4,
      }));
      expect(state.getHeaderSettings(0, 2)).toEqual(createPlaceholder());
      expect(state.getHeaderSettings(-4, 2)).toEqual(createPlaceholder());
      expect(state.getHeaderSettings(3, 1)).toEqual(createColspanSettings({
        label: 'D2',
      }));
      expect(state.getHeaderSettings(-1, 1)).toEqual(createColspanSettings({
        label: 'D2',
      }));
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

    it('should return null when column index exceeds total columns defined in the nested header configuration', () => {
      const state = new StateManager();

      state.setState([
        ['A1', { label: 'A2', colspan: 4 }, { label: 'A3', colspan: 2 }],
        ['B1', { label: 'B2', colspan: 4 }, { label: 'B3', colspan: 2 }],
        ['C1', 'C2', { label: 'C3', colspan: 3 }, { label: 'C4', colspan: 2 }],
        ['D1', 'D2', 'D3', 'D4', 'D5', { label: 'D6', colspan: 2 }],
      ]);

      expect(state.getHeaderSettings(0, 100)).toBe(null);
      expect(state.getHeaderSettings(0, 101)).toBe(null);
    });
  });

  describe('getHeaderTreeNode', () => {
    it('should return proper tree node using negative and positive header levels', () => {
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

      expect(state.getHeaderTreeNode(0, 0).data.label).toBe('A1');
      expect(state.getHeaderTreeNode(-4, 0).data.label).toBe('A1');
      expect(state.getHeaderTreeNode(0, 1).data.label).toBe('A2');
      expect(state.getHeaderTreeNode(-4, 1).data.label).toBe('A2');
      expect(state.getHeaderTreeNode(0, 2).data.label).toBe('A2');
      expect(state.getHeaderTreeNode(-4, 2).data.label).toBe('A2');
      expect(state.getHeaderTreeNode(3, 1).data.label).toBe('D2');
      expect(state.getHeaderTreeNode(-1, 1).data.label).toBe('D2');
    });

    it('should return null when header level is higher than passed nested header configuration', () => {
      const state = new StateManager();

      state.setState([
        ['A1', { label: 'A2', colspan: 4 }, { label: 'A3', colspan: 2 }],
        ['B1', { label: 'B2', colspan: 4 }, { label: 'B3', colspan: 2 }],
        ['C1', 'C2', { label: 'C3', colspan: 3 }, { label: 'C4', colspan: 2 }],
        ['D1', 'D2', 'D3', 'D4', 'D5', { label: 'D6', colspan: 2 }],
      ]);

      expect(state.getHeaderTreeNode(4, 0)).toBe(null);
    });

    it('should return null when column index exceeds total columns defined in the nested header configuration', () => {
      const state = new StateManager();

      state.setState([
        ['A1', { label: 'A2', colspan: 4 }, { label: 'A3', colspan: 2 }],
        ['B1', { label: 'B2', colspan: 4 }, { label: 'B3', colspan: 2 }],
        ['C1', 'C2', { label: 'C3', colspan: 3 }, { label: 'C4', colspan: 2 }],
        ['D1', 'D2', 'D3', 'D4', 'D5', { label: 'D6', colspan: 2 }],
      ]);

      expect(state.getHeaderTreeNode(0, 100)).toBe(null);
      expect(state.getHeaderTreeNode(0, 101)).toBe(null);
    });
  });

  describe('getHeaderTreeNodeData', () => {
    it('should call `getHeaderTreeNode` internally', () => {
      const state = new StateManager();
      const nodeData = { data: { label: 'test' } };

      spyOn(state, 'getHeaderTreeNode').and.returnValue(nodeData);

      const result = state.getHeaderTreeNodeData(1, 2);

      expect(result).toEqual({ label: 'test' });
      expect(result).not.toBe(nodeData);
      expect(state.getHeaderTreeNode).toHaveBeenCalledWith(1, 2);
      expect(state.getHeaderTreeNode).toHaveBeenCalledTimes(1);
    });

    it('should return `null` when the `getHeaderTreeNode` method returns `null`', () => {
      const state = new StateManager();

      spyOn(state, 'getHeaderTreeNode').and.returnValue(null);

      const result = state.getHeaderTreeNodeData(1, 2);

      expect(result).toBe(null);
    });
  });

  describe('findTopMostEntireHeaderLevel', () => {
    it('should return proper top-most header levels', () => {
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

      // out of range
      expect(state.findTopMostEntireHeaderLevel(0, -10)).toBe(-4);
      expect(state.findTopMostEntireHeaderLevel(0, 100)).toBe(-4);
      expect(state.findTopMostEntireHeaderLevel(-10, 0)).toBe(-4);
      expect(state.findTopMostEntireHeaderLevel(100, 0)).toBe(-4);
      expect(state.findTopMostEntireHeaderLevel(100, 100)).toBe(-4);
      expect(state.findTopMostEntireHeaderLevel(-1, -1)).toBe(-4);

      // within ranges
      expect(state.findTopMostEntireHeaderLevel(0)).toBe(-4);
      expect(state.findTopMostEntireHeaderLevel(1, 2)).toBe(-2);
      expect(state.findTopMostEntireHeaderLevel(1, 3)).toBe(-2);
      expect(state.findTopMostEntireHeaderLevel(1, 4)).toBe(-4);
      expect(state.findTopMostEntireHeaderLevel(4, 5)).toBe(-1);
      expect(state.findTopMostEntireHeaderLevel(4, 6)).toBe(-4);
      expect(state.findTopMostEntireHeaderLevel(6, 6)).toBe(-1);
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

      // out of range
      expect(state.findLeftMostColumnIndex(0, -10)).toBe(-10);
      expect(state.findLeftMostColumnIndex(0, -1)).toBe(-1);
      expect(state.findLeftMostColumnIndex(0, 100)).toBe(100);

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

  describe('findRightMostColumnIndex', () => {
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

      // out of range
      expect(state.findRightMostColumnIndex(0, -10)).toBe(-10);
      expect(state.findRightMostColumnIndex(0, -1)).toBe(-1);
      expect(state.findRightMostColumnIndex(0, 100)).toBe(100);

      // header level = 0
      expect(state.findRightMostColumnIndex(0, 0)).toBe(0);

      expect(state.findRightMostColumnIndex(0, 1)).toBe(4);
      expect(state.findRightMostColumnIndex(0, 2)).toBe(4);
      expect(state.findRightMostColumnIndex(0, 3)).toBe(4);
      expect(state.findRightMostColumnIndex(0, 4)).toBe(4);

      expect(state.findRightMostColumnIndex(0, 5)).toBe(6);
      expect(state.findRightMostColumnIndex(0, 6)).toBe(6);

      // header level = 1
      expect(state.findRightMostColumnIndex(1, 0)).toBe(0);

      expect(state.findRightMostColumnIndex(1, 1)).toBe(4);
      expect(state.findRightMostColumnIndex(1, 2)).toBe(4);
      expect(state.findRightMostColumnIndex(1, 3)).toBe(4);
      expect(state.findRightMostColumnIndex(1, 4)).toBe(4);

      expect(state.findRightMostColumnIndex(1, 5)).toBe(6);
      expect(state.findRightMostColumnIndex(1, 6)).toBe(6);

      // header level = 2
      expect(state.findRightMostColumnIndex(2, 0)).toBe(0);

      expect(state.findRightMostColumnIndex(2, 1)).toBe(1);

      expect(state.findRightMostColumnIndex(2, 2)).toBe(4);
      expect(state.findRightMostColumnIndex(2, 3)).toBe(4);
      expect(state.findRightMostColumnIndex(2, 4)).toBe(4);

      expect(state.findRightMostColumnIndex(2, 5)).toBe(6);
      expect(state.findRightMostColumnIndex(2, 6)).toBe(6);

      // header level = 3
      expect(state.findRightMostColumnIndex(3, 0)).toBe(0);
      expect(state.findRightMostColumnIndex(3, 1)).toBe(1);
      expect(state.findRightMostColumnIndex(3, 2)).toBe(2);
      expect(state.findRightMostColumnIndex(3, 3)).toBe(3);
      expect(state.findRightMostColumnIndex(3, 4)).toBe(4);

      expect(state.findRightMostColumnIndex(3, 5)).toBe(6);
      expect(state.findRightMostColumnIndex(3, 6)).toBe(6);
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
