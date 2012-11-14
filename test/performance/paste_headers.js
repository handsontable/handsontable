/**
 * I use it to measure how long does it take to paste big chunk of data into the table (WITH row/col headers)
 *
 * rev                                      | date (dd.mm.yy) | performance                           | desc
 * -----------------------------------------|-----------------|---------------------------------------|------------------------------------------------------
 * 7076ebee93ccdf17803410e87f6815aa3eebecef | 11.07.12 00:25  | 0.65 ops/sec ±5.48% (4 runs sampled)  | after introducing blockedRows/Cols. offset() core.js is known for slowing up things
 * ee05fe2faf7eecf76b6aa63d83785031aba2c007 | 27.06.12 12:47  | 0.72 ops/sec ±1.52% (23 runs sampled) | after removing rowHeaders.clone() and allowing array input to setDataAtCell
 * ddc33968f53a8767fb9e7e414bf09cd8bea8285e | 27.06.12 10:54  | XXX (crashes Firefox and Chrome)      | initial benchmark forked from paste.html, with row/col headers added
 *
 * cheers
 * Marcin
 */
$(window).load(function () {
  var suite = new Benchmark.Suite;
  var container;
  container = $('<div>');
  $("body").append(container);

  suite.add('Paste test', {
    'defer': true,
    minSamples: 1,
    maxSamples: 1,
    'fn': function (deferred) {
      if (container) {
        container.remove();
      }
      container = $('<div>');
      $("body").append(container);

      container.handsontable({
        rows: 5,
        cols: 5,
        rowHeaders: true,
        colHeaders: true,
        minSpareCols: 1, //always keep at least 1 spare col at the right
        minSpareRows: 1, //always keep at least 1 spare row at the bottom
        contextMenu: true,
        onChange: function () {
          deferred.resolve();
        }
      });

      container.find('td:first').trigger('mousedown');
      container.find('td:first').trigger('mouseup');
      container.find('textarea').val(bigdataStr).trigger('paste');
    }})
      .on('cycle', function (event) {
        $("body").prepend($('<div>' + String(event.target) + '</div>'));
      })
      .run({async: true});
});