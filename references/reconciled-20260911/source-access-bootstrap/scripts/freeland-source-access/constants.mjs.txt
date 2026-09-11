import { homedir } from 'node:os';
import { join } from 'node:path';

export const SOURCE_ACCESS = Object.freeze({
  schemaVersion: 1,
  repository: 'nuanu-ai/freeland_app',
  repositorySsh: 'git@github.com:nuanu-ai/freeland_app.git',
  title: 'FreelandQA read-only source checkout',
  baseDir: join(homedir(), '.config', 'freelandqa', 'source-access'),
  privateBasename: 'freeland_app_readonly_ed25519',
  publicBasename: 'freeland_app_readonly_ed25519.pub',
  handoffBasename: 'freeland_app_readonly_admin_handoff.txt',
  attestationBasename: 'freeland_app_readonly_attestation.json',
  directoryMode: 0o700,
  fileMode: 0o600,
  localTimeoutMs: 10_000,
  networkTimeoutMs: 30_000,
  maxOutputBytes: 1024 * 1024,
});
