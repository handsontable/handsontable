import ConditionCollection from 'handsontable/plugins/filters/conditionCollection';
import { conditions } from 'handsontable/plugins/filters/conditionRegisterer';
import { OPERATION_AND, OPERATION_OR } from 'handsontable/plugins/filters/constants';
import { LinkedPhysicalIndexToValueMap as IndexMap } from 'handsontable/translations';

describe('ConditionCollection', () => {
  it('should be initialized and accessible from the plugin', () => {
    expect(ConditionCollection).toBeDefined();
  });

  describe('isEmpty', () => {
    it('should return `true` when condition collection is empty', () => {
      const indexMap = new IndexMap();
      const conditionCollection = new ConditionCollection(indexMap);
      const conditionMock = {};

      // Mocking that the index mapper is prepared for 5 columns.
      indexMap.init(5);

      spyOn(indexMap, 'getValueAtIndex').and.returnValue(null);

      expect(conditionCollection.isEmpty()).toBe(true);

      indexMap.setValueAtIndex(3, {
        operation: OPERATION_AND,
        conditions: [conditionMock]
      });

      expect(conditionCollection.isEmpty()).toBe(false);
    });
  });

  describe('isMatch', () => {
    it('should check is value is matched to the conditions at specified column index', () => {
      const indexMap = new IndexMap();
      const conditionCollection = new ConditionCollection(indexMap);
      const conditionsMock = [{ a: 'b' }];
      const stateForColumnMock = {
        operation: OPERATION_AND,
        conditions: conditionsMock,
      };

      spyOn(conditionCollection, 'isMatchInConditions').and.returnValue(true);
      spyOn(indexMap, 'getValueAtIndex').and.returnValue(stateForColumnMock);

      const result = conditionCollection.isMatch('foo', 3);

      expect(indexMap.getValueAtIndex).toHaveBeenCalledWith(3);
      expect(conditionCollection.isMatchInConditions).toHaveBeenCalledWith(conditionsMock, 'foo', OPERATION_AND);
      expect(result).toBe(true);
    });
  });

  describe('isMatchInConditions', () => {
    it('should returns `true` if passed conditions is empty', () => {
      const indexMap = new IndexMap();
      const conditionCollection = new ConditionCollection(indexMap);

      const result = conditionCollection.isMatchInConditions([], 'foo');

      expect(result).toBe(true);
    });

    describe('OPERATION_AND', () => {
      it('should check if array of conditions is matched to the value', () => {
        const indexMap = new IndexMap();
        const conditionCollection = new ConditionCollection(indexMap);
        const conditionMock = { func: () => true };
        const conditionMock2 = { func: () => true };

        spyOn(conditionMock, 'func').and.callThrough();
        spyOn(conditionMock2, 'func').and.callThrough();

        const result = conditionCollection.isMatchInConditions([conditionMock, conditionMock2], 'foo');

        expect(conditionMock.func.calls.count()).toBe(1);
        expect(conditionMock.func).toHaveBeenCalledWith('foo');
        expect(conditionMock2.func.calls.count()).toBe(1);
        expect(conditionMock2.func).toHaveBeenCalledWith('foo');
        expect(result).toBe(true);
      });

      it('should break checking value when condition is not matched to the value', () => {
        const indexMap = new IndexMap();
        const conditionCollection = new ConditionCollection(indexMap);
        const conditionMock = { func: () => false };
        const conditionMock2 = { func: () => true };

        spyOn(conditionMock, 'func').and.callThrough();
        spyOn(conditionMock2, 'func').and.callThrough();

        const result = conditionCollection.isMatchInConditions([conditionMock, conditionMock2], 'foo');

        expect(conditionMock.func.calls.count()).toBe(1);
        expect(conditionMock.func).toHaveBeenCalledWith('foo');
        expect(conditionMock2.func.calls.count()).toBe(0);
        expect(result).toBe(false);
      });
    });

    describe('OPERATION_OR', () => {
      it('should check if one of conditions is matched to the value #1', () => {
        const indexMap = new IndexMap();
        const conditionCollection = new ConditionCollection(indexMap);
        const conditionMock = { func: () => false };
        const conditionMock2 = { func: () => true };

        spyOn(conditionMock, 'func').and.callThrough();
        spyOn(conditionMock2, 'func').and.callThrough();

        const result = conditionCollection.isMatchInConditions([conditionMock, conditionMock2], 'foo', OPERATION_OR);

        expect(conditionMock.func.calls.count()).toBe(1);
        expect(conditionMock.func).toHaveBeenCalledWith('foo');
        expect(conditionMock2.func.calls.count()).toBe(1);
        expect(conditionMock2.func).toHaveBeenCalledWith('foo');
        expect(result).toBe(true);
      });

      it('should check if one of conditions is matched to the value #2', () => {
        const indexMap = new IndexMap();
        const conditionCollection = new ConditionCollection(indexMap);
        const conditionMock = { func: () => false };
        const conditionMock2 = { func: () => false };

        spyOn(conditionMock, 'func').and.callThrough();
        spyOn(conditionMock2, 'func').and.callThrough();

        const result = conditionCollection.isMatchInConditions([conditionMock, conditionMock2], 'foo', OPERATION_OR);

        expect(conditionMock.func.calls.count()).toBe(1);
        expect(conditionMock.func).toHaveBeenCalledWith('foo');
        expect(conditionMock2.func.calls.count()).toBe(1);
        expect(conditionMock2.func).toHaveBeenCalledWith('foo');
        expect(result).toBe(false);
      });

      it('should break checking value when condition is matched to the value', () => {
        const indexMap = new IndexMap();
        const conditionCollection = new ConditionCollection(indexMap);
        const conditionMock = { func: () => false };
        const conditionMock2 = { func: () => true };
        const conditionMock3 = { func: () => false };

        spyOn(conditionMock, 'func').and.callThrough();
        spyOn(conditionMock2, 'func').and.callThrough();
        spyOn(conditionMock3, 'func').and.callThrough();

        const result = conditionCollection
          .isMatchInConditions([conditionMock, conditionMock2, conditionMock3], 'foo', OPERATION_OR);

        expect(conditionMock3.func.calls.count()).toBe(0);
        expect(result).toBe(true);
      });
    });
  });

  describe('addCondition', () => {
    beforeEach(() => {
      conditions.eq = {
        condition: () => {},
        descriptor: {},
      };
      conditions.contains = {
        condition: () => {},
        descriptor: {},
      };
    });

    afterEach(() => {
      delete conditions.eq;
      delete conditions.contains;
    });

    it('should trigger `beforeAdd` and `afterAdd` hook on adding condition', () => {
      const indexMap = new IndexMap();
      const conditionCollection = new ConditionCollection(indexMap);
      const conditionMock = { args: [], command: { key: 'eq' } };
      const hookBeforeSpy = jasmine.createSpy('hookBefore');
      const hookAfterSpy = jasmine.createSpy('hookAfter');

      conditionCollection.addLocalHook('beforeAdd', hookBeforeSpy);
      conditionCollection.addLocalHook('afterAdd', hookAfterSpy);
      conditionCollection.addCondition(3, conditionMock);

      expect(hookBeforeSpy).toHaveBeenCalledWith(3);
      expect(hookAfterSpy).toHaveBeenCalledWith(3);
    });

    it('should add conditions to the collection at specified column index.', () => {
      const indexMap = new IndexMap();
      const conditionCollection = new ConditionCollection(indexMap);

      // Mocking that the index mapper is prepared for 5 columns.
      indexMap.init(5);

      const conditionMock = { args: [1], command: { key: 'eq' } };

      conditionCollection.addCondition(3, conditionMock);

      expect(indexMap.getEntries().length).toBe(1);
      expect(indexMap.getValueAtIndex(3)).not.toBe(null);
      expect(indexMap.getValueAtIndex(0)).toBe(null);
    });

    it('should allow to add few condition under the same name and column index #160', () => {
      const indexMap = new IndexMap();
      const conditionCollection = new ConditionCollection(indexMap);

      // Mocking that the index mapper is prepared for 5 columns.
      indexMap.init(5);

      const conditionMock = { args: ['A'], command: { key: 'contains' } };
      const conditionMock2 = { args: ['B'], command: { key: 'contains' } };
      const conditionMock3 = { args: ['C'], command: { key: 'contains' } };

      conditionCollection.addCondition(3, conditionMock);
      conditionCollection.addCondition(3, conditionMock2);
      conditionCollection.addCondition(3, conditionMock3);

      expect(indexMap.getEntries().length).toBe(1);
      expect(indexMap.getValueAtIndex(3).conditions.length).toBe(3);
    });

    it('should allow to add few condition under the same column index ' +
      'only when they are related to the same operation (throw exception otherwise) #160', () => {
      const indexMap = new IndexMap();
      const conditionCollection = new ConditionCollection(indexMap);

      // Mocking that the index mapper is prepared for 5 columns.
      indexMap.init(5);

      const conditionMock = { args: ['A'], command: { key: 'contains' } };
      const conditionMock2 = { args: ['B'], command: { key: 'contains' } };
      const conditionMock3 = { args: ['C'], command: { key: 'contains' } };

      conditionCollection.addCondition(3, conditionMock, OPERATION_AND);
      conditionCollection.addCondition(3, conditionMock2, OPERATION_AND);
      expect(() => {
        conditionCollection.addCondition(3, conditionMock3, OPERATION_OR);
      }).toThrow(/has been already applied/);
    });

    it('should allow to add conditions only when they are related to the known operation ' +
      '(throw exception otherwise) #174', () => {
      const indexMap = new IndexMap();
      const conditionCollection = new ConditionCollection(indexMap);

      // Mocking that the index mapper is prepared for 5 columns.
      indexMap.init(5);

      const conditionMock = { args: ['A'], command: { key: 'contains' } };

      expect(() => {
        conditionCollection.addCondition(3, conditionMock, 'unknownOperation');
      }).toThrow(/Unexpected operation/);
    });
  });

  describe('getFilteredColumns', () => {
    it('should return list of filtered columns in proper order', () => {
      const indexMap = new IndexMap();
      const conditionCollection = new ConditionCollection(indexMap);

      // Mocking that the index mapper is prepared for 5 columns.
      indexMap.init(5);

      const conditionMock1 = { a: 'b' };
      const conditionMock2 = { c: 'd' };
      const conditionMock3 = { e: 'f' };

      // Mocking that the index mapper is prepared for 5 columns.
      indexMap.init(5);

      indexMap.setValueAtIndex(4, {
        operation: OPERATION_AND,
        conditions: [conditionMock1]
      });

      expect(conditionCollection.getFilteredColumns()).toEqual([4]);

      indexMap.setValueAtIndex(1, {
        operation: OPERATION_AND,
        conditions: [conditionMock2]
      });

      expect(conditionCollection.getFilteredColumns()).toEqual([4, 1]);

      indexMap.setValueAtIndex(3, {
        operation: OPERATION_AND,
        conditions: [conditionMock3]
      });

      expect(conditionCollection.getFilteredColumns()).toEqual([4, 1, 3]);
    });
  });

  describe('getOperation', () => {
    it('should return proper operation for particular column', () => {

      const indexMap = new IndexMap();
      const conditionCollection = new ConditionCollection(indexMap);

      // Mocking that the index mapper is prepared for 5 columns.
      indexMap.init(5);

      const conditionMock1 = { a: 'b' };

      // Mocking that the index mapper is prepared for 5 columns.
      indexMap.init(5);

      indexMap.setValueAtIndex(4, {
        operation: OPERATION_AND,
        conditions: [conditionMock1]
      });

      indexMap.setValueAtIndex(1, {
        operation: OPERATION_OR,
        conditions: [conditionMock1]
      });

      indexMap.setValueAtIndex(2, {
        operation: OPERATION_AND,
        conditions: [conditionMock1]
      });

      indexMap.setValueAtIndex(2, {
        operation: OPERATION_AND,
        conditions: [conditionMock1]
      });

      indexMap.setValueAtIndex(0, {
        operation: OPERATION_OR,
        conditions: [conditionMock1]
      });

      indexMap.setValueAtIndex(0, {
        operation: OPERATION_OR,
        conditions: [conditionMock1]
      });

      expect(conditionCollection.getOperation(0)).toEqual(OPERATION_OR);
      expect(conditionCollection.getOperation(1)).toEqual(OPERATION_OR);
      expect(conditionCollection.getOperation(2)).toEqual(OPERATION_AND);
      expect(conditionCollection.getOperation(3)).not.toBeDefined();
      expect(conditionCollection.getOperation(4)).toEqual(OPERATION_AND);
    });
  });

  describe('exportAllConditions', () => {
    it('should return an empty array when no conditions was added', () => {
      const indexMap = new IndexMap();
      const conditionCollection = new ConditionCollection(indexMap);

      // Mocking that the index mapper is prepared for 5 columns.
      indexMap.init(5);

      const exportedConditions = conditionCollection.exportAllConditions();

      expect(exportedConditions.length).toBe(0);
    });

    it('should return conditions as an array of objects for all column in the same order as it was added', () => {
      const indexMap = new IndexMap();
      const conditionCollection = new ConditionCollection(indexMap);
      const conditionMock1 = { name: 'date_tomorrow', args: [] };
      const conditionMock2 = { name: 'eq', args: ['z'] };
      const conditionMock3 = { name: 'begins_with', args: ['c'] };

      // Mocking that the index mapper is prepared for 5 columns.
      indexMap.init(5);

      indexMap.setValueAtIndex(4, {
        operation: OPERATION_AND,
        conditions: [conditionMock1]
      });

      indexMap.setValueAtIndex(1, {
        operation: OPERATION_AND,
        conditions: [conditionMock2]
      });

      indexMap.setValueAtIndex(3, {
        operation: OPERATION_AND,
        conditions: [conditionMock3]
      });

      const exportedConditions = conditionCollection.exportAllConditions();

      expect(exportedConditions.length).toBe(3);
      expect(exportedConditions[0].column).toBe(4);
      expect(exportedConditions[0].conditions[0].name).toBe('date_tomorrow');
      expect(exportedConditions[0].conditions[0].args).toEqual([]);
      expect(exportedConditions[1].column).toBe(1);
      expect(exportedConditions[1].conditions[0].name).toBe('eq');
      expect(exportedConditions[1].conditions[0].args).toEqual(['z']);
      expect(exportedConditions[2].column).toBe(3);
      expect(exportedConditions[2].conditions[0].name).toBe('begins_with');
      expect(exportedConditions[2].conditions[0].args).toEqual(['c']);
    });
  });

  describe('getConditions', () => {
    it('should return conditions at specified index otherwise should return empty array', () => {
      const indexMap = new IndexMap();
      const conditionCollection = new ConditionCollection(indexMap);
      const conditionMock = {};

      // Mocking that the index mapper is prepared for 5 columns.
      indexMap.init(5);

      indexMap.setValueAtIndex(3, {
        operation: OPERATION_AND,
        conditions: [conditionMock]
      });

      expect(conditionCollection.getConditions(2)).toEqual([]);
      expect(conditionCollection.getConditions(3)).toEqual([conditionMock]);
    });
  });

  describe('removeConditions', () => {
    it('should trigger `beforeRemove` and `afterRemove` hook on removing conditions', () => {
      const indexMap = new IndexMap();
      const conditionCollection = new ConditionCollection(indexMap);
      const conditionMock = {};

      // Mocking that the index mapper is prepared for 5 columns.
      indexMap.init(5);

      indexMap.setValueAtIndex(3, {
        operation: OPERATION_AND,
        conditions: [conditionMock]
      });

      const hookBeforeSpy = jasmine.createSpy('hookBefore');
      const hookAfterSpy = jasmine.createSpy('hookAfter');

      conditionCollection.addLocalHook('beforeRemove', hookBeforeSpy);
      conditionCollection.addLocalHook('afterRemove', hookAfterSpy);
      conditionCollection.removeConditions(3);

      expect(hookBeforeSpy).toHaveBeenCalledWith(3);
      expect(hookAfterSpy).toHaveBeenCalledWith(3);
    });

    it('should remove condition from collection', () => {
      const indexMap = new IndexMap();
      const conditionCollection = new ConditionCollection(indexMap);
      const conditionMock = {};

      // Mocking that the index mapper is prepared for 5 columns.
      indexMap.init(5);

      indexMap.setValueAtIndex(3, {
        operation: OPERATION_AND,
        conditions: [conditionMock]
      });

      conditionCollection.removeConditions(3);

      expect(indexMap.getEntries().length).toBe(0);
    });
  });

  describe('hasConditions', () => {
    it('should return `true` if at specified column index condition were found', () => {
      const indexMap = new IndexMap();
      const conditionCollection = new ConditionCollection(indexMap);
      const conditionsMock = [{}, {}];

      spyOn(conditionCollection, 'getConditions').and.returnValue(conditionsMock);

      const result = conditionCollection.hasConditions(3);
      expect(result).toBe(true);
    });

    it('should return `false` if at specified column index no conditions were found', () => {
      const indexMap = new IndexMap();
      const conditionCollection = new ConditionCollection(indexMap);
      const conditionsMock = [];

      spyOn(conditionCollection, 'getConditions').and.returnValue(conditionsMock);

      const result = conditionCollection.hasConditions(3);
      expect(result).toBe(false);
    });

    it('should return `true` if at specified column index condition were found under its name', () => {
      const indexMap = new IndexMap();
      const conditionCollection = new ConditionCollection(indexMap);
      const conditionsMock = [{ name: 'lte' }, { name: 'eq' }];

      spyOn(conditionCollection, 'getConditions').and.returnValue(conditionsMock);

      const result = conditionCollection.hasConditions(3, 'eq');
      expect(result).toBe(true);
    });

    it('should return `false` if at specified column index no conditions were found under its name', () => {
      const indexMap = new IndexMap();
      const conditionCollection = new ConditionCollection(indexMap);
      const conditionsMock = [{ name: 'lte' }, { name: 'eq' }];

      spyOn(conditionCollection, 'getConditions').and.returnValue(conditionsMock);

      const result = conditionCollection.hasConditions(3, 'between');

      expect(conditionCollection.getConditions).toHaveBeenCalledWith(3);
      expect(result).toBe(false);
    });
  });

  describe('clean', () => {
    it('should trigger `beforeClean` and `afterClean` hook on cleaning conditions', () => {
      const indexMap = new IndexMap();
      const conditionCollection = new ConditionCollection(indexMap);

      const hookBeforeSpy = jasmine.createSpy('hookBefore');
      const hookAfterSpy = jasmine.createSpy('hookAfter');

      conditionCollection.addLocalHook('beforeClean', hookBeforeSpy);
      conditionCollection.addLocalHook('afterClean', hookAfterSpy);
      conditionCollection.clean();

      expect(hookBeforeSpy).toHaveBeenCalled();
      expect(hookAfterSpy).toHaveBeenCalled();
    });

    it('should clear condition collection', () => {
      const indexMap = new IndexMap();
      const conditionCollection = new ConditionCollection(indexMap);
      const conditionMock = {};

      // Mocking that the index mapper is prepared for 5 columns.
      indexMap.init(5);

      indexMap.setValueAtIndex(3, {
        operation: OPERATION_AND,
        conditions: [conditionMock]
      });

      indexMap.setValueAtIndex(4, {
        operation: OPERATION_AND,
        conditions: [conditionMock]
      });

      conditionCollection.clean();

      expect(indexMap.getEntries().length).toBe(0);
    });
  });

  describe('destroy', () => {
    it('should nullable all properties', () => {
      const indexMap = new IndexMap();
      const conditionCollection = new ConditionCollection(indexMap);
      const conditionMock = {};

      // Mocking that the index mapper is prepared for 5 columns.
      indexMap.init(5);

      indexMap.setValueAtIndex(3, {
        operation: OPERATION_AND,
        conditions: [conditionMock]
      });

      indexMap.setValueAtIndex(4, {
        operation: OPERATION_AND,
        conditions: [conditionMock]
      });

      conditionCollection.destroy();

      expect(conditionCollection.filteringStates).toBeNull();
    });
  });
});
