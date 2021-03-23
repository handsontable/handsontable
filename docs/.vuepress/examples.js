/**
 * Matches into: `example #ID .class`.
 *
 * @type {RegExp}
 */
const exampleRegex = /^(example)\s*(#\S*|)\s*(\.\S*|)\s*([\S|\s]*)$/;

const JSFIDDLE_ENDPOINT = 'https://jsfiddle.net/api/post/library/pure/';

const mapVersion = (version = 'latest') => (version.match(/^\d+\.\d+\.\d+$/) ? version : 'latest');

const getHotUrls = (version) => {
  const mappedVersion = mapVersion(version);

  return [
    `https://cdn.jsdelivr.net/npm/handsontable@${mappedVersion}/dist/handsontable.full.min.js`,
    `https://cdn.jsdelivr.net/npm/handsontable@${mappedVersion}/dist/handsontable.full.min.css`,
  ];
};

const getCss = (version) => {
  const [scriptUrl, styleUrl] = getHotUrls(version);

  return `</style><!-- Ugly Hack due to jsFiddle issue -->
<script src="${scriptUrl}"></script>
<link type="text/css" rel="stylesheet" href="${styleUrl}" />
`;
};

const getHtml = id => `<div id="${id}" ></div>`;
const jsfiddle = (id, code, version) => {
  return `
    <form
      id="jsfiddle-${id}"
      action=${JSFIDDLE_ENDPOINT}
      method="post"
      target="_blank"
      style="display:none;"
    >
      <input type="text" name="title" readOnly value="Handsontable example" />
      <input type="text" name="wrap" readOnly value="d" />
      <textarea name="js" readOnly>${code}</textarea>
      <textarea name="html" readOnly>${getHtml(id)}</textarea>
      <textarea name="css" readOnly>${getCss(version)}</textarea>
    </form>
    <div class="js-fiddle-link">
      <button type="submit" form="jsfiddle-${id}"><i class="fa fa-jsfiddle"></i>Edit</button>
    </div>
  `;
};
module.exports = {
  type: 'example',
  render(tokens, index, opts, env) {
    const token = tokens[index];
    const tokenNext = tokens[index + 1];
    const m = token.info.trim().match(exampleRegex);
    const version = env.relativePath.split('/')[0];

    if (token.nesting === 1 && m) {
      let [, , id, klass] = m;
      id = id ? id.substring(1) : '';
      klass = klass ? klass.substring(1) : '';
      // opening tag
      return `
    <div data-jsfiddle="${id}">
    <div id="${id}" class="hot ${klass}"></div>
    </div><script data-jsfiddle="${id}">useHandsontable('${version}', function(){${tokenNext.content}});</script>
    <div class="codeLayout">${jsfiddle(id, tokenNext.content, version)}
`;
    } else {
      // closing tag
      return '</div>\n';
    }
  }
};
