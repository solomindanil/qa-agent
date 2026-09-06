import { fileURLToPath } from 'node:url';
import { assembleWorkspace } from './lib/source-workspace.mjs';

try {
  const [mode, ...args] = process.argv.slice(2);
  if (!['restore', 'verify'].includes(mode) ||
      !(args.length === 0 || (args.length === 2 && args[0] === '--root'))) {
    throw Object.assign(new Error('Usage: workspace.mjs restore|verify [--root ABSOLUTE_WORKSPACE]'), { code: 'INVALID_ARGUMENT' });
  }
  const root = args.length ? args[1] : fileURLToPath(new URL('..', import.meta.url));
  const result = await assembleWorkspace({ root, mode });
  process.stdout.write(`${JSON.stringify(result)}\n`);
} catch (error) {
  process.stderr.write(`${JSON.stringify({ code: error.code ?? 'SOURCE_ERROR', message: error.message })}\n`);
  process.exitCode = 1;
}
