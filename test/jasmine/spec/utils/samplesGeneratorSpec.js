describe('SamplesGenerator', function () {

  var SamplesGenerator = Handsontable.utils.SamplesGenerator;

  it('should internally call `generateSamples` when calling `generateRowSamples`', function () {
    var sg = new SamplesGenerator();

    spyOn(sg, 'generateSamples').andReturn('test');

    var result = sg.generateRowSamples('first param', 'second param');

    expect(result).toBe('test');
    expect(sg.generateSamples.calls.length).toBe(1);
    expect(sg.generateSamples.calls[0].args[0]).toBe('row');
    expect(sg.generateSamples.calls[0].args[1]).toBe('second param');
    expect(sg.generateSamples.calls[0].args[2]).toBe('first param');
  });

  it('should internally call `generateSamples` when calling `generateColumnSamples`', function () {
    var sg = new SamplesGenerator();

    spyOn(sg, 'generateSamples').andReturn('test');

    var result = sg.generateColumnSamples('first param', 'second param');

    expect(result).toBe('test');
    expect(sg.generateSamples.calls.length).toBe(1);
    expect(sg.generateSamples.calls[0].args[0]).toBe('col');
    expect(sg.generateSamples.calls[0].args[1]).toBe('second param');
    expect(sg.generateSamples.calls[0].args[2]).toBe('first param');
  });

  it('should generate collection of Maps when range is passed as Number', function () {
    var sg = new SamplesGenerator();

    spyOn(sg, 'generateSample').andCallFake(function(type, range, index) {
      var map = new Map();

      map.set(index, {type: type, range: range, index: index});

      return map;
    });

    var result = sg.generateSamples('row', 10, 1);

    expect(result instanceof Map).toBe(true);
    expect(result.size).toBe(1);
    expect(result.get(1).get(1).type).toBe('row');
  });

  it('should generate collection of Maps when range is passed as Object', function () {
    var sg = new SamplesGenerator();

    spyOn(sg, 'generateSample').andCallFake(function(type, range, index) {
      var map = new Map();

      map.set(index, {type: type, range: range, index: index});

      return map;
    });

    var result = sg.generateSamples('col', 10, {from: 4, to: 12});

    expect(result instanceof Map).toBe(true);
    expect(result.size).toBe(9);
    expect(result.get(7).get(7).type).toBe('col');
  });

  it('should generate row sample', function () {
    var sg = new SamplesGenerator(function(row, col) {
      var data = [
        [1, 2, 3, 44],
        ['AA', 'BB', 'C', 'D'],
        ['zz', 'xxx', 'c-c', 'vvvvv']
      ];

      return data[row][col];
    });

    spyOn(sg, 'dataFactory').andCallThrough();

    var result = sg.generateSample('row', {from: 1, to: 3}, 1);

    expect(sg.dataFactory.calls.length).toBe(3);
    expect(sg.dataFactory.mostRecentCall.args[0]).toBe(1);
    expect(sg.dataFactory.mostRecentCall.args[1]).toBe(3);
    expect(result instanceof Map).toBe(true);
    expect(result.size).toBe(2);
    expect(result.get(1).strings.length).toBe(2);
    expect(result.get(1).strings[0].value).toBe('C');
    expect(result.get(1).strings[1].value).toBe('D');
    expect(result.get(1).strings[0].col).toBe(2);
    expect(result.get(1).strings[1].col).toBe(3);
    expect(result.get(2).strings.length).toBe(1);
    expect(result.get(2).strings[0].value).toBe('BB');
    expect(result.get(2).strings[0].col).toBe(1);
  });

  it('should generate column sample', function () {
    var sg = new SamplesGenerator(function(row, col) {
      var data = [
        [1, 2, 3, 44],
        ['AA', 'BB', 'C', 'D'],
        ['zz', 'xxx', 'c-c', 'vvvvv']
      ];

      return data[row][col];
    });

    spyOn(sg, 'dataFactory').andCallThrough();

    var result = sg.generateSample('col', {from: 0, to: 2}, 1);

    expect(sg.dataFactory.calls.length).toBe(3);
    expect(sg.dataFactory.mostRecentCall.args[0]).toBe(2);
    expect(sg.dataFactory.mostRecentCall.args[1]).toBe(1);
    expect(result instanceof Map).toBe(true);
    expect(result.size).toBe(3);
    expect(result.get(1).strings.length).toBe(1);
    expect(result.get(1).strings[0].value).toBe('2');
    expect(result.get(1).strings[0].row).toBe(0);
    expect(result.get(2).strings.length).toBe(1);
    expect(result.get(2).strings[0].value).toBe('BB');
    expect(result.get(2).strings[0].row).toBe(1);
    expect(result.get(3).strings.length).toBe(1);
    expect(result.get(3).strings[0].value).toBe('xxx');
    expect(result.get(3).strings[0].row).toBe(2);
  });
});
