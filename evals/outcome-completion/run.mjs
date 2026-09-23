import { startOutcomeFixture } from './fixture.mjs';
const fixture = await startOutcomeFixture({ fault: process.argv[2] ?? 'none' });
console.log(JSON.stringify({ baseUrl: fixture.baseUrl, scope: 'owned-loopback-only' }));
let stopping = false;
const stop = async () => {
  if (stopping) return;
  stopping = true;
  try { await fixture.close(); }
  catch (error) { console.error(error); process.exitCode = 1; }
};
process.once('SIGINT', stop);
process.once('SIGTERM', stop);
