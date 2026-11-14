/**
 * Pure-Node port scanning — no external binaries, works on any Linux
 * container (the platform's slim deploy image has no lsof/ss).
 *
 * How it works: /proc/net/tcp(6) lists every listening socket with its
 * inode; /proc/<pid>/fd/<n> symlinks point at `socket:[inode]`. Matching
 * the two gives the pid that holds the port — the same thing lsof does.
 */
import { readFileSync, readdirSync, readlinkSync } from 'node:fs';
import { execSync } from 'node:child_process';

/** pids of processes LISTENing on the given TCP port (IPv4 + IPv6) */
export function findListenerPids(port) {
  const want = Number(port);
  const inodes = new Set();
  for (const f of ['/proc/net/tcp', '/proc/net/tcp6']) {
    let raw = '';
    try {
      raw = readFileSync(f, 'utf8');
    } catch {
      continue;
    }
    for (const line of raw.split('\n').slice(1)) {
      const cols = line.trim().split(/\s+/);
      // cols: sl, local_address, rem_address, st(0A=LISTEN), ... inode
      if (cols.length < 10 || cols[3] !== '0A') continue;
      const localPort = parseInt(String(cols[1]).split(':')[1], 16);
      if (localPort === want) inodes.add(cols[9]);
    }
  }
  if (inodes.size === 0) return [];

  const pids = [];
  let dirs = [];
  try {
    dirs = readdirSync('/proc');
  } catch {
    return pids;
  }
  for (const d of dirs) {
    if (!/^\d+$/.test(d)) continue;
    let fds = [];
    try {
      fds = readdirSync(`/proc/${d}/fd`);
    } catch {
      continue; // permission or vanished
    }
    for (const fd of fds) {
      let link = '';
      try {
        link = readlinkSync(`/proc/${d}/fd/${fd}`);
      } catch {
        continue;
      }
      const m = link.match(/^socket:\[(\d+)\]$/);
      if (m && inodes.has(m[1])) {
        pids.push(Number(d));
        break;
      }
    }
  }
  return pids;
}

/** Is this pid a PRODUCTION standalone server (deployed dist or local
 *  .next/standalone)? Those own :3000 — a dev boot must not kill them. */
export function isProductionServer(pid) {
  let cwd = '';
  try {
    cwd = readlinkSync(`/proc/${pid}/cwd`);
  } catch {
    return false;
  }
  return cwd.includes('next-service-dist') || cwd.endsWith('.next/standalone');
}

/** Free the port: kill every listener (or only non-production ones with
 *  keepProduction). Returns { killed, keptProduction }. */
export function freePort(port, keepProduction = false) {
  let pids = null;
  try {
    const out = execSync(`lsof -t -i tcp:${port} -s tcp:listen 2>/dev/null`, {
      shell: '/bin/bash',
      stdio: ['ignore', 'pipe', 'ignore'],
    });
    pids = out
      .toString()
      .split('\n')
      .filter(Boolean)
      .map(Number)
      .filter(Boolean);
  } catch {
    /* lsof missing or no listener — the /proc scan below decides */
  }
  if (!pids || pids.length === 0) pids = findListenerPids(port);

  const killed = [];
  const keptProduction = [];
  for (const pid of pids) {
    if (!pid || pid === process.pid) continue;
    if (keepProduction && isProductionServer(pid)) {
      keptProduction.push(pid);
      continue;
    }
    try {
      process.kill(pid, 'SIGKILL');
      killed.push(pid);
    } catch {
      /* already gone */
    }
  }
  return { killed, keptProduction };
}
