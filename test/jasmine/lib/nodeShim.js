/**
 * Default Phantom reporter uses Node type, which IE8 does not support, so we have to mock it
 */

if(typeof Node == 'undefined'){
  Node = function(){};
}
