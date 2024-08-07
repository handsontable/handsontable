import SVGFixer from 'oslllo-svg-fixer';

((async function() {
  const theme = process.env.npm_config_theme;

  if (!theme) {
    console.error('Type theme name.');

    return;
  }

  try {
    await SVGFixer(
      `./src/styles/themes/${theme}/icons/files-to-fix`,
      `./src/styles/themes/${theme}/icons/files`,
      { showProgressBar: true }
    ).fix();
  } catch (err) {
    console.log(err);
    throw err;
  }
})());
