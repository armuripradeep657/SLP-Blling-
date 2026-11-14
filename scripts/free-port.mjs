#!/usr/bin/env node
/**
 * Free the app port (default 3000) before `dev` / `start` boots.
 *
 * Why this exists: leftover servers from an earlier session (a wedged
 * standalone, a dev server that died without releasing) sit on :3000.
 * `next dev` would silently drift to :3001 and the platform's health check
 * on :3000 then hits the dead listener → "problem deploying the code".
 *
 * v31: the kill no longer depends on lsof/ss alone — a pure /proc scanner
 * (scripts/port-scan.mjs) works on slim containers that ship neither binary.
 * With --keep-production (used by `dev`), a PRODUCTION standalone server
 * (deployed next-service-dist / .next/standalone) holding the port is left
 * alive and dev drifts to :3001 instead of murdering the deployed server.
 */
import { freePort } from './port-scan.mjs';

const port = String(process.env.PORT || 3000);
const keepProduction = process.argv.includes('--keep-production');

const { killed, keptProduction } = freePort(port, keepProduction);

if (keptProduction.length > 0) {
  console.log(
    `[free-port] :${port} is served by a production standalone (pid ${keptProduction.join(', ')}) — leaving it alive; dev will use the next free port`,
  );
} else if (killed.length > 0) {
  console.log(`[free-port] :${port} clear (killed stale listener pid ${killed.join(', ')})`);
} else {
  console.log(`[free-port] :${port} clear`);
}
