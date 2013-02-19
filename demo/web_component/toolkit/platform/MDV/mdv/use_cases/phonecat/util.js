var REQUEST_TIMEOUT = 5000;

function xhr(url, onSuccess, onError) {
  var localUrl = url;
  var xhr = new XMLHttpRequest();
  var abortTimerId = window.setTimeout(function() {
    xhr.abort();
    console.log("XHR Timed out");
  }, REQUEST_TIMEOUT);

  function handleError(error) {
    window.clearTimeout(abortTimerId);
    if (onError) {
      onError(error);
      // Some cases result in multiple error handings. Only fire the callback
      // once.
      onError = undefined;
    }
  }

  try {
    xhr.onreadystatechange = function(){
      if (xhr.readyState == 4) {
        if (xhr.status < 300 && xhr.responseText) {
          window.clearTimeout(abortTimerId);
          onSuccess(xhr.responseText);
          Model.notifyChanges();
        } else {
          handleError("Failure to fetch content");
        }
      }
    }

    xhr.onerror = handleError;

    xhr.open("GET", url, true);
    xhr.send(null);
  } catch(e) {
    console.log("ex: " + e);
    console.error("exception: " + e);
    handleError();
  }
};

function setFragment(val) {
  // Just setting the location.hash to the val fails to encode newlines in
  // Safari, so we replace the whole URL with a manually generated string.
  // Also, setting the hash to empty-string removes the '#', causing a reload,
  // so always add the #.
  var href = [
    location.protocol,
    '//',
    location.hostname,
    location.port ? ':' + location.port : '',
    location.pathname,
    location.search,
    '#',
    val ? val : ''];
  location.replace(href.join(''));
};

function getFragment() {
  var hashIndex = window.location.href.indexOf("#");
  if (hashIndex == -1) return '';
  return window.location.href.substr(hashIndex + 1);
};