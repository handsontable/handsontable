import {
  captureFilterConditionsSnapshot,
  cloneFilterConditionsStack,
  conditionsStackToFiltersPayload,
  restoreFilterConditionsFromSnapshot,
} from '../filtering';

describe('dataProvider filtering', () => {
  describe('cloneFilterConditionsStack', () => {
    it('should deep-clone condition args', () => {
      const stack = [{
        column: 0,
        operation: 'conjunction',
        conditions: [{ name: 'gte', args: [1] }],
      }];
      const clone = cloneFilterConditionsStack(stack);

      expect(clone).toEqual(stack);
      clone[0].conditions[0].args[0] = 99;
      expect(stack[0].conditions[0].args[0]).toBe(1);
    });
  });

  describe('conditionsStackToFiltersPayload', () => {
    it('should map physical columns to prop keys', () => {
      const hot = {
        toVisualColumn: col => col,
        colToProp: visualCol => (visualCol === 0 ? 'id' : 'name'),
      };
      const payload = conditionsStackToFiltersPayload(hot, [{
        column: 0,
        operation: 'conjunction',
        conditions: [{ name: 'eq', args: ['x'] }],
      }]);

      expect(payload).toEqual([{
        prop: 'id',
        operation: 'conjunction',
        conditions: [{ name: 'eq', args: ['x'] }],
      }]);
    });

    it('should return null for empty stack', () => {
      const hot = { toVisualColumn: () => 0, colToProp: () => 'a' };

      expect(conditionsStackToFiltersPayload(hot, [])).toBeNull();
      expect(conditionsStackToFiltersPayload(hot, null)).toBeNull();
    });
  });

  describe('captureFilterConditionsSnapshot', () => {
    it('should clone when getFiltersConditions returns conditions', () => {
      const conditions = [{ column: 1, operation: 'conjunction', conditions: [] }];
      const hot = { runHooks: name => (name === 'getFiltersConditions' ? conditions : undefined) };
      const snap = captureFilterConditionsSnapshot(hot);

      expect(snap).toEqual(conditions);
      snap[0].column = 99;
      expect(conditions[0].column).toBe(1);
    });

    it('should return empty array when no conditions', () => {
      const hot = { runHooks: () => [] };

      expect(captureFilterConditionsSnapshot(hot)).toEqual([]);
    });
  });

  describe('restoreFilterConditionsFromSnapshot', () => {
    it('should call setFiltersConditions when snapshot non-empty', () => {
      const calls = [];
      const hot = { runHooks: (name, arg) => calls.push([name, arg]) };
      const snapshot = [{ column: 0, operation: 'conjunction', conditions: [] }];

      restoreFilterConditionsFromSnapshot(hot, snapshot);

      expect(calls).toEqual([['setFiltersConditions', snapshot]]);
    });

    it('should no-op for empty snapshot', () => {
      const hot = { runHooks: jest.fn() };

      restoreFilterConditionsFromSnapshot(hot, []);

      expect(hot.runHooks).not.toHaveBeenCalled();
    });
  });
});
