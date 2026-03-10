import { Filters } from '../../filters';

describe('Filters - updateValueComponentCondition method', () => {
  it('should use values normalized by `valueGetter` when updating state #12005', () => {
    const updateStatesAtColumn = jasmine.createSpy('updateStatesAtColumn');
    const context = {
      hot: {
        getDataAtCol: jasmine.createSpy('getDataAtCol').and.returnValue([
          { key: 'JFK', value: 'John F. Kennedy International Airport' },
          { key: 'ORD', value: 'Chicago O\'Hare International Airport' },
          { key: 'JFK', value: 'John F. Kennedy International Airport' },
        ]),
        getCellMeta: jasmine.createSpy('getCellMeta').and.callFake((visualRow) => {
          return {
            instance: null,
            visualRow,
            visualCol: 0,
            valueGetter: value => value.value,
          };
        }),
      },
      getDataMapAtColumn: jasmine.createSpy('getDataMapAtColumn'),
      conditionUpdateObserver: {
        updateStatesAtColumn,
      },
    };

    Filters.prototype.updateValueComponentCondition.call(context, 0);

    expect(context.hot.getDataAtCol).toHaveBeenCalledWith(0);
    expect(context.hot.getCellMeta).toHaveBeenCalledTimes(3);
    expect(context.getDataMapAtColumn).not.toHaveBeenCalled();
    expect(updateStatesAtColumn).toHaveBeenCalledWith(0, [
      'Chicago O\'Hare International Airport',
      'John F. Kennedy International Airport',
    ]);
  });
});
