(function(scope) {

scope.flags = scope.flags || {};

scope.flags.shadow = scope.flags.shadow || 
  (HTMLElement.prototype.webkitCreateShadowRoot ? 'webkit' : 'shim');

function fetchShadowImpl(inName) {
  switch (inName) {
    case 'webkit':
      return scope.WebkitShadowDOM;
    case 'polyfill':
      return scope.JsShadowDOM;
    case 'shim':
    default:
      return scope.ShimShadowDOM;
  }
}

window.ShadowDOM = scope.ShadowDOM = fetchShadowImpl(scope.flags.shadow);

})(window.__exported_components_polyfill_scope__);