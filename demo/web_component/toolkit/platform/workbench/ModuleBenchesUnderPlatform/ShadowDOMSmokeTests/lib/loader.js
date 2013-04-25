(function() {
  var root = "";
  [
    "../../../platform.js",
    "lib/util.js"
  ].forEach(function(p) {
    document.write('<script src="' + root + p + '"></script>');
  });
  window.addEventListener('load', function() {
    setTimeout(sinspect, 250);
  });
})();
