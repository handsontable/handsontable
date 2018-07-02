import defaultSort from 'handsontable/plugins/columnSorting/sortFunction/default';

it('defaultSort comparing function shouldn\'t change order when comparing empty string, null and undefined', () => {
  const index0 = 0;
  const index1 = 1;

  expect(defaultSort(false, {columnSorting: {}})([index0, null], [index1, null])).toEqual(0);
  expect(defaultSort(false, {columnSorting: {}})([index0, ''], [index1, ''])).toEqual(0);
  expect(defaultSort(false, {columnSorting: {}})([index0, undefined], [index1, undefined])).toEqual(0);

  expect(defaultSort(false, {columnSorting: {}})([index0, ''], [index1, null])).toEqual(0);
  expect(defaultSort(false, {columnSorting: {}})([index0, null], [index1, ''])).toEqual(0);

  expect(defaultSort(false, {columnSorting: {}})([index0, ''], [index1, undefined])).toEqual(0);
  expect(defaultSort(false, {columnSorting: {}})([index0, undefined], [index1, ''])).toEqual(0);

  expect(defaultSort(false, {columnSorting: {}})([index0, null], [index1, undefined])).toEqual(0);
  expect(defaultSort(false, {columnSorting: {}})([index0, undefined], [index1, null])).toEqual(0);
});
