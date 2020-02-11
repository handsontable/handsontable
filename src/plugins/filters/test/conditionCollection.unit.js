import ConditionCollection from 'handsontable/plugins/filters/conditionCollection';
import { conditions } from 'handsontable/plugins/filters/conditionRegisterer';
import { OPERATION_AND, OPERATION_OR } from 'handsontable/plugins/filters/constants';
import { operations } from 'handsontable/plugins/filters/logicalOperationRegisterer';

describe('ConditionCollection', () => {
  it('should be initialized and accessible from the plugin', () => {
    expect(ConditionCollection).toBeDefined();
  });

  it('should create empty bucket for conditions, columnTypes and empty orderStack', () => {
    const conditionCollection = new ConditionCollection();

    expect(conditionCollection.conditions).toEqual(jasmine.any(Object));
    expect(Object.keys(conditionCollection.conditions)).toEqual(Object.keys(operations));
    expect(conditionCollection.orderStack).toEqual(jasmine.any(Array));
    expect(conditionCollection.columnTypes).toEqual(jasmine.any(Object));
  });

  describe('isEmpty', () => {
    it('should return `true` when order stack is equal to 0', () => {
      const conditionCollection = new ConditionCollection();

      expect(conditionCollection.isEmpty()).toBe(true);

      conditionCollection.orderStack.push(1);

      expect(conditionCollection.isEmpty()).toBe(false);
    });
  });

  describe('isMatch', () => {
    it('should check is value is matched to the conditions at specified column index', () => {
      const conditionCollection = new ConditionCollection();
      conditionCollection.columnTypes = { 3: OPERATION_AND };
      const conditionMock = {};

      spyOn(conditionCollection, 'isMatchInConditions').and.returnValue(true);
      spyOn(conditionCollection, 'getConditions').and.returnValue([conditionMock]);

      const result = conditionCollection.isMatch('foo', 3);

      expect(conditionCollection.getConditions).toHaveBeenCalledWith(3);
      expect(conditionCollection.isMatchInConditions).toHaveBeenCalledWith([conditionMock], 'foo', OPERATION_AND);
      expect(result).toBe(true);
    });

    it('should check is value is matched to the conditions for all columns', () => {
      const conditionCollection = new ConditionCollection();
      conditionCollection.columnTypes = { 3: OPERATION_AND, 13: OPERATION_AND };
      const conditionMock = {};
      const conditionMock2 = {};

      conditionCollection.conditions[OPERATION_AND]['3'] = [conditionMock];
      conditionCollection.conditions[OPERATION_AND]['13'] = [conditionMock2];

      spyOn(conditionCollection, 'isMatchInConditions').and.returnValue(true);
      spyOn(conditionCollection, 'getConditions').and.returnValue([conditionMock]);

      const result = conditionCollection.isMatch('foo');

      expect(conditionCollection.getConditions).not.toHaveBeenCalled();
      expect(conditionCollection.isMatchInConditions.calls.argsFor(0)).toEqual([[conditionMock], 'foo', OPERATION_AND]);
      expect(conditionCollection.isMatchInConditions.calls.argsFor(1)).toEqual([[conditionMock2], 'foo', OPERATION_AND]);
      expect(result).toBe(true);
    });

    it('should break checking value when current condition is not matched to the rules', () => {
      const conditionCollection = new ConditionCollection();
      conditionCollection.columnTypes = { 3: OPERATION_AND, 13: OPERATION_AND };
      const conditionMock = {};
      const conditionMock2 = {};

      conditionCollection.conditions[OPERATION_AND]['3'] = [conditionMock];
      conditionCollection.conditions[OPERATION_AND]['13'] = [conditionMock2];

      spyOn(conditionCollection, 'isMatchInConditions').and.returnValue(false);
      spyOn(conditionCollection, 'getConditions').and.returnValue(conditionMock);

      const result = conditionCollection.isMatch('foo');

      expect(conditionCollection.getConditions).not.toHaveBeenCalled();
      expect(conditionCollection.isMatchInConditions.calls.count()).toBe(1);
      expect(conditionCollection.isMatchInConditions.calls.argsFor(0)).toEqual([[conditionMock], 'foo', OPERATION_AND]);
      expect(result).toBe(false);
    });
  });

  describe('isMatchInConditions', () => {
    it('should returns `true` if passed conditions is empty', () => {
      const conditionCollection = new ConditionCollection();

      const result = conditionCollection.isMatchInConditions([], 'foo');

      expect(result).toBe(true);
    });

    describe('OPERATION_AND', () => {
      it('should check if array of conditions is matched to the value', () => {
        const conditionCollection = new ConditionCollection();
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
        const conditionCollection = new ConditionCollection();
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
        const conditionCollection = new ConditionCollection();
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
        const conditionCollection = new ConditionCollection();
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
        const conditionCollection = new ConditionCollection();
        const conditionMock = { func: () => false };
        const conditionMock2 = { func: () => true };
        const conditionMock3 = { func: () => false };

        spyOn(conditionMock, 'func').and.callThrough();
        spyOn(conditionMock2, 'func').and.callThrough();
        spyOn(conditionMock3, 'func').and.callThrough();

        const result = conditionCollection.isMatchInConditions([conditionMock, conditionMock2, conditionMock3], 'foo', OPERATION_OR);

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
      const conditionCollection = new ConditionCollection();
      const conditionMock = { args: [], command: { key: 'eq' } };
      const hookBeforeSpy = jasmine.createSpy('hookBefore');
      const hookAfterSpy = jasmine.createSpy('hookAfter');

      conditionCollection.addLocalHook('beforeAdd', hookBeforeSpy);
      conditionCollection.addLocalHook('afterAdd', hookAfterSpy);
      conditionCollection.addCondition(3, conditionMock);

      expect(hookBeforeSpy).toHaveBeenCalledWith(3);
      expect(hookAfterSpy).toHaveBeenCalledWith(3);
    });

    it('should add column index to the orderStack without duplicate values', () => {
      const conditionCollection = new ConditionCollection();
      const conditionMock = { args: [], command: { key: 'eq' } };

      conditionCollection.addCondition(3, conditionMock);
      conditionCollection.addCondition(3, conditionMock);
      conditionCollection.addCondition(3, conditionMock);

      expect(conditionCollection.orderStack).toEqual([3]);
    });

    it('should add condition to the collection at specified column index.', () => {
      const conditionCollection = new ConditionCollection();
      const conditionMock = { args: [1], command: { key: 'eq' } };

      conditionCollection.addCondition(3, conditionMock);

      expect(conditionCollection.conditions[OPERATION_AND]['3'].length).toBe(1);
      expect(conditionCollection.conditions[OPERATION_AND]['3'][0].name).toBe('eq');
      expect(conditionCollection.conditions[OPERATION_AND]['3'][0].args).toEqual([1]);
      expect(conditionCollection.conditions[OPERATION_AND]['3'][0].func instanceof Function).toBe(true);
    });

    it('should allow to add few condition under the same name and column index #160', () => {
      const conditionCollection = new ConditionCollection();
      const conditionMock = { args: ['A'], command: { key: 'contains' } };
      const conditionMock2 = { args: ['B'], command: { key: 'contains' } };
      const conditionMock3 = { args: ['C'], command: { key: 'contains' } };

      conditionCollection.addCondition(3, conditionMock);
      conditionCollection.addCondition(3, conditionMock2);
      conditionCollection.addCondition(3, conditionMock3);

      expect(conditionCollection.conditions[OPERATION_AND]['3'].length).toBe(3);
    });

    it('should allow to add few condition under the same column index ' +
      'only when they are related to the same operation (throw exception otherwise) #160', () => {
      const conditionCollection = new ConditionCollection();
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
      const conditionCollection = new ConditionCollection();
      const conditionMock = { args: ['A'], command: { key: 'contains' } };

      expect(() => {
        conditionCollection.addCondition(3, conditionMock, 'unknownOperation');
      }).toThrow(/Unexpected operation/);
    });
  });

  describe('exportAllConditions', () => {
    it('should return an empty array when no conditions was added', () => {
      const conditionCollection = new ConditionCollection();

      conditionCollection.orderStack = [];

      const exportedConditions = conditionCollection.exportAllConditions();

      expect(exportedConditions.length).toBe(0);
    });

    it('should return conditions as an array of objects for all column in the same order as it was added', () => {
      const conditionCollection = new ConditionCollection();
      const conditionMock = { name: 'begins_with', args: ['c'] };
      const conditionMock1 = { name: 'date_tomorrow', args: [] };
      const conditionMock2 = { name: 'eq', args: ['z'] };

      conditionCollection.orderStack = [6, 1, 3];
      conditionCollection.columnTypes = { 1: OPERATION_AND, 3: OPERATION_AND, 6: OPERATION_AND };
      conditionCollection.conditions[OPERATION_AND]['3'] = [conditionMock];
      conditionCollection.conditions[OPERATION_AND]['6'] = [conditionMock1];
      conditionCollection.conditions[OPERATION_AND]['1'] = [conditionMock2];

      const exportedConditions = conditionCollection.exportAllConditions();

      expect(exportedConditions.length).toBe(3);
      expect(exportedConditions[0].column).toBe(6);
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
      const conditionCollection = new ConditionCollection();
      conditionCollection.columnTypes = { 3: OPERATION_AND };
      const conditionMock = {};

      conditionCollection.conditions[OPERATION_AND]['3'] = [conditionMock];

      expect(conditionCollection.getConditions(2)).toEqual([]);
      expect(conditionCollection.getConditions(3)).toEqual([conditionMock]);
    });
  });

  describe('removeConditions', () => {
    it('should trigger `beforeRemove` and `afterRemove` hook on removing conditions', () => {
      const conditionCollection = new ConditionCollection();
      const conditionMock = {};

      conditionCollection.orderStack = [3];
      conditionCollection.conditions['3'] = [conditionMock];

      const hookBeforeSpy = jasmine.createSpy('hookBefore');
      const hookAfterSpy = jasmine.createSpy('hookAfter');

      conditionCollection.addLocalHook('beforeRemove', hookBeforeSpy);
      conditionCollection.addLocalHook('afterRemove', hookAfterSpy);
      conditionCollection.removeConditions(3);

      expect(hookBeforeSpy).toHaveBeenCalledWith(3);
      expect(hookAfterSpy).toHaveBeenCalledWith(3);
    });

    it('should remove condition from collection and column index from orderStack', () => {
      const conditionCollection = new ConditionCollection();
      const conditionMock = {};

      spyOn(conditionCollection, 'clearConditions');
      conditionCollection.orderStack = [3];
      conditionCollection.conditions['3'] = [conditionMock];

      conditionCollection.removeConditions(3);

      expect(conditionCollection.orderStack).toEqual([]);
      expect(conditionCollection.clearConditions).toHaveBeenCalledWith(3);
    });
  });

  describe('clearConditions', () => {
    it('should trigger `beforeClear` and `afterClear` hook on clearing conditions', () => {
      const conditionCollection = new ConditionCollection();

      const hookBeforeSpy = jasmine.createSpy('hookBefore');
      const hookAfterSpy = jasmine.createSpy('hookAfter');

      conditionCollection.addLocalHook('beforeClear', hookBeforeSpy);
      conditionCollection.addLocalHook('afterClear', hookAfterSpy);
      conditionCollection.clearConditions(3);

      expect(hookBeforeSpy).toHaveBeenCalledWith(3);
      expect(hookAfterSpy).toHaveBeenCalledWith(3);
    });

    it('should clear all conditions at specified column index', () => {
      const conditionCollection = new ConditionCollection();
      const conditionsMock = [{}, {}];

      spyOn(conditionCollection, 'getConditions').and.returnValue(conditionsMock);

      conditionCollection.clearConditions(3);

      expect(conditionCollection.getConditions).toHaveBeenCalledWith(3);
      expect(conditionsMock.length).toBe(0);
    });
  });

  describe('hasConditions', () => {
    it('should return `true` if at specified column index condition were found', () => {
      const conditionCollection = new ConditionCollection();
      conditionCollection.columnTypes = { 3: OPERATION_AND };
      const conditionsMock = [{}, {}];

      spyOn(conditionCollection, 'getConditions').and.returnValue(conditionsMock);

      const result = conditionCollection.hasConditions(3);
      expect(result).toBe(true);
    });

    it('should return `false` if at specified column index no conditions were found', () => {
      const conditionCollection = new ConditionCollection();
      const conditionsMock = [];

      spyOn(conditionCollection, 'getConditions').and.returnValue(conditionsMock);

      const result = conditionCollection.hasConditions(3);
      expect(result).toBe(false);
    });

    it('should return `true` if at specified column index condition were found under its name', () => {
      const conditionCollection = new ConditionCollection();
      conditionCollection.columnTypes = { 3: OPERATION_AND };
      const conditionsMock = [{ name: 'lte' }, { name: 'eq' }];

      spyOn(conditionCollection, 'getConditions').and.returnValue(conditionsMock);

      const result = conditionCollection.hasConditions(3, 'eq');
      expect(result).toBe(true);
    });

    it('should return `false` if at specified column index no conditions were found under its name', () => {
      const conditionCollection = new ConditionCollection();
      conditionCollection.columnTypes = { 3: OPERATION_AND };
      const conditionsMock = [{ name: 'lte' }, { name: 'eq' }];

      spyOn(conditionCollection, 'getConditions').and.returnValue(conditionsMock);

      const result = conditionCollection.hasConditions(3, 'between');

      expect(conditionCollection.getConditions).toHaveBeenCalledWith(3);
      expect(result).toBe(false);
    });
  });

  describe('clean', () => {
    it('should trigger `beforeClean` and `afterClean` hook on cleaning conditions', () => {
      const conditionCollection = new ConditionCollection();

      conditionCollection.conditions = { 0: [] };
      conditionCollection.conditions = [1, 2, 3, 4];

      const hookBeforeSpy = jasmine.createSpy('hookBefore');
      const hookAfterSpy = jasmine.createSpy('hookAfter');

      conditionCollection.addLocalHook('beforeClean', hookBeforeSpy);
      conditionCollection.addLocalHook('afterClean', hookAfterSpy);
      conditionCollection.clean();

      expect(hookBeforeSpy).toHaveBeenCalled();
      expect(hookAfterSpy).toHaveBeenCalled();
    });

    it('should clear condition collection and orderStack', () => {
      const conditionCollection = new ConditionCollection();

      conditionCollection.conditions = { 0: [] };
      conditionCollection.conditions = [1, 2, 3, 4];

      conditionCollection.clean();

      expect(conditionCollection.conditions).toEqual(jasmine.any(Object));
      expect(Object.keys(conditionCollection.conditions)).toEqual(Object.keys(operations));
      expect(conditionCollection.orderStack.length).toBe(0);
    });
  });

  describe('destroy', () => {
    it('should nullable all properties', () => {
      const conditionCollection = new ConditionCollection();

      conditionCollection.conditions[OPERATION_AND] = { 0: [], 2: [] };
      conditionCollection.conditions[OPERATION_OR] = { 3: [], 4: [] };
      conditionCollection.orderStack = [1, 2, 3, 4];

      conditionCollection.destroy();

      expect(conditionCollection.conditions).toBeNull();
      expect(conditionCollection.orderStack).toBeNull();
      expect(conditionCollection.columnTypes).toBeNull();
    });
  });
});
