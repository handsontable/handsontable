import { HotTable } from '@handsontable/react-wrapper';
import { registerAllModules } from 'handsontable/registry';
import 'handsontable/styles/handsontable.css';
import 'handsontable/styles/ht-theme-main.css';

// register Handsontable's modules
registerAllModules();

const ExampleComponent = () => {
  const data = [
    {
      title:
        '<a href="https://www.amazon.com/Professional-JavaScript-Developers-Nicholas-Zakas/dp/1118026691">Professional JavaScript for Web Developers</a>',
      description:
        'This <a href="https://bit.ly/sM1bDf">book</a> provides a developer-level introduction along with more advanced and useful features of <b>JavaScript</b>.',
      comments: 'I would rate it ★★★★☆',
      cover:
        '{{$basePath}}/img/examples/professional-javascript-developers-nicholas-zakas.jpg',
    },
    {
      title:
        '<a href="https://shop.oreilly.com/product/9780596517748.do">JavaScript: The Good Parts</a>',
      description:
        'This book provides a developer-level introduction along with <b>more advanced</b> and useful features of JavaScript.',
      comments: 'This is the book about JavaScript',
      cover: '{{$basePath}}/img/examples/javascript-the-good-parts.jpg',
    },
    {
      title:
        '<a href="https://shop.oreilly.com/product/9780596805531.do">JavaScript: The Definitive Guide</a>',
      description:
        '<em>JavaScript: The Definitive Guide</em> provides a thorough description of the core <b>JavaScript</b> language and both the legacy and standard DOMs implemented in web browsers.',
      comments:
        'I\'ve never actually read it, but the <a href="https://shop.oreilly.com/product/9780596805531.do">comments</a> are highly <strong>positive</strong>.',
      cover: '{{$basePath}}/img/examples/javascript-the-definitive-guide.jpg',
    },
  ];

  function safeHtmlRenderer(
    _instance,
    td,
    _row,
    _col,
    _prop,
    value,
    _cellProperties
  ) {
    // WARNING: Be sure you only allow certain HTML tags to avoid XSS threats.
    // Sanitize the "value" before passing it to the innerHTML property.
    td.innerHTML = value;
  }

  function coverRenderer(
    _instance,
    td,
    _row,
    _col,
    _prop,
    value,
    _cellProperties
  ) {
    const img = document.createElement('img');

    img.src = value;
    img.addEventListener('mousedown', (event) => {
      event.preventDefault();
    });
    td.innerText = '';
    td.appendChild(img);

    return td;
  }

  return (
    <HotTable
      data={data}
      colWidths={[200, 200, 200, 80]}
      colHeaders={['Title', 'Description', 'Comments', 'Cover']}
      height="auto"
      columns={[
        { data: 'title', renderer: 'html' },
        { data: 'description', renderer: 'html' },
        { data: 'comments', renderer: safeHtmlRenderer },
        { data: 'cover', renderer: coverRenderer },
      ]}
      autoWrapRow={true}
      autoWrapCol={true}
      licenseKey="non-commercial-and-evaluation"
    />
  );
};

export default ExampleComponent;
