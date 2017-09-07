import {operations, registerOperation, getOperationFunc} from 'handsontable-pro/plugins/filters/logicalOperationRegisterer';

describe('registerOperation', function() {
  it('should register operation function under its name', function() {
    const operationMock = function() {};

    expect(operations.xor).not.toBeDefined();

    registerOperation('xor', 'XOR', operationMock);

    expect(operations.xor).toBeDefined();
    expect(operations.xor.func).toBe(operationMock);
  });
});

describe('getOperationFunc', function() {
  afterEach(function () {
    operations.xor = null;
  });

  it('should return operation result function as a closure', function() {
    const operationMock = () => true;

    operations.xor = { func: operationMock, name: 'XOR' };

    const func = getOperationFunc('xor');

    expect(func instanceof Function).toBe(true);
  });

  it('should throw exception if operation doesn\'t exists', function() {
    expect(function() {
      getOperationFunc('xor');
    }).toThrow();
  });

  it('should return `true`', function() {
    const operationMock = jasmine.createSpy();
    const conditionsMock = [{}, {}];
    const argsMock = 'hello world';

    operationMock.and.returnValue(true);
    operations.xor = {func: operationMock, name: 'XOR'};

    const result = getOperationFunc('xor')(conditionsMock, argsMock);

    expect(operationMock).toHaveBeenCalledWith(conditionsMock, argsMock);
    expect(result).toBe(true);
  });
});
