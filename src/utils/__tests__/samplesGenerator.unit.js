import SamplesGenerator from '../samplesGenerator';

describe('SamplesGenerator', () => {
  it('should throw an error if type is unsupported', () => {
    const sg = new SamplesGenerator();

    expect(() => {
      sg.generateSample('unsupported');
    }).toThrowError('Unsupported sample type');
  });

  it('should be possible to set samples count', () => {
    const sg = new SamplesGenerator();

    sg.setSampleCount(10);

    expect(sg.getSampleCount()).toBe(10);
  });

  it('should be possible to allow using duplicates', () => {
    const sg = new SamplesGenerator();

    sg.setAllowDuplicates(true);

    expect(sg.allowDuplicates).toBe(true);
  });

  it('should internally call `generateSamples` when calling `generateRowSamples`', () => {
    const sg = new SamplesGenerator();

    spyOn(sg, 'generateSamples').and.returnValue('test');

    const result = sg.generateRowSamples('first param', 'second param');

    expect(result).toBe('test');
    expect(sg.generateSamples.calls.count()).toBe(1);
    expect(sg.generateSamples.calls.argsFor(0)[0]).toBe('row');
    expect(sg.generateSamples.calls.argsFor(0)[1]).toBe('second param');
    expect(sg.generateSamples.calls.argsFor(0)[2]).toBe('first param');
  });

  it('should internally call `generateSamples` when calling `generateColumnSamples`', () => {
    const sg = new SamplesGenerator();

    spyOn(sg, 'generateSamples').and.returnValue('test');

    const result = sg.generateColumnSamples('first param', 'second param');

    expect(result).toBe('test');
    expect(sg.generateSamples.calls.count()).toBe(1);
    expect(sg.generateSamples.calls.argsFor(0)[0]).toBe('col');
    expect(sg.generateSamples.calls.argsFor(0)[1]).toBe('second param');
    expect(sg.generateSamples.calls.argsFor(0)[2]).toBe('first param');
  });

  it('should generate collection of Maps when range is passed as Number', () => {
    const sg = new SamplesGenerator();

    spyOn(sg, 'generateSample').and.callFake((type, range, index) => {
      const map = new Map();

      map.set(index, { type, range, index });

      return map;
    });

    const result = sg.generateSamples('row', 10, 1);

    expect(result instanceof Map).toBe(true);
    expect(result.size).toBe(1);
    expect(result.get(1).get(1).type).toBe('row');
  });

  it('should generate collection of Maps when range is passed as Object', () => {
    const sg = new SamplesGenerator();

    spyOn(sg, 'generateSample').and.callFake((type, range, index) => {
      const map = new Map();

      map.set(index, { type, range, index });

      return map;
    });

    const result = sg.generateSamples('col', 10, { from: 4, to: 12 });

    expect(result instanceof Map).toBe(true);
    expect(result.size).toBe(9);
    expect(result.get(7).get(7).type).toBe('col');
  });

  it('should generate row sample', () => {
    const sg = new SamplesGenerator((row, col) => {
      const data = [
        ['AA', { id: 2 }, 'C', [1, 2, 3, 4, 5], 123456789],
      ];

      return {
        value: data[row][col]
      };
    });

    spyOn(sg, 'dataFactory').and.callThrough();

    const result = sg.generateSample('row', { from: 0, to: 4 }, 0);

    expect(sg.dataFactory.calls.count()).toBe(5);
    expect(sg.dataFactory.calls.mostRecent().args[0]).toBe(0);
    expect(sg.dataFactory.calls.mostRecent().args[1]).toBe(4);
    expect(result instanceof Map).toBe(true);
    expect(result.size).toBe(4);
    expect(result.get('1').strings).toEqual([{ value: { id: 2 }, col: 1 }, { value: 'C', col: 2 }]);
    expect(result.get('2').strings).toEqual([{ value: 'AA', col: 0 }]);
  });

  it('should generate row sample with limited generated items (when the data source contains the same values)', () => {
    const sg = new SamplesGenerator((row, col) => {
      const data = [
        [true, true, true, true, true, true, true, true, true, true],
      ];

      return {
        value: data[row][col]
      };
    });

    spyOn(sg, 'dataFactory').and.callThrough();

    const result = sg.generateSample('row', { from: 0, to: 9 }, 0);

    expect(result.size).toBe(1);
    expect(result.get('4').strings).toEqual([{ col: 0, value: true }]);
  });

  it('should generate row sample controlled by `bundleSeed` (in case of collecting more samples despite their repeatability)', () => {
    let seedIndex = 0;
    const data = [
      [true, true, true, true, true, true, true, true, true, true],
    ];
    const sg = new SamplesGenerator((row, col) => {
      seedIndex += 1;

      return {
        value: data[row][col],
        bundleSeed: `${seedIndex}`,
      };
    });

    spyOn(sg, 'dataFactory').and.callThrough();

    const result = sg.generateSample('row', { from: 0, to: 9 }, 0);

    expect(result.size).toBe(10);
    expect(result.get('1').strings).toEqual([{ col: 0, value: true }]);
    expect(result.get('2').strings).toEqual([{ col: 1, value: true }]);
    expect(result.get('3').strings).toEqual([{ col: 2, value: true }]);
    expect(result.get('4').strings).toEqual([{ col: 3, value: true }]);
    expect(result.get('5').strings).toEqual([{ col: 4, value: true }]);
    expect(result.get('6').strings).toEqual([{ col: 5, value: true }]);
    expect(result.get('7').strings).toEqual([{ col: 6, value: true }]);
    expect(result.get('8').strings).toEqual([{ col: 7, value: true }]);
    expect(result.get('9').strings).toEqual([{ col: 8, value: true }]);
    expect(result.get('10').strings).toEqual([{ col: 9, value: true }]);
  });

  it('should generate column sample', () => {
    const sg = new SamplesGenerator((row, col) => {
      const data = [
        [1, 2, 3, 44],
        ['AA', 'BB', 'C', 'D'],
        ['zz', 'xxx', 'c-c', 'vvvvv'],
        [[1], [1, 2], [1, 2], [4]],
        [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }],
      ];

      return {
        value: data[row][col]
      };
    });

    spyOn(sg, 'dataFactory').and.callThrough();

    const result = sg.generateSample('col', { from: 0, to: 4 }, 3);

    expect(sg.dataFactory.calls.count()).toBe(5);
    expect(sg.dataFactory.calls.mostRecent().args[0]).toBe(4);
    expect(sg.dataFactory.calls.mostRecent().args[1]).toBe(3);
    expect(result instanceof Map).toBe(true);
    expect(result.size).toBe(3);
    expect(result.get('1').strings).toEqual([
      { value: 'D', row: 1 }, { value: [4], row: 3 }, { value: { id: 4 }, row: 4 }
    ]);
    expect(result.get('2').strings).toEqual([{ value: 44, row: 0 }]);
  });

  it('should generate column sample with limited generated items (when the data source contains the same values)', () => {
    const sg = new SamplesGenerator((row, col) => {
      const data = [
        [true],
        [true],
        [true],
        [true],
        [true],
        [true],
        [true],
        [true],
        [true],
        [true],
      ];

      return {
        value: data[row][col]
      };
    });

    spyOn(sg, 'dataFactory').and.callThrough();

    const result = sg.generateSample('col', { from: 0, to: 9 }, 0);

    expect(result.size).toBe(1);
    expect(result.get('4').strings).toEqual([{ row: 0, value: true }]);
  });

  it('should generate column sample controlled by `bundleSeed` (in case of collecting more samples despite their repeatability)', () => {
    let seedIndex = 0;
    const data = [
      [true],
      [true],
      [true],
      [true],
      [true],
      [true],
      [true],
      [true],
      [true],
      [true],
    ];

    const sg = new SamplesGenerator((row, col) => {
      seedIndex += 1;

      return {
        value: data[row][col],
        bundleSeed: `${seedIndex}`,
      };
    });

    spyOn(sg, 'dataFactory').and.callThrough();

    const result = sg.generateSample('col', { from: 0, to: 9 }, 0);

    expect(result.size).toBe(10);
    expect(result.get('1').strings).toEqual([{ row: 0, value: true }]);
    expect(result.get('2').strings).toEqual([{ row: 1, value: true }]);
    expect(result.get('3').strings).toEqual([{ row: 2, value: true }]);
    expect(result.get('4').strings).toEqual([{ row: 3, value: true }]);
    expect(result.get('5').strings).toEqual([{ row: 4, value: true }]);
    expect(result.get('6').strings).toEqual([{ row: 5, value: true }]);
    expect(result.get('7').strings).toEqual([{ row: 6, value: true }]);
    expect(result.get('8').strings).toEqual([{ row: 7, value: true }]);
    expect(result.get('9').strings).toEqual([{ row: 8, value: true }]);
    expect(result.get('10').strings).toEqual([{ row: 9, value: true }]);
  });
});
