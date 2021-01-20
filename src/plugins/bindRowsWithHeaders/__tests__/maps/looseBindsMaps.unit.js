import LooseBindsMap from 'handsontable/plugins/bindRowsWithHeaders/maps/looseBindsMap';

it('should re-index mapped indexes properly after insertion', () => {
  const looseBindsMap = new LooseBindsMap();

  looseBindsMap.init(5);
  looseBindsMap.insert(2, [2]);

  expect(looseBindsMap.getValues()).toEqual([0, 1, 2, 3, 4, 5]);

  looseBindsMap.insert(3, [3]);

  expect(looseBindsMap.getValues()).toEqual([0, 1, 2, 3, 4, 5, 6]);
});

it('should re-index mapped indexes properly after removal', () => {
  const looseBindsMap = new LooseBindsMap();

  looseBindsMap.init(5);
  looseBindsMap.remove([2]);

  expect(looseBindsMap.getValues()).toEqual([0, 1, 2, 3]);

  looseBindsMap.remove([2]);

  expect(looseBindsMap.getValues()).toEqual([0, 1, 2]);
});

it('should re-index mapped indexes properly after some removals and insertions', () => {
  const looseBindsMap = new LooseBindsMap();

  looseBindsMap.init(5);
  looseBindsMap.remove([2]);

  expect(looseBindsMap.getValues()).toEqual([0, 1, 2, 3]);

  looseBindsMap.insert(2, [2]);

  expect(looseBindsMap.getValues()).toEqual([0, 1, 2, 3, 4]);

  looseBindsMap.remove([3]);

  expect(looseBindsMap.getValues()).toEqual([0, 1, 2, 3]);

  looseBindsMap.insert(0, [0]);

  expect(looseBindsMap.getValues()).toEqual([0, 1, 2, 3, 4]);
});
