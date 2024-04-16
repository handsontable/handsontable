/**
 * Regular expression used to match the export default statement in the code.
 *
 * @type {RegExp}
 */
const EXPORT_DEFAULT_REGEX = /export default (?:function ([\w]*)|([\w]*))(?:;)/;

const addCodeForPreset = (code, preset, id) => {
  const match = code.match(EXPORT_DEFAULT_REGEX);
  const exportId = match?.[1] || match?.[2] || code.includes('export class AppModule');

  const renderImportPart = () => {
    if (/vue3(-.*)?/.test(preset)) {
      return 'import { createApp } from \'vue\';';
    }

    return '';
  };

  const renderCreatePart = () => {
    if (/react(-.*)?/.test(preset)) {
      return `ReactDOM.render(<${exportId} />, document.getElementById("${id}"));`;
    } else if (/vue3(-.*)?/.test(preset)) {
      return `const app = createApp(${exportId});
app.mount('#${id}');`;
    } else if (/vue(-.*)?/.test(preset)) {
      return `new Vue({
...${exportId},
el: '#${id}',
});`;
    } else if (/angular(-.*)?/.test(preset)) {
      return `import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

platformBrowserDynamic()
  .bootstrapModule(AppModule)
  .catch(err => { console.error(err) });`;
    }

    return '';
  };

  const importPart = renderImportPart();
  const renderPart = renderCreatePart();

  if (exportId) {
    return `${importPart ? `${importPart}\n` : ''}${code}${renderPart ? `\n${renderPart}` : ''}`
      .replace(EXPORT_DEFAULT_REGEX, '');
  }

  return code;
};

module.exports = { addCodeForPreset };
