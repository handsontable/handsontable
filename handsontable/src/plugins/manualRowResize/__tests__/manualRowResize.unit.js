import { ManualRowResize } from '../manualRowResize';
import { _resetDeprecationWarnings } from '../../../helpers/console';

describe('ManualRowResize deprecated resize-state methods', () => {
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

  describe('saveManualRowHeights', () => {
    it('should warn once, no matter how many times it is called', () => {
      // The methods read no state, so the prototype call keeps this a unit test.
      ManualRowResize.prototype.saveManualRowHeights.call({});
      ManualRowResize.prototype.saveManualRowHeights.call({});
      ManualRowResize.prototype.saveManualRowHeights.call({});

      const calls = deprecationCalls('saveManualRowHeights');

      expect(calls.length).toBe(1);
      expect(calls[0][0]).toMatch(/^Deprecated: .*removed in Handsontable 19\.0\.0/);
    });

    it('should return undefined', () => {
      expect(ManualRowResize.prototype.saveManualRowHeights.call({})).toBe(undefined);
    });
  });

  describe('loadManualRowHeights', () => {
    it('should warn once, no matter how many times it is called', () => {
      ManualRowResize.prototype.loadManualRowHeights.call({});
      ManualRowResize.prototype.loadManualRowHeights.call({});

      const calls = deprecationCalls('loadManualRowHeights');

      expect(calls.length).toBe(1);
      expect(calls[0][0]).toMatch(/^Deprecated: .*removed in Handsontable 19\.0\.0/);
    });

    it('should return an empty array', () => {
      expect(ManualRowResize.prototype.loadManualRowHeights.call({})).toEqual([]);
    });
  });

  it('should warn separately for each method', () => {
    ManualRowResize.prototype.saveManualRowHeights.call({});
    ManualRowResize.prototype.loadManualRowHeights.call({});

    expect(deprecationCalls('saveManualRowHeights').length).toBe(1);
    expect(deprecationCalls('loadManualRowHeights').length).toBe(1);
  });
});
