// V2.4 — network policy: an allowlist plus an audit record of every host a node contacts
// (decision #32, "allow + audit/gate risky calls").
//
// A local proxy per node run. HTTPS goes through CONNECT, so the proxy sees the host, never
// the traffic. Hosts on the allowlist are relayed; anything else gets a 403 and a line in the
// record, which becomes evidence and a risk finding.
//
// ponytail: enforced for clients that honour HTTPS_PROXY — Claude Code does, as do curl, git,
// pnpm and Node with NODE_USE_ENV_PROXY. A process that deliberately ignores the proxy is not
// blocked; that needs a network namespace with the proxy bridged in, which is the upgrade path.

import { createServer, request as httpRequest } from "node:http";
import type { Server } from "node:http";
import { connect } from "node:net";
import type { Socket } from "node:net";

export interface EgressRecord {
  host: string;
  allowed: boolean;
  count: number;
}

/**
 * What an agent needs by default: its own API, and loopback for local dev servers. Observed, not
 * guessed: an isolated `claude -p` on the subscription login contacts api.anthropic.com only
 * (2026-09-30, `weave doctor` re-checks it on every machine).
 */
export const DEFAULT_ALLOW_HOSTS = ["api.anthropic.com", "localhost", "127.0.0.1"];

/** Exact host, or `*.example.com` for the domain and every subdomain. */
export function hostAllowed(host: string, allow: string[]): boolean {
  const h = host.toLowerCase();
  return allow.some((a) =>
    a.startsWith("*.") ? h === a.slice(2).toLowerCase() || h.endsWith(a.slice(1).toLowerCase()) : h === a.toLowerCase(),
  );
}

export class EgressProxy {
  #allow: string[];
  #log = new Map<string, EgressRecord>();
  #server?: Server;
  #sockets = new Set<Socket>();

  constructor(allow: string[] = DEFAULT_ALLOW_HOSTS) {
    this.#allow = allow;
  }

  /** Every host contacted, allowed or not, with a count. */
  get records(): EgressRecord[] {
    return [...this.#log.values()].sort((a, b) => a.host.localeCompare(b.host));
  }

  #admit(host: string): boolean {
    const allowed = hostAllowed(host, this.#allow);
    const rec = this.#log.get(host) ?? { host, allowed, count: 0 };
    rec.count++;
    this.#log.set(host, rec);
    return allowed;
  }

  /** Start listening on loopback; returns the proxy URL. */
  async start(): Promise<string> {
    const server = createServer((req, res) => {
      // Plain HTTP through a proxy arrives in absolute form: GET http://host/path.
      let url: URL;
      try {
        url = new URL(req.url ?? "");
      } catch {
        res.writeHead(400).end("weave egress proxy: absolute URL required");
        return;
      }
      if (!this.#admit(url.hostname)) {
        res.writeHead(403).end(`weave egress policy: ${url.hostname} is not on the allowlist`);
        return;
      }
      const upstream = httpRequest(url, { method: req.method, headers: req.headers }, (up) => {
        res.writeHead(up.statusCode ?? 502, up.headers);
        up.pipe(res);
      });
      upstream.on("error", () => res.writeHead(502).end());
      req.pipe(upstream);
    });

    server.on("connect", (req, socket: Socket, head: Buffer) => {
      const target = req.url ?? "";
      const at = target.lastIndexOf(":");
      const host = (at > 0 ? target.slice(0, at) : target).replace(/^\[|\]$/g, "");
      const port = Number(at > 0 ? target.slice(at + 1) : 443) || 443;
      this.#sockets.add(socket);
      socket.on("error", () => socket.destroy());
      if (!this.#admit(host)) {
        socket.end("HTTP/1.1 403 Forbidden\r\n\r\n");
        return;
      }
      const upstream = connect(port, host, () => {
        socket.write("HTTP/1.1 200 Connection Established\r\n\r\n");
        if (head.length) upstream.write(head);
        upstream.pipe(socket);
        socket.pipe(upstream);
      });
      this.#sockets.add(upstream);
      upstream.on("error", () => socket.end("HTTP/1.1 502 Bad Gateway\r\n\r\n"));
    });
    server.on("connection", (s: Socket) => this.#sockets.add(s));

    await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
    this.#server = server;
    const address = server.address();
    const port = typeof address === "object" && address ? address.port : 0;
    return `http://127.0.0.1:${port}`;
  }

  async stop(): Promise<void> {
    for (const s of this.#sockets) s.destroy();
    this.#sockets.clear();
    const server = this.#server;
    this.#server = undefined;
    if (server) await new Promise<void>((resolve) => server.close(() => resolve()));
  }

  /** Environment that routes a child process's traffic through the proxy. */
  static env(url: string): Record<string, string> {
    return {
      HTTPS_PROXY: url,
      HTTP_PROXY: url,
      https_proxy: url,
      http_proxy: url,
      NODE_USE_ENV_PROXY: "1",
      NO_PROXY: "",
      no_proxy: "",
    };
  }
}

/** One-line summary for an evidence record. */
export function describeEgress(records: EgressRecord[]): string {
  if (!records.length) return "no outbound connections";
  return records.map((r) => `${r.host} ×${r.count}${r.allowed ? "" : " (blocked)"}`).join(", ");
}
