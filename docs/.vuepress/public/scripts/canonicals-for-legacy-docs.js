(function() {
  var docsPageRegExp = /^\/docs\/\d+\.\d+\.\d+\/.+\.html$/;

  if (!docsPageRegExp.test(location.pathname)) {
    return;
  }

  var urlsMap = [
    [/\/docs\/\d+\.\d+\.\d+\/tutorial\-introduction\.html$/, '/docs/'],
  ];

  function getURLPathname(pathname) {
    var newPathname = pathname;

    for (var index = 0; index < urlsMap.length; index++) {
      var tester = urlsMap[index][0];

      if (tester.test(pathname)) {
        newPathname = urlsMap[index][1];
        break;
      }
    }

    return newPathname;
  }

  var link = document.querySelector("link[rel='canonical']") ? document.querySelector("link[rel='canonical']") : document.createElement('link');

  link.setAttribute('rel', 'canonical');
  link.setAttribute('href', location.protocol + '//' + location.host + getURLPathname(location.pathname));

  document.head.appendChild(link);
}());
