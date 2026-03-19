import { Filters } from '../../filters';

describe('Filters - updateValueComponentCondition method', () => {
  it('should pass unified values from `getDataAtCol` to state observer #12005', () => {
    const updateStatesAtColumn = jasmine.createSpy('updateStatesAtColumn');
    const context = {
      hot: {
        getDataAtCol: jasmine.createSpy('getDataAtCol').and.returnValue([
          'John F. Kennedy International Airport',
          'Chicago O\'Hare International Airport',
          'John F. Kennedy International Airport',
          null,
          undefined,
        ]),
      },
      conditionUpdateObserver: {
        updateStatesAtColumn,
      },
    };

    Filters.prototype.updateValueComponentCondition.call(context, 0);

    expect(context.hot.getDataAtCol).toHaveBeenCalledWith(0);
    expect(updateStatesAtColumn).toHaveBeenCalledWith(0, [
      '',
      '',
      'Chicago O\'Hare International Airport',
      'John F. Kennedy International Airport',
    ]);
  });
});
