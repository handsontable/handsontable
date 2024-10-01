/* eslint-disable import/no-unresolved */
const prism = require('prismjs');
const loadLanguages = require('prismjs/components/index');
const { logger, chalk, escapeHtml } = require('@vuepress/shared-utils');

// required to make embedded highlighting work...
loadLanguages(['markup', 'css', 'javascript']);

const wrap = (code, lang) => {
  if (lang === 'text') {
    code = escapeHtml(code);
  }

  // eslint-disable-next-line max-len
  return `<pre v-pre class="language-${lang}"><code>${code}</code></pre>
          <div class="codeControls">
            <div class="select-type">
              <button
                type="button"
                class="select-type-button"
                @click="$parent.$parent.toggleDropdown($event)"
                value="${lang}"
              >
                {{ $parent.$parent.selectedLang }}
              </button>
              <ul>
                <li>
                  <button
                    type="button"
                    @click="$parent.$parent.setLanguage('JavaScript')" 
                    :class="{'select-type-js': true, 'active': ${lang.includes('js')}}"
                  >
                    JavaScript
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    @click="$parent.$parent.setLanguage('TypeScript')" 
                    :class="{'select-type-ts': true, 'active': ${lang.includes('ts')}}"
                  >
                    TypeScript
                  </button>
                </li>
              </ul>
            </div>
            <button @click="$parent.$parent.copyCode($event)" class="copycode" aria-label="Copy to clipboard">
              <i class="ico i-copy no-pointer"></i><i class="ico i-checks no-pointer"></i>
            </button>
          </div>`;
};

const getLangCodeFromExtension = (extension) => {
  const extensionMap = {
    vue: 'markup',
    html: 'markup',
    md: 'markdown',
    rb: 'ruby',
    ts: 'typescript',
    py: 'python',
    sh: 'bash',
    yml: 'yaml',
    styl: 'stylus',
    kt: 'kotlin',
    rs: 'rust',
    hf: 'excel-formula',
    formula: 'excel-formula',
    hyperformula: 'excel-formula',
  };

  return extensionMap[extension] || extension;
};

module.exports = (str, lang) => {
  if (!lang) {
    return wrap(str, 'text');
  }
  lang = lang.toLowerCase();
  const rawLang = lang;

  lang = getLangCodeFromExtension(lang);

  if (!prism.languages[lang]) {
    try {
      loadLanguages([lang]);
    } catch (e) {
      logger.warn(chalk.yellow(`[vuepress] Syntax highlight for language "${lang}" is not supported.`));
    }
  }
  if (prism.languages[lang]) {
    const code = prism.highlight(str, prism.languages[lang], lang);

    return wrap(code, rawLang);
  }

  return wrap(str, 'text');
};
