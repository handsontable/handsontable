var xinspect = function() {
  var thisFile = 'inspector.js';
  var libLocation = '';
  var s = document.querySelector('script[src $= "' + thisFile + '"]');
  if (s) {
    var src = s.getAttribute('src');
    libLocation = src.slice(0, -thisFile.length);
  }
  var inspector = window.open(libLocation + "inspector.html", "Inspector");
  xinspect = function() {
    inspector.inspect.apply(window, arguments);
  };
  var args = arguments;
  setTimeout(function(){
    xinspect.apply(window, args);
  }, 500);
};
