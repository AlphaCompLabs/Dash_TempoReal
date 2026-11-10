// In-browser stand-in for Network_analyzer + BackEnd_RESTful, used only by the GitHub Pages demo (DEMO = true).
// Same JSON shapes as the FastAPI endpoints in BackEnd_RESTful/main.py. One step() = one 5 s aggregation window,
// driven by the dashboard's own polling (TrafficDataService asks for /api/traffic every 5 s).
// No imports on purpose: scripts/sim-check.ts runs this file directly with Node.

export interface SimClient { ip: string; inbound: number; outbound: number; }
export interface SimProtocol { name: string; inbound: number; outbound: number; y: number; }
export interface SimPoint { timestamp: number; total_inbound: number; total_outbound: number; }

// Labels produced by Network_analyzer/util.py (friendly_proto). Second value: share of the bytes that are download.
const PROTOCOLS: [string, number][] = [
  ['HTTP_ALT', 0.85], ['FTP_ALT', 0.55], ['FTP-DATA', 0.9], ['HTTPS', 0.8], ['DNS', 0.5], ['ICMP', 0.5],
];
const MIN_ACTIVE = 3;
const MAX_ACTIVE = 10;
const HISTORY_LENGTH = 12; // backend keeps 12 windows = 60 s

interface Host {
  ip: string;
  active: boolean;
  rate: number; // bytes per window at level 1
  level: number; // slow random walk, makes a client heat up and cool down
  mix: number[]; // weight per PROTOCOLS entry (0 = not used)
  window: Record<string, { in: number; out: number }>;
}

export const SERVER_IP = '10.0.0.1';

export class TrafficSim {
  private hosts: Host[] = [];
  private points: SimPoint[] = [];
  private rnd: () => number;

  constructor(rnd: () => number = Math.random) {
    this.rnd = rnd;
    for (let i = 2; i <= 14; i++) this.hosts.push(this.fresh(`10.0.0.${i}`, i <= 7));
  }

  /** Advances one aggregation window. */
  step(now: number = Date.now()): void {
    let active = this.hosts.filter((h) => h.active).length;
    for (const h of this.hosts) {
      if (h.active && active > MIN_ACTIVE && this.rnd() < 0.02) { h.active = false; active--; }
      else if (!h.active && active < MAX_ACTIVE && this.rnd() < 0.04) { Object.assign(h, this.fresh(h.ip, true)); active++; }
    }
    let totalIn = 0;
    let totalOut = 0;
    for (const h of this.hosts) {
      h.window = {};
      if (!h.active) continue;
      h.level = Math.min(4, Math.max(0.2, h.level * (0.75 + this.rnd() * 0.5)));
      const burst = this.rnd() < 0.08 ? 4 + this.rnd() * 6 : 1; // a file download over FTP now and then
      h.mix.forEach((w, i) => {
        if (!w) return;
        const [name, inShare] = PROTOCOLS[i];
        const total = h.rate * h.level * w * (0.6 + this.rnd() * 0.8) * (name === 'FTP-DATA' ? burst : 1);
        const share = Math.min(0.98, Math.max(0.02, inShare + (this.rnd() - 0.5) * 0.2));
        const bytesIn = Math.round(total * share);
        const bytesOut = Math.round(total) - bytesIn;
        h.window[name] = { in: bytesIn, out: bytesOut };
        totalIn += bytesIn;
        totalOut += bytesOut;
      });
    }
    this.points.push({ timestamp: Math.floor(now / 1000), total_inbound: totalIn, total_outbound: totalOut });
    if (this.points.length > HISTORY_LENGTH) this.points.shift();
  }

  /** GET /api/traffic */
  clients(): SimClient[] {
    return this.hosts.filter((h) => h.active && Object.keys(h.window).length).map((h) => {
      const v = Object.values(h.window);
      return { ip: h.ip, inbound: v.reduce((s, p) => s + p.in, 0), outbound: v.reduce((s, p) => s + p.out, 0) };
    });
  }

  /** GET /api/traffic/history */
  history(): SimPoint[] {
    return this.points.map((p) => ({ ...p }));
  }

  /** GET /api/traffic/{ip}/protocols (null = 404, client not connected) */
  protocols(ip: string): SimProtocol[] | null {
    const h = this.hosts.find((x) => x.ip === ip && x.active && Object.keys(x.window).length);
    if (!h) return null;
    return Object.entries(h.window).map(([name, p]) => ({ name, inbound: p.in, outbound: p.out, y: p.in + p.out }));
  }

  /** GET /api/traffic/protocols/summary */
  summary(): { name: string; y: number }[] {
    const sum: Record<string, number> = {};
    for (const h of this.hosts) for (const [name, p] of Object.entries(h.window)) sum[name] = (sum[name] ?? 0) + p.in + p.out;
    return Object.entries(sum).map(([name, y]) => ({ name, y }));
  }

  private fresh(ip: string, active: boolean): Host {
    // 2 to 4 protocols per client; HTTP_ALT or FTP_ALT always present (the demo servers on 8001 and 2121).
    const mix = PROTOCOLS.map((_, i) => (i < 2 || this.rnd() < 0.4 ? 0.2 + this.rnd() : 0));
    if (this.rnd() < 0.5) mix[this.rnd() < 0.5 ? 0 : 1] = 0;
    return { ip, active, rate: 40_000 + this.rnd() * 1_500_000, level: 0.6 + this.rnd(), mix, window: {} };
  }
}
