import fs from 'node:fs';
const re = /<loc>(.*?)<\/loc>/g;

if (!fs.existsSync('.vuepress/dist/docs/sitemap.xml')) {
    console.log('sitemap.xml not found');
    fs.writeFileSync('netlify/netlify/redirects.mjs', 'export default []');
}

const sitemap = fs.readFileSync('.vuepress/dist/docs/sitemap.xml', 'utf8');
const all  = sitemap.matchAll(re);

const frameworks = {};

/** 
 * Parse sitemap.xml and extract frameworks and paths object 
 */
for (const match of all) {
    const blocks = match[1].split('/');
    const framework = blocks[4];
    let path = blocks.slice(5).join('/');
    path = path.endsWith('/') ? path.slice(0, -1) : path;
    frameworks[framework] = frameworks[framework] || [];
    frameworks[framework].push(path);
}

/* find common elements (the intersection) between all frameworks 
* this if to exclude paths that are not common between all frameworks
*/

const combinedArr = Object.values(frameworks);
const result  = combinedArr
    .flatMap(([...values]) => values)
    .filter((value, index, coll) => (coll.indexOf(value) === index) && combinedArr.every(
        (values) => values.includes(value)
    ));


fs.writeFileSync('netlify/netlify/redirects.mjs', `export default ${JSON.stringify(result, null, 2)};`);

    
