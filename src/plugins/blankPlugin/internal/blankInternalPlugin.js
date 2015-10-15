// You need to import the BasePlugin class in order to inherit from it.
import BasePlugin from './../_base';
import {registerPlugin} from './../../plugins';

/**
 * @plugin BlankInternalPlugin
 *
 * @description
 * Blank plugin template. It needs to inherit from the BasePlugin class.
 */
class BlankInternalPlugin extends BasePlugin {

  // The argument passed to the constructor is the currently processed Handsontable instance object.
  constructor(hotInstance) {

    // The super constructor from the BasePlugin class assigns the hotInstance object to this.hot.
    super(hotInstance);

    // The constructor should contain the initialization of all public properties of the class, along with a call to the super method.
    /**
     * yourProperty description.
     *
     * @type {String}
     */
    this.yourProperty = '';
    /**
     * anotherProperty description.
     * @type {Array}
     */
    this.anotherProperty = [];
  }

  /**
   * Checks if the plugin is enabled in the settings.
   */
  isEnabled() {
    return !!this.hot.getSettings().blankInternalPlugin;
  }

  /**
   * The enablePlugin method is triggered on the beforeInit hook. It should contain your initial plugin setup, along with
   * the hook connections.
   * Note, that this method is run only if the statement in the isEnabled method is true.
   */
  enablePlugin() {
    this.yourProperty = 'Your Value';

    // Add all your plugin hooks here. It's a good idea to make use of the arrow functions to keep the context consistent.
    this.hot.addHook('afterChange', (changes, source) => this.onAfterChange(changes, source));

    // The super method assigns the this.enabled property to true, which can be later used to check if plugin is already enabled.
    super.enablePlugin();
  }

  /**
   * The disablePlugin method is used to temporarily disable the plugin. Reset all of your classes properties to their default values here.
   */
  disablePlugin() {
    this.yourProperty = '';
    this.anotherProperty = [];

    // The super method takes care of clearing the hook connections and assigning the 'false' value to the 'this.enabled' property.
    super.disablePlugin();
  }

  /**
   * The updatePlugin method is called on the afterUpdateSettings hook (unless the updateSettings method turned the plugin off).
   * It should contain all the stuff your plugin needs to do to work properly after the Handsontable instance settings were modified.
   */
  updatePlugin() {

    // Sometimes disabling and re-enabling the plugin should do the trick.
    this.disablePlugin();
    this.enablePlugin();

    super.updatePlugin();
  }

  /**
   * The afterChange hook callback.
   *
   * @param {Array} changes Array of changes.
   * @param {String} source Describes the source of the change.
   */
  onAfterChange(changes, source) {
    // afterChange callback goes here.
  }

  /**
   * The destroy method should de-assign all of your properties.
   */
  destroy() {
    this.yourProperty = null;
    this.anotherProperty = null;

    // The super method takes care of de-assigning the event callbacks, plugin hooks and clearing the 'this.hot' property.
    super.destroy();
  }
}

export {BlankInternalPlugin};

// You need to register your plugin in order to use it within Handsontable.
registerPlugin('blankInternalPlugin', BlankInternalPlugin);
