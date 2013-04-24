/*
 This file is used to run PhantomJS

 Running performance tests in PhantomJS

 1. Install PhantomJS from here: http://phantomjs.org/download.html
 2. Add PhantomJS to your system path (Win/Linux instructions here: http://www.java.com/en/download/help/path.xml)
 3. Execute command: phantomjs run.js
 */

var system = require('system');

var page = require('webpage').create(),
  url = './basic.html';

// Route "console.log()" calls from within the Page context to the main Phantom context (i.e. current "this")
page.onConsoleMessage = function (msg) {
  console.log(msg);
  if (msg.indexOf('finished') > -1) {
    phantom.exit();
  }
};

page.open(url, function (status) {
  if (status !== "success") {
    console.log("Unable to access network");
    phantom.exit();
  }
});
