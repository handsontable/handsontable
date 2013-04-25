// prepoulate window.Platform.flags for default controls
window.Platform = window.Platform || {};
// prepopulate window.logFlags if necessary
window.logFlags = window.logFlags || {};
// process flags
(function(scope){
  // import
  var flags = scope.flags || {};
  // populate flags from location
  location.search.slice(1).split('&').forEach(function(o) {
    o = o.split('=');
    o[0] && (flags[o[0]] = o[1] || true);
  });
  // failure to detect native shadowDOM, or a 'truthy' value for any of these 
  // flags results in polyfill
  flags.shadow = (flags.shadowdom || flags.shadow || flags.polyfill || 
      !HTMLElement.prototype.webkitCreateShadowRoot) && 'polyfill';
  // export
  scope.flags = flags;
})(Platform);
// select ShadowDOM impl
if (Platform.flags.shadow === 'polyfill') {