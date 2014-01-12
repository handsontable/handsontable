describe('WebComponents', function () {
  var ready = false;

  document.addEventListener('WebComponentsReady', function () {
    ready = true;
  });

  it('should create table', function () {
    var hot = document.createElement('handsontable-table');
    document.body.appendChild(hot);

    waitsFor(function () {
      return ready;
    }, 1000);

    waits(0);

    runs(function () {
      expect(hot.getCell(0, 0).nodeName).toBe('TD');
      hot.parentNode.removeChild(hot);
    });
  });

  it('undefined attribute should return default value', function () {
    var hot = document.createElement('handsontable-table');
    document.body.appendChild(hot);

    waitsFor(function () {
      return ready;
    }, 1000);

    waits(0);

    runs(function () {
      expect(hot.getSettings().pasteMode).toBe('overwrite');
      expect(hot.pasteMode).toBe('overwrite');
      hot.parentNode.removeChild(hot);
    });
  });

  it('attribute should update settings', function () {
    var hot = document.createElement('handsontable-table');
    document.body.appendChild(hot);

    waitsFor(function () {
      return ready;
    }, 1000);

    waits(100);

    runs(function () {
      hot.pasteMode = 'shift_down';
      expect(hot.pasteMode).toBe('shift_down');
    });

    waits(0);

    runs(function () {
      expect(hot.getAttribute('pasteMode')).toBe('shift_down'); //unfortunately must be async because Changed callback is async in Polymer
      expect(hot.getSettings().pasteMode).toBe('shift_down'); //unfortunately must be async because Changed callback is async in Polymer
      hot.parentNode.removeChild(hot);
    });
  });

  it('settings attribute value should be parsed', function () {
    var hot = document.createElement('handsontable-table');
    window.mySettings = {
      minSpareRows: 3
    };
    hot.setAttribute('settings', 'mySettings'); //same notation is used in
    document.body.appendChild(hot);

    waitsFor(function () {
      return ready;
    }, 1000);

    waits(100);

    runs(function () {
      expect(hot.getSettings().minSpareRows).toBe(3);
      hot.parentNode.removeChild(hot);
    });
  });

  it('Polymer should be able to pass the data object as attribute directly using template bindings', function () {
    var model = {
      data: [
        {name: "Freddie"}
      ],
      html: '<handsontable-table id="hot" datarows="{{ data }}"><handsontable-column value="name"></handsontable-column></handsontable-table>'
    };

    var tpl = document.createElement('template');
    tpl.setAttribute('bind', '');
    tpl.innerHTML = '<x-html content="{{ html }}"></x-html>';
    tpl.model = model;
    document.body.appendChild(tpl);

    waitsFor(function () {
      return ready;
    }, 1000);

    waits(100);

    runs(function () {
      var hot = document.getElementById('hot');
      expect(hot.getData()).toBe(model.data);
      hot.parentNode.removeChild(hot);
    });
  });

  it('Polymer should be able to pass the settings object as attribute directly using template bindings', function () {
    var model = {
      settings: {colHeaders: ["First Name"]},
      html: '<handsontable-table id="hot" settings="{{ settings }}"><handsontable-column value="name"></handsontable-column></handsontable-table>'
    };

    var tpl = document.createElement('template');
    tpl.setAttribute('bind', '');
    tpl.innerHTML = '<x-html content="{{ html }}"></x-html>';
    tpl.model = model;
    document.body.appendChild(tpl);

    waitsFor(function () {
      return ready;
    }, 1000);

    waits(100);

    runs(function () {
      var hot = document.getElementById('hot');
      expect(hot.getColHeader(0)).toBe('First Name');
      hot.parentNode.removeChild(hot);
    });
  });

  describe("Polymer", function () {

    it('should parse empty property as boolean true', function () {
      var model = {
        html: '<handsontable-table id="hot" colHeaders></handsontable-table>'
      };

      var tpl = document.createElement('template');
      tpl.setAttribute('bind', '');
      tpl.innerHTML = '<x-html content="{{ html }}"></x-html>';
      tpl.model = model;
      document.body.appendChild(tpl);

      waitsFor(function () {
        return ready;
      }, 1000);

      waits(100);

      runs(function () {
        var hot = document.getElementById('hot');
        expect(hot.getSettings().colHeaders).toBe(true);
        hot.parentNode.removeChild(hot);
      });
    });

    it('should parse string "true" as boolean true', function () {
      var model = {
        html: '<handsontable-table id="hot" colHeaders="true"></handsontable-table>'
      };

      var tpl = document.createElement('template');
      tpl.setAttribute('bind', '');
      tpl.innerHTML = '<x-html content="{{ html }}"></x-html>';
      tpl.model = model;
      document.body.appendChild(tpl);

      waitsFor(function () {
        return ready;
      }, 1000);

      waits(100);

      runs(function () {
        var hot = document.getElementById('hot');
        expect(hot.getSettings().colHeaders).toBe(true);
        hot.parentNode.removeChild(hot);
      });
    });

    it('should parse string "false" as boolean false', function () {
      var model = {
        html: '<handsontable-table id="hot" colHeaders="false"></handsontable-table>'
      };

      var tpl = document.createElement('template');
      tpl.setAttribute('bind', '');
      tpl.innerHTML = '<x-html content="{{ html }}"></x-html>';
      tpl.model = model;
      document.body.appendChild(tpl);

      waitsFor(function () {
        return ready;
      }, 1000);

      waits(100);

      runs(function () {
        var hot = document.getElementById('hot');
        expect(hot.getSettings().colHeaders).toBe(false);
        hot.parentNode.removeChild(hot);
      });
    });

    it('should parse function', function () {
      var myFunction = function (col) {
        return col;
      };

      var model = {
        fn: myFunction,
        html: '<handsontable-table id="hot" colHeaders="{{fn}}"></handsontable-table>'
      };

      var tpl = document.createElement('template');
      tpl.setAttribute('bind', '');
      tpl.innerHTML = '<x-html content="{{ html }}"></x-html>';
      tpl.model = model;
      document.body.appendChild(tpl);

      waitsFor(function () {
        return ready;
      }, 1000);

      waits(100);

      runs(function () {
        var hot = document.getElementById('hot');
        expect(hot.getSettings().colHeaders).toBe(myFunction);
        hot.parentNode.removeChild(hot);
      });
    });

  });

  it('Web Component should observe changes in data', function () {
    var afterRender = jasmine.createSpy('afterRender');
    var lastCount;
    var model = {
      settings: {
        afterRender: afterRender
      },
      data: [
        {name: "Freddie"}
      ],
      html: '<handsontable-table id="hot" datarows="{{ data }}" settings="{{ settings }}"><handsontable-column value="name"></handsontable-column></handsontable-table>'
    };

    var tpl = document.createElement('template');
    tpl.setAttribute('bind', '');
    tpl.innerHTML = '<x-html content="{{ html }}"></x-html>';
    tpl.model = model;
    document.body.appendChild(tpl);

    waitsFor(function () {
      return ready;
    }, 1000);

    runs(function () {
      lastCount = afterRender.callCount;
      model.data[0].Name = "Frederik";
    });

    waits(100);

    runs(function () {
      expect(afterRender.callCount).toBeGreaterThan(lastCount);
      var hot = document.getElementById('hot');
      hot.parentNode.removeChild(hot);
    });
  });

});

