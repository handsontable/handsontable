import { condition } from 'handsontable/plugins/filters/condition/checked';
import { dateRowFactory } from '../helpers/utils';

describe('Filters condition (`checked`)', () => {
  it('should match the default checked template', () => {
    const data = dateRowFactory({ type: 'checkbox' });

    expect(condition(data(true), [])).toBe(true);
    expect(condition(data(false), [])).toBe(false);
  });

  it('should match a value that reads as the checked template, ignoring case', () => {
    const data = dateRowFactory({ type: 'checkbox' });

    expect(condition(data('TRUE'), [])).toBe(true);
    expect(condition(data('true'), [])).toBe(true);
    expect(condition(data('False'), [])).toBe(false);
  });

  it('should match a custom checked template', () => {
    const data = dateRowFactory({ type: 'checkbox', checkedTemplate: 'yes', uncheckedTemplate: 'no' });

    expect(condition(data('yes'), [])).toBe(true);
    expect(condition(data('YES'), [])).toBe(true);
    expect(condition(data('no'), [])).toBe(false);
    expect(condition(data(true), [])).toBe(false);
  });

  it('should not match an empty cell or a value that matches neither template', () => {
    const data = dateRowFactory({ type: 'checkbox' });

    expect(condition(data(''), [])).toBe(false);
    expect(condition(data(null), [])).toBe(false);
    expect(condition(data(undefined), [])).toBe(false);
    expect(condition(data('maybe'), [])).toBe(false);
    expect(condition(data(1), [])).toBe(false);
  });
});
