describe('RecordTranslator', function () {

  var RecordTranslator = Handsontable.utils.RecordTranslator;
  var registerIdentity = Handsontable.utils.RecordTranslatorUtils.registerIdentity;
  var getTranslator = Handsontable.utils.RecordTranslatorUtils.getTranslator;

  beforeEach(function () {
    this.$container = $('<div id="testContainer"></div>').appendTo('body');
  });

  afterEach(function () {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  it('should translate to visual row using hook system', function () {
    var hotMock = {
      runHooks: jasmine.createSpy().and.returnValue(54),
    };
    var t = new RecordTranslator(hotMock);

    expect(t.toVisualRow(12)).toBe(54);
    expect(hotMock.runHooks).toHaveBeenCalledWith('unmodifyRow', 12);
  });

  it('should translate to visual column using hook system', function () {
    var hotMock = {
      runHooks: jasmine.createSpy().and.returnValue(54),
    };
    var t = new RecordTranslator(hotMock);

    expect(t.toVisualColumn(12)).toBe(54);
    expect(hotMock.runHooks).toHaveBeenCalledWith('unmodifyCol', 12);
  });

  it('should translate to visual coordinates (as an object)', function () {
    var t = new RecordTranslator();

    spyOn(t, 'toVisualRow').and.returnValue(6);
    spyOn(t, 'toVisualColumn').and.returnValue(12);

    expect(t.toVisual({row: 3, column: 4})).toEqual({row: 6, column: 12});
  });

  it('should translate to visual coordinates (as an array)', function () {
    var t = new RecordTranslator();

    spyOn(t, 'toVisualRow').and.returnValue(6);
    spyOn(t, 'toVisualColumn').and.returnValue(12);

    expect(t.toVisual(3, 4)).toEqual([6, 12]);
  });

  it('should translate to physical row using hook system', function () {
    var hotMock = {
      runHooks: jasmine.createSpy().and.returnValue(54),
    };
    var t = new RecordTranslator(hotMock);

    expect(t.toPhysicalRow(12)).toBe(54);
    expect(hotMock.runHooks).toHaveBeenCalledWith('modifyRow', 12);
  });

  it('should translate to physical column using hook system', function () {
    var hotMock = {
      runHooks: jasmine.createSpy().and.returnValue(54),
    };
    var t = new RecordTranslator(hotMock);

    expect(t.toPhysicalColumn(12)).toBe(54);
    expect(hotMock.runHooks).toHaveBeenCalledWith('modifyCol', 12);
  });

  it('should translate to physical coordinates (as an object)', function () {
    var t = new RecordTranslator();

    spyOn(t, 'toPhysicalRow').and.returnValue(6);
    spyOn(t, 'toPhysicalColumn').and.returnValue(12);

    expect(t.toPhysical({row: 3, column: 4})).toEqual({row: 6, column: 12});
  });

  it('should translate to physical coordinates (as an array)', function () {
    var t = new RecordTranslator();

    spyOn(t, 'toPhysicalRow').and.returnValue(6);
    spyOn(t, 'toPhysicalColumn').and.returnValue(12);

    expect(t.toPhysical(3, 4)).toEqual([6, 12]);
  });

  it('should always return the same instance of RecordTranslator for Handsontable instance', function () {
    var hot = handsontable();
    var translator = getTranslator(hot);

    expect(translator === getTranslator(hot)).toBe(true);
  });

  it('should throw error when identifier was not registered while retrieving translator', function () {
    expect(function() {
      getTranslator({});
    }).toThrow();
  });

  it('should always return the same instance of RecordTranslator for custom identifier', function () {
    var hot = handsontable();
    var customIdentifier = {};

    registerIdentity(customIdentifier, hot);
    var translator = getTranslator(customIdentifier);

    expect(translator === getTranslator(customIdentifier)).toBe(true);
  });
});
