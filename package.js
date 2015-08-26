Package.describe({
  name: 'dddvvv:handsontable',
  summary: 'A meteor fork of handsontable.',
  version: '0.16.1',
  git: 'https://github.com/dddvvv/handsontable.git'
});

Package.onUse(function(api) {
  if (api.versionsFrom) {
    api.versionsFrom('0.9.0'); // package is compatible with meteor 0.9.0 and up
  }
  
  api.addFiles('dist/handsontable.full.js', 'client');
  api.addFiles('dist/handsontable.full.css', 'client');
  api.export('Handsontable','client');
});