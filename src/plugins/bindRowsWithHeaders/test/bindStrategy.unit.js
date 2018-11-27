import BindStrategy from 'handsontable-pro/plugins/bindRowsWithHeaders/bindStrategy';

describe('BindRowsWithHeaders -> BindStrategy', () => {
  it('should throw error when used strategy is not exists', () => {
    const strategy = new BindStrategy();

    expect(() => {
      strategy.setStrategy('test2');
    }).toThrow();
  });

  it('should create a map based on `length` argument', () => {
    const strategyMock = { _arrayMap: [] };
    const strategy = new BindStrategy();

    strategy.strategy = strategyMock;
    strategy.createMap(4);

    expect(strategy.strategy._arrayMap[0]).toBe(0);
    expect(strategy.strategy._arrayMap[1]).toBe(1);
    expect(strategy.strategy._arrayMap[2]).toBe(2);
    expect(strategy.strategy._arrayMap[3]).toBe(3);
    expect(strategy.strategy._arrayMap[4]).toBe(void 0);
  });

  it('should re-create a map based on current map length', () => {
    const strategyMock = { _arrayMap: [] };
    const strategy = new BindStrategy();

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

  it('should forward `createRow` method call to the strategy object', () => {
    const strategyMock = { createRow() {} };
    const createRowSpy = jest.spyOn(strategyMock, 'createRow');
    const strategy = new BindStrategy();

    strategy.strategy = { createRow: createRowSpy };
    strategy.createRow(1, 1);

    expect(createRowSpy).toHaveBeenCalledTimes(1);
    expect(createRowSpy).toHaveBeenCalledWith(1, 1);

    strategy.createRow(3);

    expect(createRowSpy).toHaveBeenCalledTimes(2);
    expect(createRowSpy).toHaveBeenCalledWith(3);
  });

  it('should forward `removeRow` method call to the strategy object', () => {
    const strategyMock = { removeRow() {} };
    const removeRowSpy = jest.spyOn(strategyMock, 'removeRow');
    const strategy = new BindStrategy();

    strategy.strategy = { removeRow: removeRowSpy };
    strategy.removeRow(1, 1);

    expect(removeRowSpy).toHaveBeenCalledTimes(1);
    expect(removeRowSpy).toHaveBeenCalledWith(1, 1);

    strategy.removeRow(3);

    expect(removeRowSpy).toHaveBeenCalledTimes(2);
    expect(removeRowSpy).toHaveBeenCalledWith(3);
  });

  it('should forward `translate` method call to the strategy object', () => {
    const strategyMock = { getValueByIndex() {} };
    const getValueByIndexSpy = jest.spyOn(strategyMock, 'getValueByIndex');
    const strategy = new BindStrategy();

    strategy.strategy = { getValueByIndex: getValueByIndexSpy };
    strategy.translate(1);

    expect(getValueByIndexSpy).toHaveBeenCalledTimes(1);
    expect(getValueByIndexSpy).toHaveBeenCalledWith(1);
  });

  it('should forward `clearMap` method call to the strategy object', () => {
    const strategyMock = { clearMap() {} };
    const clearMapSpy = jest.spyOn(strategyMock, 'clearMap');
    const strategy = new BindStrategy();

    strategy.strategy = { clearMap: clearMapSpy };
    strategy.clearMap();

    expect(clearMapSpy).toHaveBeenCalledTimes(1);
    expect(clearMapSpy).toHaveBeenCalledWith();
  });

  it('should destroy object after call `destroy` method', () => {
    const strategyMock = { destroy() {} };
    const destroySpy = jest.spyOn(strategyMock, 'destroy');
    const strategy = new BindStrategy();

    strategy.strategy = { destroy: destroySpy };
    strategy.destroy();

    expect(destroySpy).toHaveBeenCalledTimes(1);
    expect(destroySpy).toHaveBeenCalledWith();
    expect(strategy.strategy).toBeNull();
  });
});
