describe('Core_alter', () => {
  const id = 'testContainer';

  beforeEach(function() {
    this.$container = $(`<div id="${id}"></div>`).appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
    $('html').removeAttr('dir');
  });

  describe('Direction detection', () => {
    it('When no direction attr, helpers returns isLtr(): true, isRtl(): false, directionFactor(): 1 ', () => {
      const instance = handsontable();

      expect(instance.isLtr()).toBe(true);
      expect(instance.isRtl()).toBe(false);
      expect(instance.getDirectionFactor()).toBe(1);
    });

    it('When direction attr is `ltr`, helpers returns isLtr(): true, isRtl(): false, directionFactor(): 1 ', () => {
      const instance = handsontable();

      expect(instance.isLtr()).toBe(true);
      expect(instance.isRtl()).toBe(false);
      expect(instance.getDirectionFactor()).toBe(1);
    });
    
    it('When direction attr is `rtl`, helpers returns isLtr(): false, isRtl(): true, directionFactor(): -1 ', () => {
      $('html').attr('dir','rtl');
      
      const instance = handsontable();

      expect(instance.isLtr()).toBe(false);
      expect(instance.isRtl()).toBe(true);
      expect(instance.getDirectionFactor()).toBe(-1);
    });

  });
});
