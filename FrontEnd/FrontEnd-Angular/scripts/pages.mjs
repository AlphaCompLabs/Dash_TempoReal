// Publishes the Pages build to the repo-root /docs (GitHub Pages source: main branch, /docs folder, base /Dash_TempoReal/).
import { cp, readFile, rm, writeFile } from 'node:fs/promises';

const dist = new URL('../dist/FrontEnd-Angular/browser/', import.meta.url);
const docs = new URL('../../../docs/', import.meta.url);

// ponytail: async cp on purpose: Node 22's cpSync exits 127 silently on the non-ASCII path ("Programação").
await rm(docs, { recursive: true, force: true });
await cp(dist, docs, { recursive: true });
await writeFile(new URL('.nojekyll', docs), '');
// Unknown URLs boot the app (the router sends them back to the dashboard); the fallback itself is not indexed.
const shell = await readFile(new URL('index.html', dist), 'utf8');
await writeFile(new URL('404.html', docs), shell.replace('<meta name="robots" content="index, follow">', '<meta name="robots" content="noindex, follow">'));
console.log('pages: FrontEnd/FrontEnd-Angular/dist/FrontEnd-Angular/browser -> docs/ (+ .nojekyll, 404.html)');
