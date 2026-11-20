import { HotTable } from '@handsontable/react-wrapper';

declare function strict(html: string): string;
declare function loose(html: string): string;

export const Grid = () => (
  <HotTable
    licenseKey="your-license-key"
    sanitizer={(content: string, source: string) => (
      source === 'innerHTML' || source === 'header' ? strict(content) : loose(content)
    )}
  />
);

export const Settings = () => (
  <HotTable
    settings={{
      licenseKey: 'your-license-key',
      sanitizer: (content: string, source: string) => {
        if (source === 'header' || source === 'password' || source === 'innerHTML') {
          return strict(content);
        }

        return loose(content);
      },
    }}
  />
);
