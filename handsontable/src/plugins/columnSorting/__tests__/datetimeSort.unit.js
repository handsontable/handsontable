import { createDateTimeCompareFunction } from '../utils';

describe('createDateTimeCompareFunction', () => {
  it('orders datetimes ascending, including mixed date-only and full values', () => {
    const cmp = createDateTimeCompareFunction('asc', {});
    const values = ['2024-03-17T23:59:59', '2024-03-15', '2024-03-16 09:00:00'];

    values.sort(cmp);

    expect(values).toEqual(['2024-03-15', '2024-03-16 09:00:00', '2024-03-17T23:59:59']);
  });
});
