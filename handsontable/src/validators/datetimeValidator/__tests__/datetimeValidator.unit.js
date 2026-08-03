import { datetimeValidator, sourceDataValidator } from '../datetimeValidator';

describe('datetimeValidator', () => {
  it('accepts valid datetimes and date-only values', (done) => {
    const results = [];
    const push = v => results.push(v);

    datetimeValidator.call({}, '2024-12-25T14:30:00', push);
    datetimeValidator.call({}, '2024-06-01', push);
    datetimeValidator.call({}, '2024-03-16 09:00:00', push);
    datetimeValidator.call({}, 'not-a-date', push);

    setTimeout(() => {
      expect(results).toEqual([true, true, true, false]);
      done();
    }, 0);
  });

  it('accepts empty when allowEmpty', (done) => {
    datetimeValidator.call({ allowEmpty: true }, '', (v) => {
      expect(v).toBe(true);
      done();
    });
  });

  it('sourceDataValidator passes formula strings through', () => {
    expect(sourceDataValidator('=A1', {})).toBe(true);
    expect(sourceDataValidator('2024-12-25T14:30:00', {})).toBe(true);
    expect(sourceDataValidator('garbage', {})).toBe(false);
  });
});
