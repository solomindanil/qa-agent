import { createInterface } from "node:readline";
import { pathToFileURL } from "node:url";

type ControllerCommand =
  | { command: "status" }
  | { command: "setMode"; mode: "healthy" | "mapped_broken" | "unmapped_broken" }
  | { command: "close" };

export function parseControllerCommand(line: string): ControllerCommand {
  let value: unknown;
  try { value = JSON.parse(line); } catch { throw new Error("Controller command must be JSON"); }
  if (value === null || typeof value !== "object" || Array.isArray(value)) throw new Error("Controller command must be an object");
  const command = value as Record<string, unknown>;
  const keys = Object.keys(command).sort();
  if ((command.command === "status" || command.command === "close") && keys.join(",") === "command") {
    return { command: command.command };
  }
  if (command.command === "setMode" && keys.join(",") === "command,mode"
    && (command.mode === "healthy" || command.mode === "mapped_broken" || command.mode === "unmapped_broken")) {
    return { command: "setMode", mode: command.mode };
  }
  throw new Error("Unsupported controller command or mode");
}

type ControllerState = { mode: "healthy" | "mapped_broken" | "unmapped_broken"; closed: boolean };
type PreparedController = { baseUrl: string; setWorldMode(mode: ControllerState["mode"]): void; close(): Promise<void>; journalPath?: string };

async function assertLiveOrigin(baseUrl: string): Promise<{ candidateRevision: string }> {
  const response = await fetch(new URL("/api/environment", baseUrl));
  const body = await response.json();
  if (response.status !== 200 || body?.candidateRevision !== "v2") throw new Error("Owned origin is not alive at candidate v2");
  return body;
}

export async function handleControllerCommand(
  prepared: PreparedController,
  state: ControllerState,
  line: string,
  probe: (baseUrl: string) => Promise<{ candidateRevision: string }> = assertLiveOrigin,
) {
  const command = parseControllerCommand(line);
  if (state.closed) throw new Error("Controller is closed");
  if (command.command === "close") {
    await prepared.close();
    state.closed = true;
    return { event: "closed", baseUrl: prepared.baseUrl, journalPath: prepared.journalPath };
  }
  const requireLive = async () => {
    try {
      const identity = await probe(prepared.baseUrl);
      if (identity.candidateRevision !== "v2") throw new Error("Owned origin candidate identity changed");
      return identity;
    } catch (error) {
      state.closed = true;
      await prepared.close().catch(() => undefined);
      throw error;
    }
  };
  await requireLive();
  if (command.command === "setMode") {
    prepared.setWorldMode(command.mode);
    state.mode = command.mode;
    await requireLive();
  }
  return { event: "status", baseUrl: prepared.baseUrl, candidateRevision: "v2", mode: state.mode, alive: true };
}

async function main() {
  const { startW4AgentChangeScopePreparation } = await import("./prepare.mts");
  const prepared = await startW4AgentChangeScopePreparation();
  const state: ControllerState = { mode: "healthy", closed: false };
  const emit = (value: unknown) => process.stdout.write(JSON.stringify(value) + "\n");
  const onSignal = () => { void prepared.close().finally(() => process.exit(1)); };
  process.once("SIGINT", onSignal);
  process.once("SIGTERM", onSignal);
  emit({ event: "ready", baseUrl: prepared.baseUrl, actorPacketPaths: prepared.actors.map((actor: { packetPath: string }) => actor.packetPath), journalPath: prepared.journalPath });
  const input = createInterface({ input: process.stdin, crlfDelay: Infinity });
  try {
    for await (const line of input) {
      try {
        const result = await handleControllerCommand(prepared, state, line);
        emit(result);
        if (state.closed) break;
      } catch (error) {
        emit({ event: "error", message: error instanceof Error ? error.message : String(error) });
        if (state.closed) { process.exitCode = 1; break; }
      }
    }
    if (!state.closed) {
      await prepared.close();
      process.exitCode = 1;
    }
  } finally {
    input.close();
    process.stdin.pause();
    process.off("SIGINT", onSignal);
    process.off("SIGTERM", onSignal);
  }
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  await main();
}
