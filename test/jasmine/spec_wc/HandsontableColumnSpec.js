describe('<handsontable-column>', function () {
  var ready = false;

  document.addEventListener('WebComponentsReady', function () {
    ready = true;
  });

  it('property should return value set by attribute', function () {
    var hot = document.createElement('handsontable-table');
    var hotColumn = document.createElement('handsontable-column');
    hotColumn.setAttribute('title', 'My title');
    hot.appendChild(hotColumn);
    document.body.appendChild(hot);

    waitsFor(function () {
      return ready;
    }, 1000);

    waits(0);

    runs(function () {
      expect(hotColumn.title).toBe('My title');
      hot.parentNode.removeChild(hot);
    });
  });

  it('attribute value should be rendered', function () {
    var hot = document.createElement('handsontable-table');
    var hotColumn = document.createElement('handsontable-column');
    hotColumn.setAttribute('title', 'My title');
    hot.appendChild(hotColumn);
    document.body.appendChild(hot);

    waitsFor(function () {
      return ready;
    }, 1000);

    waits(0);

    runs(function () {
      expect(hot.shadowRoot.querySelector('th').textContent).toBe('My title');
      hot.parentNode.removeChild(hot);
    });
  });

  it('changed attribute value should be rendered', function () {
    var hot = document.createElement('handsontable-table');
    var hotColumn = document.createElement('handsontable-column');
    hotColumn.setAttribute('title', 'My title');
    hot.appendChild(hotColumn);
    document.body.appendChild(hot);

    waitsFor(function () {
      return ready;
    }, 1000);

    waits(0);

    runs(function () {
      hotColumn.setAttribute('title', 'My another title');
    });

    waits(0);

    runs(function () {
      expect(hot.shadowRoot.querySelector('th').textContent).toBe('My another title');
      hot.parentNode.removeChild(hot);
    });
  });

  it('autocomplete source attribute value should be parsed', function () {
    window.names = ["Fred", "Freddie", "Frederick"];
    var hot = document.createElement('handsontable-table');
    var column = document.createElement('handsontable-column');
    column.setAttribute('type', 'autocomplete');
    column.setAttribute('source', 'names');
    hot.appendChild(column);
    document.body.appendChild(hot);

    waitsFor(function () {
      return ready;
    }, 1000);

    waits(100);

    runs(function () {
      expect(hot.getCellMeta(0, 0).source).toBe(window.names);
      hot.parentNode.removeChild(hot);
    });
  });

  it('dropdown source attribute value should be parsed', function () {
    window.names = ["Fred", "Freddie", "Frederick"];
    var hot = document.createElement('handsontable-table');
    var column = document.createElement('handsontable-column');
    column.setAttribute('type', 'dropdown');
    column.setAttribute('source', 'names');
    hot.appendChild(column);
    document.body.appendChild(hot);

    waitsFor(function () {
      return ready;
    }, 1000);

    waits(100);

    runs(function () {
      expect(hot.getCellMeta(0, 0).source).toBe(window.names);
      hot.parentNode.removeChild(hot);
    });
  });

  it('Polymer should be able to pass the autocomplete source object as attribute directly using template bindings', function () {
    var names = ["Fred", "Freddie", "Frederick"];
    var model = {
      data: [
        {name: "Freddie"}
      ],
      names: names,
      html: '<handsontable-table id="hot" datarows="{{ data }}"><handsontable-column value="name" type="autocomplete" source="{{ names }}"></handsontable-column></handsontable-table>'
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
      expect(hot.getCellMeta(0, 0).source).toBe(names);
      hot.parentNode.removeChild(hot);
    });
  });

  it('Polymer should be able to pass the dropdown source object as attribute directly using template bindings', function () {
    var names = ["Fred", "Freddie", "Frederick"];
    var model = {
      data: [
        {name: "Freddie"}
      ],
      names: names,
      html: '<handsontable-table id="hot" datarows="{{ data }}"><handsontable-column value="name" type="dropdown" source="{{ names }}"></handsontable-column></handsontable-table>'
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
      expect(hot.getCellMeta(0, 0).source).toBe(names);
      expect(hot.getDataAtCell(0, 0)).toBe('Freddie');
      hot.parentNode.removeChild(hot);
    });
  });

});

