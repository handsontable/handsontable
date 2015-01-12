
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

      it("should recognize a mobile browser by a useragent string", function () {
        var mobileUserAgentStrings = [
          'Mozilla/5.0 (iPhone; CPU iPhone OS 8_1 like Mac OS X) AppleWebKit/600.1.4 (KHTML, like Gecko) Version/8.0 Mobile/12B411 Safari/600.1.4',
          'Mozilla/5.0 (iPhone; CPU iPhone OS 7_1_2 like Mac OS X) AppleWebKit/537.51.2 (KHTML, like Gecko) Version/7.0 Mobile/11D257 Safari/9537.53',
          'Mozilla/5.0 (iPad; CPU OS 8_1 like Mac OS X) AppleWebKit/600.1.4 (KHTML, like Gecko) Version/8.0 Mobile/12B410 Safari/600.1.4',
          'Mozilla/5.0 (iPhone; CPU iPhone OS 8_1_1 like Mac OS X) AppleWebKit/600.1.4 (KHTML, like Gecko) Version/8.0 Mobile/12B435 Safari/600.1.4',
          'Mozilla/5.0 (Linux; U; Android 4.0.3; ko-kr; LG-L160L Build/IML74K) AppleWebkit/534.30 (KHTML, like Gecko) Version/4.0 Mobile Safari/534.30',
          'Mozilla/5.0 (Linux; U; Android 4.0.3; de-ch; HTC Sensation Build/IML74K) AppleWebKit/534.30 (KHTML, like Gecko) Version/4.0 Mobile Safari/534.30',
          'Mozilla/5.0 (Linux; U; Android 2.3.5; en-us; HTC Vision Build/GRI40) AppleWebKit/533.1 (KHTML, like Gecko) Version/4.0 Mobile Safari/533.1',
          'Mozilla/5.0 (Linux; U; Android 2.3.4; fr-fr; HTC Desire Build/GRJ22) AppleWebKit/533.1 (KHTML, like Gecko) Version/4.0 Mobile Safari/533.1',
          'Mozilla/5.0 (Linux; U; Android 2.3.3; zh-tw; HTC_Pyramid Build/GRI40) AppleWebKit/533.1 (KHTML, like Gecko) Version/4.0 Mobile Safari',
          'Mozilla/5.0 (compatible; MSIE 9.0; Windows Phone OS 7.5; Trident/5.0; IEMobile/9.0)',
          'HTC_Touch_3G Mozilla/4.0 (compatible; MSIE 6.0; Windows CE; IEMobile 7.11)',
          'Mozilla/4.0 (compatible; MSIE 7.0; Windows Phone OS 7.0; Trident/3.1; IEMobile/7.0; Nokia;N70)'
        ];

        var desktopUserAgentStrings = [
          'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/38.0.2125.111 Safari/537.36',
          'Mozilla/5.0 (Windows NT 6.1; WOW64; rv:33.0) Gecko/20100101 Firefox/33.0',
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10) AppleWebKit/600.1.25 (KHTML, like Gecko) Version/8.0 Safari/600.1.25',
          'Mozilla/5.0 (Windows NT 6.3; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/38.0.2125.111 Safari/537.36',
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_1) AppleWebKit/600.1.25 (KHTML, like Gecko) Version/8.0 Safari/600.1.25',
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/38.0.2125.111 Safari/537.36',
          'Mozilla/5.0 (Windows NT 6.1; WOW64; Trident/7.0; rv:11.0) like Gecko',
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_9_5) AppleWebKit/600.1.17 (KHTML, like Gecko) Version/7.1 Safari/537.85.10',
          'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:33.0) Gecko/20100101 Firefox/33.0',
          'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/38.0.2125.111 Safari/537.36'
        ];

        for(var i = 0, mobileCount = mobileUserAgentStrings.length; i < mobileCount; i++) {
          expect(Handsontable.helper.isMobileBrowser(mobileUserAgentStrings[i])).toEqual(true);
        }

        for(var i = 0, desktopCount = desktopUserAgentStrings.length; i < desktopCount; i++) {
          expect(Handsontable.helper.isMobileBrowser(desktopUserAgentStrings[i])).toEqual(false);
        }

      });

      it("tap (touchstart) should be translated to mousedown", function () {
        var onAfterOnCellMouseDown = jasmine.createSpy('onAfterOnCellMouseDown');

        var hot = handsontable({
          data: Handsontable.helper.createSpreadsheetObjectData(10, 5),
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
          data: Handsontable.helper.createSpreadsheetObjectData(10, 5),
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
          expect(document.querySelector(".htMobileEditorContainer")).toBeTruthy();
          expect(document.querySelector(".htMobileEditorContainer").offsetParent).toBeTruthy();

          triggerTouchEvent('touchstart', getCell(0, 4));

          waitsFor(function () {
            return onAfterOnCellMouseDown.calls.length > 2;
          }, 'Mousedown on Cell event', 1000);

          runs(function () {
            expect(document.querySelector(".htMobileEditorContainer").offsetParent).toBeFalsy();
          });
        });
      });

      it("should set the cell pointer's position to point to the edited cell", function () {
        var onAfterOnCellMouseDown = jasmine.createSpy('onAfterOnCellMouseDown');
        var hot = handsontable({
          data: Handsontable.helper.createSpreadsheetObjectData(10, 5),
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
          data: Handsontable.helper.createSpreadsheetObjectData(10, 5),
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

      it("should snap the editor to the right side of the screen if the edited cell is on the right side of the editor", function () {
        var onAfterOnCellMouseDown = jasmine.createSpy('onAfterOnCellMouseDown');
        var hot = handsontable({
          data: Handsontable.helper.createSpreadsheetObjectData(10, 24),
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
          data: Handsontable.helper.createSpreadsheetObjectData(10, 5),
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
          data: Handsontable.helper.createSpreadsheetObjectData(10, 5),
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
          data: Handsontable.helper.createSpreadsheetObjectData(10, 5),
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
            data: Handsontable.helper.createSpreadsheetObjectData(10, 5),
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
            data: Handsontable.helper.createSpreadsheetObjectData(10, 5),
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

            runs(function () {
              triggerTouchEvent('touchend', editor.controls.upButton);
              waits(10);
              runs(function () {
                var newSelection = getSelected();
                expect(editor.getValue()).toEqual(getCell(newSelection[0], newSelection[1]).innerText);
              });
            });

            runs(function () {
              triggerTouchEvent('touchend', editor.controls.rightButton);
              waits(10);
              runs(function () {
                var newSelection = getSelected();
                expect(editor.getValue()).toEqual(getCell(newSelection[0], newSelection[1]).innerText);
              });
            });

            runs(function () {
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
            data: Handsontable.helper.createSpreadsheetObjectData(10, 5),
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
            editor.TEXTAREA.value = 'done!';
            triggerTouchEvent('touchend', editor.controls.leftButton);
            waits(10);
            runs(function () {
              expect(cell.innerText).toEqual('done!');
            });

            runs(function () {
              var newSelection = getSelected();
              expect(getCell(newSelection[0], newSelection[1]).innerText).toEqual('C3');
              editor.TEXTAREA.value = 'done!';
              triggerTouchEvent('touchend', editor.controls.upButton);
              waits(10);
              runs(function () {
                expect(getCell(newSelection[0], newSelection[1]).innerText).toEqual('done!');
              });
            });

            runs(function () {
              var newSelection = getSelected();
              expect(getCell(newSelection[0], newSelection[1]).innerText).toEqual('C2');
              editor.TEXTAREA.value = 'done!';
              triggerTouchEvent('touchend', editor.controls.rightButton);
              waits(10);
              runs(function () {
                expect(getCell(newSelection[0], newSelection[1]).innerText).toEqual('done!');
              });
            });

            runs(function () {
              var newSelection = getSelected();
              expect(getCell(newSelection[0], newSelection[1]).innerText).toEqual('D2');
              editor.TEXTAREA.value = 'done!';
              triggerTouchEvent('touchend', editor.controls.downButton);
              waits(10);
              runs(function () {
                expect(getCell(newSelection[0], newSelection[1]).innerText).toEqual('done!');
              });
            });

            runs(function () {
              var newSelection = getSelected();
              expect(getCell(newSelection[0], newSelection[1]).innerText).toEqual('done!');
              editor.TEXTAREA.value = 'done.';
              triggerTouchEvent('touchend', editor.controls.downButton);
              waits(10);
              runs(function () {
                expect(getCell(newSelection[0], newSelection[1]).innerText).toEqual('done.');
              });
            });

          });
        });
      });

      describe("Editor moving:", function () {
        it("should move the editor after touch-and-dragging the position handle", function () {

          var onAfterOnCellMouseDown = jasmine.createSpy('onAfterOnCellMouseDown');
          var hot = handsontable({
            data: Handsontable.helper.createSpreadsheetObjectData(10, 5),
            width: 400,
            height: 400,
            afterOnCellMouseDown: onAfterOnCellMouseDown
          });
          var targetCoords;
          var editor;

          var cell = hot.getCell(2, 3);
          mouseDoubleClick(cell); // should work fine as a doubletouch if previous tests passed

          waitsFor(function () {
            return onAfterOnCellMouseDown.calls.length > 1; // doubleclicked on a cell -> editor should open
          }, 'Mousedown on Cell event', 1000);

          runs(function () {
            editor = getActiveEditor();
            triggerTouchEvent('touchstart', editor.moveHandle);
          });
          waits(10);

          runs(function () {
            targetCoords = getCell(3, 1).getBoundingClientRect();
            var pageX = parseInt(targetCoords.left + 3, 10);
            var pageY = parseInt(targetCoords.top + 3, 10);

            triggerTouchEvent('touchmove', editor.moveHandle, pageX, pageY);
          });

          waits(10);

          runs(function () {
            expect(parseInt(editor.editorContainer.style.left, 10)).toBeLessThan(targetCoords.left);
            expect(parseInt(editor.editorContainer.style.top, 10)).toBeLessThan(targetCoords.top);
          });

        });

        it("should hide the editor's cell pointer after manually moving the editor", function () {
          var onAfterOnCellMouseDown = jasmine.createSpy('onAfterOnCellMouseDown');
          var hot = handsontable({
            data: Handsontable.helper.createSpreadsheetObjectData(10, 5),
            width: 400,
            height: 400,
            afterOnCellMouseDown: onAfterOnCellMouseDown
          });
          var targetCoords;
          var editor;

          var cell = hot.getCell(2, 3);
          mouseDoubleClick(cell); // should work fine as a doubletouch if previous tests passed

          waitsFor(function () {
            return onAfterOnCellMouseDown.calls.length > 1; // doubleclicked on a cell -> editor should open
          }, 'Mousedown on Cell event', 1000);

          runs(function () {
            editor = getActiveEditor();

            expect(Handsontable.Dom.hasClass(editor.cellPointer, 'hidden')).toEqual(false);

            triggerTouchEvent('touchstart', editor.moveHandle);
          });
          waits(10);

          runs(function () {
            targetCoords = getCell(3, 1).getBoundingClientRect();
            var pageX = parseInt(targetCoords.left + 3, 10);
            var pageY = parseInt(targetCoords.top + 3, 10);

            triggerTouchEvent('touchmove', editor.moveHandle, pageX, pageY);
          });

          waits(10);

          runs(function () {
            expect(Handsontable.Dom.hasClass(editor.cellPointer, 'hidden')).toEqual(true);
          });
        });
      });
    });
  });

