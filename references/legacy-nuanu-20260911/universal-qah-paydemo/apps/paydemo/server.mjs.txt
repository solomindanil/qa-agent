import { createServer } from 'node:http';
import { createHash, randomUUID } from 'node:crypto';
import { readdirSync, readFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

const port = Number.parseInt(process.env.PAYDEMO_PORT ?? '4173', 10);
const variant = process.env.PAYDEMO_VARIANT ?? 'fixed-v2';
const environmentId = process.env.PAYDEMO_ENVIRONMENT_ID ?? `local-${port}`;
const instanceNonce = process.env.PAYDEMO_INSTANCE_NONCE ?? randomUUID();
const plans = new Map([['starter', { amountCents: 1000 }]]);
const paymentsByRun = new Map();
const buildManifest = JSON.parse(readFileSync('dist/paydemo/build-manifest.json', 'utf8'));
if (buildManifest.variant !== variant) {
  throw new Error(
    `PayDemo build identity mismatch: runtime variant "${variant}" does not match manifest variant "${buildManifest.variant}"`,
  );
}
if (!/^[a-z0-9][a-z0-9-]{0,63}$/.test(environmentId)) {
  throw new Error('PayDemo runtime identity mismatch: environment id is malformed');
}
if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(instanceNonce)) {
  throw new Error('PayDemo runtime identity mismatch: instance nonce is malformed');
}
if (
  buildManifest.app !== 'PayDemo'
  || !/^(?:[0-9a-f]{40}|[0-9a-f]{64})$/.test(buildManifest.commit)
  || !/^sha256:[0-9a-f]{64}$/.test(buildManifest.sourceHash)
  || !/^sha256:[0-9a-f]{64}$/.test(buildManifest.contentHash)
) {
  throw new Error('PayDemo build identity mismatch: manifest is incomplete or malformed');
}

const safeFileList = (files, prefix) => (
  Array.isArray(files)
  && files.length > 0
  && new Set(files).size === files.length
  && files.every((file) => (
    typeof file === 'string'
    && file.startsWith(prefix)
    && !file.startsWith('/')
    && !file.split('/').includes('..')
  ))
  && files.every((file, index) => index === 0 || files[index - 1] < file)
);

if (!safeFileList(buildManifest.sourceFiles, 'apps/paydemo/')) {
  throw new Error('PayDemo build identity mismatch: manifest contains an unsafe source file set');
}
if (!safeFileList(buildManifest.contentFiles, 'public/')) {
  throw new Error('PayDemo build identity mismatch: manifest contains an unsafe distributed file set');
}

const listFiles = (directory) => readdirSync(directory, { withFileTypes: true })
  .flatMap((entry) => {
    const absolutePath = join(directory, entry.name);
    if (entry.isDirectory()) return listFiles(absolutePath);
    if (entry.isFile()) return [absolutePath];
    throw new Error(`PayDemo build identity mismatch: non-regular file ${absolutePath}`);
  });

const canonicalTreeHash = (baseDirectory, files) => {
  const hash = createHash('sha256');
  for (const file of files) {
    hash.update(file);
    hash.update('\0');
    hash.update(readFileSync(join(baseDirectory, file)));
    hash.update('\0');
  }
  return `sha256:${hash.digest('hex')}`;
};

const actualSourceFiles = listFiles('apps/paydemo')
  .map((file) => relative('.', file).split(sep).join('/'))
  .sort();
if (JSON.stringify(actualSourceFiles) !== JSON.stringify(buildManifest.sourceFiles)) {
  throw new Error('PayDemo build identity mismatch: source file set does not match manifest');
}
const sourceHash = createHash('sha256');
for (const sourceFile of buildManifest.sourceFiles) {
  sourceHash.update(sourceFile);
  sourceHash.update('\0');
  sourceHash.update(readFileSync(sourceFile));
  sourceHash.update('\0');
}
const actualSourceHash = `sha256:${sourceHash.digest('hex')}`;
if (actualSourceHash !== buildManifest.sourceHash) {
  throw new Error(
    `PayDemo build identity mismatch: source content hash "${actualSourceHash}" does not match manifest "${buildManifest.sourceHash}"`,
  );
}

const distributedRoot = 'dist/paydemo';
const actualContentFiles = listFiles(join(distributedRoot, 'public'))
  .map((file) => relative(distributedRoot, file).split(sep).join('/'))
  .sort();
if (JSON.stringify(actualContentFiles) !== JSON.stringify(buildManifest.contentFiles)) {
  throw new Error('PayDemo build identity mismatch: distributed file set does not match manifest');
}
const actualContentHash = canonicalTreeHash(distributedRoot, buildManifest.contentFiles);
if (actualContentHash !== buildManifest.contentHash) {
  throw new Error(
    `PayDemo build identity mismatch: distributed content hash "${actualContentHash}" does not match manifest "${buildManifest.contentHash}"`,
  );
}
const buildInfo = {
  app: buildManifest.app,
  variant: buildManifest.variant,
  commit: buildManifest.commit,
  contentHash: buildManifest.contentHash,
  environmentId,
  instanceNonce,
};
const staticFiles = new Map([
  ['/', {
    bytes: readFileSync('dist/paydemo/public/index.html'),
    type: 'text/html; charset=utf-8',
  }],
  ['/app.mjs', {
    bytes: readFileSync('dist/paydemo/public/app.mjs'),
    type: 'text/javascript; charset=utf-8',
  }],
  ['/styles.css', {
    bytes: readFileSync('dist/paydemo/public/styles.css'),
    type: 'text/css; charset=utf-8',
  }],
]);

const sendJson = (response, status, body) => {
  const bytes = Buffer.from(JSON.stringify(body));
  response.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'content-length': String(bytes.byteLength),
  });
  response.end(bytes);
};

const readJson = async (request) => {
  const chunks = [];
  for await (const chunk of request) chunks.push(chunk);
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
};

const validRunId = (runId) => typeof runId === 'string' && /^[a-z0-9-]{1,64}$/.test(runId);

const server = createServer(async (request, response) => {
  const pathname = new URL(request.url, 'http://127.0.0.1').pathname;
  const staticFile = request.method === 'GET' ? staticFiles.get(pathname) : undefined;
  if (staticFile) {
    response.writeHead(200, { 'content-type': staticFile.type });
    return response.end(staticFile.bytes);
  }

  if (request.method === 'GET' && request.url === '/build-info') {
    return sendJson(response, 200, buildInfo);
  }

  if (request.method === 'POST' && request.url === '/api/reset') {
    const { runId } = await readJson(request);
    if (!validRunId(runId)) return sendJson(response, 400, { error: 'INVALID_RUN_ID' });
    paymentsByRun.delete(runId);
    return sendJson(response, 200, { runId, reset: true });
  }

  if (request.method === 'POST' && request.url === '/api/checkout') {
    const { runId, planId, amountCents, paymentMethod } = await readJson(request);
    const plan = plans.get(planId);
    const idempotencyKey = request.headers['idempotency-key'];
    if (!validRunId(runId)) return sendJson(response, 400, { error: 'INVALID_RUN_ID' });
    if (!plan) return sendJson(response, 404, { error: 'UNKNOWN_PLAN' });
    if (variant === 'fixed-v2' && amountCents !== plan.amountCents) {
      return sendJson(response, 422, { error: 'AMOUNT_MISMATCH' });
    }
    if (!['card', 'bank'].includes(paymentMethod)) return sendJson(response, 422, { error: 'INVALID_PAYMENT_METHOD' });
    if (variant === 'fixed-v2' && typeof idempotencyKey !== 'string') {
      return sendJson(response, 400, { error: 'MISSING_IDEMPOTENCY_KEY' });
    }

    const run = paymentsByRun.get(runId) ?? { payments: [], idempotency: new Map() };
    if (variant === 'fixed-v2' && run.idempotency.has(idempotencyKey)) {
      return sendJson(response, 200, run.idempotency.get(idempotencyKey));
    }
    const payment = {
      paymentId: `demo-${runId}-${run.payments.length + 1}`,
      amountCents: variant === 'buggy-v1' ? amountCents : plan.amountCents,
      paymentMethod,
    };
    run.payments.push(payment);
    if (variant === 'fixed-v2') run.idempotency.set(idempotencyKey, payment);
    paymentsByRun.set(runId, run);
    return sendJson(response, 201, payment);
  }

  return sendJson(response, 404, { error: 'NOT_FOUND' });
});

server.listen(port, '127.0.0.1');
