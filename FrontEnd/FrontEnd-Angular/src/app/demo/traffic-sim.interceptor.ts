// Answers the dashboard's API calls from the in-browser simulator (GitHub Pages demo only, see app.config.ts).
// Services and components keep calling the real URLs; nothing leaves the browser.
import { HttpErrorResponse, HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { SERVER_IP, TrafficSim } from './traffic-sim';

const sim = new TrafficSim();

export const trafficSimInterceptor: HttpInterceptorFn = (req, next) => {
  const route = req.method === 'GET' ? req.url.match(/\/api\/([^?#]+)/)?.[1] : undefined;
  const ok = (body: unknown) => of(new HttpResponse({ status: 200, body, url: req.url }));
  if (route === 'traffic') { sim.step(); return ok(sim.clients()); }
  if (route === 'traffic/history') return ok(sim.history());
  if (route === 'traffic/protocols/summary') return ok(sim.summary());
  if (route === 'server-info') return ok({ server_ip: SERVER_IP });
  const ip = route?.match(/^traffic\/([^/]+)\/protocols$/)?.[1];
  if (ip) {
    const data = sim.protocols(decodeURIComponent(ip));
    return data ? ok(data) : throwError(() => new HttpErrorResponse({ status: 404, statusText: 'Not Found', url: req.url }));
  }
  return next(req);
};
