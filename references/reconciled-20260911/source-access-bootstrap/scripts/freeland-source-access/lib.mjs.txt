import { createHash, createPrivateKey, createPublicKey, randomBytes } from 'node:crypto';
import { promises as fs } from 'node:fs';
import { join } from 'node:path';
import { SOURCE_ACCESS } from './constants.mjs';

export class SourceAccessError extends Error {
  constructor(reason) {
    super(reason);
    this.name = 'SourceAccessError';
  }
}

export function buildPaths(baseDir) {
  return {
    baseDir,
    privateKey: join(baseDir, SOURCE_ACCESS.privateBasename),
    publicKey: join(baseDir, SOURCE_ACCESS.publicBasename),
    handoff: join(baseDir, SOURCE_ACCESS.handoffBasename),
    attestation: join(baseDir, SOURCE_ACCESS.attestationBasename),
  };
}

function reason(reason) {
  throw new SourceAccessError(reason);
}

function expectedUid(options) {
  return options.expectedUid ?? (typeof process.getuid === 'function' ? process.getuid() : undefined);
}

async function lstatOrNull(path) {
  try {
    return await fs.lstat(path);
  } catch (error) {
    if (error?.code === 'ENOENT') return null;
    reason('SOURCE_ACCESS_CUSTODY_INVALID');
  }
}

function hasExactMode(stat, mode) {
  return (stat.mode & 0o777) === mode;
}

function isOwned(stat, uid) {
  return uid === undefined || stat.uid === uid;
}

function validateDirectoryStat(stat, uid) {
  if (!stat?.isDirectory() || stat.isSymbolicLink() || !isOwned(stat, uid) || !hasExactMode(stat, SOURCE_ACCESS.directoryMode)) {
    reason('SOURCE_ACCESS_DIRECTORY_INVALID');
  }
}

function validateFileStat(stat, uid) {
  if (!stat?.isFile() || stat.isSymbolicLink() || stat.nlink !== 1 || !isOwned(stat, uid) || !hasExactMode(stat, SOURCE_ACCESS.fileMode)) {
    reason('SOURCE_ACCESS_CUSTODY_INVALID');
  }
}

async function validateExistingBaseDir(baseDir, uid) {
  const stat = await lstatOrNull(baseDir);
  if (stat) validateDirectoryStat(stat, uid);
  return stat;
}

async function ensureBaseDir(baseDir, uid) {
  const existing = await lstatOrNull(baseDir);
  if (existing) {
    validateDirectoryStat(existing, uid);
    return;
  }
  try {
    await fs.mkdir(baseDir, { recursive: true, mode: SOURCE_ACCESS.directoryMode });
    await fs.chmod(baseDir, SOURCE_ACCESS.directoryMode);
  } catch {
    reason('SOURCE_ACCESS_DIRECTORY_INVALID');
  }
  validateDirectoryStat(await lstatOrNull(baseDir), uid);
}

function readU32(buffer, offset) {
  if (offset + 4 > buffer.length) reason('SOURCE_ACCESS_KEY_INVALID');
  return buffer.readUInt32BE(offset);
}

function readString(buffer, offset) {
  const length = readU32(buffer, offset);
  const start = offset + 4;
  const end = start + length;
  if (end > buffer.length) reason('SOURCE_ACCESS_KEY_INVALID');
  return { value: buffer.subarray(start, end), offset: end };
}

function equalsAscii(buffer, text) {
  return buffer.equals(Buffer.from(text, 'utf8'));
}

function parsePublicBlob(blob) {
  let parsed = readString(blob, 0);
  if (!equalsAscii(parsed.value, 'ssh-ed25519')) reason('SOURCE_ACCESS_KEY_INVALID');
  parsed = readString(blob, parsed.offset);
  if (parsed.value.length !== 32 || parsed.offset !== blob.length) reason('SOURCE_ACCESS_KEY_INVALID');
  return parsed.value;
}

function parsePublicMaterial(content) {
  if (!Buffer.isBuffer(content)) content = Buffer.from(content);
  const text = content.toString('utf8');
  if (!text.endsWith('\n') || text.includes('\r') || text.slice(0, -1).includes('\n')) reason('SOURCE_ACCESS_KEY_INVALID');
  const match = /^ssh-ed25519 ([A-Za-z0-9+/]+={0,2}) (FreelandQA read-only source checkout)$/.exec(text.slice(0, -1));
  if (!match || match[2] !== SOURCE_ACCESS.title) {
    reason('SOURCE_ACCESS_KEY_INVALID');
  }
  const blob = Buffer.from(match[1], 'base64');
  if (blob.toString('base64') !== match[1]) reason('SOURCE_ACCESS_KEY_INVALID');
  return { line: text.slice(0, -1), blob, key: parsePublicBlob(blob) };
}

function deriveEd25519PublicKey(seed) {
  try {
    const privateKeyDer = Buffer.concat([
      Buffer.from('302e020100300506032b657004220420', 'hex'),
      seed,
    ]);
    const publicKeyDer = createPublicKey(createPrivateKey({
      key: privateKeyDer,
      format: 'der',
      type: 'pkcs8',
    })).export({ format: 'der', type: 'spki' });
    const prefix = Buffer.from('302a300506032b6570032100', 'hex');
    if (publicKeyDer.length !== prefix.length + 32 || !publicKeyDer.subarray(0, prefix.length).equals(prefix)) {
      reason('SOURCE_ACCESS_KEY_INVALID');
    }
    return publicKeyDer.subarray(prefix.length);
  } catch (error) {
    if (error instanceof SourceAccessError) throw error;
    reason('SOURCE_ACCESS_KEY_INVALID');
  }
}

function parsePrivateMaterial(content) {
  const text = content.toString('utf8');
  const match = /^-----BEGIN OPENSSH PRIVATE KEY-----\n([A-Za-z0-9+/=\n]+)-----END OPENSSH PRIVATE KEY-----\n$/.exec(text);
  if (!match) reason('SOURCE_ACCESS_KEY_INVALID');
  const encoded = match[1].replace(/\n/g, '');
  const bytes = Buffer.from(encoded, 'base64');
  if (bytes.toString('base64') !== encoded) reason('SOURCE_ACCESS_KEY_INVALID');
  const magic = Buffer.from('openssh-key-v1\0', 'utf8');
  if (bytes.length < magic.length || !bytes.subarray(0, magic.length).equals(magic)) reason('SOURCE_ACCESS_KEY_INVALID');

  let offset = magic.length;
  let parsed = readString(bytes, offset);
  if (!equalsAscii(parsed.value, 'none')) reason('SOURCE_ACCESS_KEY_INVALID');
  parsed = readString(bytes, parsed.offset);
  if (!equalsAscii(parsed.value, 'none')) reason('SOURCE_ACCESS_KEY_INVALID');
  parsed = readString(bytes, parsed.offset);
  if (parsed.value.length !== 0) reason('SOURCE_ACCESS_KEY_INVALID');
  offset = parsed.offset;
  if (readU32(bytes, offset) !== 1) reason('SOURCE_ACCESS_KEY_INVALID');
  offset += 4;
  parsed = readString(bytes, offset);
  const outerBlob = parsed.value;
  const outerKey = parsePublicBlob(outerBlob);
  parsed = readString(bytes, parsed.offset);
  if (parsed.offset !== bytes.length) reason('SOURCE_ACCESS_KEY_INVALID');

  const privateBlock = parsed.value;
  if (privateBlock.length < 8 || readU32(privateBlock, 0) !== readU32(privateBlock, 4)) reason('SOURCE_ACCESS_KEY_INVALID');
  offset = 8;
  parsed = readString(privateBlock, offset);
  if (!equalsAscii(parsed.value, 'ssh-ed25519')) reason('SOURCE_ACCESS_KEY_INVALID');
  parsed = readString(privateBlock, parsed.offset);
  const embeddedPublic = parsed.value;
  parsed = readString(privateBlock, parsed.offset);
  const privateBytes = parsed.value;
  parsed = readString(privateBlock, parsed.offset);
  const derivedPublic = privateBytes.length === 64 ? deriveEd25519PublicKey(privateBytes.subarray(0, 32)) : null;
  if (!equalsAscii(parsed.value, SOURCE_ACCESS.title) || embeddedPublic.length !== 32 || privateBytes.length !== 64 || !privateBytes.subarray(32).equals(embeddedPublic) || !derivedPublic?.equals(embeddedPublic) || !embeddedPublic.equals(outerKey)) {
    reason('SOURCE_ACCESS_KEY_INVALID');
  }
  for (let pad = 1; parsed.offset < privateBlock.length; pad += 1, parsed.offset += 1) {
    if (privateBlock[parsed.offset] !== (pad & 0xff)) reason('SOURCE_ACCESS_KEY_INVALID');
  }
  return { blob: outerBlob, key: outerKey };
}

function fingerprintFor(blob) {
  return `SHA256:${createHash('sha256').update(blob).digest('base64').replace(/=$/, '')}`;
}

function validateKeyPair(privateContent, publicContent) {
  const privateKey = parsePrivateMaterial(privateContent);
  const publicKey = parsePublicMaterial(publicContent);
  if (!privateKey.key.equals(publicKey.key) || !privateKey.blob.equals(publicKey.blob)) reason('SOURCE_ACCESS_KEY_MISMATCH');
  const privateFingerprint = fingerprintFor(privateKey.blob);
  const publicFingerprint = fingerprintFor(publicKey.blob);
  if (privateFingerprint !== publicFingerprint || !/^SHA256:[A-Za-z0-9+/]{43}$/.test(publicFingerprint)) reason('SOURCE_ACCESS_KEY_INVALID');
  return { fingerprint: publicFingerprint, publicLine: publicKey.line };
}

function handoffBytes(fingerprint, publicLine) {
  return Buffer.from([
    `repository=${SOURCE_ACCESS.repository}`,
    `title=${SOURCE_ACCESS.title}`,
    'allowWrite=false',
    `fingerprint=${fingerprint}`,
    `publicKey=${publicLine}`,
    '',
  ].join('\n'), 'utf8');
}

function attestationBytes(fingerprint) {
  const attestation = {
    repository: SOURCE_ACCESS.repository,
    title: SOURCE_ACCESS.title,
    fingerprint,
    readOnly: true,
    allowWrite: false,
  };
  return Buffer.from(`${JSON.stringify(attestation)}\n`, 'utf8');
}

async function validateAwaiting(paths, uid) {
  for (const path of [paths.privateKey, paths.publicKey, paths.handoff]) validateFileStat(await lstatOrNull(path), uid);
  const privateContent = await fs.readFile(paths.privateKey);
  const publicContent = await fs.readFile(paths.publicKey);
  const { fingerprint, publicLine } = validateKeyPair(privateContent, publicContent);
  const handoff = await fs.readFile(paths.handoff);
  if (!handoff.equals(handoffBytes(fingerprint, publicLine))) reason('SOURCE_ACCESS_HANDOFF_INVALID');
  return { fingerprint, publicLine };
}

async function validateReady(paths, uid, fingerprint) {
  validateFileStat(await lstatOrNull(paths.attestation), uid);
  const actual = await fs.readFile(paths.attestation);
  if (!actual.equals(attestationBytes(fingerprint))) reason('SOURCE_ACCESS_ATTESTATION_INVALID');
}

export async function inspectCustody(options = {}) {
  const baseDir = options.baseDir ?? SOURCE_ACCESS.baseDir;
  const paths = buildPaths(baseDir);
  const uid = expectedUid(options);
  await validateExistingBaseDir(baseDir, uid);
  const [privateStat, publicStat, handoffStat, attestationStat] = await Promise.all([
    lstatOrNull(paths.privateKey), lstatOrNull(paths.publicKey), lstatOrNull(paths.handoff), lstatOrNull(paths.attestation),
  ]);
  const privateExists = Boolean(privateStat);
  const publicExists = Boolean(publicStat);
  const handoffExists = Boolean(handoffStat);
  const attestationExists = Boolean(attestationStat);
  const absent = !privateExists && !publicExists && !handoffExists && !attestationExists;
  const awaiting = privateExists && publicExists && handoffExists && !attestationExists;
  const ready = privateExists && publicExists && handoffExists && attestationExists;
  if (!absent && !awaiting && !ready) reason('SOURCE_ACCESS_PARTIAL_STATE');
  if (ready && options.allowReady === false) reason('SOURCE_ACCESS_PARTIAL_STATE');
  if (absent) return { status: 'ABSENT', paths };
  const key = await validateAwaiting(paths, uid);
  if (ready) {
    await validateReady(paths, uid, key.fingerprint);
    return { status: 'SOURCE_ACCESS_READY', paths, ...key };
  }
  return { status: 'AWAITING_ADMIN', paths, ...key };
}

const DEPLOY_KEY_DENIAL = /^ERROR: Permission to nuanu-ai\/freeland_app(?:\.git)? denied to deploy key\.\r?\n?$/;
const WRITE_ACCESS_DENIAL = /^ERROR: Write access to repository not granted\.\r?\n?$/;

export function classifyWriteDenial(stderr) {
  return typeof stderr === 'string' && (DEPLOY_KEY_DENIAL.test(stderr) || WRITE_ACCESS_DENIAL.test(stderr));
}

function verifyResult(fingerprint) {
  return {
    schemaVersion: SOURCE_ACCESS.schemaVersion,
    status: 'SOURCE_ACCESS_READY',
    repository: SOURCE_ACCESS.repository,
    title: SOURCE_ACCESS.title,
    fingerprint,
    readOnly: true,
    allowWrite: false,
    readSucceeded: true,
    writeDenied: true,
    attestationMatch: true,
  };
}

function validateVerifyRunnerResult(result) {
  if (!result || typeof result !== 'object') reason('SOURCE_ACCESS_RUNNER_UNEXPECTED');
  if (result.timedOut) reason('SOURCE_ACCESS_RUNNER_TIMEOUT');
  if (result.overflow) reason('SOURCE_ACCESS_RUNNER_OUTPUT_OVERFLOW');
  if (result.executable !== undefined && result.executable !== 'git') reason('SOURCE_ACCESS_RUNNER_UNEXPECTED');
  if (result.signal) reason('SOURCE_ACCESS_RUNNER_SIGNAL');
  if (!Number.isInteger(result.code)) reason('SOURCE_ACCESS_RUNNER_UNEXPECTED');
  if (result.stdout !== undefined && typeof result.stdout !== 'string') reason('SOURCE_ACCESS_RUNNER_UNEXPECTED');
  if (result.stderr !== undefined && typeof result.stderr !== 'string') reason('SOURCE_ACCESS_RUNNER_UNEXPECTED');
}

async function runVerificationCommand(runner, invocation) {
  let result;
  try {
    result = await runner(invocation);
  } catch {
    reason('SOURCE_ACCESS_RUNNER_FAILED');
  }
  validateVerifyRunnerResult(result);
  return result;
}

async function removeVerificationRepository(path) {
  try {
    await fs.rm(path, { recursive: true, force: false, maxRetries: 0 });
  } catch {
    reason('SOURCE_ACCESS_VERIFY_TEMPORARY_DIRECTORY_INVALID');
  }
}

async function writeAttestationNoClobber(paths, fingerprint, uid) {
  let temporaryDir;
  try {
    temporaryDir = await fs.mkdtemp(join(paths.baseDir, '.attestation-'));
    await fs.chmod(temporaryDir, SOURCE_ACCESS.directoryMode);
    validateDirectoryStat(await lstatOrNull(temporaryDir), uid);
    const temporaryFile = join(temporaryDir, SOURCE_ACCESS.attestationBasename);
    await fs.writeFile(temporaryFile, attestationBytes(fingerprint), { mode: SOURCE_ACCESS.fileMode, flag: 'wx' });
    await fs.chmod(temporaryFile, SOURCE_ACCESS.fileMode);
    validateFileStat(await lstatOrNull(temporaryFile), uid);
    try {
      await fs.link(temporaryFile, paths.attestation);
    } catch (error) {
      if (error?.code === 'EEXIST') reason('SOURCE_ACCESS_ATTESTATION_COLLISION');
      throw error;
    }
    await fs.unlink(temporaryFile);
    await fs.rmdir(temporaryDir);
  } catch (error) {
    if (error instanceof SourceAccessError) throw error;
    reason('SOURCE_ACCESS_ATTESTATION_FAILED');
  } finally {
    if (temporaryDir) {
      try {
        await fs.rm(temporaryDir, { recursive: true, force: false, maxRetries: 0 });
      } catch {
        // A final attestation link remains valid; temporary cleanup is best effort.
      }
    }
  }
}

export async function verifySourceAccess(options = {}) {
  const baseDir = options.baseDir ?? SOURCE_ACCESS.baseDir;
  const uid = expectedUid(options);
  const initial = await inspectCustody({ baseDir, expectedUid: uid });
  if (initial.status === 'SOURCE_ACCESS_READY') return verifyResult(initial.fingerprint);
  if (initial.status !== 'AWAITING_ADMIN') reason('SOURCE_ACCESS_CUSTODY_NOT_READY');
  if (typeof options.runner !== 'function') reason('SOURCE_ACCESS_RUNNER_UNAVAILABLE');

  const gitSshCommand = `ssh -F /dev/null -i ${initial.paths.privateKey} -o BatchMode=yes -o IdentitiesOnly=yes -o ForwardAgent=no -o StrictHostKeyChecking=yes`;
  const remoteOptions = {
    shell: false,
    timeoutMs: SOURCE_ACCESS.networkTimeoutMs,
    maxOutputBytes: SOURCE_ACCESS.maxOutputBytes,
    env: { GIT_SSH_COMMAND: gitSshCommand },
  };
  const read = await runVerificationCommand(options.runner, {
    command: 'git',
    args: ['ls-remote', SOURCE_ACCESS.repositorySsh],
    ...remoteOptions,
  });
  if (read.code !== 0) reason('SOURCE_ACCESS_READ_FAILED');

  let temporaryDir;
  try {
    temporaryDir = await fs.mkdtemp(join(baseDir, '.verify-'));
    await fs.chmod(temporaryDir, SOURCE_ACCESS.directoryMode);
    validateDirectoryStat(await lstatOrNull(temporaryDir), uid);
    const localOptions = {
      command: 'git',
      cwd: temporaryDir,
      shell: false,
      timeoutMs: SOURCE_ACCESS.localTimeoutMs,
      maxOutputBytes: SOURCE_ACCESS.maxOutputBytes,
    };
    for (const args of [
      ['init', '--quiet'],
      ['config', 'user.name', 'FreelandQA read-only probe'],
      ['config', 'user.email', 'freelandqa-readonly@invalid'],
      ['commit', '--allow-empty', '--quiet', '-m', 'FreelandQA read-only probe'],
    ]) {
      const result = await runVerificationCommand(options.runner, { ...localOptions, args });
      if (result.code !== 0) reason('SOURCE_ACCESS_LOCAL_GIT_FAILED');
    }
    const probeRef = `refs/heads/freelandqa-readonly-probe-${randomBytes(12).toString('hex')}`;
    const write = await runVerificationCommand(options.runner, {
      command: 'git',
      args: ['push', '--dry-run', SOURCE_ACCESS.repositorySsh, `HEAD:${probeRef}`],
      cwd: temporaryDir,
      ...remoteOptions,
    });
    if (write.code === 0) reason('SOURCE_WRITE_CAPABILITY_DETECTED');
    if (!classifyWriteDenial(write.stderr)) reason('SOURCE_ACCESS_WRITE_DENIAL_UNEXPECTED');
    await removeVerificationRepository(temporaryDir);
    temporaryDir = undefined;
  } catch (error) {
    if (error instanceof SourceAccessError) throw error;
    reason('SOURCE_ACCESS_VERIFY_FAILED');
  } finally {
    if (temporaryDir) await removeVerificationRepository(temporaryDir);
  }

  if (await lstatOrNull(initial.paths.attestation)) reason('SOURCE_ACCESS_ATTESTATION_COLLISION');
  const finalCustody = await inspectCustody({ baseDir, expectedUid: uid });
  if (finalCustody.status === 'SOURCE_ACCESS_READY') reason('SOURCE_ACCESS_ATTESTATION_COLLISION');
  if (finalCustody.status !== 'AWAITING_ADMIN' || finalCustody.fingerprint !== initial.fingerprint) {
    reason('SOURCE_ACCESS_CUSTODY_CHANGED');
  }
  await writeAttestationNoClobber(finalCustody.paths, finalCustody.fingerprint, uid);
  return verifyResult(initial.fingerprint);
}

function validateRunnerResult(result) {
  if (!result || typeof result !== 'object') reason('SOURCE_ACCESS_RUNNER_UNEXPECTED');
  if (result.timedOut) reason('SOURCE_ACCESS_RUNNER_TIMEOUT');
  if (result.overflow) reason('SOURCE_ACCESS_RUNNER_OUTPUT_OVERFLOW');
  if (result.executable !== undefined && result.executable !== 'ssh-keygen') reason('SOURCE_ACCESS_RUNNER_UNEXPECTED');
  if (result.signal) reason('SOURCE_ACCESS_RUNNER_SIGNAL');
  if (result.code !== 0) reason('SOURCE_ACCESS_RUNNER_EXIT');
}

function validateGeneratedFileStat(stat, uid) {
  if (!stat?.isFile() || stat.isSymbolicLink() || stat.nlink !== 1 || !isOwned(stat, uid)) {
    reason('SOURCE_ACCESS_CUSTODY_INVALID');
  }
}

async function destinationIsAbsent(path) {
  if (await lstatOrNull(path)) reason('SOURCE_ACCESS_DESTINATION_COLLISION');
}

async function promoteNoClobber(from, to, paths, index, hooks, uid, onLinked) {
  await destinationIsAbsent(to);
  await hooks?.afterDestinationCheck?.({ paths, index, from, to });
  try {
    await fs.link(from, to);
  } catch (error) {
    if (error?.code === 'EEXIST') reason('SOURCE_ACCESS_DESTINATION_COLLISION');
    throw error;
  }
  onLinked();
  await hooks?.afterLinkBeforeUnlink?.({ paths, index, from, to });
  await fs.unlink(from);
  validateFileStat(await lstatOrNull(to), uid);
}

function directoryIdentity(stat) {
  return { dev: stat.dev, ino: stat.ino };
}

function validateTemporaryDirectory(stat, uid, identity) {
  validateDirectoryStat(stat, uid);
  if (stat.dev !== identity.dev || stat.ino !== identity.ino) {
    reason('SOURCE_ACCESS_TEMPORARY_DIRECTORY_INVALID');
  }
}

async function removeOwnedTemporaryDir(temporaryDir, temporaryIdentity, temporaryFiles, uid, hooks) {
  await hooks?.beforeTemporaryCleanup?.({ temporaryDir });
  validateTemporaryDirectory(await lstatOrNull(temporaryDir), uid, temporaryIdentity);
  for (const temporaryFile of temporaryFiles) {
    validateTemporaryDirectory(await lstatOrNull(temporaryDir), uid, temporaryIdentity);
    const stat = await lstatOrNull(temporaryFile);
    if (!stat) continue;
    validateGeneratedFileStat(stat, uid);
    validateTemporaryDirectory(await lstatOrNull(temporaryDir), uid, temporaryIdentity);
    try {
      await fs.unlink(temporaryFile);
    } catch {
      reason('SOURCE_ACCESS_TEMPORARY_DIRECTORY_INVALID');
    }
  }
  validateTemporaryDirectory(await lstatOrNull(temporaryDir), uid, temporaryIdentity);
  try {
    await fs.rmdir(temporaryDir);
  } catch {
    reason('SOURCE_ACCESS_TEMPORARY_DIRECTORY_INVALID');
  }
}

function closedResult(paths, fingerprint) {
  return {
    schemaVersion: SOURCE_ACCESS.schemaVersion,
    status: 'AWAITING_ADMIN',
    repository: SOURCE_ACCESS.repository,
    title: SOURCE_ACCESS.title,
    fingerprint,
    handoffPath: paths.handoff,
  };
}

export async function prepareSourceAccess(options = {}) {
  const baseDir = options.baseDir ?? SOURCE_ACCESS.baseDir;
  const runner = options.runner;
  const uid = expectedUid(options);
  const initial = await inspectCustody({ baseDir, expectedUid: uid, allowReady: false });
  if (initial.status === 'AWAITING_ADMIN') return closedResult(initial.paths, initial.fingerprint);
  if (typeof runner !== 'function') reason('SOURCE_ACCESS_RUNNER_UNAVAILABLE');

  await ensureBaseDir(baseDir, uid);
  const paths = buildPaths(baseDir);
  let temporaryDir;
  let temporaryIdentity;
  let temporaryFiles = [];
  let promotions = 0;
  try {
    temporaryDir = await fs.mkdtemp(join(baseDir, '.prepare-'));
    await fs.chmod(temporaryDir, SOURCE_ACCESS.directoryMode);
    const temporaryStat = await lstatOrNull(temporaryDir);
    validateDirectoryStat(temporaryStat, uid);
    temporaryIdentity = directoryIdentity(temporaryStat);
    const temporaryPrivate = join(temporaryDir, SOURCE_ACCESS.privateBasename);
    const temporaryPublic = `${temporaryPrivate}.pub`;
    const temporaryHandoff = join(temporaryDir, SOURCE_ACCESS.handoffBasename);
    temporaryFiles = [temporaryPrivate, temporaryPublic, temporaryHandoff];
    const invocation = {
      command: 'ssh-keygen',
      args: ['-q', '-t', 'ed25519', '-N', '', '-C', SOURCE_ACCESS.title, '-f', temporaryPrivate],
      shell: false,
      timeoutMs: SOURCE_ACCESS.localTimeoutMs,
      maxOutputBytes: SOURCE_ACCESS.maxOutputBytes,
    };
    let runnerResult;
    try {
      runnerResult = await runner(invocation);
    } catch (error) {
      if (error instanceof SourceAccessError) throw error;
      reason('SOURCE_ACCESS_RUNNER_FAILED');
    }
    validateRunnerResult(runnerResult);

    validateGeneratedFileStat(await lstatOrNull(temporaryPrivate), uid);
    validateGeneratedFileStat(await lstatOrNull(temporaryPublic), uid);
    const privateContent = await fs.readFile(temporaryPrivate);
    const publicContent = await fs.readFile(temporaryPublic);
    const { fingerprint, publicLine } = validateKeyPair(privateContent, publicContent);
    await fs.chmod(temporaryPrivate, SOURCE_ACCESS.fileMode);
    await fs.chmod(temporaryPublic, SOURCE_ACCESS.fileMode);
    validateFileStat(await lstatOrNull(temporaryPrivate), uid);
    validateFileStat(await lstatOrNull(temporaryPublic), uid);
    await fs.writeFile(temporaryHandoff, handoffBytes(fingerprint, publicLine), { mode: SOURCE_ACCESS.fileMode, flag: 'wx' });
    await fs.chmod(temporaryHandoff, SOURCE_ACCESS.fileMode);
    validateFileStat(await lstatOrNull(temporaryHandoff), uid);

    const promotionsToMake = [
      [temporaryPrivate, paths.privateKey],
      [temporaryPublic, paths.publicKey],
      [temporaryHandoff, paths.handoff],
    ];
    for (let index = 0; index < promotionsToMake.length; index += 1) {
      const [from, to] = promotionsToMake[index];
      await options.hooks?.beforePromote?.({ paths, index });
      await promoteNoClobber(from, to, paths, index, options.hooks, uid, () => { promotions += 1; });
    }
    return closedResult(paths, fingerprint);
  } catch (error) {
    if (error instanceof SourceAccessError) throw error;
    reason('SOURCE_ACCESS_PREPARE_FAILED');
  } finally {
    if (temporaryDir && temporaryIdentity && promotions === 0) await removeOwnedTemporaryDir(temporaryDir, temporaryIdentity, temporaryFiles, uid, options.hooks);
  }
}
