// Post-build smoke check for the GitHub Pages build (npm run check, also part of build:pages). Exits 1 on any failure.
// SEO basics, demo bar + team credit present, no em dash anywhere a visitor can read, simulator invariants.
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { TrafficSim } from '../src/app/demo/traffic-sim.ts';

const SITE = 'https://alphacomplabs.github.io/Dash_TempoReal/';
const root = new URL('../dist/FrontEnd-Angular/browser/', import.meta.url);
const fails = [];
const must = (ok, msg) => ok || fails.push(msg);
const read = (p) => readFileSync(new URL(p, root), 'utf8');

const h = read('index.html');
const meta = (re) => h.match(re)?.[1] ?? '';
const title = meta(/<title>([^<]*)<\/title>/);
const desc = meta(/<meta name="description" content="([^"]*)"/);
must(title && title.length <= 160, `title missing or > 160 chars (${title.length})`);
must(desc.length >= 70 && desc.length <= 160, `description must be 70-160 chars (${desc.length})`);
must(h.includes(`<link rel="canonical" href="${SITE}">`), 'canonical mismatch');
must(h.includes('<base href="/Dash_TempoReal/">'), 'base href is not /Dash_TempoReal/ (build with --configuration production,pages)');
must(h.includes(`content="${SITE}og.png"`) && existsSync(new URL('og.png', root)), 'og:image missing');
must(h.includes('lang="pt-BR"'), 'html lang must be pt-BR');
try {
  const graph = JSON.parse(meta(/<script type="application\/ld\+json">(.*?)<\/script>/s))['@graph'];
  for (const type of ['WebApplication', 'SoftwareSourceCode']) {
    const node = graph.find((n) => n['@type'] === type);
    must(Array.isArray(node?.creator) && node.creator.length > 1, `${type}: creator must list the team`);
    must(node?.creator?.some((p) => p['@id'] === 'https://g2portfolio.grovicdata.com/#person'), `${type}: Gustavo @id missing`);
  }
} catch { fails.push('invalid JSON-LD'); }
must(read('sitemap.xml').includes(`<loc>${SITE}</loc>`), 'sitemap.xml missing the site URL');
must(read('robots.txt').includes(`${SITE}sitemap.xml`), 'robots.txt missing the sitemap');

const walk = (dir) => readdirSync(dir).flatMap((n) => {
  const p = new URL(n, dir);
  return statSync(p).isDirectory() ? walk(new URL(`${n}/`, dir)) : [p];
});
const js = [];
for (const f of walk(root)) {
  const name = f.pathname.split('/browser/')[1];
  if (!/\.(html|js|css|json|txt|xml|webmanifest)$/.test(name) || name.endsWith('3rdpartylicenses.txt')) continue;
  // esbuild writes non-ASCII as \xNN / \uNNNN in JS: decode so both the em dash scan and the text checks see it.
  const text = readFileSync(f, 'utf8')
    .replace(/\\x([0-9a-f]{2})/gi, (_, c) => String.fromCharCode(parseInt(c, 16)))
    .replace(/\\u\{?([0-9a-f]{4,5})\}?/gi, (_, c) => String.fromCodePoint(parseInt(c, 16)));
  must(!text.includes(String.fromCharCode(0x2014)), `em dash in ${name}`);
  if (name.endsWith('.js')) js.push(text);
}
const bundle = js.join('\n');
must(bundle.includes('Demo estática para portfólio: dados simulados no navegador.'), 'demo bar missing (DEMO flag off?)');
must(bundle.includes('https://g2portfolio.grovicdata.com/projetos/dash-tempo-real/'), 'portfolio link missing or without trailing slash');
must(bundle.includes('https://github.com/AlphaCompLabs/Dash_TempoReal'), 'repo link missing');
must(bundle.includes('Gustavo Martins Gripaldi'), 'team credit missing');

// Simulator invariants: per-protocol bytes add up to the client totals, 3..10 clients, 60 s of history.
const sim = new TrafficSim();
for (let i = 0; i < 500; i++) {
  sim.step(i * 5000);
  const clients = sim.clients();
  must(clients.length >= 3 && clients.length <= 10, `sim: ${clients.length} clients at step ${i}`);
  for (const c of clients) {
    const p = sim.protocols(c.ip) ?? [];
    must(p.length > 0 && p.every((x) => x.y === x.inbound + x.outbound && x.inbound >= 0 && x.outbound >= 0), `sim: bad protocols for ${c.ip}`);
    must(p.reduce((s, x) => s + x.inbound, 0) === c.inbound && p.reduce((s, x) => s + x.outbound, 0) === c.outbound, `sim: totals mismatch ${c.ip}`);
  }
  must(sim.history().length === Math.min(i + 1, 12), 'sim: history length');
}
must(sim.protocols('10.9.9.9') === null, 'sim: unknown ip must 404');

if (fails.length) { console.error(`check: ${fails.length} problem(s)\n- ` + [...new Set(fails)].join('\n- ')); process.exit(1); }
console.log('check: SEO OK, demo bar + team credit OK, no em dash, simulator OK');
