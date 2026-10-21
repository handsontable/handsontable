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

it('checkbox comparing function should sort a case variant with the template it matches (DEV-355)', () => {
  const templates = { checkedTemplate: 'Yes', uncheckedTemplate: 'No' };
  const values = ['YES', 'No', 'yes', 'no', 'Yes'];

  expect([...values].sort(checkboxSort('asc', templates, {}))).toEqual(['No', 'no', 'YES', 'yes', 'Yes']);
});

it('checkbox comparing function should keep the default-template order for an undefined template', () => {
  const columnMeta = {};

  // With no templates in the column meta, values sort as before: by the default comparator.
  expect(checkboxSort('asc', columnMeta, {})('TRUE', true)).toBe(checkboxSort('asc', columnMeta, {})('true', true));
});

