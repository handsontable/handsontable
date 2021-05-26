import ColumnFilter from 'walkontable/filter/column';

describe('ColumnFilter', () => {
  describe('offsettedTH', () => {
    it('should do nothing if row header is not visible', () => {
      const filter = new ColumnFilter();

      filter.countTH = 0;

      expect(filter.offsettedTH(1)).toEqual(1);
    });

    it('should decrease n by 1 if row header is visible', () => {
      const filter = new ColumnFilter();

      filter.countTH = 1;

      expect(filter.offsettedTH(1)).toEqual(0);
    });
  });

  describe('unOffsettedTH', () => {
    it('should do nothing if row header is not visible', () => {
      const filter = new ColumnFilter();

      filter.countTH = 0;

      expect(filter.unOffsettedTH(1)).toEqual(1);
    });

    it('should increase n by 1 if row header is visible', () => {
      const filter = new ColumnFilter();

      filter.countTH = 1;

      expect(filter.unOffsettedTH(0)).toEqual(1);
    });
  });
});
