module.exports = function tableWrapper(md) {
  const defaultRender = md.renderer.rules.table_open || function() {
    return '<table>';
  };

  md.renderer.rules.table_open = function(tokens, idx, options, env, self) {
    let tableWrapperElement = '<div class="table-wrapper">';
    const table = defaultRender(tokens, idx, options, env, self);

    tableWrapperElement += table;

    return tableWrapperElement;
  };

  md.renderer.rules.table_close = function() {
    const tableClose = '</table>';

    return `${tableClose}</div>`;
  };
};
