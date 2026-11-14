#!/usr/bin/env node
/**
 * Free the app port (default 3000) before `dev` / `start` boots.
 *
 * Why this exists: leftover servers from an earlier session (a wedged
 * standalone `bun .next/standalone/server.js`, or a dev server that died
 * without releasing) sit on :3000. `next dev` would silently drift to :3001
 * and the platform's health check on :3000 then hits the dead listener →
 * "Sorry, there was a problem deploying the code." Killing the stale
 * listener first makes every boot land on :3000 healthy.
 */
import { execSync } from 'node:child_process';

const port = String(process.env.PORT || 3000);

const run = (cmd) => {
  try {
    execSync(cmd, { stdio: 'ignore', shell: '/bin/bash' });
  } catch {
    /* no listener found — that's fine */
  }
};

// primary: lsof gives the exact listener pids
run(`lsof -t -i tcp:${port} -s tcp:listen | xargs -r kill -9`);
// belt & braces: ss-based pass in case lsof missed an edge (e.g. ipv6-only bind)
run(
  `ss -tlnp | grep ":${port} " | grep -oP 'pid=\\K\\d+' | sort -u | xargs -r kill -9`,
);

console.log(`[free-port] :${port} clear`);
