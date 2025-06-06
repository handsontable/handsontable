import Handsontable from 'handsontable';
import 'handsontable/styles/handsontable.css';
import 'handsontable/styles/ht-theme-main.css';
import 'handsontable/styles/ht-theme-horizon.css';

// constants.js
export const data = [
  [false, 'Tagcat', 'United Kingdom', 'Classic Vest', '11/10/2025', '01-2331942', true, '172', 2, 2],
  [true, 'Zoomzone', 'Indonesia', 'Cycling Cap', '03/05/2025', '88-2768633', true, '188', 6, 2],
  [true, 'Meeveo', 'United States', 'Full-Finger Gloves', '27/03/2025', '51-6775945', true, '162', 1, 3],
  [false, 'Buzzdog', 'Philippines', 'HL Mountain Frame', '29/08/2025', '44-4028109', true, '133', 7, 1],
  [true, 'Katz', 'India', 'Half-Finger Gloves', '02/10/2025', '08-2758492', true, '87', 1, 3],
  [false, 'Jaxbean', 'China', 'HL Road Frame', '28/09/2025', '84-3557705', false, '26', 8, 1],
  [false, 'Wikido', 'Brazil', 'HL Touring Frame', '24/06/2025', '20-9397637', false, '110', 4, 1],
  [false, 'Browsedrive', 'United States', 'LL Mountain Frame', '13/03/2025', '36-0079556', true, '50', 4, 4],
  [false, 'Twinder', 'United Kingdom', 'LL Road Frame', '06/04/2025', '41-1489542', false, '160', 6, 1],
  [false, 'Jetwire', 'China', 'LL Touring Frame', '01/02/2025', '37-1531629', true, '30', 8, 5],
  [false, 'Chatterpoint', 'China', 'Long-Sleeve Logo Jersey', '14/07/2025', '25-5083429', true, '39', 7, 2],
  [false, 'Twinder', 'Egypt', "Men's Bib-Shorts", '31/08/2025', '04-4281278', false, '96', 6, 1],
  [false, 'Midel', 'United States', "Men's Sports Shorts", '27/06/2025', '55-1711908', true, '108', 10, 3],
  [false, 'Yodo', 'India', 'ML Mountain Frame', '16/03/2025', '58-8360815', false, '46', 1, 1],
  [false, 'Camido', 'Russia', 'ML Mountain Frame-W', '13/09/2025', '10-3786104', true, '97', 8, 3],
  [false, 'Eire', 'Thailand', 'ML Road Frame', '10/04/2025', '45-1186054', true, '161', 1, 4],
  [false, 'Vinte', 'United Kingdom', 'ML Road Frame-W', '22/01/2025', '62-6202742', true, '58', 4, 3],
  [false, 'Twitterlist', 'China', 'Mountain Bike Socks', '09/11/2025', '88-9646223', true, '92', 8, 3],
  [false, 'Eidel', 'Bangladesh', 'Mountain-100', '19/09/2025', '45-5588112', true, '5', 6, 5],
  [false, 'Trunyx', 'Nigeria', 'Mountain-200', '09/03/2025', '66-6271819', true, '158', 4, 1],
  [false, 'Katz', 'Turkey', 'Mountain-300', '05/03/2025', '38-9245023', false, '121', 5, 4],
  [false, 'Kaymbo', 'United States', 'Mountain-400-W', '24/12/2025', '44-5916927', false, '61', 5, 4],
  [false, 'Ozu', 'Pakistan', 'Mountain-500', '13/06/2025', '31-5449914', true, '155', 2, 2],
  [false, 'Rhynyx', 'India', 'Racing Socks', '05/12/2025', '19-9413869', true, '162', 2, 4],
  [false, 'Flashset', 'Iran', 'Road-150', '14/12/2025', '25-9807605', false, '46', 7, 1],
  [false, 'Yata', 'Congo (Kinshasa)', 'Road-250', '12/06/2025', '74-4291983', true, '47', 4, 4],
  [false, 'Brainlounge', 'Vietnam', 'Road-350-W', '10/03/2025', '83-0980643', true, '104', 2, 3],
  [false, 'Babblestorm', 'United States', 'Road-450', '10/10/2025', '19-2878430', true, '101', 6, 4],
  [false, 'Youspan', 'Brazil', 'Road-550-W', '16/12/2025', '19-1838230', true, '150', 10, 3],
  [false, 'Nlounge', 'China', 'Road-650', '31/10/2025', '32-2267938', true, '42', 4, 2],
  [false, 'Twinte', 'India', 'Road-750', '17/08/2025', '79-2821972', true, '144', 9, 3],
  [false, 'Oyonder', 'United Kingdom', 'Short-Sleeve Classic Jersey', '04/12/2025', '46-6597557', true, '195', 4, 1],
  [false, 'Gigabox', 'Pakistan', 'Sport-100', '03/02/2025', '15-1793960', true, '199', 4, 4],
  [false, 'Livetube', 'France', 'Touring-1000', '16/05/2025', '86-0811003', true, '110', 4, 5],
  [false, 'Voomm', 'United Kingdom', 'Touring-2000', '15/07/2025', '95-3068680', true, '51', 4, 4],
  [false, 'Voonyx', 'China', 'Touring-3000', '27/11/2025', '35-3085360', false, '69', 2, 5],
  [false, 'Zoombeat', 'United States', "Women's Mountain Shorts", '03/11/2025', '56-8673088', false, '53', 2, 3],
  [false, 'Roomm', 'China', "Women's Tights", '16/03/2025', '76-0085918', true, '168', 1, 1],
  [false, 'Leenti', 'China', 'Mountain-400', '16/05/2025', '03-0893276', false, '58', 1, 4],
  [false, 'Jetpulse', 'United States', 'Road-550', '08/02/2025', '79-9013306', true, '152', 9, 3],
  [false, 'Katz', 'Peru', 'Road-350', '15/02/2025', '55-7799920', true, '66', 4, 2],
  [false, 'Cogidoo', 'India', 'LL Mountain Front Wheel', '04/06/2025', '07-0881122', false, '112', 9, 2],
  [false, 'Divavu', 'Colombia', 'Touring Rear Wheel', '24/02/2025', '58-6157387', true, '50', 10, 4],
  [false, 'Mydeo', 'China', 'Touring Front Wheel', '07/12/2025', '12-2810010', false, '31', 3, 5],
  [false, 'Browsebug', 'Japan', 'ML Mountain Front Wheel', '14/01/2025', '64-9249984', true, '132', 5, 5],
  [false, 'Layo', 'China', 'HL Mountain Front Wheel', '24/04/2025', '45-0739652', true, '45', 1, 5],
  [false, 'Snaptags', 'United Kingdom', 'LL Touring Handlebars', '06/08/2025', '09-5712761', true, '197', 4, 2],
  [false, 'Cogilith', 'China', 'HL Touring Handlebars', '31/05/2025', '01-7345008', true, '190', 4, 3],
  [false, 'Reallinks', 'United Kingdom', 'LL Road Front Wheel', '14/05/2025', '62-1065350', true, '184', 3, 4],
  [false, 'Quaxo', 'United States', 'ML Road Front Wheel', '23/03/2025', '44-7241323', true, '169', 3, 4],
  [false, 'Devify', 'China', 'HL Road Front Wheel', '12/12/2025', '52-0295699', false, '152', 4, 4],
  [false, 'Youopia', 'Angola', 'LL Mountain Handlebars', '01/04/2025', '52-2650922', false, '182', 6, 4],
  [false, 'Ainyx', 'China', 'Touring Pedal', '27/02/2025', '48-3618525', true, '141', 6, 1],
  [false, 'Browsetype', 'Malaysia', 'ML Mountain Handlebars', '28/04/2025', '51-8893923', true, '169', 7, 1],
  [false, 'Muxo', 'China', 'HL Mountain Handlebars', '22/08/2025', '68-5911361', false, '39', 7, 1],
  [false, 'Bubbletube', 'China', 'LL Road Handlebars', '04/10/2025', '41-5880042', true, '71', 8, 3],
  [false, 'Fadeo', 'Vietnam', 'ML Road Handlebars', '23/04/2025', '90-5913983', true, '148', 10, 3],
  [false, 'Yadel', 'United Kingdom', 'HL Road Handlebars', '18/04/2025', '92-0960699', true, '116', 8, 1],
  [false, 'Blognation', 'China', 'LL Headset', '10/01/2025', '06-9493898', true, '96', 10, 1],
  [false, 'Devpoint', 'China', 'ML Headset', '25/12/2025', '69-5878565', true, '35', 4, 2],
  [false, 'Aibox', 'United Kingdom', 'HL Headset', '18/03/2025', '13-1133017', true, '16', 8, 2],
  [false, 'Brightdog', 'China', 'LL Mountain Pedal', '11/09/2025', '39-6530433', true, '194', 2, 5],
  [false, 'Gabcube', 'Nigeria', 'ML Mountain Pedal', '22/04/2025', '96-6860388', true, '24', 1, 3],
  [false, 'Muxo', 'China', 'HL Mountain Pedal', '05/06/2025', '30-0356137', true, '170', 4, 4],
  [false, 'Tambee', 'China', 'ML Touring Seat/Saddle', '22/02/2025', '93-9058255', true, '184', 9, 5],
  [false, 'Cogilith', 'India', 'LL Touring Seat/Saddle', '06/04/2025', '82-9268909', false, '153', 10, 4],
  [false, 'Dynabox', 'Hong Kong', 'HL Touring Seat/Saddle', '10/01/2025', '20-6913815', false, '88', 10, 1],
  [false, 'Shuffledrive', 'Sudan', 'LL Road Pedal', '16/09/2025', '08-8238817', true, '57', 9, 2],
  [false, 'Fivechat', 'China', 'ML Road Pedal', '26/08/2025', '44-7370350', false, '62', 4, 1],
  [false, 'Meembee', 'United States', 'HL Road Pedal', '27/12/2025', '01-3525949', true, '123', 2, 4],
  [false, 'Dynazzy', 'United Kingdom', 'LL Mountain Seat/Saddle 1', '15/12/2025', '04-2414623', true, '77', 10, 5],
  [false, 'Eare', 'China', 'ML Mountain Seat/Saddle 1', '04/04/2025', '15-1917509', false, '199', 9, 4],
  [false, 'Yozio', 'China', 'HL Mountain Seat/Saddle 1', '15/03/2025', '06-2526845', true, '149', 8, 2],
  [false, 'Quinu', "Xi'an", '425-777-7829', '22/02/2025', '83-1713558', false, '191', 9, 5],
  [false, 'Jazzy', 'United Kingdom', 'ML Road Seat/Saddle 1', '07/08/2025', '00-8892524', true, '150', 10, 2],
  [false, 'Thoughtsphere', 'China', 'HL Road Seat/Saddle 1', '28/11/2025', '39-5538991', true, '130', 7, 3],
  [false, 'Leenti', 'China', 'ML Road Rear Wheel', '29/12/2025', '06-9002973', true, '179', 1, 2],
  [false, 'Quaxo', 'United Kingdom', 'HL Road Rear Wheel', '06/09/2025', '73-6104901', true, '98', 5, 3],
  [false, 'Tanoodle', 'Chile', 'LL Mountain Seat/Saddle 2', '24/05/2025', '68-7384479', true, '175', 2, 3],
  [false, 'Feednation', 'China', 'ML Mountain Seat/Saddle 2', '21/11/2025', '26-7757763', true, '11', 1, 3],
  [false, 'Kayveo', 'China', 'HL Mountain Seat/Saddle 2', '21/06/2025', '07-4873562', false, '184', 7, 4],
  [false, 'Meevee', 'Saudi Arabia', 'LL Road Seat/Saddle 1', '16/11/2025', '46-5819554', false, '27', 9, 3],
  [false, 'Twitterworks', 'China', 'ML Road Seat/Saddle 2', '19/04/2025', '01-2666826', true, '186', 3, 2],
  [false, 'Wikizz', 'Tanzania', 'HL Road Seat/Saddle 2', '08/03/2025', '54-7090503', true, '20', 3, 3],
  [false, 'Yoveo', 'United States', 'LL Mountain Tire', '14/10/2025', '78-7658520', false, '153', 2, 1],
  [false, 'Yakidoo', 'China', 'ML Mountain Tire', '12/10/2025', '23-9926318', true, '161', 8, 5],
  [false, 'Oyope', 'China', 'HL Mountain Tire', '20/09/2025', '20-0179517', true, '98', 10, 5],
  [false, 'Skipstorm', 'United States', 'LL Road Tire', '01/10/2025', '02-9543343', true, '30', 7, 3],
  [false, 'Minyx', 'United States', 'ML Road Tire', '07/07/2025', '98-3938169', true, '73', 10, 2],
  [false, 'Miboo', 'China', 'HL Road Tire', '25/07/2025', '68-5197934', true, '158', 9, 1],
  [false, 'Realfire', 'United States', 'Touring Tire', '27/08/2025', '39-8260460', true, '122', 5, 2],
  [false, 'Shufflester', 'China', 'Mountain Tire Tube', '08/06/2025', '45-9776170', true, '33', 2, 4],
  [false, 'Ntag', 'China', 'Road Tire Tube', '06/12/2025', '45-0858451', true, '107', 6, 2],
  [false, 'Jabberbean', 'United States', 'Touring Tire Tube', '26/04/2025', '15-4247305', true, '15', 1, 2],
  [false, 'Thoughtblab', 'China', 'LL Bottom Bracket', '21/05/2025', '15-8534931', true, '168', 5, 2],
  [false, 'Jabbertype', 'China', 'Classic Vest', '25/07/2025', '23-1251557', true, '135', 4, 2],
  [false, 'Buzzshare', 'United Kingdom', 'Cycling Cap', '07/07/2025', '86-5920601', true, '11', 1, 4],
  [false, 'Roodel', 'United States', 'Full-Finger Gloves', '13/01/2025', '48-1055459', true, '41', 6, 4],
  [false, 'Zoovu', 'China', 'Half-Finger Gloves', '03/06/2025', '12-7842022', true, '144', 6, 1],
  [false, 'Photofeed', 'China', 'HL Mountain Frame', '14/07/2025', '94-5088099', true, '106', 1, 4],
];
const example = document.getElementById('exampleTheme');
const hotInstance = new Handsontable(example, {
  data,
  height: 450,
  colWidths: [180, 220, 140, 120, 120, 120, 140],
  colHeaders: ['Company Name', 'Name', 'Sell date', 'In stock', 'Quantity', 'Order ID', 'Country'],
  contextMenu: [
    'cut',
    'copy',
    '---------',
    'row_above',
    'row_below',
    'remove_row',
    '---------',
    'alignment',
    'make_read_only',
    'clear_column',
  ],
  columns: [
    {
      data: 1,
      type: 'text',
      headerClassName: 'htLeft',
    },
    {
      data: 3,
      type: 'text',
      headerClassName: 'htLeft',
    },
    {
      data: 4,
      type: 'date',
      allowInvalid: false,
      dateFormat: 'DD/MM/YYYY',
      headerClassName: 'htLeft',
    },
    {
      data: 6,
      type: 'checkbox',
      className: 'htCenter',
      headerClassName: 'htLeft',
    },
    {
      data: 7,
      type: 'numeric',
      headerClassName: 'htLeft',
    },
    {
      data: 5,
      type: 'text',
      headerClassName: 'htLeft',
    },
    {
      data: 2,
      type: 'text',
      headerClassName: 'htLeft',
    },
  ],
  dropdownMenu: true,
  hiddenColumns: {
    indicators: true,
  },
  multiColumnSorting: true,
  filters: true,
  rowHeaders: true,
  manualRowMove: true,
  headerClassName: 'htLeft',
  autoWrapRow: true,
  autoWrapCol: true,
  manualRowResize: true,
  manualColumnResize: true,
  navigableHeaders: true,
  licenseKey: 'non-commercial-and-evaluation',
});

const colorBox = document.getElementById('colorBox');
const themeSelect = document.getElementById('themeSelect');
const currentTheme = document.querySelector('html')?.classList.contains('theme-dark')
  ? 'ht-theme-horizon-dark'
  : 'ht-theme-horizon';

const setTheme = (theme) => {
  colorBox.classList.value = `color-box ${theme}`;
  hotInstance.useTheme(theme === 'ht-no-theme' ? undefined : theme);
};

themeSelect.value = currentTheme;
setTheme(currentTheme);
themeSelect.addEventListener('change', (event) => {
  const themeName = event.target.value;

  setTheme(themeName);
});
