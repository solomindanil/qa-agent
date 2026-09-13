import { mkdtemp, readFile, realpath, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { startPublicInputFixture } from "../../components/console/tests/fixtures/public-input/fixture.ts";
import { registerAuthoredFixture } from "../../components/console/tests/fixtures/nuanu-readonly/fixture.ts";

const sourceRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

// Preparation owns only synthetic data/server lifetime. Test design, publication,
// campaign execution and diagnosis belong to the fresh agent, using existing APIs.
export async function startPublicAgentExercise() {
  const root = await mkdtemp(path.join(await realpath(os.tmpdir()), "qa-public-agent-"));
  const server = await startPublicInputFixture();
  try {
    const registration = await registerAuthoredFixture(server.baseUrl, root, {
      productSlug: "public-household-catalog",
      name: "Public household catalog",
      description: "Visitors find household items using name search and category filtering.",
      surfaces: [{ kind: "web", name: "Public item catalog" }],
      journeys: [
        {
          name: "Find matching public items",
          expectedOutcome: "Case-insensitive literal name substring and category restrictions compose; clearing search retains the selected category.",
        },
        {
          name: "Read the result summary",
          expectedOutcome: "The result summary agrees with the displayed items, including an empty result.",
        },
        {
          name: "Manage inventory as staff",
          expectedOutcome: "Only authorized staff can manage inventory; staff access is not provided in this exercise.",
        },
      ],
      authoredJourneyName: "Find matching public items",
    });
    const briefPath = path.join(root, "product-brief.md");
    await writeFile(briefPath, await readFile(new URL("./product-brief.md", import.meta.url)),
      { flag: "wx", mode: 0o600 });
    const packet = {
      sourceRoot,
      consolePath: path.join(sourceRoot, "components/console"),
      kernelPath: path.join(sourceRoot, "components/kernel"),
      exerciseRoot: root,
      workspacePath: registration.workspacePath,
      productSlug: "public-household-catalog",
      baseUrl: server.baseUrl,
      targetUrl: new URL("catalog", server.baseUrl).href,
      briefPath,
    };
    const packetPath = path.join(root, "actor-context.json");
    await writeFile(packetPath, JSON.stringify(packet, null, 2) + "\n", { flag: "wx", mode: 0o600 });
    return { ...packet, packetPath, registration, close: server.close };
  } catch (error) {
    await server.close();
    // Preserve any partial registration for diagnosis; never silently re-register.
    throw new Error("Local exercise preparation failed; retained evidence at " + root, { cause: error });
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const exercise = await startPublicAgentExercise();
  const stop = () => {
    exercise.close().catch(error => { console.error(error); process.exitCode = 1; });
  };
  process.once("SIGINT", stop);
  process.once("SIGTERM", stop);
  console.log(JSON.stringify({
    status: "ready", packetPath: exercise.packetPath, targetUrl: exercise.targetUrl,
    workspacePath: exercise.workspacePath,
  }));
}
