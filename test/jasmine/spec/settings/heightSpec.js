describe('settings', function () {
  describe('height', function () {
    var id = 'testContainer';

    beforeEach(function () {
      this.$container = $('<div id="' + id + '"></div>').appendTo('body');
    });

    afterEach(function () {
      if (this.$container) {
        destroy();
        this.$container.remove();
      }
    });

    describe('constructor', function () {
      it('should read height from inline style', function () {
        this.$container[0].style.height = '200px';
        var instance = handsontable();
        expect(instance.view.getHeight()).toEqual(200);
      });

      it('should read height from CSS class', function () {
        var $style = $('<style>.htCustom{ height: 200px }</style>').appendTo('head');
        this.$container[0].className = 'htCustom';
        var instance = handsontable();
        expect(instance.view.getHeight()).toEqual(200);
        $style.remove();
      });

      it('should read height from settings (number)', function () {
        var instance = handsontable({
          height: 200
        });
        expect(instance.view.getHeight()).toEqual(200);
      });

      it('should read height from settings (function)', function () {
        var instance = handsontable({
          height: function() {
            return 200
          }
        });
        expect(instance.view.getHeight()).toEqual(200);
      });

      it('should return undefined if height not defined', function () {
        var instance = handsontable();
        expect(instance.view.getHeight()).toBeFalsy();
      });

      it('should return undefined if height not defined (also after render)', function () {
        var instance = handsontable();
        render();
        expect(instance.view.getHeight()).toBeFalsy();
      });
    });

    describe('dynamic', function () {
      it('should read height from inline style', function () {
        this.$container[0].style.height = '200px';
        var instance = handsontable();
        this.$container[0].style.height = '300px';
        render();
        expect(instance.view.getHeight()).toEqual(300);
      });

      it('should read height from CSS class', function () {
        var $style = $('<style>.htCustom{ height: 200px } .htBig{ height: 300px }</style>').appendTo('head');
        this.$container[0].className = 'htCustom';
        var instance = handsontable();
        this.$container[0].className = 'htBig';
        render();
        expect(instance.view.getHeight()).toEqual(300);
        $style.remove();
      });

      it('should read height from settings (number)', function () {
        var instance = handsontable();
        updateSettings({
          height: 200
        });
        expect(instance.view.getHeight()).toEqual(200);
      });

      it('should read height from settings (function)', function () {
        var instance = handsontable();
        updateSettings({
          height: function() {
            return 200
          }
        });
        expect(instance.view.getHeight()).toEqual(200);
      });

      it('should return undefined if height not defined', function () {
        var instance = handsontable({
          height: 200
        });
        updateSettings({
          height: null
        });
        expect(instance.view.getHeight()).toBeFalsy();
      });

      it('should return undefined if height not defined (also after render)', function () {
        var instance = handsontable({
          height: 200
        });
        updateSettings({
          height: null
        });
        render();
        expect(instance.view.getHeight()).toBeFalsy();
      });
    });
  });
});