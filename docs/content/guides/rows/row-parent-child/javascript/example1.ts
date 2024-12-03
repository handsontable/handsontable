import Handsontable from 'handsontable';
import 'handsontable/styles/handsontable.css';
import 'handsontable/styles/ht-theme-main.css';

interface Album {
  title: string;
  artist: string;
  label: string;
}

interface MusicAward {
  category: string;
  artist?: string | null;
  title?: string | null;
  label?: string | null;
  __children: Album[];
}

const sourceDataObject: MusicAward[] = [
  {
    category: 'Best Rock Performance',
    artist: null,
    title: null,
    label: null,
    __children: [
      {
        title: "Don't Wanna Fight",
        artist: 'Alabama Shakes',
        label: 'ATO Records',
      },
      {
        title: 'What Kind Of Man',
        artist: 'Florence & The Machine',
        label: 'Republic',
      },
      {
        title: 'Something From Nothing',
        artist: 'Foo Fighters',
        label: 'RCA Records',
      },
      {
        title: "Ex's & Oh's",
        artist: 'Elle King',
        label: 'RCA Records',
      },
      {
        title: 'Moaning Lisa Smile',
        artist: 'Wolf Alice',
        label: 'RCA Records/Dirty Hit',
      },
    ],
  },
  {
    category: 'Best Metal Performance',
    __children: [
      {
        title: 'Cirice',
        artist: 'Ghost',
        label: 'Loma Vista Recordings',
      },
      {
        title: 'Identity',
        artist: 'August Burns Red',
        label: 'Fearless Records',
      },
      {
        title: '512',
        artist: 'Lamb Of God',
        label: 'Epic Records',
      },
      {
        title: 'Thank You',
        artist: 'Sevendust',
        label: '7Bros Records',
      },
      {
        title: 'Custer',
        artist: 'Slipknot',
        label: 'Roadrunner Records',
      },
    ],
  },
  {
    category: 'Best Rock Song',
    __children: [
      {
        title: "Don't Wanna Fight",
        artist: 'Alabama Shakes',
        label: 'ATO Records',
      },
      {
        title: "Ex's & Oh's",
        artist: 'Elle King',
        label: 'RCA Records',
      },
      {
        title: 'Hold Back The River',
        artist: 'James Bay',
        label: 'Republic',
      },
      {
        title: 'Lydia',
        artist: 'Highly Suspect',
        label: '300 Entertainment',
      },
      {
        title: 'What Kind Of Man',
        artist: 'Florence & The Machine',
        label: 'Republic',
      },
    ],
  },
  {
    category: 'Best Rock Album',
    __children: [
      {
        title: 'Drones',
        artist: 'Muse',
        label: 'Warner Bros. Records',
      },
      {
        title: 'Chaos And The Calm',
        artist: 'James Bay',
        label: 'Republic',
      },
      {
        title: 'Kintsugi',
        artist: 'Death Cab For Cutie',
        label: 'Atlantic',
      },
      {
        title: 'Mister Asylum',
        artist: 'Highly Suspect',
        label: '300 Entertainment',
      },
      {
        title: '.5: The Gray Chapter',
        artist: 'Slipknot',
        label: 'Roadrunner Records',
      },
    ],
  },
];

const container = document.querySelector('#example1')!;

new Handsontable(container, {
  data: sourceDataObject,
  preventOverflow: 'horizontal',
  rowHeaders: true,
  colHeaders: ['Category', 'Artist', 'Title', 'Album', 'Label'],
  nestedRows: true,
  contextMenu: true,
  bindRowsWithHeaders: true,
  autoWrapRow: true,
  autoWrapCol: true,
  height: 'auto',
  licenseKey: 'non-commercial-and-evaluation',
});
