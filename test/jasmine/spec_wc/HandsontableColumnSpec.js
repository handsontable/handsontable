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

});

