
import * as dom from './../dom.js';
import {getEditor, registerEditor} from './../editors.js';
import {TextEditor} from './textEditor.js';

var PasswordEditor = TextEditor.prototype.extend();

export {PasswordEditor};

Handsontable.editors = Handsontable.editors || {};

/**
 * @private
 * @editor
 * @class PasswordEditor
 * @dependencies TextEditor
 */
Handsontable.editors.PasswordEditor = PasswordEditor;

PasswordEditor.prototype.createElements = function () {
  TextEditor.prototype.createElements.apply(this, arguments);

  this.TEXTAREA = document.createElement('input');
  this.TEXTAREA.setAttribute('type', 'password');
  this.TEXTAREA.className = 'handsontableInput';
  this.textareaStyle = this.TEXTAREA.style;
  this.textareaStyle.width = 0;
  this.textareaStyle.height = 0;

  dom.empty(this.TEXTAREA_PARENT);
  this.TEXTAREA_PARENT.appendChild(this.TEXTAREA);
};

registerEditor('password', PasswordEditor);
