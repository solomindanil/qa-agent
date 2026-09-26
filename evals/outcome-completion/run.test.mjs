import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const runner = fileURLToPath(new URL('./run.mjs', import.meta.url));

async function launch(journalPath) {
  const child = spawn(process.execPath,
    [runner, 'v2-healthy', 'journal-note-1', journalPath],
    { stdio: ['ignore', 'pipe', 'pipe'] });
  let output = '';
  const ready = await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('launcher ready timeout')), 5000);
    child.stdout.on('data', chunk => {
      output += chunk;
      const line = output.split('\n').find(text => text.includes('"baseUrl"'));
      if (line) {
        clearTimeout(timeout);
        resolve(JSON.parse(line));
      }
    });
    child.once('error', reject);
    child.once('exit', code => reject(new Error('launcher exited before ready: ' + code)));
  });
  return { child, ready };
}

test('v2 launcher writes one create-only completed HTTP journal', async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'ocp-journal-test-'));
  const journalPath = path.join(directory, 'http-journal.json');
  try {
    const first = await launch(journalPath);
    try {
      await fetch(first.ready.baseUrl + 'notes');
      const save = await fetch(first.ready.baseUrl + 'notes', { method: 'POST' });
      assert.equal(save.status, 202);
      await fetch(first.ready.baseUrl + 'notes-state');
      await fetch(first.ready.baseUrl + 'notes');
    } finally { first.child.kill('SIGINT'); }
    const [firstExit] = await new Promise(resolve => first.child.once('exit', (...args) => resolve(args)));
    assert.equal(firstExit, 0);
    const bytes = await readFile(journalPath, 'utf8');
    const hits = JSON.parse(bytes);
    assert.deepEqual(hits.map(hit => [hit.seq, hit.method, hit.path, hit.status]), [
      [1, 'GET', '/notes', 200],
      [2, 'POST', '/notes', 202],
      [3, 'GET', '/notes-state', 200],
      [4, 'GET', '/notes', 200]
    ]);
    assert.ok(hits.every(hit => hit.noteId === 'journal-note-1' &&
      typeof hit.completedAt === 'string' && hit.completedAt >= hit.at));
    assert.equal(bytes.includes('v2-healthy'), false, 'journal does not expose fault key');

    const second = await launch(journalPath);
    second.child.kill('SIGINT');
    const [secondExit] = await new Promise(resolve => second.child.once('exit', (...args) => resolve(args)));
    assert.notEqual(secondExit, 0, 'create-only journal refuses overwrite');
    assert.equal(await readFile(journalPath, 'utf8'), bytes);
  } finally { await rm(directory, { recursive: true, force: true }); }
});
