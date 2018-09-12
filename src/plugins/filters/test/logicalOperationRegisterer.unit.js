import { operations, registerOperation, getOperationFunc } from 'handsontable-pro/plugins/filters/logicalOperationRegisterer';

describe('registerOperation', () => {
  it('should register operation function under its name', () => {
    const operationMock = function() {};

    expect(operations.xor).not.toBeDefined();

    registerOperation('xor', 'XOR', operationMock);

    expect(operations.xor).toBeDefined();
    expect(operations.xor.func).toBe(operationMock);
  });
});

describe('getOperationFunc', () => {
  afterEach(() => {
    operations.xor = null;
  });

  it('should return operation result function as a closure', () => {
    const operationMock = () => true;

    operations.xor = { func: operationMock, name: 'XOR' };

    const func = getOperationFunc('xor');

    expect(func instanceof Function).toBe(true);
  });

  it('should throw exception if operation doesn\'t exists', () => {
    expect(() => {
      getOperationFunc('xor');
    }).toThrow();
  });

  it('should return `true`', () => {
    const operationMock = jasmine.createSpy();
    const conditionsMock = [{}, {}];
    const argsMock = 'hello world';

    operationMock.and.returnValue(true);
    operations.xor = { func: operationMock, name: 'XOR' };

    const result = getOperationFunc('xor')(conditionsMock, argsMock);

    expect(operationMock).toHaveBeenCalledWith(conditionsMock, argsMock);
    expect(result).toBe(true);
  });
});
