#!/usr/bin/env node
/**
 * Dev boot with port arbitration.
 *
 * The container's boot step runs `bun run dev` — and `next dev -p 3000`
 * CRASHES (EADDRINUSE) when the port is taken; it does not auto-bump. After
 * freeing stale listeners (never killing a production standalone — the
 * deployed next-service-dist must survive), this picks the first free port:
 * :3000 normally, :3001+ when a production server owns :3000 — so dev and
 * the deployed server can coexist in the deploy container.
 */
import { spawn } from 'node:child_process';
import { freePort, findListenerPids } from './port-scan.mjs';

const port = String(process.env.PORT || 3000);
const { keptProduction } = freePort(port, true);

let listenPort = port;
if (keptProduction.length > 0) {
  const base = Number(port);
  listenPort = '';
  for (let cand = base + 1; cand <= base + 5; cand++) {
    if (findListenerPids(String(cand)).length === 0) {
      listenPort = String(cand);
      break;
    }
  }
  if (!listenPort) listenPort = String(base + 1); // everything busy — let next dev report it
  console.log(`[dev-boot] production standalone owns :${port} — dev moves to :${listenPort}`);
}

const child = spawn(`next dev -p ${listenPort}`, {
  stdio: 'inherit',
  shell: true,
  env: { ...process.env, NEXT_DEV_DIST: '.next-dev' },
});
child.on('exit', (code) => process.exit(code ?? 0));
