import { compareFunctionFactory as checkboxSort } from 'handsontable/plugins/columnSorting/sortFunction/checkbox';

it('checkbox comparing function shouldn\'t change order when comparing empty string, null and undefined', () => {
  const defaultTemplates = { checkedTemplate: true, uncheckedTemplate: false };

  expect(checkboxSort('asc', defaultTemplates, {})(null, null)).toEqual(0);
  expect(checkboxSort('desc', defaultTemplates, {})(null, null)).toEqual(0);

  expect(checkboxSort('asc', defaultTemplates, {})('', '')).toEqual(0);
  expect(checkboxSort('desc', defaultTemplates, {})('', '')).toEqual(0);

  expect(checkboxSort('asc', defaultTemplates, {})(undefined, undefined)).toEqual(0);
  expect(checkboxSort('desc', defaultTemplates, {})(undefined, undefined)).toEqual(0);

  expect(checkboxSort('asc', defaultTemplates, {})('', null)).toEqual(0);
  expect(checkboxSort('desc', defaultTemplates, {})('', null)).toEqual(0);
  expect(checkboxSort('asc', defaultTemplates, {})(null, '')).toEqual(0);
  expect(checkboxSort('desc', defaultTemplates, {})(null, '')).toEqual(0);

  expect(checkboxSort('asc', defaultTemplates, {})('', undefined)).toEqual(0);
  expect(checkboxSort('desc', defaultTemplates, {})('', undefined)).toEqual(0);
  expect(checkboxSort('asc', defaultTemplates, {})(undefined, '')).toEqual(0);
  expect(checkboxSort('desc', defaultTemplates, {})(undefined, '')).toEqual(0);

  expect(checkboxSort('asc', defaultTemplates, {})(null, undefined)).toEqual(0);
  expect(checkboxSort('desc', defaultTemplates, {})(null, undefined)).toEqual(0);
  expect(checkboxSort('asc', defaultTemplates, {})(undefined, null)).toEqual(0);
  expect(checkboxSort('desc', defaultTemplates, {})(undefined, null)).toEqual(0);
});
