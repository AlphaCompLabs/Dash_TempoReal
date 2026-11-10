import { DefaultUrlSerializer, UrlTree } from '@angular/router';

/**
 * GitHub Pages serves every prerendered route as `<path>/index.html`, so `/projetos/x` answers with a 301 to
 * `/projetos/x/`. Writing the slash in every router-generated link avoids that redirect (crawl budget, latency,
 * clean shared URLs). Parsing is unchanged: the router already matches with or without the slash.
 */
export class TrailingSlashSerializer extends DefaultUrlSerializer {
  override serialize(tree: UrlTree): string {
    const [, path, rest] = super.serialize(tree).match(/^([^?#]*)(.*)$/)!;
    const done = path.endsWith('/') || /\.[a-z0-9]+$/i.test(path);
    return (done ? path : `${path}/`) + rest;
  }
}
