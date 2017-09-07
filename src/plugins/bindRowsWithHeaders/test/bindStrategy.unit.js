import BindStrategy from 'handsontable-pro/plugins/bindRowsWithHeaders/bindStrategy';

describe('BindRowsWithHeaders -> BindStrategy', function() {
  it('should throw error when used strategy is not exists', function() {
    var strategy = new BindStrategy();

    expect(function() {
      strategy.setStrategy('test2');
    }).toThrow();
  });

  it('should create a map based on `length` argument', function() {
    var strategyMock = {_arrayMap: []};
    var strategy = new BindStrategy();

    strategy.strategy = strategyMock;
    strategy.createMap(4);

    expect(strategy.strategy._arrayMap[0]).toBe(0);
    expect(strategy.strategy._arrayMap[1]).toBe(1);
    expect(strategy.strategy._arrayMap[2]).toBe(2);
    expect(strategy.strategy._arrayMap[3]).toBe(3);
    expect(strategy.strategy._arrayMap[4]).toBe(void 0);
  });

  it('should re-create a map based on current map length', function() {
    var strategyMock = {_arrayMap: []};
    var strategy = new BindStrategy();

    strategy.strategy = strategyMock;
    strategy.strategy._arrayMap[0] = 4;
    strategy.strategy._arrayMap[1] = 5;
    strategy.strategy._arrayMap[2] = 6;
    strategy.createMap();

    expect(strategy.strategy._arrayMap[0]).toBe(0);
    expect(strategy.strategy._arrayMap[1]).toBe(1);
    expect(strategy.strategy._arrayMap[2]).toBe(2);
    expect(strategy.strategy._arrayMap[3]).toBe(void 0);
  });

  it('should forward `createRow` method call to the strategy object', function() {
    var strategyMock = jasmine.createSpyObj('strategy', ['createRow']);
    var strategy = new BindStrategy();

    strategy.strategy = strategyMock;
    strategy.createRow(1, 1);

    expect(strategy.strategy.createRow.calls.argsFor(0)).toEqual([1, 1]);

    strategy.createRow(3);

    expect(strategyMock.createRow.calls.argsFor(1)).toEqual([3]);
  });

  it('should forward `removeRow` method call to the strategy object', function() {
    var strategyMock = jasmine.createSpyObj('strategy', ['removeRow']);
    var strategy = new BindStrategy();

    strategy.strategy = strategyMock;
    strategy.removeRow(1, 1);

    expect(strategy.strategy.removeRow.calls.argsFor(0)).toEqual([1, 1]);

    strategy.removeRow(3);

    expect(strategyMock.removeRow.calls.argsFor(1)).toEqual([3]);
  });

  it('should forward `translate` method call to the strategy object', function() {
    var strategyMock = jasmine.createSpyObj('strategy', ['getValueByIndex']);
    var strategy = new BindStrategy();

    strategy.strategy = strategyMock;
    strategy.translate(1);

    expect(strategyMock.getValueByIndex.calls.argsFor(0)).toEqual([1]);
  });

  it('should forward `clearMap` method call to the strategy object', function() {
    var strategyMock = jasmine.createSpyObj('strategy', ['clearMap']);
    var strategy = new BindStrategy();

    strategy.strategy = strategyMock;
    strategy.clearMap();

    expect(strategyMock.clearMap).toHaveBeenCalled();
  });

  it('should destroy object after call `destroy` method', function() {
    var strategyMock = jasmine.createSpyObj('strategy', ['destroy']);
    var strategy = new BindStrategy();

    strategy.strategy = strategyMock;
    strategy.destroy();

    expect(strategyMock.destroy).toHaveBeenCalled();
    expect(strategy.strategy).toBeNull();
  });
});
