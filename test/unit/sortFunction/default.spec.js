import defaultSort from 'handsontable/plugins/columnSorting/sortFunction/default';

it('defaultSort comparing function shouldn\'t change order when comparing empty string, null and undefined', () => {

  expect(defaultSort(false, {})(['key1', null], ['key2', null])).toEqual(0);
  expect(defaultSort(false, {})(['key1', ''], ['key2', ''])).toEqual(0);
  expect(defaultSort(false, {})(['key1', undefined], ['key2', undefined])).toEqual(0);

  expect(defaultSort(false, {})(['key1', ''], ['key2', null])).toEqual(0);
  expect(defaultSort(false, {})(['key1', null], ['key2', ''])).toEqual(0);

  expect(defaultSort(false, {})(['key1', ''], ['key2', undefined])).toEqual(0);
  expect(defaultSort(false, {})(['key1', undefined], ['key2', ''])).toEqual(0);

  expect(defaultSort(false, {})(['key1', null], ['key2', undefined])).toEqual(0);
  expect(defaultSort(false, {})(['key1', undefined], ['key2', null])).toEqual(0);
});
