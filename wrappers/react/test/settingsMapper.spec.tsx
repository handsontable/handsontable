import { SettingsMapper } from '../src/settingsMapper';
import { HotTableProps } from '../src/types';

describe('Settings mapper unit tests', () => {
  describe('getSettings', () => {
    it('should return a valid settings object, when provided an object with settings (including the hooks prefixed with "on")', () => {
      const settingsMapper = new SettingsMapper();

      const initial: HotTableProps = {
        width: 300,
        height: 300,
        contextMenu: true,
        columns: [
          {label: 'first label'},
          {label: 'second label'}
        ],
        afterChange: () => {
          return 'works!';
        },
        afterRender: () => {
          return 'also works!';
        }
      };
      const result: {[key: string]: any} = SettingsMapper.getSettings(initial);

      expect(!!result.width && !!result.height && !!result.contextMenu && !!result.columns && !!result.afterChange && !!result.afterRender).toEqual(true);
      expect(Object.keys(initial).length).toEqual(Object.keys(result).length);
      expect(result.width).toEqual(300);
      expect(result.height).toEqual(300);
      expect(result.contextMenu).toEqual(true);
      expect(JSON.stringify(initial.columns)).toEqual(JSON.stringify(result.columns));
      expect(JSON.stringify(result.afterChange)).toEqual(JSON.stringify(initial.afterChange));
      expect(JSON.stringify(result.afterRender)).toEqual(JSON.stringify(initial.afterRender));
      expect(result.afterChange()).toEqual('works!');
      expect(result.afterRender()).toEqual('also works!');
    });

    it('should return a valid settings object, when provided an object with settings inside a "settings" property (including the hooks prefixed with "on")', () => {
      const settingsMapper = new SettingsMapper();
      const initial = {
        settings: {
          width: 300,
          height: 300,
          contextMenu: true,
          columns: [
            {label: 'first label'},
            {label: 'second label'}
          ],
          afterChange: () => {
            return 'works!';
          },
          afterRender: () => {
            return 'also works!';
          }
        }
      };
      const result: {[key: string]: any} = SettingsMapper.getSettings(initial);

      expect(!!result.width && !!result.height && !!result.contextMenu && !!result.columns && !!result.afterChange && !!result.afterRender).toEqual(true);
      expect(Object.keys(initial.settings).length).toEqual(Object.keys(result).length);
      expect(result.width).toEqual(300);
      expect(result.height).toEqual(300);
      expect(result.contextMenu).toEqual(true);
      expect(JSON.stringify(initial.settings.columns)).toEqual(JSON.stringify(result.columns));
      expect(JSON.stringify(result.afterChange)).toEqual(JSON.stringify(initial.settings.afterChange));
      expect(JSON.stringify(result.afterRender)).toEqual(JSON.stringify(initial.settings.afterRender));
      expect(result.afterChange()).toEqual('works!');
      expect(result.afterRender()).toEqual('also works!');
      expect(result.settings).toEqual(void 0);
    });

    it('should return a valid settings object, when provided an object with settings inside a "settings" property as well as individually (including the hooks prefixed with "on")', () => {
      const settingsMapper = new SettingsMapper();
      const initial = {
        width: 300,
        height: 300,
        settings: {
          contextMenu: true,
          columns: [
            {label: 'first label'},
            {label: 'second label'}
          ],
          afterChange: () => {
            return 'works!';
          },
          afterRender: () => {
            return 'also works!';
          }
        }
      };
      const result: {[key: string]: any} = SettingsMapper.getSettings(initial);

      expect(!!result.width && !!result.height && !!result.contextMenu && !!result.columns && !!result.afterChange && !!result.afterRender).toEqual(true);
      expect(Object.keys(initial.settings).length + Object.keys(initial).length - 1).toEqual(Object.keys(result).length);
      expect(result.width).toEqual(300);
      expect(result.height).toEqual(300);
      expect(result.contextMenu).toEqual(true);
      expect(JSON.stringify(initial.settings.columns)).toEqual(JSON.stringify(result.columns));
      expect(JSON.stringify(result.afterChange)).toEqual(JSON.stringify(initial.settings.afterChange));
      expect(JSON.stringify(result.afterRender)).toEqual(JSON.stringify(initial.settings.afterRender));
      expect(result.afterChange()).toEqual('works!');
      expect(result.afterRender()).toEqual('also works!');
      expect(result.settings).toEqual(void 0);
    });
  });
});
