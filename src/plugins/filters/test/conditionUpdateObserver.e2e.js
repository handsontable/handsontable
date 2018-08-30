describe('ConditionUpdateObserver', () => {
  const id = 'testContainer';

  function getConditionUpdateObserver() {
    return handsontable({ filters: true }).getPlugin('filters').conditionUpdateObserver;
  }

  beforeEach(function() {
    this.$container = $(`<div id="${id}"></div>`).appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  it('should be initialized and accessible from the plugin', () => {
    const conditionObserver = getConditionUpdateObserver();

    expect(conditionObserver).toBeDefined();
  });

  it('should create properties and setup default values to them', () => {
    const conditionObserver = getConditionUpdateObserver();

    expect(conditionObserver.conditionCollection).toBeDefined();
    expect(conditionObserver.columnDataFactory).toBeDefined();
    expect(conditionObserver.changes).toEqual([]);
    expect(conditionObserver.grouping).toBe(false);
    expect(conditionObserver.latestEditedColumnPosition).toBe(-1);
    expect(conditionObserver.latestOrderStack).toEqual([]);
  });

  it('should fire `update` hook on every modified condition', () => {
    const conditionObserver = getConditionUpdateObserver();
    const updateSpy = jasmine.createSpy('update');

    conditionObserver.addLocalHook('update', updateSpy);

    conditionObserver.conditionCollection.addCondition(0, { name: 'gt', args: [2] });
    conditionObserver.conditionCollection.removeConditions(2);
    conditionObserver.conditionCollection.addCondition(1, { name: 'contains', args: ['b'] });
    conditionObserver.conditionCollection.addCondition(2, { name: 'begins_with', args: ['c'] });
    conditionObserver.conditionCollection.addCondition(2, { name: 'ends_with', args: ['d'] });
    conditionObserver.conditionCollection.clean();

    // add 'gt'
    expect(updateSpy.calls.argsFor(0)[0].editedConditionStack.column).toBe(0);
    expect(updateSpy.calls.argsFor(0)[0].editedConditionStack.conditions.length).toBe(1);
    expect(updateSpy.calls.argsFor(0)[0].editedConditionStack.conditions[0].name).toBe('gt');
    expect(updateSpy.calls.argsFor(0)[0].editedConditionStack.conditions[0].args).toEqual([2]);
    // remove
    expect(updateSpy.calls.argsFor(1)[0].editedConditionStack.column).toBe(2);
    expect(updateSpy.calls.argsFor(1)[0].editedConditionStack.conditions.length).toBe(0);
    // add 'contains'
    expect(updateSpy.calls.argsFor(2)[0].editedConditionStack.column).toBe(1);
    expect(updateSpy.calls.argsFor(2)[0].editedConditionStack.conditions.length).toBe(1);
    expect(updateSpy.calls.argsFor(2)[0].editedConditionStack.conditions[0].name).toBe('contains');
    expect(updateSpy.calls.argsFor(2)[0].editedConditionStack.conditions[0].args).toEqual(['b']);
    // add 'begins_with'
    expect(updateSpy.calls.argsFor(3)[0].editedConditionStack.column).toBe(2);
    expect(updateSpy.calls.argsFor(3)[0].editedConditionStack.conditions.length).toBe(1);
    expect(updateSpy.calls.argsFor(3)[0].editedConditionStack.conditions[0].name).toBe('begins_with');
    expect(updateSpy.calls.argsFor(3)[0].editedConditionStack.conditions[0].args).toEqual(['c']);
    // add 'ends_with'
    expect(updateSpy.calls.argsFor(4)[0].editedConditionStack.column).toBe(2);
    expect(updateSpy.calls.argsFor(4)[0].editedConditionStack.conditions.length).toBe(2);
    expect(updateSpy.calls.argsFor(4)[0].editedConditionStack.conditions[1].name).toBe('ends_with');
    expect(updateSpy.calls.argsFor(4)[0].editedConditionStack.conditions[1].args).toEqual(['d']);
    // clean
    expect(updateSpy.calls.argsFor(5)[0].editedConditionStack.column).toBe(0);
    expect(updateSpy.calls.argsFor(6)[0].editedConditionStack.column).toBe(1);
    expect(updateSpy.calls.argsFor(7)[0].editedConditionStack.column).toBe(2);
  });

  describe('groupChanges', () => {
    it('should fire `update` hook only once on `flush` method call when groupChanges is enabled', () => {
      const conditionObserver = getConditionUpdateObserver();
      const updateSpy = jasmine.createSpy('update');

      conditionObserver.addLocalHook('update', updateSpy);

      conditionObserver.groupChanges();
      conditionObserver.conditionCollection.addCondition(0, { name: 'gt', args: [2] });
      conditionObserver.conditionCollection.removeConditions(2);
      conditionObserver.conditionCollection.addCondition(1, { name: 'contains', args: ['b'] });
      conditionObserver.conditionCollection.addCondition(2, { name: 'begins_with', args: ['c'] });
      conditionObserver.conditionCollection.addCondition(2, { name: 'ends_with', args: ['d'] });

      expect(updateSpy).not.toHaveBeenCalled();

      conditionObserver.flush();

      // add 'gt'
      expect(updateSpy.calls.argsFor(0)[0].editedConditionStack.column).toBe(0);
      expect(updateSpy.calls.argsFor(0)[0].editedConditionStack.conditions.length).toBe(1);
      expect(updateSpy.calls.argsFor(0)[0].editedConditionStack.conditions[0].name).toBe('gt');
      expect(updateSpy.calls.argsFor(0)[0].editedConditionStack.conditions[0].args).toEqual([2]);
      // add 'begins_with' and 'ends_with'
      expect(updateSpy.calls.argsFor(1)[0].editedConditionStack.column).toBe(2);
      expect(updateSpy.calls.argsFor(1)[0].editedConditionStack.conditions.length).toBe(2);
      expect(updateSpy.calls.argsFor(1)[0].editedConditionStack.conditions[0].name).toBe('begins_with');
      expect(updateSpy.calls.argsFor(1)[0].editedConditionStack.conditions[0].args).toEqual(['c']);
      expect(updateSpy.calls.argsFor(1)[0].editedConditionStack.conditions[1].name).toBe('ends_with');
      expect(updateSpy.calls.argsFor(1)[0].editedConditionStack.conditions[1].args).toEqual(['d']);
      // add 'contains'
      expect(updateSpy.calls.argsFor(2)[0].editedConditionStack.column).toBe(1);
      expect(updateSpy.calls.argsFor(2)[0].editedConditionStack.conditions.length).toBe(1);
      expect(updateSpy.calls.argsFor(2)[0].editedConditionStack.conditions[0].name).toBe('contains');
      expect(updateSpy.calls.argsFor(2)[0].editedConditionStack.conditions[0].args).toEqual(['b']);
    });
  });

  describe('destroy', () => {
    it('should nullable all properties', () => {
      const conditionObserver = getConditionUpdateObserver();

      conditionObserver.conditionCollection = {};
      conditionObserver.columnDataFactory = {};
      conditionObserver.changes = [];
      conditionObserver.grouping = false;
      conditionObserver.latestEditedColumnPosition = -1;
      conditionObserver.latestOrderStack = [];

      conditionObserver.destroy();

      expect(conditionObserver.conditionCollection).toBeNull();
      expect(conditionObserver.columnDataFactory).toBeNull();
      expect(conditionObserver.changes).toBeNull();
      expect(conditionObserver.grouping).toBeNull();
      expect(conditionObserver.latestEditedColumnPosition).toBeNull();
      expect(conditionObserver.latestOrderStack).toBeNull();
    });
  });
});
