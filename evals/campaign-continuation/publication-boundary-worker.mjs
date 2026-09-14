// Source-owned process fixture: actual filesystem writer, no target or runner.
import fs from 'node:fs/promises';
import path from 'node:path';
import { syncBuiltinESMExports } from 'node:module';

const config = JSON.parse(await fs.readFile(process.argv[2], 'utf8'));
const hold = () => new Promise((resolve, reject) => {
  if (!process.send) return reject(new Error('Owned IPC missing'));
  process.send({ boundary: config.scenario }, error => { if (error) reject(error); });
  // The owning test SIGKILLs this exact child. Never synthesize termination.
  process.on('message', resolve);
});

if (config.scenario === 'accepted_mid_prepare') {
  const nativeOpen = fs.open;
  fs.open = async (...args) => {
    const handle = await nativeOpen(...args);
    if (String(args[0]).startsWith(config.storeRoot + path.sep) && String(args[0]).endsWith('/result.json')) {
      const nativeWrite = handle.writeFile.bind(handle);
      handle.writeFile = async (...writeArgs) => { const result = await nativeWrite(...writeArgs); await hold(); return result; };
    }
    return handle;
  };
  syncBuiltinESMExports();
}

const { acquireContinuationWriteAdmission, prepareContinuationDirectory,
  publishPreparedContinuationDirectory } = await import('../../components/console/src/node/campaign-continuation-files.ts');
const admission = await acquireContinuationWriteAdmission(config);
if (config.scenario === 'retry_before_start') await hold();
const prepared = await prepareContinuationDirectory({ ...config, admission,
  directoryMode: config.scenario === 'accepted_mid_prepare' ? 0o500 : 0o700,
  files: config.files.map(file => ({ ...file, bytes: Buffer.from(file.bytes, 'base64') })) });
if (config.scenario === 'start_prepared') await hold();
await publishPreparedContinuationDirectory({ ...config, admission, prepared });
await hold();
throw new Error('Boundary fixture must be killed by its original owner');
