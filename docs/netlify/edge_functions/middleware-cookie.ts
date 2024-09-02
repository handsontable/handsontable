export default async (req: Request, { cookies }: Context) => {

const framework = cookies.get('docs_fw') === 'react' ? 'react-data-grid' : 'javascript-data-grid';

   if (framework === 'react-data-grid') {
        console.log('cookie was set to react');
        cookies.set('docs_fw', 'react', { path: '/' });
   }
   return;
  };
