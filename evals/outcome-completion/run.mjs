import { startOutcomeFixture } from './fixture.mjs';
import { writeFile } from 'node:fs/promises';
import path from 'node:path';

const fault = process.argv[2] ?? 'none';
const v2 = fault.startsWith('v2-');
const noteId = v2 ? process.argv[3] : undefined;
const journalPath = v2 ? process.argv[4] : undefined;
if (v2 && (!journalPath || !path.isAbsolute(journalPath)))
  throw new Error('v2 requires an absolute create-only journal path');
const fixture = await startOutcomeFixture({ fault, noteId });
console.log(JSON.stringify({ baseUrl: fixture.baseUrl, scope: 'owned-loopback-only' }));
let stopping = false;
const stop = async () => {
  if (stopping) return;
  stopping = true;
  try {
    await fixture.close();
    if (journalPath) {
      await writeFile(journalPath, JSON.stringify(fixture.hits, null, 2) + '\n',
        { flag: 'wx', mode: 0o600 });
      console.log(JSON.stringify({ status: 'stopped', journalPath }));
    }
  }
  catch (error) { console.error(error); process.exitCode = 1; }
};
process.once('SIGINT', stop);
process.once('SIGTERM', stop);
