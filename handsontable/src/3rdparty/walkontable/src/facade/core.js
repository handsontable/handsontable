import Walkontable from '../core';

// todo refactoring (IMPORTANT): introduce facade pattern to keep backward compatibility
/**
 * @class WalkontableFacade
 * @extends Walkontable
 * @inheritDoc
 */
export default class WalkontableFacade {
  /**
   * Facades pool.
   *
   * @type {{[string]:WalkontableFacade}}
   * @private
   */
  _facades={};
  /**
   * 
   * @param {SettingsPure|Walkontable} settingsOrInstance
   */
  constructor(settingsOrInstance) {
    if(settingsOrInstance instanceof Walkontable) {
      this._wot = settingsOrInstance
    }else {
      this._initFromSettings(settingsOrInstance);
    }
  }

  _initFromSettings(settings) {
    const self = this; // while debugging, I see that `this` for settings.facade is settings.
    //todo pass not by settings, use ioc
    settings.selectionDraw = (selection, fastDraw) => { selection.draw(this, fastDraw)};
    //todo pass not by settings, use ioc
    settings.selectionsCellBorderGetter = (selection) => selection?.getCell().getBorder(this); 
    
    settings.facade = (instance) => {
      const facade = new WalkontableFacade(instance);
      
      return () => facade;
    };
    
    this._wot = new Walkontable(settings.table, settings);
  }
  
  get guid(){
    return this._wot.guid;
  }
  
  get rootDocument(){
    return this._wot.domBindings.rootDocument;
  }
  
  get rootWindow(){
    return this._wot.domBindings.rootWindow;
  }
  get wtSettings(){
    return this._wot.wtSettings; // todo create facade
  }
  get cloneSource(){
    return this._wot.cloneSource; // todo create facade
  }
  get cloneOverlay(){
    return this._wot.cloneOverlay; // todo create facade
  }
  get selections(){
    return this._wot.selections; // todo create facade
  }
  get wtViewport(){
    return this._wot.wtViewport; // todo create facade
  }
  get wtOverlays(){
    return this._wot.wtOverlays; // todo create facade
  }
  get wtTable(){
    return this._wot.wtTable; // todo create facade
  }
  get wtEvent(){
    return this._wot.wtEvent; // todo create facade
  }
  get wtScroll(){
    return this._wot.wtScroll; // todo create facade
  }
  get drawn(){
    return this._wot.drawn;
  }
  set drawn(value){
    this._wot.drawn = value;
  }
  get drawInterrupted(){
    return this._wot.drawInterrupted;
  }
  set drawInterrupted(value){
    this._wot.drawInterrupted = value;
  }
  
  draw(fastDraw = false) {
     this._wot.draw(fastDraw);
     return this;
  }

  getCell(coords, topmost = false) {
    return this._wot.getCell(coords, topmost);
  }

  scrollViewport(coords, snapToTop, snapToRight, snapToBottom, snapToLeft) {
    return this._wot.scrollViewport(coords, snapToTop, snapToRight, snapToBottom, snapToLeft);
  }

  scrollViewportHorizontally(column, snapToRight, snapToLeft) {
    return this._wot.scrollViewportHorizontally(column, snapToRight, snapToLeft) ;
  }

  scrollViewportVertically(row, snapToTop, snapToBottom) {
    return this._wot.scrollViewportVertically(row, snapToTop, snapToBottom);
  }

  getViewport() {
    return this._wot.getViewport();
  }

  getOverlayName() {
    return this._wot.getOverlayName();
  }

  exportSettingsAsClassNames() {
    return this._wot.exportSettingsAsClassNames();
  }

  update(settings, value) {
     this._wot.update(settings, value);
     return this;
  }

  getSetting(key, param1, param2, param3, param4) {
    return this._wot.getSetting(key, param1, param2, param3, param4);
  }

  hasSetting(key) {
    return this._wot.hasSetting(key);
  }

  destroy() {
    this._wot.destroy();
  }

}
