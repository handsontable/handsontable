import {
  getNormalizedDate,
} from 'handsontable/helpers/date';

describe('Date helper', () => {
  describe('getNormalizedDate', () => {
    it('should return a proper date object, with time set to 00:00, when providing it with a date-only string', () => {
      const date1 = getNormalizedDate('2016-02-02');
      const date2 = getNormalizedDate('2016/02/02');
      const date3 = getNormalizedDate('02/02/2016');

      expect(date1.getDate()).toEqual(2);
      expect(date2.getDate()).toEqual(2);
      expect(date3.getDate()).toEqual(2);

      expect(date1.getMonth()).toEqual(1);
      expect(date2.getMonth()).toEqual(1);
      expect(date3.getMonth()).toEqual(1);

      expect(date1.getFullYear()).toEqual(2016);
      expect(date2.getFullYear()).toEqual(2016);
      expect(date3.getFullYear()).toEqual(2016);

      expect(date1.getFullYear()).toEqual(2016);
      expect(date2.getFullYear()).toEqual(2016);
      expect(date3.getFullYear()).toEqual(2016);

      expect(date1.getHours()).toEqual(0);
      expect(date2.getHours()).toEqual(0);
      expect(date3.getHours()).toEqual(0);

      expect(date1.getMinutes()).toEqual(0);
      expect(date2.getMinutes()).toEqual(0);
      expect(date3.getMinutes()).toEqual(0);
    });

  });
});
