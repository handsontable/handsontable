import { ManualColumnResize } from '../manualColumnResize';
import { _resetDeprecationWarnings } from '../../../helpers/console';

describe('ManualColumnResize deprecated resize-state methods', () => {
  let warnSpy;

  beforeEach(() => {
    // `deprecatedWarnOnce` records printed warnings module-globally, so without this each spec
    // below would depend on the order the specs run in.
    _resetDeprecationWarnings();

    warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    warnSpy.mockRestore();
  });

  function deprecationCalls(methodName) {
    return warnSpy.mock.calls.filter(([message]) => String(message).includes(`\`${methodName}()\``));
  }

  describe('saveManualColumnWidths', () => {
    it('should warn once, no matter how many times it is called', () => {
      // The methods read no state, so the prototype call keeps this a unit test.
      ManualColumnResize.prototype.saveManualColumnWidths.call({});
      ManualColumnResize.prototype.saveManualColumnWidths.call({});
      ManualColumnResize.prototype.saveManualColumnWidths.call({});

      const calls = deprecationCalls('saveManualColumnWidths');

      expect(calls.length).toBe(1);
      expect(calls[0][0]).toMatch(/^Deprecated: .*removed in Handsontable 19\.0\.0/);
    });

    it('should return undefined', () => {
      expect(ManualColumnResize.prototype.saveManualColumnWidths.call({})).toBe(undefined);
    });
  });

  describe('loadManualColumnWidths', () => {
    it('should warn once, no matter how many times it is called', () => {
      ManualColumnResize.prototype.loadManualColumnWidths.call({});
      ManualColumnResize.prototype.loadManualColumnWidths.call({});

      const calls = deprecationCalls('loadManualColumnWidths');

      expect(calls.length).toBe(1);
      expect(calls[0][0]).toMatch(/^Deprecated: .*removed in Handsontable 19\.0\.0/);
    });

    it('should return an empty array', () => {
      expect(ManualColumnResize.prototype.loadManualColumnWidths.call({})).toEqual([]);
    });
  });

  it('should warn separately for each method', () => {
    ManualColumnResize.prototype.saveManualColumnWidths.call({});
    ManualColumnResize.prototype.loadManualColumnWidths.call({});

    expect(deprecationCalls('saveManualColumnWidths').length).toBe(1);
    expect(deprecationCalls('loadManualColumnWidths').length).toBe(1);
  });
});
