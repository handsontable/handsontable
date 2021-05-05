import ColumnFilter from '../column';

describe('ColumnFilter', () => {
  it('should expose interface', () => {
    const filter = new ColumnFilter(0, 10, 3);

    expect(filter.offsetted).toBeDefined();
  });
});
