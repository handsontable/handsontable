describe('WebComponents', function () {
  var ready = false;

  document.addEventListener('WebComponentsReady', function () {
    ready = true;
  });

  it('should create table', function () {
    var hot = document.createElement('x-handsontable');
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
    var hot = document.createElement('x-handsontable');
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
    var hot = document.createElement('x-handsontable');
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

});

