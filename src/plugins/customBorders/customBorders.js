(function () {

  function CustomBorders () {}

  /***
   * Array for all custom border objects (for redraw)
   * @type {{}}
   */
  var bordersArray = {},
    /***
     * Flag for prevent redraw borders after each AfterRender hook
     * @type {boolean}
     */
    doDraw = false;


  var init = function () {
    var customBorders = this.getSettings().customBorders;
    var enable = false;

    if(typeof customBorders === "boolean"){
      if (customBorders == true){
        enable = true;
      }
    }

    if(typeof customBorders === "object"){
      if(customBorders.length > 0) {
        for(var i = 0; i< customBorders.length; i++) {
          if(customBorders[i].range){
            prepareBorderFromCustomAddedRange(customBorders[i]);
          } else {
            prepareBorderFromCustomAdded(customBorders[i].row, customBorders[i].col, customBorders[i]);
          }
        }
        doDraw = true;
      }
    }

    if(enable){
      if(!this.customBorders){
        this.customBorders = new CustomBorders();
      }
    }
  };

  var prepareBorderFromCustomAdded = function (row, col, borderObj){
    var border = createEmptyBorders(row, col);
    border = extendDefaultBorder(border, borderObj);
    //this.setCellMeta(row, col, 'borders', border);
    insertBorderToArray(border);
  };

  var prepareBorderFromCustomAddedRange = function (rowObj) {
    var range = rowObj.range;

    for (var row = range.from.row; row <= range.to.row; row ++) {
      for (var col = range.from.col; col<= range.to.col; col++){

        var border = createEmptyBorders(row, col);
        var add = 0;

        if(row == range.from.row) {
          add++;
          if(rowObj.hasOwnProperty('top')){
            border.top = rowObj.top;
          }
        }

        if(row == range.to.row){
          add++;
          if(rowObj.hasOwnProperty('bottom')){
            border.bottom = rowObj.bottom;
          }
        }

        if(col == range.from.col) {
          add++;
          if(rowObj.hasOwnProperty('left')){
            border.left = rowObj.left;
          }
        }


        if (col == range.to.col) {
          add++;
          if(rowObj.hasOwnProperty('right')){
            border.right = rowObj.right;
          }
        }


        if(add>0){
//          this.setCellMeta(row, col, 'borders', border);
          insertBorderToArray(border);
        }
      }
    }
  };

  /***
   * Create separated class name for borders for each cell
   * @param row
   * @param col
   * @returns {string}
   */
  var createClassName = function (row, col) {
    return "border_row" + row + "col" + col;
  };


  /***
   * Create default single border for each position (top/right/bottom/left)
   * @returns {{width: number, color: string}}
   */
  var createDefaultCustomBorder = function () {
    return {
      width: 1,
      color: '#000'
    };
  }

  /***
   * Create default Handsontable border object
   * @returns {{width: number, color: string, cornerVisible: boolean}}
   */
  var createDefaultHtBorder = function () {
    return {
      width: 1,
      color: '#000',
      cornerVisible: false
    }
  };

  /***
   * Prepare empty border for each cell with all custom borders hidden
   *
   * @param row
   * @param col
   * @returns {{className: *, border: *, row: *, col: *, top: {hide: boolean}, right: {hide: boolean}, bottom: {hide: boolean}, left: {hide: boolean}}}
   */
  var createEmptyBorders = function (row, col){
    return {
      className: createClassName(row, col),
      border: createDefaultHtBorder(),
      row: row,
      col: col,
      top:{
        hide:true
      },
      right:{
        hide:true
      },
      bottom:{
        hide:true
      },
      left:{
        hide:true
      }
    }
  };


  var extendDefaultBorder = function (defaultBorder, customBorder){

    if(customBorder.hasOwnProperty('border')){
      defaultBorder.border = customBorder.border;
    }

    if(customBorder.hasOwnProperty('top')){
      defaultBorder.top = customBorder.top;
    }

    if(customBorder.hasOwnProperty('right')){
      defaultBorder.right = customBorder.right;
    }

    if(customBorder.hasOwnProperty('bottom')){
      defaultBorder.bottom = customBorder.bottom;
    }

    if(customBorder.hasOwnProperty('left')){
      defaultBorder.left = customBorder.left;
    }
    return defaultBorder;
  }

  /***
   * Insert object with borders for each cell to bordersArray
   *
   * @param bordersObj
   */
  var insertBorderToArray = function (bordersObj) {
    bordersArray[bordersObj.className] = bordersObj;
  };

  /***
   * Clean bordersArray for cell when custom border has been removed
   *
   * @param className
   */
  var removeBorderFromArray = function (className) {
    delete bordersArray[className];
  };


  /***
   * Remove borders divs from DOM
   *
   * @param borderClassName
   */
  var removeBordersFromDom = function (borderClassName) {
    var borders = document.getElementsByClassName(borderClassName)[0];

    if(borders){
      var parent = borders.parentNode;
      parent.parentNode.removeChild(parent);
    }

  };


  /***
   * Remove border (triggered from context menu)
   *
   * @param row
   * @param col
   */
  var removeBorder = function(row,col) {
    var borderClassName = createClassName(row,col);
    removeBordersFromDom(borderClassName);
    removeBorderFromArray(borderClassName);

    this.removeCellMeta(row, col, 'borders');
  };


  /***
   * Draw borders for single cell
   *
   * @param borderObj
   */
  var drawBorders = function (borderObj) {
    var bordersInDOM = document.getElementsByClassName(createClassName(borderObj.row,borderObj.col)),
      bordersExist = bordersInDOM.length > 0;

    if(bordersExist){
      removeBordersFromDom(createClassName(borderObj.row,borderObj.col));
    }

    var border = new WalkontableBorder(this.view.wt,borderObj);
    border.appear([borderObj.row,borderObj.col,borderObj.row,borderObj.col]);
  };


  /***
   * Set borders for each cell re. to border position
   *
   * @param row
   * @param col
   * @param place
   */
  var setBorder = function (row, col,place){
    var bordersMeta = this.getCellMeta(row, col).borders;
    if (!bordersMeta || bordersMeta.border == undefined){
      bordersMeta = createEmptyBorders(row, col);
    }
    bordersMeta[place] = createDefaultCustomBorder();
    this.setCellMeta(row, col, 'borders', bordersMeta);
    insertBorderToArray(bordersMeta);
    doDraw = true;
    this.render();
  };


  /***
   * Prepare borders based on cell and border position
   *
   * @param range
   * @param place
   * @param border
   */
  var prepareBorder = function (range, place, border) {
    if (range.from.row == range.to.row && range.from.col == range.to.col){
      if(place == "noBorders"){
        removeBorder.call(this, range.from.row, range.from.col);
      } else {
        setBorder.call(this, range.from.row, range.from.col, place);
      }
    } else {
      switch (place) {
        case "noBorders":
          for(var column = range.from.col; column <= range.to.col; column++){
            for(var row = range.from.row; row <= range.to.row; row++) {
              removeBorder.call(this, row, column);
            }
          }
          break;
        case "top":
          for(var topCol = range.from.col; topCol <= range.to.col; topCol++){
            setBorder.call(this, range.from.row, topCol, place);
          }
          break;
        case "right":
          for(var rowRight = range.from.row; rowRight <=range.to.row; rowRight++){
            setBorder.call(this,rowRight, range.to.col, place);
          }
          break;
        case "bottom":
          for(var bottomCol = range.from.col; bottomCol <= range.to.col; bottomCol++){
            setBorder.call(this, range.to.row, bottomCol, place);
          }
          break;
        case "left":
          for(var rowLeft = range.from.row; rowLeft <=range.to.row; rowLeft++){
            setBorder.call(this,rowLeft, range.from.col, place);
          }
          break;
      }
    }
  };


  /***
   * Add border options to context menu
   *
   * @param defaultOptions
   */
  var addBordersOptionsToContextMenu = function (defaultOptions) {
    if(!this.getSettings().customBorders){
      return;
    }

    defaultOptions.items.bordersCellsSeparator = Handsontable.ContextMenu.SEPARATOR;
    defaultOptions.items.borders = {
      name: function () {
        var div = document.createElement('div'),
          button = document.createElement('button'),
          xButton = button.cloneNode(true),
          tButton = button.cloneNode(true),
          lButton = button.cloneNode(true),
          bButton = button.cloneNode(true),
          rButton = button.cloneNode(true),

          xText = document.createTextNode('X'),
          tText = document.createTextNode('top'),
          rText = document.createTextNode('right'),
          bText = document.createTextNode('bottom'),
          lText = document.createTextNode('left');

        xButton.appendChild(xText);
        tButton.appendChild(tText);
        rButton.appendChild(rText);
        bButton.appendChild(bText);
        lButton.appendChild(lText);

        Handsontable.Dom.addClass(xButton,'noBorders');
        Handsontable.Dom.addClass(tButton,'top');
        Handsontable.Dom.addClass(rButton,'right');
        Handsontable.Dom.addClass(bButton,'bottom');
        Handsontable.Dom.addClass(lButton,'left');

        div.appendChild(xButton);
        div.appendChild(tButton);
        div.appendChild(rButton);
        div.appendChild(bButton);
        div.appendChild(lButton);

        return div.outerHTML;
      },
      callback:function(key, selection ,event){
        var className = event.target.className,
          type = event.target.tagName;
        if (type === "BUTTON") {
          if(className) {
            prepareBorder.call(this, this.getSelectedRange(), className);
          }
        }
      },
      disabled:function () {
        return false;
      }
    };
  };


  Handsontable.hooks.add('beforeInit', init);
  Handsontable.hooks.add('afterContextMenuDefaultOptions', addBordersOptionsToContextMenu);
  Handsontable.hooks.add('afterRender', function () {
    if(doDraw){
      for (var key in bordersArray) {
        if (bordersArray.hasOwnProperty(key)) {
          drawBorders.call(this,bordersArray[key])
        }
      }
      doDraw = false;
    }
  });
  Handsontable.CustomBorders = CustomBorders;

}());