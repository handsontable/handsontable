module.exports = {
  HOT_FILENAME: 'handsontable',
  HOT_VERSION: '18.0.0-rc3',
  HOT_PACKAGE_NAME: 'handsontable',
  HOT_BUILD_DATE: (() => {
    const d = new Date();
    const p = n => String(n).padStart(2, '0');

    return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
  })(),
  HOT_RELEASE_DATE: '23/06/2026',
};
