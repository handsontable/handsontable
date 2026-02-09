import StrictBindsMap from 'handsontable/plugins/bindRowsWithHeaders/maps/strictBindsMap';

it('should re-index mapped indexes properly after insertion', () => {
  const strictBindsMap = new StrictBindsMap();

  strictBindsMap.init(5);
  strictBindsMap.insert(2, [2]);

  expect(strictBindsMap.getValues()).toEqual([0, 1, 5, 2, 3, 4]);

  strictBindsMap.insert(3, [3]);

  expect(strictBindsMap.getValues()).toEqual([0, 1, 5, 6, 2, 3, 4]);
});

it('should re-index mapped indexes properly after removal', () => {
  const strictBindsMap = new StrictBindsMap();

  strictBindsMap.init(5);
  strictBindsMap.remove([2]);

  expect(strictBindsMap.getValues()).toEqual([0, 1, 3, 4]);

  strictBindsMap.remove([2]);

  expect(strictBindsMap.getValues()).toEqual([0, 1, 4]);
});

it('should re-index mapped indexes properly after some removals and insertions', () => {
  const strictBindsMap = new StrictBindsMap();

  strictBindsMap.init(5);
  strictBindsMap.remove([2]);

  expect(strictBindsMap.getValues()).toEqual([0, 1, 3, 4]);

  strictBindsMap.insert(2, [2]);

  expect(strictBindsMap.getValues()).toEqual([0, 1, 5, 3, 4]);

  strictBindsMap.remove([3]);

  expect(strictBindsMap.getValues()).toEqual([0, 1, 5, 4]);

  strictBindsMap.insert(0, [0]);

  expect(strictBindsMap.getValues()).toEqual([6, 0, 1, 5, 4]);
});
