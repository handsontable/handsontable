/**
 * Copyright (c) 2010 The Chromium Authors. All rights reserved.  Use of this
 * source code is governed by a BSD-style license that can be found in the
 * LICENSE file.
 */

function testSearchSupport() {
  var i = document.createElement("input");
  i.setAttribute("type", "search");
  return i.type !== "text";
};

function filterSamples() {
  var clearlink = document.getElementById('clearlink');
  var searchinput = document.getElementById('searchinput');
  var noresults = document.getElementById('noresults');

  var searchtext = searchinput.value.toUpperCase();
  if (!canclear && searchtext != "" ) {
    clearlink.style.display = "inline";
  } else {
    clearlink.style.display = "none";
  }
  if (searchtext == currentfilter) {
    return;
  } else {
    currentfilter = searchtext;
    window.location.hash = searchinput.value;
  }

  noresults.style.display = 'none';
  var num_found = 0;
  for (var key in search_data) {
    if (search_data.hasOwnProperty(key)) {
      var sampleentry = document.getElementById(key);
      if (search_data[key].indexOf(searchtext) == -1) {
        sampleentry.style.display = "none";
      } else {
        sampleentry.style.display = "block";
        num_found += 1;
      }
    }
  }
  if (num_found == 0) {
    noresults.style.display = 'block';
  }
  removeSelected();
};

function removeSelected() {
  var anchors = document.getElementsByTagName('a');
  for (var i = 0, anchor; anchor = anchors[i]; i++) {
    if (anchor.className == "selected") {
      anchor.className = "";
    }
  }
};

function setFilter(text, target) {
  var searchinput = document.getElementById('searchinput');
  searchinput.value = text;
  filterSamples();
  target.className = "selected";
  searchinput.focus();
};

function clearFilter() {
  var searchinput = document.getElementById('searchinput');
  searchinput.value = "";
  filterSamples();
  searchinput.focus();
};

function initSearch() {
  var searchinput = document.getElementById('searchinput');
  if (canclear) {
    searchinput.addEventListener('click', filterSamples, false);
  }

  if (window.location.hash.length > 1) {
    var hash = window.location.hash.substring(1);
    var elem = document.getElementById(hash);
    if (elem) {
      elem.scrollIntoView();
    } else {
      setFilter(hash);
    }
  }
};

var currentfilter = "";
var canclear = testSearchSupport();
window.addEventListener('load', initSearch, false);
