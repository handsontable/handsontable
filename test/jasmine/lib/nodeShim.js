/**
 * Default Phantom reporter uses Node type, which IE8 does not support, so we have to mock it
 */

if(typeof Node == 'undefined'){
  Node = function(){};
}

if (window._phantom) {
  // https://github.com/eligrey/Blob.js/blob/master/Blob.js
  window.Blob = function(blobParts, options) {
    var BlobBuilder = window.BlobBuilder || window.WebKitBlobBuilder || window.MozBlobBuilder || window.MSBlobBuilder;
    var type = options ? (options.type || "") : "";
    var builder = new BlobBuilder();

    if (blobParts) {
      for (var i = 0, len = blobParts.length; i < len; i++) {
        if (Uint8Array && blobParts[i] instanceof Uint8Array) {
          builder.append(blobParts[i].buffer);
        }
        else {
          builder.append(blobParts[i]);
        }
      }
    }
    var blob = builder.getBlob(type);

    if (!blob.slice && blob.webkitSlice) {
      blob.slice = blob.webkitSlice;
    }

    return blob;
  };
}
