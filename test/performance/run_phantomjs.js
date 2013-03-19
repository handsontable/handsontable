/**
 * This file is used to run PhantomJS
 *
 * Running performance tests in PhantomJS
 *
 * 1. Install PhantomJS from here: http://phantomjs.org/download.html
 * 2. Add PhantomJS to your system path (Win/Linux instructions here: http://www.java.com/en/download/help/path.xml)
 * 3. Execute command: phantomjs run.js
 */

var system = require('system');

var page = require('webpage').create(),
  url = './textRenderer.html';

page.viewportSize = {
  width: 1200,
  height: 1000
};

page.onConsoleMessage = function (msg) {
  console.log(msg);
  if (msg.indexOf('SCORE') > -1) {
    phantom.exit();
  }
};

page.onError = function (error, stack) {
  stack.forEach(function (item) {
    console.log('  ', item.file, ':', item.line);
  })
};

page.open(url, function (status) {
  if (status !== "success") {
    console.log("Unable to access network");
    phantom.exit();
  }
  /*setTimeout(function () {
   page.render('img.png');
   phantom.exit();
   }, 15000);*/
});
