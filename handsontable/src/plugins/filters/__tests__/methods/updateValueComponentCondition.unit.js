import { Filters } from '../../filters';

describe('Filters - updateValueComponentCondition method', () => {
  it('should use normalized values from `getDataMapAtColumn` when updating state #12005', () => {
    const updateStatesAtColumn = jasmine.createSpy('updateStatesAtColumn');
    const context = {
      hot: {
        toPhysicalColumn: jasmine.createSpy('toPhysicalColumn').and.returnValue(0),
        getDataAtCol: jasmine.createSpy('getDataAtCol'),
      },
      getDataMapAtColumn: jasmine.createSpy('getDataMapAtColumn').and.returnValue([
        { value: 'John F. Kennedy International Airport' },
        { value: 'Chicago O\'Hare International Airport' },
        { value: 'John F. Kennedy International Airport' },
      ]),
      conditionUpdateObserver: {
        updateStatesAtColumn,
      },
    };

    Filters.prototype.updateValueComponentCondition.call(context, 0);

    expect(context.hot.toPhysicalColumn).toHaveBeenCalledWith(0);
    expect(context.getDataMapAtColumn).toHaveBeenCalledWith(0);
    expect(context.hot.getDataAtCol).not.toHaveBeenCalled();
    expect(updateStatesAtColumn).toHaveBeenCalledWith(0, [
      'Chicago O\'Hare International Airport',
      'John F. Kennedy International Airport',
    ]);
  });

  it('should not update state for non-existing physical column', () => {
    const context = {
      hot: {
        toPhysicalColumn: jasmine.createSpy('toPhysicalColumn').and.returnValue(null),
      },
      getDataMapAtColumn: jasmine.createSpy('getDataMapAtColumn'),
      conditionUpdateObserver: {
        updateStatesAtColumn: jasmine.createSpy('updateStatesAtColumn'),
      },
    };

    Filters.prototype.updateValueComponentCondition.call(context, 3);

    expect(context.getDataMapAtColumn).not.toHaveBeenCalled();
    expect(context.conditionUpdateObserver.updateStatesAtColumn).not.toHaveBeenCalled();
  });
});
