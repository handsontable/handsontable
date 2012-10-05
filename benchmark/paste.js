/**
 * I use it to measure how long does it take to paste big chunk of data into the table.
 *
 * rev                                      | date (dd.mm.yy) | performance                           | desc
 * -----------------------------------------|-----------------|---------------------------------------|------------------------------------------------------
 * 7076ebee93ccdf17803410e87f6815aa3eebecef | 11.07.12 00:25  | 4.76 ops/sec ±1.55% (31 runs sampled) | after introducing blockedRows/Cols. offset() core.js is known for slowing up things
 * b4b317377df93984d3c805299f99b9de89294a71 | 29.05.12 21:59  | 5.02 ops/sec ±1.56% (36 runs sampled) | add drag-down, copy-down, context menu
 * b4b317377df93984d3c805299f99b9de89294a71 | 29.05.12 21:59  | 5.20 ops/sec ±1.93% (33 runs sampled) | add drag-down, copy-down, context menu
 * d56dd43249a294d4838c97fad4bc92b27f4371b2 | 22.05.12 21:49  | 5.58 ops/sec ±1.43% (34 runs sampled) | optimize border appear
 * d3ca342fa4e68f7daefec13e8d2215c836c58b71 | 15.05.12 10:43  | 5.73 ops/sec ±1.69% (35 runs sampled) | not changing className of each highlighted cell; instead use a div element beyond the table
 * 17f3b5fcc046aa12d7f752f3ecd18a2ecdb8ca1f | 14.05.12 20:06  | 5.97 ops/sec ±1.73% (32 runs sampled) | save some function calls
 * cf40ce4585e6a72d6cd9294f84b76d16ca319161 | 14.05.12 19:34  | 5.94 ops/sec ±1.84% (32 runs sampled) | not binding callbacks to each table cell; instead use jQuery 'live' style on
 * 53f9dc6532513996ff6c29624fe3a2673dd968fb | 14.05.12 19:27  | 1.93 ops/sec ±1.17% (26 runs sampled) | remove jQuery from createRow, createCol, createCell. move bind to bindCellActions
 * 025d5564181526bd528177c6e293cc6831deb750 | 13.05.12 16:31  | 1.19 ops/sec ±1.62% (24 runs sampled) | populate from array did not extend the grid column-wise
 * e516e6455540b831ef0ba39e5244f69b1833cca9 | 13.05.12 16:00  | 2.84 ops/sec ±1.38% (28 runs sampled) | use datamap array instead of DOM where possible
 * 2f7172da20a015d8b3a1bffc21693cb329cc6de5 | 10.05.12 00:30  | 2.82 ops/sec ±1.43% (28 runs sampled) | add viewport autoscroll
 * 8efaa2deaac36056ef0dc3f1cf8b2bdae8464911 | 09.05.12 11:57  | 2.84 ops/sec ±1.48% (28 runs sampled) | add minSpareCols and minWidth
 * a9dba70636ea3e78883f4d6d62fe2a3ea0db14bd | 28.04.12 01:28  | 2.89 ops/sec ±1.51% (29 runs sampled) | adding legend
 * 320a9ab33fa157d4f6c5454b5db398e718e62517 | 27.04.12 09:14  | 2.93 ops/sec ±1.64% (29 runs sampled) | adding autosuggest
 * 31b9c5810a99b78e2acad044e2f02797a6be214d | 18.04.12 11:18  | 3.45 ops/sec ±1.51% (30 runs sampled) | textarea fixes for IE7
 * bbb7009acff37c4989ca6e354ac23c2c2e049a9c | 12.11.11 16:20  | 3.37 ops/sec ±1.19% (30 runs sampled) | deintegration from jQuery where possible
 * 81641afb98a2c432de434dbbc4a19efcf02be24c | 12.11.11 15:31  | 3.31 ops/sec ±1.31% (30 runs sampled) | setData optimization
 * 1f201b5f357448c5b7d3c0647651043b710caf48 | 12.11.11 13:56  | 3.33 ops/sec ±3.66% (23 runs sampled) | first version with mesurable paste and keepEmtyRows
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
    minSamples: 20,
    'fn': function (deferred) {
      if (container) {
        container.remove();
      }
      container = $('<div>');
      $("body").append(container);

      container.handsontable({
        rows: 5,
        cols: 5,
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