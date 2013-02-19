var fileXHREnabled = function() {
  var xhr = new XMLHttpRequest();
  try {
    xhr.onreadystatechange = function() {};
    xhr.onerror = function() {};
    xhr.open("GET", "nothing.xml", true);
    xhr.send(null);
  } catch (e) {
    return false;
  }

  xhr.abort();
  return true;
}();

if (fileXHREnabled || window.location.protocol != 'file:')    {
  // Hide body content initially to minimize flashing.
  document.write('<style id="hider" type="text/css">');
  document.write('body { display:none!important; }');
  document.write('</style>');

  window.onload = window.renderPage;

  window.postRender = function() {
    var elm = document.getElementById("hider");
    elm.parentNode.removeChild(elm);

    // Since populating the page is done asynchronously, the DOM doesn't exist
    // when the browser tries to resolve any #anchors in the URL. So we reset
    // the URL once we're done, which forces the browser to scroll to the anchor
    // as it normally would.
    if (location.hash.length > 1)
      location.href = location.href;
  }
} else if ((navigator.userAgent.indexOf("Chrome") > -1) &&
           (window.location.href.match("^file:")) &&
            !fileXHREnabled) {
  window.onload = function() {
    // Display the warning to use the --allow-file-access-from-files.
    document.getElementById("devModeWarning").style.display = "block";
  }
}
