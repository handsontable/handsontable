import { compareFunctionFactory as checkboxSort } from 'handsontable/plugins/columnSorting/sortFunction/checkbox';

it('checkbox comparing function shouldn\'t change order when comparing empty string, null and undefined', () => {
  const defaultTemplates = { checkedTemplate: true, uncheckedTemplate: false };

  expect(checkboxSort('asc', defaultTemplates, {})(null, null)).toBe(0);
  expect(checkboxSort('desc', defaultTemplates, {})(null, null)).toBe(0);

  expect(checkboxSort('asc', defaultTemplates, {})('', '')).toBe(0);
  expect(checkboxSort('desc', defaultTemplates, {})('', '')).toBe(0);

  expect(checkboxSort('asc', defaultTemplates, {})(undefined, undefined)).toBe(0);
  expect(checkboxSort('desc', defaultTemplates, {})(undefined, undefined)).toBe(0);

  expect(checkboxSort('asc', defaultTemplates, {})('', null)).toBe(0);
  expect(checkboxSort('desc', defaultTemplates, {})('', null)).toBe(0);
  expect(checkboxSort('asc', defaultTemplates, {})(null, '')).toBe(0);
  expect(checkboxSort('desc', defaultTemplates, {})(null, '')).toBe(0);

  expect(checkboxSort('asc', defaultTemplates, {})('', undefined)).toBe(0);
  expect(checkboxSort('desc', defaultTemplates, {})('', undefined)).toBe(0);
  expect(checkboxSort('asc', defaultTemplates, {})(undefined, '')).toBe(0);
  expect(checkboxSort('desc', defaultTemplates, {})(undefined, '')).toBe(0);

  expect(checkboxSort('asc', defaultTemplates, {})(null, undefined)).toBe(0);
  expect(checkboxSort('desc', defaultTemplates, {})(null, undefined)).toBe(0);
  expect(checkboxSort('asc', defaultTemplates, {})(undefined, null)).toBe(0);
  expect(checkboxSort('desc', defaultTemplates, {})(undefined, null)).toBe(0);
});
