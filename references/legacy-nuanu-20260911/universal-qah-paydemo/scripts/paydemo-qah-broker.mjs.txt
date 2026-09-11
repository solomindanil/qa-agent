#!/usr/bin/env node

import { execFile as execFileCallback } from 'node:child_process';
import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import {
  lstat,
  mkdir,
  open,
  readFile,
  realpath,
  rename,
} from 'node:fs/promises';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { dirname, isAbsolute, join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

const execFile = promisify(execFileCallback);
const SCRIPT_DIRECTORY = dirname(fileURLToPath(import.meta.url));
const ENVIRONMENT_SCRIPT = join(SCRIPT_DIRECTORY, 'paydemo-qah-environment.mjs');
const DEFAULT_REPOSITORY = 'https://github.com/solomindanil/NuanuFlowQA.git';
const DEFAULT_STATE_ROOT = join(tmpdir(), 'paydemo-qah-environments');
const DEFAULT_BROKER_PORT = 43180;
const DEFAULT_PRODUCT_PORT = 4173;
const MAX_REQUEST_BYTES = 32 * 1024;
const MAX_RESPONSE_BYTES = 128 * 1024;
const MAX_HEADER_BYTES = 8 * 1024;
const MAX_IDEMPOTENCY_ENTRIES = 256;
const REQUEST_TIMEOUT_MS = 5_000;
const CHILD_MAX_BUFFER_BYTES = 128 * 1024;
const UUID_V4 = /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/;
const SHA_256 = /^sha256:[a-f0-9]{64}$/;
const IDENTIFIER = /^[a-z0-9][a-z0-9-]{0,63}$/;
const IDEMPOTENCY_KEY = /^[A-Za-z0-9_-]{16,128}$/;
const ALLOWED_VARIANTS = new Set(['buggy-v1', 'fixed-v2']);
const ALLOWED_CLEANUP_ITEM_KEYS = new Set([
  'cleanup_clean_environment',
  'cleanup_risk_environment',
]);
const CHILD_ENV_ALLOWLIST = [
  'PATH',
  'LANG',
  'LC_ALL',
  'LC_CTYPE',
  'TMPDIR',
  'TMP',
  'TEMP',
  'SYSTEMROOT',
  'WINDIR',
  'COMSPEC',
  'PATHEXT',
];

class PublicError extends Error {
  constructor(status, code, publicMessage = code) {
    super(publicMessage);
    this.name = 'PublicError';
    this.status = status;
    this.code = code;
    this.publicMessage = publicMessage;
  }
}

class HarnessOutputError extends Error {
  constructor() {
    super('trusted environment CLI returned an invalid closed-contract envelope');
    this.name = 'HarnessOutputError';
  }
}

function configurationError(message) {
  throw new PublicError(500, 'INVALID_CONFIGURATION', message);
}

function exactKeys(value, expected) {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return false;
  const actual = Object.keys(value).sort();
  return actual.length === expected.length
    && expected.every((key, index) => actual[index] === key);
}

function stableJson(value) {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map((entry) => stableJson(entry)).join(',')}]`;
  return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableJson(value[key])}`).join(',')}}`;
}

function sha256(value) {
  return `sha256:${createHash('sha256').update(value).digest('hex')}`;
}

function safeEqual(left, right) {
  const leftBytes = Buffer.from(left);
  const rightBytes = Buffer.from(right);
  return leftBytes.length === rightBytes.length && timingSafeEqual(leftBytes, rightBytes);
}

function parseInteger(value, name, { minimum, maximum, allowZero = false }) {
  const text = String(value);
  if (!/^[0-9]+$/.test(text)) configurationError(`${name} must be an integer`);
  const parsed = Number.parseInt(text, 10);
  if (allowZero && parsed === 0) return 0;
  if (parsed < minimum || parsed > maximum) {
    configurationError(`${name} must be between ${minimum} and ${maximum}`);
  }
  return parsed;
}

function normalizeRepository(value) {
  let url;
  try {
    url = new URL(value);
  } catch {
    configurationError('repository must be one exact HTTPS Git URL');
  }
  if (
    url.protocol !== 'https:'
    || !url.hostname
    || url.username
    || url.password
    || url.search
    || url.hash
    || !url.pathname.endsWith('.git')
    || url.pathname.includes('//')
  ) {
    configurationError('repository must be one exact HTTPS Git URL without credentials, query, or fragment');
  }
  return url.href;
}

function normalizeAbsolutePath(value, name) {
  if (typeof value !== 'string' || value.length === 0) configurationError(`${name} must be configured`);
  const normalized = resolve(value);
  if (!isAbsolute(normalized) || normalized === resolve(sep)) {
    configurationError(`${name} must be a safe absolute path below the filesystem root`);
  }
  return normalized;
}

function validateConfiguration(input, { allowEphemeralBrokerPort = true } = {}) {
  if (input?.host !== '127.0.0.1') {
    configurationError('broker host must be the literal loopback address 127.0.0.1');
  }
  const port = parseInteger(input.port, 'broker port', {
    minimum: 1024,
    maximum: 65535,
    allowZero: allowEphemeralBrokerPort,
  });
  const productPort = parseInteger(input.productPort, 'product port', {
    minimum: 1024,
    maximum: 65535,
  });
  if (port !== 0 && port === productPort) configurationError('broker port and product port must differ');
  if (!IDENTIFIER.test(input.campaignId ?? '')) configurationError('campaign id has an invalid format');
  if (!IDENTIFIER.test(input.environmentId ?? '')) configurationError('environment id has an invalid format');
  if (!/^[a-f0-9]{40}$/.test(input.commit ?? '')) {
    configurationError('commit must be an exact 40-character lowercase Git SHA');
  }
  if (!ALLOWED_VARIANTS.has(input.variant)) configurationError('variant is not supported');
  if (!ALLOWED_CLEANUP_ITEM_KEYS.has(input.cleanupItemKey)) {
    configurationError('cleanup item key is not one of the two closed Process steps');
  }
  const stateRoot = normalizeAbsolutePath(input.stateRoot, 'state root');
  const tokenFile = normalizeAbsolutePath(input.tokenFile, 'token file');
  const curlConfig = normalizeAbsolutePath(input.curlConfig, 'curl config');
  if (tokenFile === curlConfig) configurationError('token file and curl config must be distinct');
  return Object.freeze({
    host: input.host,
    port,
    campaignId: input.campaignId,
    environmentId: input.environmentId,
    repository: normalizeRepository(input.repository),
    commit: input.commit,
    variant: input.variant,
    productPort,
    cleanupItemKey: input.cleanupItemKey,
    stateRoot,
    tokenFile,
    curlConfig,
    configuredToken: input.configuredToken,
  });
}

function parseCliFlags(argv) {
  if (argv.length % 2 !== 0) configurationError('broker options must be flag/value pairs');
  const flags = new Map();
  for (let index = 0; index < argv.length; index += 2) {
    const name = argv[index];
    const value = argv[index + 1];
    if (!['--token-file', '--curl-config'].includes(name) || flags.has(name) || value.startsWith('--')) {
      configurationError('broker received an unsupported or duplicate option');
    }
    flags.set(name, value);
  }
  return flags;
}

export function configurationFromEnvironment(environment = process.env, argv = []) {
  const host = environment.PAYDEMO_QAH_BROKER_HOST ?? '127.0.0.1';
  if (host !== '127.0.0.1') {
    configurationError('broker host must be the literal loopback address 127.0.0.1');
  }
  const flags = parseCliFlags(argv);
  const stateRoot = resolve(environment.PAYDEMO_QAH_BROKER_STATE_ROOT ?? DEFAULT_STATE_ROOT);
  return validateConfiguration({
    host,
    port: environment.PAYDEMO_QAH_BROKER_PORT ?? DEFAULT_BROKER_PORT,
    campaignId: environment.PAYDEMO_QAH_BROKER_CAMPAIGN_ID ?? 'paydemo-demo',
    environmentId: environment.PAYDEMO_QAH_BROKER_ENVIRONMENT_ID ?? 'paydemo-demo',
    repository: environment.PAYDEMO_QAH_BROKER_REPOSITORY ?? DEFAULT_REPOSITORY,
    commit: environment.PAYDEMO_QAH_BROKER_COMMIT,
    variant: environment.PAYDEMO_QAH_BROKER_VARIANT ?? 'buggy-v1',
    productPort: environment.PAYDEMO_QAH_BROKER_PRODUCT_PORT ?? DEFAULT_PRODUCT_PORT,
    cleanupItemKey: environment.PAYDEMO_QAH_BROKER_CLEANUP_ITEM_KEY,
    stateRoot,
    tokenFile: flags.get('--token-file')
      ?? environment.PAYDEMO_QAH_BROKER_TOKEN_FILE
      ?? join(stateRoot, '.broker', 'token'),
    curlConfig: flags.get('--curl-config')
      ?? environment.PAYDEMO_QAH_BROKER_CURL_CONFIG
      ?? join(stateRoot, '.broker', 'curl.conf'),
    configuredToken: environment.PAYDEMO_QAH_BROKER_TOKEN,
  }, { allowEphemeralBrokerPort: false });
}

async function secureFileStatus(path) {
  try {
    const details = await lstat(path);
    if (!details.isFile() || details.isSymbolicLink() || (details.mode & 0o077) !== 0) {
      configurationError('credential file must be a regular owner-only file');
    }
    if (typeof process.getuid === 'function' && details.uid !== process.getuid()) {
      configurationError('credential file must be owned by the broker user');
    }
    return details;
  } catch (error) {
    if (error?.code === 'ENOENT') return undefined;
    throw error;
  }
}

async function writeExclusive(path, contents) {
  const handle = await open(path, 'wx', 0o600);
  try {
    await handle.writeFile(contents, 'utf8');
    await handle.sync();
  } finally {
    await handle.close();
  }
}

async function loadOrCreateToken(path, configuredToken) {
  await mkdir(dirname(path), { recursive: true, mode: 0o700 });
  const existing = await secureFileStatus(path);
  if (existing) {
    const token = (await readFile(path, 'utf8')).trim();
    if (!/^[a-f0-9]{64}$/.test(token)) configurationError('token file has an invalid format');
    if (configuredToken !== undefined && !safeEqual(token, configuredToken)) {
      configurationError('configured token does not match the token file');
    }
    return token;
  }
  const token = configuredToken ?? randomBytes(32).toString('hex');
  if (!/^[a-f0-9]{64}$/.test(token)) configurationError('configured token has an invalid format');
  try {
    await writeExclusive(path, `${token}\n`);
    return token;
  } catch (error) {
    if (error?.code !== 'EEXIST') throw error;
    return loadOrCreateToken(path, configuredToken);
  }
}

async function writeCurlConfig(path, token) {
  await mkdir(dirname(path), { recursive: true, mode: 0o700 });
  await secureFileStatus(path);
  const temporary = `${path}.${process.pid}.${randomBytes(8).toString('hex')}.tmp`;
  const contents = [
    `header = "Authorization: Bearer ${token}"`,
    'header = "Content-Type: application/json"',
    'noproxy = "127.0.0.1"',
    'proto = "=http"',
    'proto-redir = "-all"',
    'fail-with-body',
    'silent',
    'show-error',
    '',
  ].join('\n');
  await writeExclusive(temporary, contents);
  await rename(temporary, path);
}

function isolatedChildEnvironment(repository) {
  const environment = {};
  for (const name of CHILD_ENV_ALLOWLIST) {
    if (typeof process.env[name] === 'string') environment[name] = process.env[name];
  }
  environment.NUANU_QA_ALLOWED_REPOSITORIES = repository;
  return environment;
}

function prepareArguments(configuration) {
  return [
    'prepare',
    '--repo-url', configuration.repository,
    '--commit', configuration.commit,
    '--variant', configuration.variant,
    '--port', String(configuration.productPort),
    '--environment-id', configuration.environmentId,
    '--state-root', configuration.stateRoot,
    '--item-key', 'prepare_environment',
  ];
}

function cleanupArguments(configuration, pidFile, itemKey = configuration.cleanupItemKey) {
  return [
    'cleanup',
    '--environment-id', configuration.environmentId,
    '--state-root', configuration.stateRoot,
    '--pid-file', pidFile,
    '--item-key', itemKey,
  ];
}

async function makeInvocation(configuration, mode, pidFile, itemKey) {
  const script = await realpath(ENVIRONMENT_SCRIPT);
  const command = await realpath(process.execPath);
  const args = mode === 'prepare'
    ? prepareArguments(configuration)
    : cleanupArguments(configuration, pidFile, itemKey);
  return {
    mode,
    command,
    script,
    args,
    options: {
      encoding: 'utf8',
      env: isolatedChildEnvironment(configuration.repository),
      maxBuffer: CHILD_MAX_BUFFER_BYTES,
      shell: false,
      windowsHide: true,
    },
  };
}

async function executeInvocation(invocation) {
  const result = await execFile(
    invocation.command,
    [invocation.script, ...invocation.args],
    invocation.options,
  );
  if (Buffer.byteLength(result.stdout, 'utf8') > MAX_RESPONSE_BYTES) {
    throw new HarnessOutputError();
  }
  return result.stdout;
}

function expectedPidFile(configuration) {
  return join(configuration.stateRoot, configuration.environmentId, 'server.pid');
}

function parseEnvironmentOutput(output) {
  if (typeof output === 'string') {
    if (Buffer.byteLength(output, 'utf8') > MAX_RESPONSE_BYTES) throw new HarnessOutputError();
    try {
      return JSON.parse(output);
    } catch {
      throw new HarnessOutputError();
    }
  }
  if (output === null || typeof output !== 'object' || Array.isArray(output)) {
    throw new HarnessOutputError();
  }
  try {
    if (Buffer.byteLength(JSON.stringify(output), 'utf8') > MAX_RESPONSE_BYTES) {
      throw new HarnessOutputError();
    }
  } catch (error) {
    if (error instanceof HarnessOutputError) throw error;
    throw new HarnessOutputError();
  }
  return output;
}

function validateCommonEnvelope(envelope, itemKey) {
  if (!exactKeys(envelope, ['artifact_outputs', 'item'])) throw new HarnessOutputError();
  if (!exactKeys(envelope.item, ['artifacts', 'data', 'description', 'key'])) {
    throw new HarnessOutputError();
  }
  if (
    envelope.item.key !== itemKey
    || typeof envelope.item.description !== 'string'
    || envelope.item.description.length === 0
    || envelope.item.description.length > 1_024
    || !exactKeys(envelope.item.artifacts, [])
    || !exactKeys(envelope.artifact_outputs, ['item.artifacts.environment_manifest'])
    || envelope.artifact_outputs['item.artifacts.environment_manifest'] !== null
    || Buffer.byteLength(JSON.stringify(envelope), 'utf8') > MAX_RESPONSE_BYTES
  ) {
    throw new HarnessOutputError();
  }
}

function validatePrepareEnvelope(envelope, configuration) {
  validateCommonEnvelope(envelope, 'prepare_environment');
  const data = envelope.item.data;
  if (
    !exactKeys(data, [
      'base_url',
      'commit',
      'content_hash',
      'environment_id',
      'environment_status',
      'instance_nonce',
      'pid_file',
      'variant',
    ])
    || data.environment_status !== 'READY'
    || data.environment_id !== configuration.environmentId
    || !UUID_V4.test(data.instance_nonce)
    || data.base_url !== `http://127.0.0.1:${configuration.productPort}`
    || data.variant !== configuration.variant
    || data.commit !== configuration.commit
    || !SHA_256.test(data.content_hash)
    || data.pid_file !== expectedPidFile(configuration)
  ) {
    throw new HarnessOutputError();
  }
  return envelope;
}

function validateCleanupEnvelope(
  envelope,
  configuration,
  pidFile,
  itemKey = configuration.cleanupItemKey,
) {
  validateCommonEnvelope(envelope, itemKey);
  const data = envelope.item.data;
  if (
    !exactKeys(data, ['environment_id', 'environment_status', 'pid_file'])
    || !['STOPPED', 'ABSENT'].includes(data.environment_status)
    || data.environment_id !== configuration.environmentId
    || data.pid_file !== pidFile
  ) {
    throw new HarnessOutputError();
  }
  return envelope;
}

function rawHeaderValues(request, expectedName) {
  const values = [];
  for (let index = 0; index < request.rawHeaders.length; index += 2) {
    if (request.rawHeaders[index].toLowerCase() === expectedName) values.push(request.rawHeaders[index + 1]);
  }
  return values;
}

function sendJson(response, status, payload) {
  if (response.destroyed || response.writableEnded) return;
  const body = JSON.stringify(payload);
  if (Buffer.byteLength(body, 'utf8') > MAX_RESPONSE_BYTES) {
    sendJson(response, 500, { error: { code: 'INTERNAL_ERROR' } });
    return;
  }
  response.writeHead(status, {
    'cache-control': 'no-store',
    connection: 'close',
    'content-length': Buffer.byteLength(body, 'utf8'),
    'content-type': 'application/json',
    'x-content-type-options': 'nosniff',
  });
  response.end(body);
}

function sendSocketError(socket, status, code) {
  if (!socket.writable) return;
  const body = JSON.stringify({ error: { code } });
  socket.end([
    `HTTP/1.1 ${status} ${status === 431 ? 'Request Header Fields Too Large' : 'Bad Request'}`,
    'Connection: close',
    'Content-Type: application/json',
    'Cache-Control: no-store',
    `Content-Length: ${Buffer.byteLength(body, 'utf8')}`,
    '',
    body,
  ].join('\r\n'));
}

async function readJsonBody(request, declaredLength) {
  const chunks = [];
  let total = 0;
  for await (const chunk of request) {
    total += chunk.length;
    if (total > MAX_REQUEST_BYTES) throw new PublicError(413, 'BODY_TOO_LARGE');
    chunks.push(chunk);
  }
  if (total !== declaredLength) throw new PublicError(400, 'INVALID_REQUEST');
  let text;
  try {
    text = new TextDecoder('utf-8', { fatal: true }).decode(Buffer.concat(chunks));
  } catch {
    throw new PublicError(400, 'INVALID_REQUEST');
  }
  try {
    return JSON.parse(text);
  } catch {
    throw new PublicError(400, 'INVALID_REQUEST');
  }
}

function parseRequest(path, value) {
  const prepare = path === '/v1/prepare';
  const keysAreExact = prepare
    ? exactKeys(value, ['campaign_id', 'environment_id', 'idempotency_key'])
    : exactKeys(value, ['campaign_id', 'environment_id', 'idempotency_key', 'lease'])
      || exactKeys(value, ['campaign_id', 'environment_id', 'idempotency_key', 'item_key', 'lease']);
  if (
    !keysAreExact
    || !IDENTIFIER.test(value.campaign_id ?? '')
    || !IDENTIFIER.test(value.environment_id ?? '')
    || !IDEMPOTENCY_KEY.test(value.idempotency_key ?? '')
    || (!prepare && !UUID_V4.test(value.lease ?? ''))
    || (!prepare && value.item_key !== undefined && !ALLOWED_CLEANUP_ITEM_KEYS.has(value.item_key))
  ) {
    throw new PublicError(400, 'INVALID_REQUEST');
  }
  return value;
}

function errorResult(status, code) {
  return { status, payload: { error: { code } } };
}

export async function createPayDemoBroker({ configuration: rawConfiguration, executeEnvironment, audit } = {}) {
  const configuration = validateConfiguration(rawConfiguration);
  const token = await loadOrCreateToken(configuration.tokenFile, configuration.configuredToken);
  await writeCurlConfig(configuration.curlConfig, token);
  const executor = executeEnvironment ?? executeInvocation;
  const tupleHash = sha256(stableJson({
    campaign_id: configuration.campaignId,
    commit: configuration.commit,
    environment_id: configuration.environmentId,
    cleanup_item_key: configuration.cleanupItemKey,
    port: configuration.productPort,
    repository: configuration.repository,
    state_root: configuration.stateRoot,
    variant: configuration.variant,
  }));
  let state = 'ABSENT';
  let instanceNonce;
  let ownedPidFile;
  const idempotency = new Map();
  const activeOperations = new Set();
  let accepting = true;
  let shutdownPromise;

  function auditEvent(event, details = {}) {
    try {
      audit?.({ event, tuple_hash: tupleHash, ...details });
    } catch {
      // Audit consumers cannot change broker control flow.
    }
  }

  function transition(to, requestHash) {
    const from = state;
    state = to;
    auditEvent('state_transition', { from, to, request_hash: requestHash });
  }

  async function invoke(mode, pidFile, itemKey) {
    const invocation = await makeInvocation(configuration, mode, pidFile, itemKey);
    return parseEnvironmentOutput(await executor(invocation));
  }

  async function compensateFailedPrepare(requestHash) {
    const pidFile = expectedPidFile(configuration);
    try {
      const envelope = validateCleanupEnvelope(
        await invoke('cleanup', pidFile),
        configuration,
        pidFile,
      );
      auditEvent('prepare_compensated', { request_hash: requestHash });
      return ['STOPPED', 'ABSENT'].includes(envelope.item.data.environment_status);
    } catch {
      auditEvent('prepare_compensation_failed', { request_hash: requestHash });
      return false;
    }
  }

  function harnessFailure(error) {
    return errorResult(
      502,
      error instanceof HarnessOutputError ? 'HARNESS_OUTPUT_INVALID' : 'HARNESS_EXECUTION_FAILED',
    );
  }

  async function startOperation(path, request, requestHash) {
    if (path === '/v1/prepare') {
      if (state === 'PREPARING' || state === 'CLEANING') return errorResult(409, 'ENVIRONMENT_BUSY');
      if (state !== 'ABSENT') return errorResult(409, 'INVALID_STATE');
      transition('PREPARING', requestHash);
      try {
        const envelope = validatePrepareEnvelope(await invoke('prepare'), configuration);
        ownedPidFile = envelope.item.data.pid_file;
        instanceNonce = envelope.item.data.instance_nonce;
        transition('READY', requestHash);
        return { status: 200, payload: envelope };
      } catch (error) {
        const compensated = await compensateFailedPrepare(requestHash);
        ownedPidFile = undefined;
        instanceNonce = undefined;
        transition(compensated ? 'ABSENT' : 'QUARANTINED', requestHash);
        return harnessFailure(error);
      }
    }

    if (state === 'PREPARING' || state === 'CLEANING') return errorResult(409, 'ENVIRONMENT_BUSY');
    if (state !== 'READY') return errorResult(409, 'INVALID_STATE');
    if (!safeEqual(request.lease, instanceNonce)) return errorResult(403, 'INVALID_LEASE');
    transition('CLEANING', requestHash);
    const cleanupPidFile = ownedPidFile;
    const cleanupItemKey = request.item_key ?? configuration.cleanupItemKey;
    try {
      const envelope = validateCleanupEnvelope(
        await invoke('cleanup', cleanupPidFile, cleanupItemKey),
        configuration,
        cleanupPidFile,
        cleanupItemKey,
      );
      ownedPidFile = undefined;
      instanceNonce = undefined;
      transition('ABSENT', requestHash);
      return { status: 200, payload: envelope };
    } catch (error) {
      transition('QUARANTINED', requestHash);
      return harnessFailure(error);
    }
  }

  function makeIdempotencyRoom() {
    if (idempotency.size < MAX_IDEMPOTENCY_ENTRIES) return true;
    for (const [key, entry] of idempotency) {
      if (entry.settled) idempotency.delete(key);
      if (idempotency.size < MAX_IDEMPOTENCY_ENTRIES) return true;
    }
    return false;
  }

  async function operate(path, request) {
    const requestHash = sha256(stableJson({ body: request, method: 'POST', path }));
    const existing = idempotency.get(request.idempotency_key);
    if (existing) {
      if (existing.requestHash !== requestHash) return errorResult(409, 'IDEMPOTENCY_CONFLICT');
      auditEvent('idempotency_replay', { request_hash: requestHash });
      return existing.promise;
    }
    if (request.campaign_id !== configuration.campaignId
      || request.environment_id !== configuration.environmentId) {
      return errorResult(403, 'NOT_ALLOWED');
    }
    if (path === '/v1/cleanup' && state === 'READY' && !safeEqual(request.lease, instanceNonce)) {
      return errorResult(403, 'INVALID_LEASE');
    }
    if (state === 'QUARANTINED') return errorResult(409, 'RECOVERY_REQUIRED');
    if (state === 'PREPARING' || state === 'CLEANING') return errorResult(409, 'ENVIRONMENT_BUSY');
    if (path === '/v1/prepare' && state !== 'ABSENT') return errorResult(409, 'INVALID_STATE');
    if (path === '/v1/cleanup' && state !== 'READY') return errorResult(409, 'INVALID_STATE');
    if (!makeIdempotencyRoom()) return errorResult(503, 'IDEMPOTENCY_CAPACITY_EXCEEDED');
    const promise = startOperation(path, request, requestHash);
    const entry = { requestHash, promise, settled: false };
    idempotency.set(request.idempotency_key, entry);
    activeOperations.add(promise);
    void promise.then(() => {
      entry.settled = true;
      activeOperations.delete(promise);
    }, () => {
      entry.settled = true;
      activeOperations.delete(promise);
    });
    return promise;
  }

  let server;
  async function handle(request, response) {
    try {
      if (request.socket.remoteAddress !== '127.0.0.1') throw new PublicError(403, 'NOT_ALLOWED');
      const address = server.address();
      const expectedHost = `127.0.0.1:${address.port}`;
      const hosts = rawHeaderValues(request, 'host');
      if (hosts.length !== 1 || hosts[0] !== expectedHost) throw new PublicError(400, 'INVALID_HOST');
      const authorization = rawHeaderValues(request, 'authorization');
      if (authorization.length !== 1 || !safeEqual(authorization[0], `Bearer ${token}`)) {
        throw new PublicError(401, 'UNAUTHORIZED');
      }
      if (request.method !== 'POST' || !['/v1/prepare', '/v1/cleanup'].includes(request.url)) {
        throw new PublicError(404, 'NOT_FOUND');
      }
      if (!accepting) throw new PublicError(503, 'SHUTTING_DOWN');
      const transferEncoding = rawHeaderValues(request, 'transfer-encoding');
      const contentLengths = rawHeaderValues(request, 'content-length');
      if (transferEncoding.length > 0 || contentLengths.length > 1) {
        throw new PublicError(400, 'AMBIGUOUS_BODY');
      }
      if (contentLengths.length === 0) throw new PublicError(411, 'LENGTH_REQUIRED');
      if (!/^(0|[1-9][0-9]*)$/.test(contentLengths[0])) throw new PublicError(400, 'INVALID_REQUEST');
      const declaredLength = Number.parseInt(contentLengths[0], 10);
      if (declaredLength > MAX_REQUEST_BYTES) throw new PublicError(413, 'BODY_TOO_LARGE');
      const contentTypes = rawHeaderValues(request, 'content-type');
      if (contentTypes.length !== 1 || contentTypes[0].toLowerCase() !== 'application/json') {
        throw new PublicError(415, 'UNSUPPORTED_MEDIA_TYPE');
      }
      const body = parseRequest(request.url, await readJsonBody(request, declaredLength));
      if (!accepting) throw new PublicError(503, 'SHUTTING_DOWN');
      const result = await operate(request.url, body);
      sendJson(response, result.status, result.payload);
    } catch (error) {
      if (error instanceof PublicError) sendJson(response, error.status, { error: { code: error.code } });
      else sendJson(response, 500, { error: { code: 'INTERNAL_ERROR' } });
    }
  }

  server = createServer({
    headersTimeout: REQUEST_TIMEOUT_MS,
    maxHeaderSize: MAX_HEADER_BYTES,
    requestTimeout: REQUEST_TIMEOUT_MS,
  }, (request, response) => {
    void handle(request, response);
  });
  server.maxHeadersCount = 16;
  server.keepAliveTimeout = 1_000;
  server.on('clientError', (error, socket) => {
    if (error?.code === 'HPE_HEADER_OVERFLOW') sendSocketError(socket, 431, 'HEADER_TOO_LARGE');
    else if (['HPE_UNEXPECTED_CONTENT_LENGTH', 'HPE_INVALID_TRANSFER_ENCODING'].includes(error?.code)) {
      sendSocketError(socket, 400, 'AMBIGUOUS_BODY');
    } else sendSocketError(socket, 400, 'INVALID_REQUEST');
  });

  return {
    listen() {
      return new Promise((resolvePromise, rejectPromise) => {
        const onError = (error) => rejectPromise(error);
        server.once('error', onError);
        server.listen(configuration.port, configuration.host, () => {
          server.off('error', onError);
          const address = server.address();
          if (address.port === configuration.productPort) {
            server.close();
            rejectPromise(new PublicError(500, 'INVALID_CONFIGURATION', 'broker port and product port must differ'));
            return;
          }
          resolvePromise();
        });
      });
    },
    address() {
      return server.address();
    },
    close() {
      if (shutdownPromise) return shutdownPromise;
      accepting = false;
      const closeServer = server.listening
        ? new Promise((resolvePromise, rejectPromise) => {
          server.close((error) => {
            if (error) rejectPromise(error);
            else resolvePromise();
          });
        })
        : Promise.resolve();
      const drainOperations = Promise.allSettled([...activeOperations]);
      shutdownPromise = Promise.all([closeServer, drainOperations]).then(() => undefined);
      return shutdownPromise;
    },
  };
}

async function runCli() {
  const configuration = configurationFromEnvironment(process.env, process.argv.slice(2));
  const broker = await createPayDemoBroker({
    configuration,
    audit: (entry) => process.stderr.write(`PAYDEMO_QAH_BROKER_AUDIT ${JSON.stringify(entry)}\n`),
  });
  await broker.listen();
  const address = broker.address();
  process.stderr.write(`PAYDEMO_QAH_BROKER_READY 127.0.0.1:${address.port}\n`);
  let stopping = false;
  const stop = async () => {
    if (stopping) return;
    stopping = true;
    await broker.close();
  };
  process.once('SIGINT', () => { void stop(); });
  process.once('SIGTERM', () => { void stop(); });
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  runCli().catch((error) => {
    const message = error instanceof PublicError
      ? error.publicMessage
      : 'broker failed because of an internal runtime error';
    process.stderr.write(`PAYDEMO_QAH_BROKER_ERROR ${message}\n`);
    process.exitCode = 1;
  });
}
