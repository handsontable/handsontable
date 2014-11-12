if (Handsontable.mobileBrowser) {
  describe("MobileTextEditor", function () {
    var id = 'testContainer';

    beforeEach(function () {
      this.$container = $('<div id="' + id + '"></div>').appendTo('body');
    });

    afterEach(function () {
      if (this.$container) {
        destroy();
        this.$container.remove();
      }
    });

    describe("at init: ", function () {

      it("tap (touchstart) should be translated to mousedown", function () {
        var onAfterOnCellMouseDown = jasmine.createSpy('onAfterOnCellMouseDown');

        var hot = handsontable({
          data: createSpreadsheetObjectData(10, 5),
          width: 400,
          height: 400,
          afterOnCellMouseDown: onAfterOnCellMouseDown
        });

        var cell = hot.getCell(1, 1);

        expect(getSelected()).toBeUndefined();

        triggerTouchEvent('touchstart', cell);

        waitsFor(function () {
          return onAfterOnCellMouseDown.calls.length > 0;
        }, 'Mousedown on Cell event', 1000);

        runs(function () {
          expect(getSelected()).toBeDefined();
        });
      });

      it("should close the editor on tap outside the editor", function () {

        var onAfterOnCellMouseDown = jasmine.createSpy('onAfterOnCellMouseDown');

        var hot = handsontable({
          data: createSpreadsheetObjectData(10, 5),
          width: 400,
          height: 400,
          afterOnCellMouseDown: onAfterOnCellMouseDown
        });

        var cell = hot.getCell(1, 1);

        mouseDoubleClick(cell); // should test it properly, if touch->mousedown translation works

        waitsFor(function () {
          return onAfterOnCellMouseDown.calls.length > 1;
        }, 'Mousedown on Cell event', 1000);

        runs(function () {
          expect(document.getElementById("mobile-editor-container")).toBeTruthy();
          expect(document.getElementById("mobile-editor-container").offsetParent).toBeTruthy();

          triggerTouchEvent('touchstart', getCell(0, 4));

          waitsFor(function () {
            return onAfterOnCellMouseDown.calls.length > 2;
          }, 'Mousedown on Cell event', 1000);

          runs(function () {
            expect(document.getElementById("mobile-editor-container").offsetParent).toBeFalsy();
          });

        });

      });

      it("should set the cell pointer's position to point to the edited cell", function () {
        var onAfterOnCellMouseDown = jasmine.createSpy('onAfterOnCellMouseDown');
        var hot = handsontable({
          data: createSpreadsheetObjectData(10, 5),
          width: 400,
          height: 400,
          afterOnCellMouseDown: onAfterOnCellMouseDown
        });

        var cell = hot.getCell(2, 3);

        mouseDoubleClick(cell);

        waitsFor(function () {
          return onAfterOnCellMouseDown.calls.length > 1; // doubleclicked on a cell -> editor should open
        }, 'Mousedown on Cell event', 1000);

        runs(function () {
          var cellPosition = Handsontable.Dom.offset(cell)
            , cellWidth = Handsontable.Dom.outerWidth(cell)
            , cellPointer = getActiveEditor().cellPointer
            , cellPointerPosition = Handsontable.Dom.offset(getActiveEditor().cellPointer)
            , cellPointerWidth = Handsontable.Dom.outerWidth(getActiveEditor().cellPointer);

          expect(Math.ceil(cellPosition.left + cellWidth / 2)).toEqual(Math.ceil(cellPointerPosition.left + cellPointerWidth / 2));
        });

      });

      it("should center the editor after opening if the edited cell horizontal position is within editor boundaries", function () {
        var onAfterOnCellMouseDown = jasmine.createSpy('onAfterOnCellMouseDown');
        var hot = handsontable({
          data: createSpreadsheetObjectData(10, 5),
          width: 400,
          height: 400,
          afterOnCellMouseDown: onAfterOnCellMouseDown
        });

        var cell = hot.getCell(2, 4);

        mouseDoubleClick(cell);

        waitsFor(function () {
          return onAfterOnCellMouseDown.calls.length > 1; // doubleclicked on a cell -> editor should open
        }, 'Mousedown on Cell event', 1000);

        runs(function () {
          var editor = getActiveEditor()
            , editorWidth = Handsontable.Dom.outerWidth(editor.editorContainer)
            , editorPosition = Handsontable.Dom.offset(editor.editorContainer);

          expect(Math.ceil(editorPosition.left + editorWidth / 2)).toEqual(Math.ceil(window.innerWidth / 2));
        });
      });

      it("should snap the editor to the ride side of the screen if the edited cell is on the right side of the editor", function () {
        var onAfterOnCellMouseDown = jasmine.createSpy('onAfterOnCellMouseDown');
        var hot = handsontable({
          data: createSpreadsheetObjectData(10, 24),
          width: window.innerWidth,
          height: 400,
          afterOnCellMouseDown: onAfterOnCellMouseDown
        });

        var cell = hot.getCell(2, 23);

        mouseDoubleClick(cell);

        waitsFor(function () {
          return onAfterOnCellMouseDown.calls.length > 1; // doubleclicked on a cell -> editor should open
        }, 'Mousedown on Cell event', 1000);

        runs(function () {
          var editor = getActiveEditor()
            , editorWidth = Handsontable.Dom.outerWidth(editor.editorContainer)
            , editorPosition = Handsontable.Dom.offset(editor.editorContainer);

          expect(Math.ceil(editorPosition.left + editorWidth)).toEqual(window.innerWidth);
        });
      });

      it("should snap the editor to the left side of the screen if the edited cell is on the left side of the editor", function () {
        var onAfterOnCellMouseDown = jasmine.createSpy('onAfterOnCellMouseDown');
        var hot = handsontable({
          data: createSpreadsheetObjectData(10, 5),
          width: 400,
          height: 400,
          afterOnCellMouseDown: onAfterOnCellMouseDown
        });

        var cell = hot.getCell(2, 0);

        mouseDoubleClick(cell);

        waitsFor(function () {
          return onAfterOnCellMouseDown.calls.length > 1; // doubleclicked on a cell -> editor should open
        }, 'Mousedown on Cell event', 1000);

        runs(function () {
          var editor = getActiveEditor()
            , editorPosition = Handsontable.Dom.offset(editor.editorContainer);

          expect(editorPosition.left).toEqual(0);
        });
      });

      it("should be positioned right below the edited cell", function () {
        var onAfterOnCellMouseDown = jasmine.createSpy('onAfterOnCellMouseDown');
        var hot = handsontable({
          data: createSpreadsheetObjectData(10, 5),
          width: 400,
          height: 400,
          afterOnCellMouseDown: onAfterOnCellMouseDown
        });

        var cell = hot.getCell(2, 3);

        mouseDoubleClick(cell);

        waitsFor(function () {
          return onAfterOnCellMouseDown.calls.length > 1; // doubleclicked on a cell -> editor should open
        }, 'Mousedown on Cell event', 1000);

        runs(function () {
          var editor = getActiveEditor()
            , cellPosition = Handsontable.Dom.offset(cell)
            , cellHeight = Handsontable.Dom.outerHeight(cell)
            , editorPosition = Handsontable.Dom.offset(editor.editorContainer)
            , cellPointerHeight = Handsontable.Dom.outerHeight(editor.cellPointer);

          expect(editorPosition.top - cellPointerHeight).toEqual(cellPosition.top + cellHeight);
        });
      });

      it("should apply the changes after tapping outside the editor", function () {
        var onAfterOnCellMouseDown = jasmine.createSpy('onAfterOnCellMouseDown');
        var hot = handsontable({
          data: createSpreadsheetObjectData(10, 5),
          width: 400,
          height: 400,
          afterOnCellMouseDown: onAfterOnCellMouseDown
        });

        var cell = hot.getCell(2, 3);
        mouseDoubleClick(cell);

        waitsFor(function () {
          return onAfterOnCellMouseDown.calls.length > 1; // doubleclicked on a cell -> editor should open
        }, 'Mousedown on Cell event', 1000);

        runs(function () {
          var editor = getActiveEditor();

          editor.setValue('done!');

          expect(cell.innerText).toEqual('D3');

          triggerTouchEvent('touchstart', getCell(0, 0));

          waitsFor(function () {
            return onAfterOnCellMouseDown.calls.length > 2;
          }, 'Mousedown on Cell event', 1000);

          runs(function () {
            expect(cell.innerText).toEqual('done!');
          });
        });
      });


      describe(" Move Controls:", function () {
        it("should change the selected cell in the appropriate direction after hitting the controller button", function () {
          var onAfterOnCellMouseDown = jasmine.createSpy('onAfterOnCellMouseDown');
          var hot = handsontable({
            data: createSpreadsheetObjectData(10, 5),
            width: 400,
            height: 400,
            afterOnCellMouseDown: onAfterOnCellMouseDown
          });

          var cell = hot.getCell(2, 3);

          mouseDoubleClick(cell);

          waitsFor(function () {
            return onAfterOnCellMouseDown.calls.length > 1; // doubleclicked on a cell -> editor should open
          }, 'Mousedown on Cell event', 1000);

          runs(function () {
            var editor = getActiveEditor()
              , selected = getSelected();

            expect(selected[1]).toEqual(3);
            triggerTouchEvent('touchend', editor.controls.leftButton);
            waits(10);
            runs(function () {
              selected = getSelected();
              expect(selected[1]).toEqual(2);
            });

          });

          runs(function () {
            var editor = getActiveEditor()
              , selected = getSelected();

            expect(selected[0]).toEqual(2);
            expect(selected[1]).toEqual(2);
            triggerTouchEvent('touchend', editor.controls.upButton);
            waits(10);
            runs(function () {
              selected = getSelected();
              expect(selected[0]).toEqual(1);
              expect(selected[1]).toEqual(2);
            });
          });

          runs(function () {
            var editor = getActiveEditor()
              , selected = getSelected();

            expect(selected[0]).toEqual(1);
            expect(selected[1]).toEqual(2);
            triggerTouchEvent('touchend', editor.controls.rightButton);
            waits(10);
            runs(function () {
              selected = getSelected();
              expect(selected[0]).toEqual(1);
              expect(selected[1]).toEqual(3);
            });
          });

          runs(function () {
            var editor = getActiveEditor()
              , selected = getSelected();

            expect(selected[0]).toEqual(1);
            expect(selected[1]).toEqual(3);
            triggerTouchEvent('touchend', editor.controls.downButton);
            waits(10);
            runs(function () {
              selected = getSelected();
              expect(selected[0]).toEqual(2);
              expect(selected[1]).toEqual(3);
            });
          });

        });

        it("should change the editor's input value to the value of the newly selected cell", function () {
          var onAfterOnCellMouseDown = jasmine.createSpy('onAfterOnCellMouseDown');
          var hot = handsontable({
            data: createSpreadsheetObjectData(10, 5),
            width: 400,
            height: 400,
            afterOnCellMouseDown: onAfterOnCellMouseDown
          });

          var cell = hot.getCell(2, 3);

          mouseDoubleClick(cell);

          waitsFor(function () {
            return onAfterOnCellMouseDown.calls.length > 1; // doubleclicked on a cell -> editor should open
          }, 'Mousedown on Cell event', 1000);

          runs(function () {
            var editor = getActiveEditor();

            expect(editor.getValue()).toEqual(cell.innerText);

            triggerTouchEvent('touchend', editor.controls.leftButton);
            waits(10);
            runs(function () {
              var newSelection = getSelected();
              expect(editor.getValue()).toEqual(getCell(newSelection[0], newSelection[1]).innerText);
            });

            runs(function() {
              triggerTouchEvent('touchend', editor.controls.upButton);
              waits(10);
              runs(function () {
                var newSelection = getSelected();
                expect(editor.getValue()).toEqual(getCell(newSelection[0], newSelection[1]).innerText);
              });
            });

            runs(function() {
              triggerTouchEvent('touchend', editor.controls.rightButton);
              waits(10);
              runs(function () {
                var newSelection = getSelected();
                expect(editor.getValue()).toEqual(getCell(newSelection[0], newSelection[1]).innerText);
              });
            });

            runs(function() {
              triggerTouchEvent('touchend', editor.controls.downButton);
              waits(10);
              runs(function () {
                var newSelection = getSelected();
                expect(editor.getValue()).toEqual(getCell(newSelection[0], newSelection[1]).innerText);
              });
            });

          });

        });

        it("should apply the changes after moving selection elsewhere", function () {
          var onAfterOnCellMouseDown = jasmine.createSpy('onAfterOnCellMouseDown');
          var hot = handsontable({
            data: createSpreadsheetObjectData(10, 5),
            width: 400,
            height: 400,
            afterOnCellMouseDown: onAfterOnCellMouseDown
          });

          var cell = hot.getCell(2, 3);

          mouseDoubleClick(cell);

          waitsFor(function () {
            return onAfterOnCellMouseDown.calls.length > 1; // doubleclicked on a cell -> editor should open
          }, 'Mousedown on Cell event', 1000);

          runs(function () {
            var editor = getActiveEditor();

            expect(cell.innerText).toEqual('D3');
            editor.setValue('done!');
            triggerTouchEvent('touchend', editor.controls.leftButton);
            waits(10);
            runs(function () {
              expect(cell.innerText).toEqual('done!');
            });

            runs(function () {
              var newSelection = getSelected();
              expect(getCell(newSelection[0], newSelection[1]).innerText).toEqual('C3');
              editor.setValue('done!');
              triggerTouchEvent('touchend', editor.controls.upButton);
              waits(10);
              runs(function () {
                expect(getCell(newSelection[0], newSelection[1]).innerText).toEqual('done!');
              });
            });

            runs(function () {
              var newSelection = getSelected();
              expect(getCell(newSelection[0], newSelection[1]).innerText).toEqual('C2');
              editor.setValue('done!');
              triggerTouchEvent('touchend', editor.controls.rightButton);
              waits(10);
              runs(function () {
                expect(getCell(newSelection[0], newSelection[1]).innerText).toEqual('done!');
              });
            });

            runs(function () {
              var newSelection = getSelected();
              expect(getCell(newSelection[0], newSelection[1]).innerText).toEqual('D2');
              editor.setValue('done!');
              triggerTouchEvent('touchend', editor.controls.downButton);
              waits(10);
              runs(function () {
                expect(getCell(newSelection[0], newSelection[1]).innerText).toEqual('done!');
              });
            });

            runs(function () {
              var newSelection = getSelected();
              expect(getCell(newSelection[0], newSelection[1]).innerText).toEqual('done!');
              editor.setValue('done.');
              triggerTouchEvent('touchend', editor.controls.downButton);
              waits(10);
              runs(function () {
                expect(getCell(newSelection[0], newSelection[1]).innerText).toEqual('done.');
              });
            });

          });
        });
      });

      //xdescribe(" Editor position handle:", function () {
      //  it("should move the editor after touch-and-dragging the position handle", function () {
      //
      //    var onAfterOnCellMouseDown = jasmine.createSpy('onAfterOnCellMouseDown');
      //    var hot = handsontable({
      //      data: createSpreadsheetObjectData(10, 5),
      //      width: 400,
      //      height: 400,
      //      afterOnCellMouseDown: onAfterOnCellMouseDown
      //    });
      //
      //    var cell = hot.getCell(2, 3);
      //
      //    mouseDoubleClick(cell);
      //
      //    waitsFor(function () {
      //      return onAfterOnCellMouseDown.calls.length > 1; // doubleclicked on a cell -> editor should open
      //    }, 'Mousedown on Cell event', 1000);
      //
      //    runs(function () {
      //      var editor = getActiveEditor();
      //
      //      debugger;
      //      triggerTouchEvent('touchstart', editor.moveHandle);
      //      waits(10);
      //
      //      runs(function() {
      //        triggerTouchEvent('touchmove', getCell(0,0));
      //        debugger;
      //      });
      //
      //
      //    });
      //
      //  });
      //});
    });

  });

}


//it("should open the editor on double-tap", function () {
//  var onAfterOnCellMouseDown = jasmine.createSpy('onAfterOnCellMouseDown');
//
//  var hot = handsontable({
//    data: createSpreadsheetObjectData(10, 5),
//    width: 400,
//    height: 400,
//    afterOnCellMouseDown: onAfterOnCellMouseDown
//  });
//
//  var cell = hot.getCell(1,1);
//
//  expect(getSelected()).toBeUndefined();
//
//  triggerTouchEvent('touchstart', cell);
//  triggerTouchEvent('touchstend', cell);
//  triggerTouchEvent('touchstart', cell);
//  triggerTouchEvent('touchstend', cell);
//
//  waitsFor(function () {
//    return onAfterOnCellMouseDown.calls.length > 1;
//  }, 'Mousedown on Cell event', 1000);
//
//  runs(function () {
//    expect(getSelected()).toBeDefined();
//  });
//});
