const exampleRegex = /^(example)\s*(#\S*|)\s*(\.\S*|)\s*([\S|\s]*)$/

module.exports = {
  type: 'example',
  render: function (tokens, index, opts, env) {
    const token = tokens[index]
    const tokenNext = tokens[index + 1]
    const m = token.info.trim().match(exampleRegex);

    if (token.nesting === 1 && m) {
      let [full, tag, id, klass, content] = m;
      id = id ? id.substring(1): '';
      klass = klass ? klass.substring(1) : '';
      // opening tag
      return `<div data-jsfiddle="${id}"><div id="${id}" class="hot ${klass}"></div></div><script data-jsfiddle="${id}">${tokenNext.content}</script><div class="codeLayout"><button class="jsFiddleLink" data-runfiddle="${id}"><i class="fa fa-jsfiddle"></i>Edit</button>\n`;

    } else {
      // closing tag
      return `</div>\n`;
    }
  }
}
