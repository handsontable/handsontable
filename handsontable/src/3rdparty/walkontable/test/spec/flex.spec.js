describe('WalkontableInFlexContainer', () => {
  const debug = false;

  beforeEach(function() {
    this.styleDomEleement = document.createElement('style');
    this.styleDomEleement.type = 'text/css';

    // Minimal CSS from PR #10005.
    const css = `
      .columns-container {
        display: flex;
        min-height: 400px;
      }
  
      .card-maximized {
        flex-grow: 1;
      }
  
      .card {
        display: flex;
        flex-direction: column;
      }
  
      .card > .card-body {
        flex: 1 1 auto;
        display: flex;
        flex-direction: column;
      }
  
      .container {
        flex: 1 1 auto;
        display: flex;
      }
  
      .hot {
        flex: 1 1 auto;
      }
    `;

    this.styleDomEleement.appendChild(document.createTextNode(css));

    this.$columnsContainer = $('<div></div>').addClass('columns-container');
    this.$card = $('<div></div>').addClass('card').addClass('card-maximized');
    this.$cardBody = $('<div></div>').addClass('card-body');
    this.$outerContainer = $('<div></div>').addClass('container');
    this.$wrapper = $('<div></div>').addClass('hot').css({ height: '100%', overflow: 'hidden' });
    this.$container = $('<div></div>');
    this.$table = $('<table></table>').addClass('htCore'); // create a table that is not attached to document

    this.$columnsContainer.append(this.$card);
    this.$card.append(this.$cardBody);
    this.$cardBody.append(this.$outerContainer);
    this.$outerContainer.append(this.$wrapper);
    this.$wrapper.append(this.$container);
    this.$container.append(this.$table);

    this.$columnsContainer.appendTo('body');
    $(this.styleDomEleement).appendTo('body');

    createDataArray(100, 4);
  });

  afterEach(function() {
    if (!debug) {
      $('.wtHolder').remove();
    }

    this.$columnsContainer.remove();
    this.styleDomEleement.remove();
    this.wotInstance.destroy();
  });

  it('should display walkontable properly (`overflow` property not set for some container) #10005', () => {
    const wt = walkontable({
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns
    });

    wt.draw();

    expect($('.ht_master').height()).not.toBe(0);
  });

  it('should display walkontable properly (`overflow` property set to `hidden` for some container) #10005', () => {
    spec().$cardBody.css({ overflow: 'hidden' });

    const wt = walkontable({
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns
    });

    wt.draw();

    expect($('.ht_master').height()).not.toBe(0);
  });

  it('should display walkontable properly (`overflow` property set to `scroll` for some container) #10005', () => {
    spec().$cardBody.css({ overflow: 'scroll' });

    const wt = walkontable({
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns
    });

    wt.draw();

    expect($('.ht_master').height()).not.toBe(0);
  });

  it('should display walkontable properly (`overflow` property set to `auto` for some container) #10005', () => {
    spec().$cardBody.css({ overflow: 'auto' });

    const wt = walkontable({
      data: getData,
      totalRows: getTotalRows,
      totalColumns: getTotalColumns
    });

    wt.draw();

    expect($('.ht_master').height()).not.toBe(0);
  });
});
