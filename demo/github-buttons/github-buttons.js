/**
 * GitHub Buttons on the homepage
 * Adapted from https://github.com/mdo/github-buttons/
 * Copyright 2014 Mark Otto. Released under Apache 2.0.
 */

var user = "handsontable",
  repo = "handsontable",
  head = document.getElementsByTagName('head')[0];

// Add commas to numbers
function addCommas(n) {
  return String(n).replace(/(\d)(?=(\d{3})+$)/g, '$1,')
}

function jsonp(path) {
  var el = document.createElement('script');
  el.src = path + '?callback=callback';
  head.insertBefore(el, head.firstChild);
}

function callback(obj) {
  if(obj.data.watchers) {
    var watchCount = document.getElementById("githubWatch").querySelector(".gh-count");
    var forkCount = document.getElementById("githubFork").querySelector(".gh-count");
    watchCount.innerHTML = addCommas(obj.data.watchers);
    forkCount.innerHTML = addCommas(obj.data.forks);
    watchCount.style.display = 'block';
    forkCount.style.display = 'block';
  }
}

//cross browser DOMContentLoaded, works also in async scripts
contentLoaded(window, function() {
  jsonp('https://api.github.com/repos/' + user + '/' + repo);
});

