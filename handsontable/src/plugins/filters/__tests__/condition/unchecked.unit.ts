import { condition } from 'handsontable/plugins/filters/condition/unchecked';
import { dateRowFactory } from '../helpers/utils';

describe('Filters condition (`unchecked`)', () => {
  it('should match the default unchecked template', () => {
    const data = dateRowFactory({ type: 'checkbox' });

    expect(condition(data(false), [])).toBe(true);
    expect(condition(data(true), [])).toBe(false);
  });

  it('should match a value that reads as the unchecked template, ignoring case', () => {
    const data = dateRowFactory({ type: 'checkbox' });

    expect(condition(data('FALSE'), [])).toBe(true);
    expect(condition(data('false'), [])).toBe(true);
    expect(condition(data('True'), [])).toBe(false);
  });

  it('should match a custom unchecked template', () => {
    const data = dateRowFactory({ type: 'checkbox', checkedTemplate: 'yes', uncheckedTemplate: 'no' });

    expect(condition(data('no'), [])).toBe(true);
    expect(condition(data('NO'), [])).toBe(true);
    expect(condition(data('yes'), [])).toBe(false);
    expect(condition(data(false), [])).toBe(false);
  });

  it('should match an empty cell when the unchecked template is itself empty', () => {
    const data = dateRowFactory({ type: 'checkbox', uncheckedTemplate: '' });

    expect(condition(data(''), [])).toBe(true);
    expect(condition(data(null), [])).toBe(true);
  });

  it('should not match an empty cell or a value that matches neither template', () => {
    const data = dateRowFactory({ type: 'checkbox' });

    expect(condition(data(''), [])).toBe(false);
    expect(condition(data(null), [])).toBe(false);
    expect(condition(data(undefined), [])).toBe(false);
    expect(condition(data('maybe'), [])).toBe(false);
    expect(condition(data(0), [])).toBe(false);
  });
});
