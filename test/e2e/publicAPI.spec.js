describe('Public API', () => {
  const id = 'testContainer';

  beforeEach(function() {
    this.$container = $(`<div id="${id}"></div>`).appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  describe('Plugins', () => {
    it('should expose static method for registering external plugins', () => {
      expect(Handsontable.plugins.registerPlugin).toBeFunction();
    });

    it('should expose BasePlugin class', () => {
      expect(Handsontable.plugins.BasePlugin).toBeFunction();
    });

    it('should expose all registered plugin classes', () => {
      expect(Handsontable.plugins.AutoColumnSize).toBeFunction();
      expect(Handsontable.plugins.AutoRowSize).toBeFunction();
      expect(Handsontable.plugins.ColumnSorting).toBeFunction();
      expect(Handsontable.plugins.Comments).toBeFunction();
      expect(Handsontable.plugins.ContextMenu).toBeFunction();
      expect(Handsontable.plugins.CopyPaste).toBeFunction();
      expect(Handsontable.plugins.CustomBorders).toBeFunction();
      expect(Handsontable.plugins.DragToScroll).toBeFunction();
      expect(Handsontable.plugins.ManualColumnFreeze).toBeFunction();
      expect(Handsontable.plugins.ManualColumnResize).toBeFunction();
      expect(Handsontable.plugins.ManualRowResize).toBeFunction();
      expect(Handsontable.plugins.MultipleSelectionHandles).toBeFunction();
      expect(Handsontable.plugins.TouchScroll).toBeFunction();
      expect(Handsontable.plugins.UndoRedo).toBeFunction();
    });
  });

  describe('Editors', () => {
    it('should expose static method for registering external editors', () => {
      expect(Handsontable.editors.registerEditor).toBeFunction();
    });

    it('should expose static method for retrieving registered editors', () => {
      expect(Handsontable.editors.getEditor).toBeFunction();
    });

    it('should expose BaseEditor class', () => {
      expect(Handsontable.editors.BaseEditor).toBeFunction();
    });

    it('should expose all registered editor classes', () => {
      expect(Handsontable.editors.AutocompleteEditor).toBeFunction();
      expect(Handsontable.editors.CheckboxEditor).toBeFunction();
      expect(Handsontable.editors.DateEditor).toBeFunction();
      expect(Handsontable.editors.DropdownEditor).toBeFunction();
      expect(Handsontable.editors.HandsontableEditor).toBeFunction();
      expect(Handsontable.editors.NumericEditor).toBeFunction();
      expect(Handsontable.editors.PasswordEditor).toBeFunction();
      expect(Handsontable.editors.SelectEditor).toBeFunction();
      expect(Handsontable.editors.TextEditor).toBeFunction();
    });
  });

  describe('Renderers', () => {
    it('should expose static method for registering external renderers', () => {
      expect(Handsontable.renderers.registerRenderer).toBeFunction();
    });

    it('should expose static method for retrieving registered renderers', () => {
      expect(Handsontable.renderers.getRenderer).toBeFunction();
    });

    it('should expose BaseRenderer class', () => {
      expect(Handsontable.renderers.BaseRenderer).toBeFunction();
    });

    it('should expose all registered renderer functions', () => {
      expect(Handsontable.renderers.AutocompleteRenderer).toBeFunction();
      expect(Handsontable.renderers.CheckboxRenderer).toBeFunction();
      expect(Handsontable.renderers.HtmlRenderer).toBeFunction();
      expect(Handsontable.renderers.NumericRenderer).toBeFunction();
      expect(Handsontable.renderers.PasswordRenderer).toBeFunction();
      expect(Handsontable.renderers.TextRenderer).toBeFunction();
    });
  });

  describe('Validators', () => {
    it('should expose static method for registering external validators', () => {
      expect(Handsontable.validators.registerValidator).toBeFunction();
    });

    it('should expose static method for retrieving registered validators', () => {
      expect(Handsontable.validators.getValidator).toBeFunction();
    });

    it('should expose all registered validator functions', () => {
      expect(Handsontable.validators.AutocompleteValidator).toBeFunction();
      expect(Handsontable.validators.DateValidator).toBeFunction();
      expect(Handsontable.validators.NumericValidator).toBeFunction();
      expect(Handsontable.validators.TimeValidator).toBeFunction();
    });
  });

  describe('CellTypes', () => {
    it('should expose static method for registering external cell types', () => {
      expect(Handsontable.cellTypes.registerCellType).toBeFunction();
    });

    it('should expose static method for retrieving registered cell types', () => {
      expect(Handsontable.cellTypes.getCellType).toBeFunction();
    });

    it('should expose all registered cell type objects', () => {
      expect(Handsontable.cellTypes.autocomplete.editor).toBe(Handsontable.editors.AutocompleteEditor);
      expect(Handsontable.cellTypes.autocomplete.renderer).toBe(Handsontable.renderers.AutocompleteRenderer);
      expect(Handsontable.cellTypes.autocomplete.validator).toBe(Handsontable.validators.AutocompleteValidator);

      expect(Handsontable.cellTypes.checkbox.editor).toBe(Handsontable.editors.CheckboxEditor);
      expect(Handsontable.cellTypes.checkbox.renderer).toBe(Handsontable.renderers.CheckboxRenderer);
      expect(Handsontable.cellTypes.checkbox.validator).not.toBeDefined();

      expect(Handsontable.cellTypes.date.editor).toBe(Handsontable.editors.DateEditor);
      expect(Handsontable.cellTypes.date.renderer).toBe(Handsontable.renderers.AutocompleteRenderer);
      expect(Handsontable.cellTypes.date.validator).toBe(Handsontable.validators.DateValidator);

      expect(Handsontable.cellTypes.dropdown.editor).toBe(Handsontable.editors.DropdownEditor);
      expect(Handsontable.cellTypes.dropdown.renderer).toBe(Handsontable.renderers.AutocompleteRenderer);
      expect(Handsontable.cellTypes.dropdown.validator).toBe(Handsontable.validators.AutocompleteValidator);

      expect(Handsontable.cellTypes.handsontable.editor).toBe(Handsontable.editors.HandsontableEditor);
      expect(Handsontable.cellTypes.handsontable.renderer).toBe(Handsontable.renderers.AutocompleteRenderer);
      expect(Handsontable.cellTypes.handsontable.validator).not.toBeDefined();

      expect(Handsontable.cellTypes.numeric.editor).toBe(Handsontable.editors.NumericEditor);
      expect(Handsontable.cellTypes.numeric.renderer).toBe(Handsontable.renderers.NumericRenderer);
      expect(Handsontable.cellTypes.numeric.validator).toBe(Handsontable.validators.NumericValidator);

      expect(Handsontable.cellTypes.password.editor).toBe(Handsontable.editors.PasswordEditor);
      expect(Handsontable.cellTypes.password.renderer).toBe(Handsontable.renderers.PasswordRenderer);
      expect(Handsontable.cellTypes.password.validator).not.toBeDefined();

      expect(Handsontable.cellTypes.text.editor).toBe(Handsontable.editors.TextEditor);
      expect(Handsontable.cellTypes.text.renderer).toBe(Handsontable.renderers.TextRenderer);
      expect(Handsontable.cellTypes.text.validator).not.toBeDefined();

      expect(Handsontable.cellTypes.time.editor).toBe(Handsontable.editors.TextEditor);
      expect(Handsontable.cellTypes.time.renderer).toBe(Handsontable.renderers.TextRenderer);
      expect(Handsontable.cellTypes.time.validator).toBe(Handsontable.validators.TimeValidator);
    });
  });

  describe('Helpers', () => {
    it('should expose all registered helpers', () => {
      expect(Handsontable.dom.addClass).toBeFunction();
      expect(Handsontable.dom.addEvent).toBeFunction();
      expect(Handsontable.dom.closest).toBeFunction();
      expect(Handsontable.dom.closestDown).toBeFunction();
      expect(Handsontable.dom.empty).toBeFunction();
      expect(Handsontable.dom.fastInnerHTML).toBeFunction();
      expect(Handsontable.dom.fastInnerText).toBeFunction();
      expect(Handsontable.dom.getCaretPosition).toBeFunction();
      expect(Handsontable.dom.getComputedStyle).toBeFunction();
      expect(Handsontable.dom.getCssTransform).toBeFunction();
      expect(Handsontable.dom.getParent).toBeFunction();
      expect(Handsontable.dom.getScrollLeft).toBeFunction();
      expect(Handsontable.dom.getScrollTop).toBeFunction();
      expect(Handsontable.dom.getScrollableElement).toBeFunction();
      expect(Handsontable.dom.getScrollbarWidth).toBeFunction();
      expect(Handsontable.dom.getSelectionEndPosition).toBeFunction();
      expect(Handsontable.dom.getSelectionText).toBeFunction();
      expect(Handsontable.dom.getStyle).toBeFunction();
      expect(Handsontable.dom.getTrimmingContainer).toBeFunction();
      expect(Handsontable.dom.getWindowScrollLeft).toBeFunction();
      expect(Handsontable.dom.getWindowScrollTop).toBeFunction();
      expect(Handsontable.dom.hasClass).toBeFunction();
      expect(Handsontable.dom.hasHorizontalScrollbar).toBeFunction();
      expect(Handsontable.dom.hasVerticalScrollbar).toBeFunction();
      expect(Handsontable.dom.index).toBeFunction();
      expect(Handsontable.dom.innerHeight).toBeFunction();
      expect(Handsontable.dom.innerWidth).toBeFunction();
      expect(Handsontable.dom.isChildOf).toBeFunction();
      expect(Handsontable.dom.isChildOfWebComponentTable).toBeFunction();
      expect(Handsontable.dom.isImmediatePropagationStopped).toBeFunction();
      expect(Handsontable.dom.isInput).toBeFunction();
      expect(Handsontable.dom.isLeftClick).toBeFunction();
      expect(Handsontable.dom.isRightClick).toBeFunction();
      expect(Handsontable.dom.isVisible).toBeFunction();
      expect(Handsontable.dom.offset).toBeFunction();
      expect(Handsontable.dom.outerHeight).toBeFunction();
      expect(Handsontable.dom.outerWidth).toBeFunction();
      expect(Handsontable.dom.overlayContainsElement).toBeFunction();
      expect(Handsontable.dom.pageX).toBeFunction();
      expect(Handsontable.dom.pageY).toBeFunction();
      expect(Handsontable.dom.polymerUnwrap).toBeFunction();
      expect(Handsontable.dom.polymerWrap).toBeFunction();
      expect(Handsontable.dom.removeClass).toBeFunction();
      expect(Handsontable.dom.removeEvent).toBeFunction();
      expect(Handsontable.dom.removeTextNodes).toBeFunction();
      expect(Handsontable.dom.resetCssTransform).toBeFunction();
      expect(Handsontable.dom.setCaretPosition).toBeFunction();
      expect(Handsontable.dom.setOverlayPosition).toBeFunction();
      expect(Handsontable.dom.stopImmediatePropagation).toBeFunction();
      expect(Handsontable.dom.stopPropagation).toBeFunction();
    });
  });
});
