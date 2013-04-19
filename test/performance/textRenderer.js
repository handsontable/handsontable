$(document).ready(function () {
  var suite = new Benchmark.Suite;

  $('<button id="runAll">Run all tests</button>').appendTo(document.body).click(function () {
    runAllTests();
  });

  /**
   * Prepare
   */

  $('<h1>Tests</h1>').appendTo(document.body);

  $('<div id="example1"></div>').appendTo(document.body).handsontable({
    data: [
      ['test']
    ],
    columns: [
      {
        type: 'text'
      }
    ]
  });

  $('<div id="example2"></div>').appendTo(document.body).handsontable({
    data: [
      ['test']
    ],
    columns: [
      {
        type: 'autocomplete',
        source: ['test', 'test2', 'test3']
      }
    ]
  });

  $('<div id="example3"></div>').appendTo(document.body).handsontable({
    data: [
      [true]
    ],
    columns: [
      {
        type: 'checkbox'
      }
    ]
  });

  $('<div id="example4"></div>').appendTo(document.body).handsontable({
    data: [
      [123456.78]
    ],
    columns: [
      {
        type: 'numeric',
        format: '0,0.00 $',
        language: 'de-de'
      }
    ]
  });

  $('<div id="example5" style=""></div>').appendTo(document.body).handsontable({
    startRows: 3,
    startCols: 3
  });

  $('<div id="example6" style="width: 100px; height: 50px; overflow: scroll"></div>').appendTo(document.body).handsontable({
    startRows: 3,
    startCols: 3
  });

  /**
   * Test suite
   */

  suite.add('textRenderer', function () {
    $("#example1").handsontable('render');
  });

  suite.add('autocompleteRenderer', function () {
    $("#example2").handsontable('render');
  });

  suite.add('checkboxRenderer', function () {
    $("#example3").handsontable('render');
  });

  suite.add('numericRenderer', function () {
    $("#example4").handsontable('render');
  });

  suite.add('overflow: none', function () {
    $("#example5").handsontable('render');
  });

  suite.add('overflow: scroll', function () {
    $("#example6").handsontable('render');
  });

  /**
   * Reporter
   */

  $('<h1>Test results</h1>').appendTo(document.body);

  var results = [];

  var reporter = $('<div id="reporter"></div>').appendTo(document.body).handsontable({
    data: results,
    columns: [
      {
        data: "name"
      },
      {
        data: "hz",
        type: "numeric",
        format: "0,0"
      },
      {
        data: "stats.rme", //The relative margin of error (expressed as a percentage of the mean).
        type: "numeric",
        format: "0.0"
      },
      {
        data: "stats.sample.length",
        type: "numeric"
      }
    ],
    colHeaders: ['Test name', 'Operations/sec', 'RME (%)', 'Runs']
  });

  suite.on('cycle', function (event) {
    results.push(event.target);
    reporter.handsontable('render');
    var stringified = String(event.target).replace(/±/g, '+-');
    console.log(' - ', stringified/*, results*/);
  });

  suite.on('complete', function () {
    var total = 0;
    for (var i = 0, ilen = results.length; i < ilen; i++) {
      total += results[i].hz;
    }
    console.error("TOTAL SCORE:", numeral(total).format('0'));
  });

  function runAllTests() {
    console.log("Running all tests...");
    suite.run(/*{ 'defer': true }*/{async: true});
  }

  if (/phantom/i.test(navigator.userAgent)) {
    //This is PhantomJS. Start tests immediately
    runAllTests();
  }
});